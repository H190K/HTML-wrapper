/** Shared contracts. Owned by the architecture: do not change shapes without updating docs/ARCHITECTURE.md. */

export type Lang = 'html' | 'css' | 'js';

export interface Project {
  html: string;
  css: string;
  js: string;
}

export type DeviceId = 'desktop' | 'tablet' | 'mobile';

export interface Device {
  id: DeviceId;
  label: string;
  /** CSS pixel size of the simulated viewport. `null` = fill the pane. */
  width: number | null;
  height: number | null;
}

export type ConsoleLevel = 'log' | 'info' | 'warn' | 'error';

export interface ConsoleEntry {
  id: number;
  level: ConsoleLevel;
  /** Pre-serialised arguments (the sandbox stringifies before posting). */
  args: string[];
  timestamp: number;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  project: Project;
}

/** Messages posted from the sandboxed preview iframe to the app shell. */
export type PreviewMessage =
  | { source: 'html-runner'; runId: number; type: 'ready'; durationMs: number }
  | { source: 'html-runner'; runId: number; type: 'console'; level: ConsoleLevel; args: string[] };
