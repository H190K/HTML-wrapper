import { useStore } from '@nanostores/react';
import {
  Check,
  ChevronDown,
  CircleHelp,
  Download,
  FileArchive,
  FileCode,
  LayoutTemplate,
  Link2,
  Moon,
  MoreHorizontal,
  Play,
  RotateCcw,
  Sun,
  Timer,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { TEMPLATES } from '@/lib/templates';
import { $autoRun, $run, setAutoRun } from '@/stores/playground';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tip } from '@/components/ui/tooltip';
import {
  confirmReset,
  copyShareLink,
  currentTheme,
  downloadHtml,
  downloadZip,
  modKey,
  setTheme,
  type Theme,
} from './actions';
import { announce, formatDuration, runNow, takeRunAnnouncement } from './announce';
import { loadTemplate } from './useLoadTemplate';

const EASE = [0.25, 1, 0.5, 1] as const;

export function TopBar({ compact, onRun }: { compact: boolean; onRun?: () => void }) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-1.5 border-b border-line-strong bg-paper px-2 sm:gap-3 sm:px-3">
      <Wordmark compact={compact} />
      {!compact && <span aria-hidden className="h-5 w-px bg-line" />}
      <RunButton compact={compact} onRun={onRun} />
      {!compact && <AutoRunSwitch />}
      <Stopwatch compact={compact} />

      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
        {compact ? (
          <>
            <ShareButton compact />
            <MobileMenu />
          </>
        ) : (
          <>
            <TemplatesMenu />
            <ShareButton />
            <ExportMenu />
            <span aria-hidden className="mx-1 h-5 w-px bg-line" />
            <Tip label="Reset to the starter project">
              <Button variant="ghost" size="icon" aria-label="Reset" onClick={confirmReset}>
                <RotateCcw />
              </Button>
            </Tip>
            <ThemeToggle />
            <Tip label="About HTML Runner">
              <Button variant="ghost" size="icon" asChild>
                <a href="/about" aria-label="About HTML Runner">
                  <CircleHelp />
                </a>
              </Button>
            </Tip>
          </>
        )}
      </div>
    </header>
  );
}

function Wordmark({ compact }: { compact: boolean }) {
  return (
    <a
      href="/"
      className={cn(
        'display flex h-8 items-center rounded-[var(--radius-sm)] px-1 whitespace-nowrap text-ink',
        compact ? 'text-[0.95rem]' : 'text-[1.05rem]',
      )}
      aria-label="HTML Runner home"
    >
      HTML<span className="ml-[0.18em] text-track">Runner</span>
    </a>
  );
}

function RunButton({ compact, onRun }: { compact: boolean; onRun?: () => void }) {
  const reduce = useReducedMotion();
  const [launch, setLaunch] = useState(0);
  return (
    <Tip label="Run" shortcut={`${modKey()} ↵`}>
      <Button
        variant="primary"
        size={compact ? 'md' : 'lg'}
        aria-keyshortcuts="Control+Enter Meta+Enter"
        onClick={() => {
          setLaunch((n) => n + 1);
          runNow();
          onRun?.();
        }}
        className="gap-2 pr-3 pl-3"
      >
        <motion.span
          key={launch}
          initial={launch && !reduce ? { x: -5, opacity: 0.4 } : false}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.22, ease: EASE }}
          className="grid place-items-center"
        >
          <Play className="fill-current" aria-hidden />
        </motion.span>
        <span>Run</span>
        {!compact && (
          <kbd className="ml-1 hidden rounded-[2px] border border-on-track/35 px-1 py-0.5 font-mono text-[0.625rem] leading-none opacity-85 lg:inline">
            {modKey()} ↵
          </kbd>
        )}
      </Button>
    </Tip>
  );
}

function AutoRunSwitch() {
  const on = useStore($autoRun);
  return (
    <Tip label={on ? 'Runs 400 ms after you stop typing' : 'Runs only when you press Run'}>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => setAutoRun(!on)}
        className="flex h-8 items-center gap-2 rounded-[var(--radius-md)] px-1.5 text-sm text-ink-2 hover:text-ink"
      >
        <span
          aria-hidden
          className={cn(
            'relative h-4 w-7 rounded-full border transition-colors duration-200',
            on ? 'border-ink bg-ink' : 'border-line-strong/40 bg-surface-2',
          )}
        >
          <span
            className={cn(
              'absolute top-1/2 left-[2px] size-2.5 -translate-y-1/2 rounded-full transition-transform duration-200 ease-[var(--ease-out-quart)]',
              on ? 'translate-x-[12px] bg-paper' : 'bg-muted',
            )}
          />
        </span>
        <span className="hidden lg:inline">Auto-run</span>
        <span className="sr-only lg:hidden">Auto-run</span>
      </button>
    </Tip>
  );
}

/** The last run's render time, read like a stopwatch. New results roll in from below. */
function Stopwatch({ compact }: { compact: boolean }) {
  const runState = useStore($run);
  const reduce = useReducedMotion();
  const pending = runState.durationMs === null;
  const text = pending ? '--' : formatDuration(runState.durationMs!);

  useEffect(() => {
    if (runState.durationMs !== null && takeRunAnnouncement()) {
      announce(`Ran in ${formatDuration(runState.durationMs)}`);
    }
  }, [runState.durationMs]);

  return (
    <Tip label="Time from load start to the page's load event, last run">
      <div
        tabIndex={0}
        role="timer"
        aria-live="off"
        aria-label={pending ? 'Running' : `Last run took ${text}`}
        className="flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] px-1 font-mono text-xs text-ink tabular-nums"
      >
        <Timer
          aria-hidden
          className={cn(
            'size-3.5 shrink-0 transition-colors duration-200',
            pending ? 'text-track' : 'text-muted',
            compact && 'hidden min-[380px]:block',
          )}
        />
        <span className={cn('relative inline-flex h-4 overflow-hidden', compact ? 'w-[3.25rem]' : 'w-[4.25rem]')}>
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={pending ? `p${runState.id}` : `d${runState.id}`}
              initial={reduce ? { opacity: 0 } : { y: '100%', opacity: 0 }}
              animate={{ y: '0%', opacity: pending ? 0.5 : 1 }}
              exit={reduce ? { opacity: 0 } : { y: '-100%', opacity: 0 }}
              transition={{ duration: 0.22, ease: EASE }}
              className="absolute inset-0 leading-4"
            >
              {text}
            </motion.span>
          </AnimatePresence>
        </span>
      </div>
    </Tip>
  );
}

function ShareButton({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const reduce = useReducedMotion();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const onClick = async () => {
    clearTimeout(timer.current);
    try {
      const url = await copyShareLink();
      setState('copied');
      announce(url.length > 8000 ? 'Share link copied. It is long, some apps may cut it off.' : 'Share link copied');
    } catch {
      setState('failed');
      announce('Could not copy the share link. Your browser blocked clipboard access.');
    }
    timer.current = setTimeout(() => setState('idle'), 2000);
  };

  const label = state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : 'Share';
  const Icon = state === 'copied' ? Check : Link2;

  return (
    <Tip label="Copy a link that contains your code">
      <Button
        variant="outline"
        size={compact ? 'icon' : 'md'}
        onClick={onClick}
        aria-label={compact ? label : undefined}
        className={cn(!compact && 'w-[6.25rem] xl:w-[6.5rem]', state === 'copied' && 'border-infield text-infield')}
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={state}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: EASE }}
            className="flex items-center gap-2"
          >
            <Icon aria-hidden className="size-4" />
            {!compact && label}
          </motion.span>
        </AnimatePresence>
      </Button>
    </Tip>
  );
}

function TemplatesMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" aria-label="Templates" className="px-2 xl:px-3">
          <LayoutTemplate />
          <span className="hidden xl:inline">Templates</span>
          <ChevronDown className="text-muted" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72">
        <DropdownMenuLabel>Start from a template</DropdownMenuLabel>
        {TEMPLATES.map((t) => (
          <DropdownMenuItem key={t.id} onSelect={() => loadTemplate(t.id)} className="flex-col items-start gap-0.5">
            <span className="font-medium">{t.name}</span>
            <span className="text-xs text-muted">{t.description}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ExportMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" aria-label="Export" className="px-2 xl:px-3">
          <Download />
          <span className="hidden xl:inline">Export</span>
          <ChevronDown className="text-muted" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <DropdownMenuItem onSelect={downloadZip}>
          <FileArchive />
          <span className="flex-1">Download .zip</span>
          <kbd className="font-mono text-[0.625rem] text-muted">{modKey()} S</kbd>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={downloadHtml}>
          <FileCode />
          <span className="flex-1">Download single .html</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, set] = useState<Theme>(currentTheme);
  useEffect(() => {
    const mo = new MutationObserver(() => set(currentTheme()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, []);
  return [theme, setTheme];
}

function ThemeToggle() {
  const [theme, set] = useTheme();
  const reduce = useReducedMotion();
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <Tip label={`Switch to ${next} theme`}>
      <Button variant="ghost" size="icon" aria-label={`Switch to ${next} theme`} onClick={() => set(next)}>
        <motion.span
          key={theme}
          initial={reduce ? false : { rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.24, ease: EASE }}
          className="grid place-items-center"
        >
          {theme === 'dark' ? <Moon aria-hidden /> : <Sun aria-hidden />}
        </motion.span>
      </Button>
    </Tip>
  );
}

/** Phone layout: everything except Run and Share lives here. */
function MobileMenu() {
  const auto = useStore($autoRun);
  const [theme, set] = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="More actions">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <DropdownMenuItem onSelect={(e) => (e.preventDefault(), setAutoRun(!auto))} role="menuitemcheckbox" aria-checked={auto}>
          <Play />
          <span className="flex-1">Auto-run</span>
          <span className="font-mono text-xs text-muted">{auto ? 'On' : 'Off'}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => set(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? <Sun /> : <Moon />}
          {theme === 'dark' ? 'Light theme' : 'Dark theme'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Templates</DropdownMenuLabel>
        {TEMPLATES.map((t) => (
          <DropdownMenuItem key={t.id} onSelect={() => loadTemplate(t.id)}>
            <LayoutTemplate />
            {t.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={downloadZip}>
          <FileArchive />
          Download .zip
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={downloadHtml}>
          <FileCode />
          Download single .html
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={confirmReset}>
          <RotateCcw />
          Reset
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/about">
            <CircleHelp />
            About HTML Runner
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
