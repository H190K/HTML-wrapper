# About HTML Runner

A client-side live code preview tool for **SWE402**. Write HTML, CSS, and JavaScript in the editor panel and instantly preview the result — switching between Desktop (1200px), Tablet (768px), and Mobile (375px) viewports.

## Features

**In Scope:**
- Three-panel code editor (HTML, CSS, JavaScript tabs)
- Live sandboxed iframe preview
- Device viewport switcher
- Run / Rerun to rebuild the preview
- Save as ZIP — bundles index.html, style.css, and script.js
- Fully client-side — no database or backend

**Out of Scope:**
- User accounts or authentication
- Cloud save or sync
- Syntax highlighting (plain textareas only)
- Multi-file projects

## Why It Exists

Coursework deliverable for SWE402 demonstrating core web technologies — HTML, CSS, and JavaScript — without frameworks or backend infrastructure.

## Technology Stack

- **Structure:** HTML5
- **Styling:** CSS3 (no frameworks)
- **Interactivity:** Vanilla JavaScript (ES6+)
- **Download:** JSZip via CDN
- **Hosting:** Cloudflare Pages

## Architecture

```
index.html        ← Main shell (two-panel layout + modal)
css/style.css     ← All styling (Molten Gold Premium Dark Theme)
js/app.js        ← All logic (run, rerun, save, modal, device modes)
assets/
  favicon.png     ← Site favicon + OG/Twitter image
  ABOUT.md        ← About modal content (fetched at runtime)
```

## Key Design Decisions

1. **No frameworks** — plain HTML/CSS/JS for course requirements
2. **Sandboxed iframe** — user code runs in isolation
3. **JSZip for download** — client-side zip creation via CDN
4. **CSS isolation wrapper** — `.runner-preview` prevents parent style leaks
5. **Minimal dependencies** — only JSZip loaded externally
