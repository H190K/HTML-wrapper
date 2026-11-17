import { atom } from 'nanostores';
import { buildPreviewDocument } from '../lib/preview';
import { decodeProject } from '../lib/share';
import { loadProject, readPref, saveProject, writePref } from '../lib/storage';
import { DEFAULT_TEMPLATE_ID, getTemplate } from '../lib/templates';
import type { ConsoleEntry, ConsoleLevel, DeviceId, Lang, Project } from '../lib/types';

export interface RunState {
  id: number;
  startedAt: number;
  durationMs: number | null;
}

/** Where the current project came from. `share` and `url-template` are not saved until the user edits. */
export type ProjectOrigin = 'share' | 'url-template' | 'saved' | 'default' | 'user';

const AUTORUN_KEY = 'html-runner:autorun';
const DEVICE_KEY = 'html-runner:device';
const AUTORUN_DELAY = 400;
const SAVE_DELAY = 500;
const MAX_ENTRIES = 500;

const fallback = (): Project => ({ ...getTemplate(DEFAULT_TEMPLATE_ID)!.project });

/* ---------------- atoms (contract) ---------------- */
export const $project = atom<Project>(fallback());
export const $activeLang = atom<Lang>('html');
export const $device = atom<DeviceId>('desktop');
export const $autoRun = atom<boolean>(true);
export const $consoleEntries = atom<ConsoleEntry[]>([]);
export const $consoleOpen = atom<boolean>(false);
export const $run = atom<RunState>({ id: 0, startedAt: 0, durationMs: null });
export const $previewDoc = atom<string>('');

/* ---------------- atoms (shell extras) ---------------- */
/** Bumped whenever the project is replaced wholesale (template, reset, share), so editors reload their documents. */
export const $docVersion = atom<number>(0);
export const $origin = atom<ProjectOrigin>('default');
/** True once the project should be written to localStorage. */
export const $persisting = atom<boolean>(true);
/** Set when a share link failed to decode, so the UI can say so. */
export const $loadNotice = atom<string | null>(null);

let autoRunTimer: ReturnType<typeof setTimeout> | undefined;
let saveTimer: ReturnType<typeof setTimeout> | undefined;
let entryId = 0;
let autoOpenedOnError = false;

/* ---------------- actions (contract) ---------------- */

export function setCode(lang: Lang, value: string): void {
  const current = $project.get();
  if (current[lang] === value) return;
  $project.set({ ...current, [lang]: value });

  if (!$persisting.get()) {
    // First edit of a shared or URL-template project: from now on it is the user's own.
    $persisting.set(true);
    $origin.set('user');
    clearUrlSource();
  }
  scheduleSave();

  if ($autoRun.get()) {
    clearTimeout(autoRunTimer);
    autoRunTimer = setTimeout(run, AUTORUN_DELAY);
  }
}

export function run(): void {
  clearTimeout(autoRunTimer);
  const id = $run.get().id + 1;
  $run.set({ id, startedAt: now(), durationMs: null });
  clearConsole();
  $previewDoc.set(buildPreviewDocument($project.get(), { runId: id }));
}

export function resetTo(project: Project, origin: ProjectOrigin = 'user'): void {
  $project.set({ html: project.html, css: project.css, js: project.js });
  $origin.set(origin);
  $docVersion.set($docVersion.get() + 1);
  const persist = origin !== 'share' && origin !== 'url-template';
  $persisting.set(persist);
  if (persist) {
    if (origin === 'user') clearUrlSource();
    scheduleSave();
  }
  run();
}

export function clearConsole(): void {
  $consoleEntries.set([]);
}

export function pushConsole(entry: { level: ConsoleLevel; args: string[]; timestamp?: number }): void {
  const next: ConsoleEntry = {
    id: ++entryId,
    level: entry.level,
    args: entry.args.map(String),
    timestamp: entry.timestamp ?? Date.now(),
  };
  const list = $consoleEntries.get();
  $consoleEntries.set(list.length >= MAX_ENTRIES ? [...list.slice(1 - MAX_ENTRIES), next] : [...list, next]);
  if (next.level === 'error' && !autoOpenedOnError) {
    autoOpenedOnError = true;
    $consoleOpen.set(true);
  }
}

export function markReady(runId: number, durationMs: number): void {
  const current = $run.get();
  if (runId !== current.id || current.durationMs !== null) return;
  $run.set({ ...current, durationMs: Math.max(0, durationMs) });
}

/* ---------------- shell actions ---------------- */

export function setAutoRun(on: boolean): void {
  $autoRun.set(on);
  writePref(AUTORUN_KEY, on ? '1' : '0');
  if (!on) clearTimeout(autoRunTimer);
}

export function setDevice(id: DeviceId): void {
  $device.set(id);
  writePref(DEVICE_KEY, id);
}

export function setActiveLang(lang: Lang): void {
  $activeLang.set(lang);
}

export function setConsoleOpen(open: boolean): void {
  $consoleOpen.set(open);
}

/** Starts persisting a project loaded from a link without waiting for an edit. */
export function keepProject(): void {
  $persisting.set(true);
  $origin.set('user');
  clearUrlSource();
  flushSave();
}

/**
 * Resolves the initial project, in priority order:
 * `#code=` share payload, `?template=id`, saved project, else the `hello` template.
 * Safe to call more than once; only the first call does anything.
 */
let initialised = false;
export function initPlayground(): void {
  if (initialised || typeof window === 'undefined') return;
  initialised = true;

  const auto = readPref(AUTORUN_KEY);
  if (auto === '0') $autoRun.set(false);
  const device = readPref(DEVICE_KEY);
  if (device === 'desktop' || device === 'tablet' || device === 'mobile') $device.set(device);

  const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
  const query = new URLSearchParams(location.search);
  const code = hash.get('code');
  const templateId = query.get('template');

  let project: Project | null = null;
  let origin: ProjectOrigin = 'default';

  if (code !== null) {
    project = decodeProject(code);
    if (project) origin = 'share';
    else $loadNotice.set('That share link is damaged or incomplete, so your last project was opened instead.');
  }
  if (!project && templateId) {
    const t = getTemplate(templateId);
    if (t) {
      project = { ...t.project };
      origin = 'url-template';
    }
  }
  if (!project) {
    project = loadProject();
    if (project) origin = 'saved';
  }
  if (!project) project = fallback();

  $project.set(project);
  $origin.set(origin);
  $persisting.set(origin !== 'share' && origin !== 'url-template');
  $docVersion.set($docVersion.get() + 1);

  addEventListener('pagehide', () => {
    if (saveTimer !== undefined) flushSave();
  });
  run();
}

/* ---------------- internals ---------------- */

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function scheduleSave(): void {
  if (!$persisting.get()) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flushSave, SAVE_DELAY);
}

function flushSave(): void {
  clearTimeout(saveTimer);
  saveTimer = undefined;
  if ($persisting.get()) saveProject($project.get());
}

/** Drops `#code=` / `?template=` from the address bar so a reload restores the user's own work. */
function clearUrlSource(): void {
  if (typeof location === 'undefined') return;
  if (!location.hash && !location.search) return;
  history.replaceState(history.state, '', location.pathname);
}
