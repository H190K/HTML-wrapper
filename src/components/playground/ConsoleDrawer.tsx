import { useStore } from '@nanostores/react';
import { ChevronRight, ChevronUp, CircleAlert, Info, Ban, TriangleAlert } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { cn } from '@/lib/cn';
import type { ConsoleEntry, ConsoleLevel } from '@/lib/types';
import { $consoleEntries, $consoleOpen, clearConsole, setConsoleOpen } from '@/stores/playground';
import { Tip } from '@/components/ui/tooltip';

export const CONSOLE_BAR_H = 36;

const LEVEL: Record<ConsoleLevel, { icon: typeof Info; row: string; label: string }> = {
  log: { icon: ChevronRight, row: 'text-ink', label: 'Log' },
  info: { icon: Info, row: 'text-lane-css', label: 'Info' },
  warn: { icon: TriangleAlert, row: 'text-warn bg-warn/8', label: 'Warning' },
  error: { icon: CircleAlert, row: 'text-danger bg-danger/8', label: 'Error' },
};

const time = (ts: number) => {
  const d = new Date(ts);
  const p = (n: number, l = 2) => String(n).padStart(l, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(d.getMilliseconds(), 3)}`;
};

/**
 * Drawer pinned to the bottom of the preview. The header bar is always visible; the log panel slides up
 * over the stage with a transform, so opening it never re-lays-out (or rescales) the preview.
 */
export function ConsoleDrawer() {
  const entries = useStore($consoleEntries);
  const open = useStore($consoleOpen);
  const reduce = useReducedMotion();
  const errors = entries.filter((e) => e.level === 'error').length;
  const warns = entries.filter((e) => e.level === 'warn').length;

  return (
    <>
      <div
        className="pointer-events-none absolute inset-x-0 overflow-hidden"
        style={{ bottom: CONSOLE_BAR_H, height: 'min(55%, 280px)' }}
      >
        <div
          id="console-panel"
          className={cn(
            'console-panel pointer-events-auto absolute inset-0 border-t border-line-strong bg-surface',
            !open && 'is-closed',
          )}
          inert={!open}
        >
          <ConsoleList entries={entries} />
        </div>
      </div>

      <div
        className="absolute inset-x-0 bottom-0 flex items-center gap-2 border-t border-line bg-paper pr-1.5 pl-1"
        style={{ height: CONSOLE_BAR_H }}
      >
        <button
          type="button"
          aria-expanded={open}
          aria-controls="console-panel"
          onClick={() => setConsoleOpen(!open)}
          className="flex h-7 items-center gap-2 rounded-[var(--radius-sm)] px-2 text-ink hover:bg-surface-2"
        >
          <ChevronUp
            aria-hidden
            className={cn('size-4 text-muted transition-transform duration-200 ease-[var(--ease-out-quart)]', open && 'rotate-180')}
          />
          <span className="label-caps">Console</span>
          <motion.span
            key={entries.length}
            initial={reduce || entries.length === 0 ? false : { scale: 1.25 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.18, ease: [0.25, 1, 0.5, 1] }}
            className={cn(
              'min-w-5 rounded-[var(--radius-sm)] px-1 py-0.5 text-center font-mono text-[0.6875rem] leading-none tabular-nums',
              entries.length ? 'bg-ink text-paper' : 'bg-surface-2 text-muted',
            )}
            aria-label={`${entries.length} ${entries.length === 1 ? 'message' : 'messages'}`}
          >
            {entries.length}
          </motion.span>
        </button>

        {errors > 0 && (
          <span className="flex items-center gap-1 font-mono text-[0.6875rem] text-danger tabular-nums">
            <CircleAlert className="size-3.5" aria-hidden />
            {errors} {errors === 1 ? 'error' : 'errors'}
          </span>
        )}
        {warns > 0 && (
          <span className="flex items-center gap-1 font-mono text-[0.6875rem] text-warn tabular-nums">
            <TriangleAlert className="size-3.5" aria-hidden />
            {warns} {warns === 1 ? 'warning' : 'warnings'}
          </span>
        )}

        <Tip label="Clear console" side="top">
          <button
            type="button"
            aria-label="Clear console"
            onClick={clearConsole}
            disabled={entries.length === 0}
            className="ml-auto grid size-7 place-items-center rounded-[var(--radius-sm)] text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-40"
          >
            <Ban className="size-3.5" aria-hidden />
          </button>
        </Tip>
      </div>
    </>
  );
}

function ConsoleList({ entries }: { entries: ConsoleEntry[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  const stick = useRef(true);

  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [entries]);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const onScroll = () => {
      stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div ref={scroller} role="log" aria-label="Console output" className="h-full overflow-auto overscroll-contain">
      {entries.length === 0 ? (
        <p className="px-4 py-3 font-mono text-xs text-muted">
          Nothing logged yet. Output from console.log, warnings and uncaught errors shows up here.
        </p>
      ) : (
        <ol className="font-mono text-xs leading-relaxed">
          {entries.map((e) => {
            const L = LEVEL[e.level];
            const Icon = L.icon;
            return (
              <li
                key={e.id}
                className={cn('flex gap-2 border-b border-line px-3 py-1.5', L.row)}
                style={e.level === 'error' ? { boxShadow: 'inset 2px 0 0 var(--danger)' } : undefined}
              >
                <Icon className="mt-[3px] size-3.5 shrink-0 opacity-80" aria-label={L.label} />
                <div className="min-w-0 flex-1 whitespace-pre-wrap break-words">
                  {e.args.map((a, i) => (
                    <span key={i}>
                      {i > 0 && ' '}
                      {a}
                    </span>
                  ))}
                </div>
                <time className="shrink-0 text-[0.625rem] text-muted tabular-nums" dateTime={new Date(e.timestamp).toISOString()}>
                  {time(e.timestamp)}
                </time>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
