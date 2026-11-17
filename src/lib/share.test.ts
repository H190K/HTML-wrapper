import { describe, expect, it } from 'vitest';
import { decodeProject, encodeProject } from './share';

describe('share links', () => {
  it('round-trips a project, including unicode and markup', () => {
    const project = { html: '<h1>Héllo 世界 🏁</h1>', css: 'h1 { color: #d93d22; }', js: 'console.log(`</script>`)' };
    const payload = encodeProject(project);
    expect(payload).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeProject(payload)).toEqual(project);
  });

  it('round-trips a large project', () => {
    const big = 'x'.repeat(200_000);
    const project = { html: big, css: big, js: big };
    expect(decodeProject(encodeProject(project))).toEqual(project);
  });

  it('returns null for malformed input without throwing', () => {
    const bad = ['', '   ', '!!!', 'abc$def', 'AAAA', 'not-deflate-data', encodeProject({ html: '', css: '', js: '' }).slice(0, 5)];
    for (const input of bad) expect(decodeProject(input)).toBeNull();
    expect(decodeProject(undefined as unknown as string)).toBeNull();
  });

  it('rejects payloads whose JSON has the wrong shape', async () => {
    const { deflateSync, strToU8 } = await import('fflate');
    const enc = (v: unknown) =>
      btoa(String.fromCharCode(...deflateSync(strToU8(JSON.stringify(v))))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(decodeProject(enc([1, 2]))).toBeNull();
    expect(decodeProject(enc({ html: 5 }))).toBeNull();
    expect(decodeProject(enc({ other: 'x' }))).toBeNull();
    expect(decodeProject(enc({ html: '<p>only html</p>' }))).toEqual({ html: '<p>only html</p>', css: '', js: '' });
  });
});
