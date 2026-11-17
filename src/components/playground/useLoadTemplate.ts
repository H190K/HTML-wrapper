import { getTemplate, TEMPLATES } from '@/lib/templates';
import type { Project } from '@/lib/types';
import { $project, resetTo } from '@/stores/playground';
import { askConfirm } from './confirm';

const same = (a: Project, b: Project) => a.html === b.html && a.css === b.css && a.js === b.js;

/** True when the current code is neither empty nor an untouched template, so replacing it would lose work. */
export function hasOwnWork(): boolean {
  const p = $project.get();
  if (!p.html.trim() && !p.css.trim() && !p.js.trim()) return false;
  return !TEMPLATES.some((t) => same(t.project, p));
}

export function loadTemplate(id: string): void {
  const t = getTemplate(id);
  if (!t) return;
  const go = () => resetTo({ ...t.project }, 'user');
  if (!hasOwnWork()) return go();
  askConfirm({
    title: `Replace your code with ${t.name}?`,
    description: 'All three lanes will be overwritten. Download a .zip first if you want to keep what you have.',
    confirmLabel: `Load ${t.name}`,
    onConfirm: go,
  });
}

export const useLoadTemplate = () => loadTemplate;
