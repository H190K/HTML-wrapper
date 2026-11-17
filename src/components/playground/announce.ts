import { atom } from 'nanostores';
import { run } from '@/stores/playground';

/** Text for the shell's polite live region. */
export const $announcement = atom('');

let seq = 0;
export function announce(text: string): void {
  // A zero-width suffix forces screen readers to re-read identical consecutive messages.
  seq = (seq + 1) % 2;
  $announcement.set(text + (seq ? '​' : ''));
}

let announceNextRun = false;

/** A run the user asked for explicitly (button or shortcut): its completion is announced. */
export function runNow(): void {
  announceNextRun = true;
  run();
}

export function takeRunAnnouncement(): boolean {
  const v = announceNextRun;
  announceNextRun = false;
  return v;
}

export function formatDuration(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)} s`;
  if (ms < 10) return `${ms.toFixed(1)} ms`;
  return `${Math.round(ms)} ms`;
}
