import { strToU8, zipSync } from 'fflate';
import { escapeScript, escapeStyle } from './preview';
import type { Project } from './types';

// User code is emitted verbatim (no re-indenting) so <pre> blocks and template literals keep their whitespace.
const HEAD = `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>HTML Runner project</title>`;

const block = (code: string) => {
  const t = code.trim();
  return t ? `\n${t}\n` : '\n';
};

/** One self-contained .html file with the CSS and JS inlined. */
export function buildStandaloneHtml(project: Project): string {
  return `<!doctype html>
<html lang="en">
<head>
${HEAD}
<style>${block(escapeStyle(project.css))}</style>
</head>
<body>${block(project.html)}<script>${block(escapeScript(project.js))}</script>
</body>
</html>
`;
}

/** index.html + style.css + script.js */
export function buildZip(project: Project): Uint8Array {
  const index = `<!doctype html>
<html lang="en">
<head>
${HEAD}
<link rel="stylesheet" href="style.css">
</head>
<body>${block(project.html)}<script src="script.js"></script>
</body>
</html>
`;
  return zipSync({
    'index.html': strToU8(index),
    'style.css': strToU8(block(project.css).slice(1)),
    'script.js': strToU8(block(project.js).slice(1)),
  });
}

export function downloadBlob(data: BlobPart, filename: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([data], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
