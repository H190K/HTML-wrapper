import { useStore } from '@nanostores/react';
import { useEffect, useRef } from 'react';
import type { ConsoleLevel, PreviewMessage } from '@/lib/types';
import { $previewDoc, $run, markReady, pushConsole, run } from '@/stores/playground';

const LEVELS: ConsoleLevel[] = ['log', 'info', 'warn', 'error'];

function isPreviewMessage(data: unknown): data is PreviewMessage {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  if (d.source !== 'html-runner' || typeof d.runId !== 'number') return false;
  if (d.type === 'ready') return typeof d.durationMs === 'number';
  if (d.type === 'console') {
    return LEVELS.includes(d.level as ConsoleLevel) && Array.isArray(d.args) && d.args.every((a) => typeof a === 'string');
  }
  return false;
}

/**
 * The security boundary. No `allow-same-origin`: the frame has an opaque origin and cannot reach
 * this app's storage or DOM. Messages are only accepted from this frame's own window.
 */
export function PreviewFrame({ title = 'Preview' }: { title?: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const doc = useStore($previewDoc);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const win = frame.current?.contentWindow;
      if (!win || event.source !== win) return;
      const data: unknown = event.data;
      if (!isPreviewMessage(data)) return;
      if (data.runId !== $run.get().id) return; // stale run
      if (data.type === 'ready') markReady(data.runId, data.durationMs);
      else pushConsole({ level: data.level, args: data.args });
    };
    window.addEventListener('message', onMessage);
    // A frame mounted after its run already finished (e.g. the layout switched between desktop and phone)
    // needs a fresh run of its own, otherwise its console output would be dropped as stale or duplicated.
    if ($run.get().durationMs !== null) run();
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <iframe
      ref={frame}
      title={title}
      sandbox="allow-scripts allow-modals allow-forms allow-popups"
      srcDoc={doc}
      className="block size-full border-0 bg-white"
    />
  );
}
