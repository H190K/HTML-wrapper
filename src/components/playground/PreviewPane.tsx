import { useStore } from '@nanostores/react';
import { Monitor, RotateCw, Smartphone, Tablet, X } from 'lucide-react';
import { motion, useAnimate, useReducedMotion } from 'motion/react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { DEVICES, getDevice } from '@/lib/devices';
import { TEMPLATES } from '@/lib/templates';
import type { DeviceId } from '@/lib/types';
import { $device, $loadNotice, $project, $run, run, setDevice } from '@/stores/playground';
import { Tip } from '@/components/ui/tooltip';
import { ConsoleDrawer, CONSOLE_BAR_H } from './ConsoleDrawer';
import { PreviewFrame } from './PreviewFrame';
import { useLoadTemplate } from './useLoadTemplate';

const ICONS: Record<DeviceId, typeof Monitor> = { desktop: Monitor, tablet: Tablet, mobile: Smartphone };
const STAGE_PAD = 24;

function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ w: Math.round(width), h: Math.round(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

export function PreviewPane() {
  const deviceId = useStore($device);
  const runState = useStore($run);
  const project = useStore($project);
  const notice = useStore($loadNotice);
  const reduce = useReducedMotion();
  const [stageRef, stage] = useSize<HTMLDivElement>();
  const device = getDevice(deviceId);
  const fixed = device.width !== null && device.height !== null;
  const isEmpty = !project.html.trim() && !project.css.trim() && !project.js.trim();

  const dw = device.width ?? stage.w;
  const dh = device.height ?? stage.h;
  const scale =
    fixed && stage.w > 0
      ? Math.min(1, (stage.w - STAGE_PAD * 2) / dw, (stage.h - STAGE_PAD * 2) / dh)
      : 1;
  const safeScale = Math.max(0.1, scale);

  // A short settle when the device changes: opacity + transform only, and the frame is not remounted.
  const [frameScope, animate] = useAnimate<HTMLDivElement>();
  const firstDevice = useRef(true);
  useEffect(() => {
    if (firstDevice.current) {
      firstDevice.current = false;
      return;
    }
    if (reduce || !frameScope.current) return;
    animate(
      frameScope.current,
      { opacity: [0, 1], y: [10, 0], scale: [0.985, 1] },
      { duration: 0.28, ease: [0.25, 1, 0.5, 1] },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);
  const [spin, setSpin] = useState(0);

  return (
    <section aria-label="Preview" className="flex h-full min-h-0 flex-col bg-paper">
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-line bg-paper px-2 sm:px-3">
        <span className="label-caps hidden text-muted xl:inline">Preview</span>
        <div role="radiogroup" aria-label="Device size" className="flex rounded-[var(--radius-md)] border border-line bg-surface p-0.5">
          {DEVICES.map((d) => {
            const Icon = ICONS[d.id];
            const on = d.id === deviceId;
            return (
              <Tip key={d.id} label={d.width ? `${d.label}, ${d.width} × ${d.height}` : `${d.label}, fills the pane`}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={on}
                  aria-label={d.label}
                  onClick={() => setDevice(d.id)}
                  onKeyDown={(e) => {
                    const i = DEVICES.indexOf(d);
                    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
                    if (!step) return;
                    e.preventDefault();
                    const next = DEVICES[(i + step + DEVICES.length) % DEVICES.length];
                    setDevice(next.id);
                    (e.currentTarget.parentElement?.children[DEVICES.indexOf(next)] as HTMLElement | undefined)?.focus();
                  }}
                  tabIndex={on ? 0 : -1}
                  className={cn(
                    'relative flex h-6 items-center gap-1.5 rounded-[var(--radius-sm)] px-2 text-xs font-medium transition-colors duration-150',
                    on ? 'text-paper' : 'text-muted hover:text-ink',
                  )}
                >
                  {on && (
                    <motion.span
                      layoutId="device-pill"
                      aria-hidden
                      className="absolute inset-0 rounded-[var(--radius-sm)] bg-ink"
                      transition={{ type: 'tween', duration: reduce ? 0 : 0.24, ease: [0.25, 1, 0.5, 1] }}
                    />
                  )}
                  <Icon className="relative size-3.5" aria-hidden />
                  <span className="relative hidden md:inline">{d.label}</span>
                </button>
              </Tip>
            );
          })}
        </div>

        <p className="ml-auto truncate font-mono text-[0.6875rem] text-muted tabular-nums">
          <span className="text-ink-2">
            {dw} × {dh}
          </span>{' '}
          at {Math.round(safeScale * 100)}%
        </p>

        <Tip label="Run again" shortcut="Ctrl ↵">
          <button
            type="button"
            aria-label="Run again"
            onClick={() => {
              setSpin((s) => s + 1);
              run();
            }}
            className="grid size-7 place-items-center rounded-[var(--radius-sm)] text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
          >
            <motion.span
              key={spin}
              initial={spin && !reduce ? { rotate: -180 } : false}
              animate={{ rotate: 0 }}
              transition={{ duration: 0.32, ease: [0.25, 1, 0.5, 1] }}
              className="grid place-items-center"
            >
              <RotateCw className="size-4" aria-hidden />
            </motion.span>
          </button>
        </Tip>
      </div>

      {notice && (
        <div role="status" className="flex shrink-0 items-start gap-3 border-b border-line bg-surface px-3 py-2 text-sm text-ink-2">
          <span aria-hidden className="mt-1.5 size-1.5 shrink-0 bg-warn" />
          <p className="flex-1">{notice}</p>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => $loadNotice.set(null)}
            className="grid size-6 place-items-center rounded-[var(--radius-sm)] text-muted hover:text-ink"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        <div
          ref={stageRef}
          className={cn('stage absolute inset-x-0 top-0 overflow-hidden', fixed ? 'bg-surface-2' : 'bg-paper')}
          style={{ bottom: CONSOLE_BAR_H }}
        >
          <div
            className={fixed ? 'absolute top-1/2 left-1/2' : 'absolute inset-0'}
            style={
              fixed
                ? {
                    width: dw,
                    height: dh,
                    transform: `translate(-50%, -50%) scale(${safeScale})`,
                    transition: 'transform 280ms var(--ease-out-quart)',
                  }
                : undefined
            }
          >
            <div
              ref={frameScope}
              className={cn(
                'size-full overflow-hidden bg-white',
                // outline, not border, so the frame's inner size is exactly the device size
                fixed && 'rounded-[var(--radius-md)] outline-1 outline-line-strong shadow-[6px_6px_0_0_var(--line)]',
              )}
            >
              <PreviewFrame title={`Preview, ${device.label.toLowerCase()} size`} />
            </div>
          </div>

          {isEmpty && <EmptyState />}
          {runState.durationMs === null && runState.id > 0 && <RunningBar key={runState.id} />}
        </div>

        <ConsoleDrawer />
      </div>
    </section>
  );
}

/** A thin bar that sweeps across the top of the stage while a run is loading. */
function RunningBar() {
  return <div aria-hidden className="run-sweep absolute inset-x-0 top-0 h-0.5 origin-left bg-track" />;
}

function EmptyState() {
  const load = useLoadTemplate();
  return (
    <div className="absolute inset-0 grid place-items-center bg-paper p-6">
      <div className="max-w-sm">
        <p className="display text-3xl text-ink">Nothing on the track yet.</p>
        <p className="mt-3 text-sm text-ink-2">
          Write some markup in lane 01 and press Run, or start from one of these:
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => load(t.id)}
                className="h-8 rounded-[var(--radius-md)] border border-line bg-surface px-3 text-sm text-ink transition-colors duration-150 hover:border-line-strong"
              >
                {t.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
