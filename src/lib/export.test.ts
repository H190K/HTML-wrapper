import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { buildStandaloneHtml, buildZip } from './export';

const project = { html: '<h1>Hi</h1>\n<pre>  keep\n    spaces</pre>', css: 'h1 { color: red; }', js: 'console.log("</script>")' };

describe('export', () => {
  it('zips index.html, style.css and script.js', () => {
    const files = unzipSync(buildZip(project));
    expect(Object.keys(files).sort()).toEqual(['index.html', 'script.js', 'style.css']);
    const index = strFromU8(files['index.html']);
    expect(index).toContain('<link rel="stylesheet" href="style.css">');
    expect(index).toContain('<script src="script.js"></script>');
    expect(index).toContain('<pre>  keep\n    spaces</pre>');
    expect(strFromU8(files['style.css'])).toBe('h1 { color: red; }\n');
    expect(strFromU8(files['script.js'])).toBe('console.log("</script>")\n');
  });

  it('builds a self-contained html file with escaped inline code', () => {
    const html = buildStandaloneHtml(project);
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('h1 { color: red; }');
    expect(html).toContain(String.raw`console.log("<\/script>")`);
    expect(html.match(/<\/script>/g)?.length).toBe(1);
    expect(html).not.toContain('html-runner');
  });
});
