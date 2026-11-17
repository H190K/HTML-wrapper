import { asProject } from './share';
import type { Project } from './types';

export const PROJECT_KEY = 'html-runner:project';

export function loadProject(): Project | null {
  try {
    const raw = localStorage.getItem(PROJECT_KEY);
    if (!raw) return null;
    return asProject(JSON.parse(raw));
  } catch {
    return null;
  }
}

/** Callers debounce. Silently ignores quota or privacy-mode failures. */
export function saveProject(project: Project): void {
  try {
    localStorage.setItem(
      PROJECT_KEY,
      JSON.stringify({ html: project.html, css: project.css, js: project.js, savedAt: Date.now() }),
    );
  } catch {
    /* storage unavailable */
  }
}

/** Small typed helpers for UI preferences. */
export function readPref(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writePref(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}
