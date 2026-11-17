import { useStore } from '@nanostores/react';
import { WrapText } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useRef, useState, type KeyboardEvent } from 'react';
import { cn } from '@/lib/cn';
import { readPref, writePref } from '@/lib/storage';
import type { Lang } from '@/lib/types';
import { $activeLang, $persisting, setActiveLang } from '@/stores/playground';
import { Tip } from '@/components/ui/tooltip';
import { CodeEditor } from './CodeEditor';

export const LANES: { id: Lang; no: string; label: string; color: string }[] = [
  { id: 'html', no: '01', label: 'HTML', color: 'var(--lane-html)' },
  { id: 'css', no: '02', label: 'CSS', color: 'var(--lane-css)' },
  { id: 'js', no: '03', label: 'JS', color: 'var(--lane-js)' },
];

const WRAP_KEY = 'html-runner:wrap';

export function EditorPane() {
  const active = useStore($activeLang);
  const persisting = useStore($persisting);
  const [wrap, setWrap] = useState(() => readPref(WRAP_KEY) === '1');
  const [cursor, setCursor] = useState({ line: 1, col: 1 });
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  const onCursor = useCallback((line: number, col: number) => {
    setCursor((c) => (c.line === line && c.col === col ? c : { line, col }));
  }, []);

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = -1;
    if (e.key === 'ArrowRight') next = (index + 1) % LANES.length;
    else if (e.key === 'ArrowLeft') next = (index - 1 + LANES.length) % LANES.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = LANES.length - 1;
    if (next < 0) return;
    e.preventDefault();
    setActiveLang(LANES[next].id);
    tabs.current[next]?.focus();
  };

  const toggleWrap = () => {
    setWrap((w) => {
      writePref(WRAP_KEY, w ? '0' : '1');
      return !w;
    });
  };

  const lane = LANES.find((l) => l.id === active)!;

  return (
    <section aria-label="Code" className="flex h-full min-h-0 flex-col bg-surface">
      <div className="flex h-10 shrink-0 items-stretch border-b border-line pr-1.5">
        <div role="tablist" aria-label="Language lanes" className="flex items-stretch">
          {LANES.map((l, i) => {
            const selected = l.id === active;
            return (
              <button
                key={l.id}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                role="tab"
                id={`lane-tab-${l.id}`}
                aria-selected={selected}
                aria-controls="lane-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveLang(l.id)}
                onKeyDown={(e) => onTabKey(e, i)}
                className={cn(
                  'relative flex items-center gap-2 border-r border-line px-3.5 text-sm transition-colors duration-150 sm:px-4',
                  'focus-visible:-outline-offset-2',
                  selected ? 'bg-surface text-ink' : 'bg-paper text-muted hover:text-ink',
                )}
              >
                <span aria-hidden className="size-2 rounded-[1px]" style={{ background: l.color }} />
                <span className="font-mono text-[0.6875rem] tracking-wider text-muted">{l.no}</span>
                <span className="font-semibold tracking-tight">{l.label}</span>
                {selected && (
                  <motion.span
                    layoutId="lane-underline"
                    aria-hidden
                    className="absolute inset-x-0 -bottom-px h-0.5"
                    style={{ background: l.color }}
                    transition={{ type: 'tween', duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
                  />
                )}
              </button>
            );
          })}
        </div>
        <div className="flex-1 border-b-0 bg-paper" />
        <div className="flex items-center bg-paper pl-1.5">
          <Tip label={wrap ? 'Turn off word wrap' : 'Turn on word wrap'}>
            <button
              type="button"
              aria-pressed={wrap}
              aria-label="Word wrap"
              onClick={toggleWrap}
              className={cn(
                'grid size-7 place-items-center rounded-[var(--radius-sm)] border transition-colors duration-150',
                wrap ? 'border-line-strong bg-surface text-ink' : 'border-transparent text-muted hover:text-ink',
              )}
            >
              <WrapText className="size-4" />
            </button>
          </Tip>
        </div>
      </div>

      <div
        id="lane-panel"
        role="tabpanel"
        aria-labelledby={`lane-tab-${active}`}
        className="relative min-h-0 flex-1"
        style={{ ['--lane' as string]: lane.color }}
      >
        <CodeEditor wrap={wrap} onCursor={onCursor} />
      </div>

      <div className="flex h-7 shrink-0 items-center gap-4 border-t border-line bg-paper px-3 font-mono text-[0.6875rem] text-muted">
        <span className="flex items-center gap-1.5 text-ink-2">
          <span aria-hidden className="size-1.5 rounded-[1px]" style={{ background: lane.color }} />
          {lane.label}
        </span>
        <span aria-label={`Line ${cursor.line}, column ${cursor.col}`}>
          Ln {cursor.line}, Col {cursor.col}
        </span>
        <span className="hidden truncate lg:inline">Esc then Tab leaves the editor</span>
        <span className="ml-auto truncate">{persisting ? 'Saved in this browser' : 'Not saved until you edit'}</span>
      </div>
    </section>
  );
}
