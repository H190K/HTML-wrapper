import { describe, expect, it } from 'vitest';
import { getTemplate, TEMPLATES } from './templates';

describe('templates', () => {
  it('ships exactly the documented ids', () => {
    expect(TEMPLATES.map((t) => t.id)).toEqual(['hello', 'card', 'clock', 'todo', 'canvas']);
  });

  it('every template is complete', () => {
    for (const t of TEMPLATES) {
      expect(t.name).toBeTruthy();
      expect(t.description).toBeTruthy();
      expect(t.project.html.trim()).not.toBe('');
      expect(t.project.css.trim()).not.toBe('');
      expect(t.project.js.trim()).not.toBe('');
      // the sandbox has no same-origin access, so templates must not rely on storage
      expect(t.project.js).not.toMatch(/localStorage|sessionStorage|document\.cookie/);
    }
  });

  it('getTemplate finds by id and returns undefined otherwise', () => {
    expect(getTemplate('clock')?.name).toBe('Analog clock');
    expect(getTemplate('nope')).toBeUndefined();
  });
});
