# About HTML Runner

HTML Runner is a playground for HTML, CSS and JavaScript that runs entirely in your browser. You write in three editors, one per language, and the result renders next to them in a sandboxed preview, with a console underneath. It is meant for the small jobs: trying a layout, reproducing a bug, sketching an idea, or teaching someone how the three languages fit together.

[Open the editor](/app), or start from a template such as [the profile card](/app?template=card) or [the canvas race](/app?template=canvas).

## What it does

- **Three editors** for HTML, CSS and JavaScript, with syntax highlighting.
- **Live preview** in a sandboxed frame. Auto-run updates it shortly after you stop typing; turn auto-run off and press <kbd>Ctrl</kbd> + <kbd>Enter</kbd> (<kbd>Cmd</kbd> + <kbd>Enter</kbd> on a Mac) to run by hand.
- **Device sizes**: Desktop, Tablet (768 × 1024) and Mobile (375 × 667).
- **Console panel** that shows `console.log`, `info`, `warn` and `error` output from the preview, plus uncaught errors and rejected promises.
- **Render stopwatch** showing how long each run took to load.
- **Starter templates**: Hello, Runner; a profile card; an analog clock; a todo list; and a canvas animation. Each one opens at `/app?template=<id>`.
- **Share links** that carry the whole project inside the URL.
- **Export** as a `.zip` (`index.html`, `style.css`, `script.js`) or as one self-contained `.html` file.
- **Autosave** to your browser, and **light and dark themes**.

## Privacy

HTML Runner is a set of static files. There is no backend, no account, no analytics and no tracking.

- **Your work stays on your device.** Autosave uses your browser's `localStorage`. Clearing site data removes it, so export anything you want to keep.
- **Share links live in the URL only.** The project is compressed into the part of the link after `#`. Browsers do not send that part to servers, and nothing is stored anywhere else. Anyone you give the link to can read the code in it.

## How the sandbox works

Your code runs inside an `<iframe>` with the `sandbox` attribute and without `allow-same-origin`. That gives the preview its own opaque origin: scripts in it can run, show alerts and submit forms, but they cannot read this site's storage, cookies or page. Messages from the preview (console output and the render time) are only accepted from that frame, and console output is shown as text, never as HTML. This matters most for share links, because a link someone sends you is code you have not written.

## Built with

- [Astro](https://astro.build) for the static pages, with a [React](https://react.dev) island for the editor
- [CodeMirror 6](https://codemirror.net) for the editors
- [Tailwind CSS](https://tailwindcss.com) and a small set of design tokens
- [nanostores](https://github.com/nanostores/nanostores) for state
- [fflate](https://github.com/101arrowz/fflate) for zip export and compressing share links
- Archivo and JetBrains Mono, self-hosted

The site is static and hosted on Cloudflare Pages.

## Credits

Built by [H190K](https://h190k.com). HTML Runner began as a course project for SWE402, Internet Programming, as a single page with plain text areas, and grew from there.

The source is open on [GitHub](https://github.com/H190K/HTML-wrapper). Issues and pull requests are welcome.
