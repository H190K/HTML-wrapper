import { describe, expect, it } from 'vitest';
import { buildPreviewDocument, escapeScript, escapeStyle } from './preview';

describe('buildPreviewDocument', () => {
  it('escapes </script> in user JS so it cannot close its element', () => {
    const doc = buildPreviewDocument({ html: '', css: '', js: 'const s = "</script><b>x</b>"; const t = "</SCRIPT >";' }, { runId: 1 });
    // Only the bridge script and the user script close: exactly two closing tags.
    expect(doc.match(/<\/script>/gi)?.length).toBe(2);
    expect(doc).toContain(String.raw`"<\/script><b>x</b>"`);
    expect(doc).toContain(String.raw`"<\/SCRIPT >"`);
  });

  it('escapes </style> in user CSS', () => {
    const doc = buildPreviewDocument({ html: '', css: 'a{}</style><script>alert(1)</script>', js: '' }, { runId: 1 });
    expect(doc.match(/<\/style>/gi)?.length).toBe(1);
    expect(doc).toContain(String.raw`<\/style><script>alert(1)</script>`);
  });

  it('escapes HTML comment openers inside scripts', () => {
    expect(escapeScript('if (a <!-- b) {}')).toBe(String.raw`if (a <\!-- b) {}`);
    expect(escapeStyle('</Style>')).toBe(String.raw`<\/Style>`);
  });

  it('tells the bridge on which document lines the user HTML and JS start', () => {
    const doc = buildPreviewDocument({ html: '<p>a</p>\n<p>b</p>', css: 'a{}\nb{}', js: 'first();\nsecond();' }, { runId: 3 });
    const lines = doc.split('\n');
    const js = Number(/var JS_LINE = (\d+);/.exec(doc)![1]);
    const html = Number(/var HTML_LINE = (\d+);/.exec(doc)![1]);
    expect(lines[js - 1]).toBe('<script>first();');
    expect(lines[html - 1]).toBe('<p>a</p>');
    expect(doc).not.toContain('\u0000');
  });

  it('injects the bridge before user code and embeds the run id', () => {
    const doc = buildPreviewDocument({ html: '<p id="u">hi</p>', css: 'p{color:red}', js: 'console.log(1)' }, { runId: 42 });
    const bridgeAt = doc.indexOf("'html-runner'");
    expect(bridgeAt).toBeGreaterThan(-1);
    expect(bridgeAt).toBeLessThan(doc.indexOf('p{color:red}'));
    expect(bridgeAt).toBeLessThan(doc.indexOf('<p id="u">'));
    expect(doc).toContain('var RUN = 42;');
    // user JS lives in its own script element after the HTML
    expect(doc.indexOf('console.log(1)')).toBeGreaterThan(doc.indexOf('<p id="u">'));
  });
});
