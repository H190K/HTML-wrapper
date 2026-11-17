import type { Project } from './types';

/** Neutralise `</script` and `<!--` so user JS can never close or confuse its own <script> element. */
export function escapeScript(code: string): string {
  return code.replace(/<\/(script)/gi, '<\\/$1').replace(/<!--/g, '<\\!--');
}

/** Neutralise `</style` so user CSS can never close its own <style> element. */
export function escapeStyle(code: string): string {
  return code.replace(/<\/(style)/gi, '<\\/$1');
}

/**
 * The bridge runs inside the sandboxed (opaque-origin) frame before any user code.
 * It only ever posts plain strings to the parent; the parent verifies `event.source`.
 */
function bridgeScript(runId: number, htmlLine: string, jsLine: string): string {
  return `(function () {
  var RUN = ${JSON.stringify(runId)};
  var HTML_LINE = ${htmlLine};
  var JS_LINE = ${jsLine};
  var MAX = 10000;
  function post(msg) {
    msg.source = 'html-runner';
    msg.runId = RUN;
    try { parent.postMessage(msg, '*'); } catch (e) {}
  }
  function fmt(v, seen) {
    if (typeof v === 'string') return v;
    if (v === undefined) return 'undefined';
    if (v === null) return 'null';
    if (typeof v === 'function') return 'function ' + (v.name || 'anonymous') + '()';
    if (typeof v === 'symbol' || typeof v === 'bigint') return String(v) + (typeof v === 'bigint' ? 'n' : '');
    if (typeof v !== 'object') return String(v);
    if (v instanceof Error) return v.stack && v.stack.indexOf(v.message) !== -1 ? v.stack : v.name + ': ' + v.message;
    if (typeof Element !== 'undefined' && v instanceof Element) {
      var tag = '<' + v.tagName.toLowerCase();
      if (v.id) tag += ' id="' + v.id + '"';
      if (v.className && typeof v.className === 'string') tag += ' class="' + v.className + '"';
      return tag + '>';
    }
    seen = seen || [];
    try {
      return JSON.stringify(v, function (k, val) {
        if (typeof val === 'bigint') return String(val) + 'n';
        if (typeof val === 'function') return 'function ' + (val.name || 'anonymous') + '()';
        if (val === undefined) return 'undefined';
        if (val && typeof val === 'object') {
          if (seen.indexOf(val) !== -1) return '[Circular]';
          seen.push(val);
        }
        return val;
      }, 2) || String(v);
    } catch (e) {
      return Object.prototype.toString.call(v);
    }
  }
  function clip(s) { return s.length > MAX ? s.slice(0, MAX) + ' [truncated]' : s; }
  ['log', 'info', 'warn', 'error', 'debug'].forEach(function (level) {
    var orig = console[level];
    console[level] = function () {
      var args = [];
      for (var i = 0; i < arguments.length; i++) args.push(clip(fmt(arguments[i])));
      post({ type: 'console', level: level === 'debug' ? 'log' : level, args: args });
      if (orig) try { orig.apply(console, arguments); } catch (e) {}
    };
  });
  window.addEventListener('error', function (e) {
    var msg = e.message || (e.error ? fmt(e.error) : 'Script error');
    if (msg.indexOf('Uncaught') !== 0) msg = 'Uncaught ' + msg;
    var where = '';
    if (e.lineno && e.lineno >= JS_LINE) where = ' (JS line ' + (e.lineno - JS_LINE + 1) + ')';
    else if (e.lineno) where = ' (HTML line ' + Math.max(1, e.lineno - HTML_LINE + 1) + ')';
    post({ type: 'console', level: 'error', args: [clip(msg + where)] });
  });
  window.addEventListener('unhandledrejection', function (e) {
    post({ type: 'console', level: 'error', args: [clip('Unhandled promise rejection: ' + fmt(e.reason))] });
  });
  window.addEventListener('load', function () {
    post({ type: 'ready', durationMs: Math.round(performance.now() * 10) / 10 });
  });
})();`;
}

const lineOf = (text: string, index: number) => text.slice(0, index).split('\n').length;

export function buildPreviewDocument(project: Project, opts: { runId: number }): string {
  // Build once with placeholders to learn where user HTML and JS start, so errors report lane line numbers.
  // The placeholders sit on single lines, so substituting the numbers does not move anything.
  const render = (htmlLine: string, jsLine: string) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script>${bridgeScript(opts.runId, htmlLine, jsLine)}</script>
<style>${escapeStyle(project.css)}</style>
</head>
<body>
\u0000HTML\u0000${project.html}
<script>\u0000JS\u0000${escapeScript(project.js)}
</script>
</body>
</html>`;
  const draft = render('0', '0');
  const htmlLine = lineOf(draft, draft.indexOf('\u0000HTML\u0000'));
  const jsLine = lineOf(draft, draft.indexOf('\u0000JS\u0000'));
  return render(String(htmlLine), String(jsLine)).replace('\u0000HTML\u0000', '').replace('\u0000JS\u0000', '');
}
