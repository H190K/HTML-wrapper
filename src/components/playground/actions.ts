import { buildStandaloneHtml, buildZip, downloadBlob } from '@/lib/export';
import { encodeProject } from '@/lib/share';
import { writePref } from '@/lib/storage';
import { DEFAULT_TEMPLATE_ID, getTemplate } from '@/lib/templates';
import { $project, resetTo } from '@/stores/playground';
import { askConfirm } from './confirm';

export const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);

export const modKey = () => (isMac() ? '⌘' : 'Ctrl');

export function shareUrl(): string {
  return `${location.origin}/app#code=${encodeProject($project.get())}`;
}

/** Copies a share link. Resolves to the URL; rejects only if the clipboard is unavailable. */
export async function copyShareLink(): Promise<string> {
  const url = shareUrl();
  try {
    await navigator.clipboard.writeText(url);
    return url;
  } catch (err) {
    // Clipboard blocked (insecure context or permissions): let the user copy it by hand.
    window.prompt('Copy this share link', url);
    throw err;
  }
}

export function downloadZip(): void {
  downloadBlob(buildZip($project.get()) as Uint8Array<ArrayBuffer>, 'html-runner-project.zip', 'application/zip');
}

export function downloadHtml(): void {
  downloadBlob(buildStandaloneHtml($project.get()), 'html-runner-project.html', 'text/html');
}

export function confirmReset(): void {
  const hello = getTemplate(DEFAULT_TEMPLATE_ID)!;
  askConfirm({
    title: 'Reset to the starter project?',
    description: `This replaces all three lanes with the ${hello.name} template. Download a .zip first if you want to keep your code.`,
    confirmLabel: 'Reset',
    onConfirm: () => resetTo({ ...hello.project }, 'user'),
  });
}

export type Theme = 'light' | 'dark';

export const currentTheme = (): Theme => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

export function setTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  writePref('html-runner:theme', theme);
}
