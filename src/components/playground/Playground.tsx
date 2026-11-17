import { useStore } from '@nanostores/react';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { cn } from '@/lib/cn';
import { readPref, writePref } from '@/lib/storage';
import { $consoleEntries, $origin, initPlayground, keepProject } from '@/stores/playground';
import { TooltipProvider } from '@/components/ui/tooltip';
import '@/styles/playground.css';
import { downloadZip } from './actions';
import { $announcement, runNow } from './announce';
import { ConfirmDialog } from './confirm';
import { EditorPane } from './EditorPane';
import { PreviewPane } from './PreviewPane';
import { TopBar } from './TopBar';

const NARROW = '(max-width: 767px)';
const LAYOUT_KEY = 'html-runner:split';

function useNarrow(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = matchMedia(NARROW);
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    () => matchMedia(NARROW).matches,
    () => false,
  );
}

function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        runNow();
      } else if (e.key.toLowerCase() === 's' && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        downloadZip();
      }
    };
    // Capture phase so the editor's own Mod-Enter binding never sees it.
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);
}

function loadSplit(): { [id: string]: number } | undefined {
  try {
    const v = JSON.parse(readPref(LAYOUT_KEY) ?? 'null');
    if (v && typeof v.editor === 'number' && typeof v.preview === 'number') return v;
  } catch {
    /* ignore */
  }
  return undefined;
}

export default function Playground() {
  const narrow = useNarrow();
  const announcement = useStore($announcement);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initPlayground();
    setReady(true);
  }, []);
  useShortcuts();

  if (!ready) return <div className="h-dvh bg-paper" />;

  return (
    <TooltipProvider>
      <div className="flex h-dvh flex-col overflow-hidden bg-paper text-ink">
        {narrow ? <PhoneLayout /> : <DesktopLayout />}
      </div>
      <ConfirmDialog />
      <div aria-live="polite" role="status" className="sr-only">
        {announcement}
      </div>
    </TooltipProvider>
  );
}

function SharedBanner() {
  const origin = useStore($origin);
  if (origin !== 'share' && origin !== 'url-template') return null;
  const text =
    origin === 'share'
      ? 'You opened a shared project. Your own saved work stays untouched until you edit this.'
      : 'You opened a template from a link. Your own saved work stays untouched until you edit this.';
  return (
    <div role="status" className="flex shrink-0 items-center gap-3 border-b border-line bg-surface px-3 py-1.5 text-sm text-ink-2">
      <span aria-hidden className="size-1.5 shrink-0 bg-track" />
      <p className="min-w-0 flex-1 truncate">{text}</p>
      <button
        type="button"
        onClick={keepProject}
        className="h-7 shrink-0 rounded-[var(--radius-sm)] border border-line px-2.5 text-xs font-medium text-ink hover:border-line-strong"
      >
        Keep it
      </button>
    </div>
  );
}

function DesktopLayout() {
  const [defaultLayout] = useState(loadSplit);
  return (
    <>
      <TopBar compact={false} />
      <SharedBanner />
      <Group
        id="playground-split"
        orientation="horizontal"
        defaultLayout={defaultLayout}
        onLayoutChanged={(layout, meta) => {
          if (meta.isUserInteraction) writePref(LAYOUT_KEY, JSON.stringify(meta.requestedLayout ?? layout));
        }}
        className="min-h-0 flex-1"
      >
        <Panel id="editor" defaultSize="46" minSize="300px" className="min-w-0">
          <EditorPane />
        </Panel>
        <Separator className="split-handle" aria-label="Resize editor and preview">
          <span aria-hidden className="split-grip" />
        </Separator>
        <Panel id="preview" defaultSize="54" minSize="320px" className="min-w-0">
          <PreviewPane />
        </Panel>
      </Group>
    </>
  );
}

type PhoneView = 'code' | 'preview';

function PhoneLayout() {
  const [view, setView] = useState<PhoneView>('code');
  const entries = useStore($consoleEntries);
  const errors = entries.filter((e) => e.level === 'error').length;

  const tab = (id: PhoneView, label: string) => (
    <button
      type="button"
      role="tab"
      id={`phone-tab-${id}`}
      aria-selected={view === id}
      aria-controls={`phone-panel-${id}`}
      onClick={() => setView(id)}
      className={cn(
        'relative flex flex-1 items-center justify-center gap-2 text-sm font-semibold',
        view === id ? 'text-ink' : 'text-muted',
      )}
    >
      {label}
      {id === 'preview' && errors > 0 && (
        <span className="rounded-[var(--radius-sm)] bg-danger px-1 font-mono text-[0.625rem] leading-4 text-paper" aria-label={`${errors} errors`}>
          {errors}
        </span>
      )}
      <span
        aria-hidden
        className={cn(
          'absolute inset-x-3 bottom-0 h-0.5 origin-center bg-track transition-transform duration-200 ease-[var(--ease-out-quart)]',
          view === id ? 'scale-x-100' : 'scale-x-0',
        )}
      />
    </button>
  );

  return (
    <>
      <TopBar compact onRun={() => setView('preview')} />
      <SharedBanner />
      <div
        role="tablist"
        aria-label="View"
        className="flex h-10 shrink-0 border-b border-line bg-paper"
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            const next = view === 'code' ? 'preview' : 'code';
            setView(next);
            document.getElementById(`phone-tab-${next}`)?.focus();
          }
        }}
      >
        {tab('code', 'Code')}
        {tab('preview', 'Preview')}
      </div>
      <div className="relative min-h-0 flex-1">
        <div id="phone-panel-code" role="tabpanel" aria-labelledby="phone-tab-code" hidden={view !== 'code'} className="absolute inset-0">
          <EditorPane />
        </div>
        <div
          id="phone-panel-preview"
          role="tabpanel"
          aria-labelledby="phone-tab-preview"
          hidden={view !== 'preview'}
          className="absolute inset-0"
        >
          <PreviewPane />
        </div>
      </div>
    </>
  );
}
