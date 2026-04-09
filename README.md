# HTML Runner

> A client-side live code preview tool for **SWE402 Internet Programming** course.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-htmlrunner.h190k.com-00d4ff?style=flat-square)](https://htmlrunner.h190k.com/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-H190K/HTML--runner-00d4ff?style=flat-square)](https://github.com/H190K/HTML-wraper)
[![Course](https://img.shields.io/badge/Course-SWE402%20Internet%20Programming-00d4ff?style=flat-square)]()

---

## Overview

**HTML Runner** is a fully client-side live code preview tool designed for the **SWE402 Internet Programming** course. It provides an interactive environment where students can write HTML, CSS, and JavaScript code and instantly preview the result in a sandboxed iframe — without needing any external services, databases, or server-side processing.

### Key Features

- **Three-Panel Code Editor** — Write HTML, CSS, and JavaScript in separate tabs
- **Live Preview** — Instantly see your code execution in a sandboxed iframe
- **Device Viewport Switching** — Test your designs at Desktop (1200px), Tablet (768px), and Mobile (375px) widths
- **Run / Rerun** — Manually trigger code execution at any time
- **Save as ZIP** — Download your project as a complete `index.html`, `style.css`, and `script.js` bundle
- **About Modal** — Project documentation fetched dynamically from `ABOUT.md`

---

## Live Demo

**Site URL:** [https://htmlrunner.h190k.com/](https://htmlrunner.h190k.com/)

Open this link in your browser to start using HTML Runner immediately. No installation or signup required.

---

## GitHub Repository

**Repository:** [https://github.com/H190K/HTML-wraper](https://github.com/H190K/HTML-wraper)

The repository contains the complete source code for HTML Runner, including:

```
HTML-wraper/
├── index.html        # Main application shell
├── css/
│   └── style.css     # All styling (premium dark theme)
├── js/
│   └── app.js        # Application logic
├── assets/
│   ├── favicon.png   # Site favicon
│   └── ABOUT.md      # About modal content
└── PROJECT_PLAN.md   # Project planning document
```

---

## For SWE402 Students

This tool is part of the **SWE402 Internet Programming** course curriculum. It demonstrates core web technologies in action:

### What This Project Teaches

- **HTML5** — Semantic markup, meta tags, accessibility attributes
- **CSS3** — Modern CSS features including CSS variables, flexbox, gradients, transitions, and responsive design
- **Vanilla JavaScript (ES6+)** — DOM manipulation, event handling, async/await, template literals
- **Browser APIs** — Iframe sandboxing, Blob API, URL.createObjectURL, Fetch API
- **Client-Side Architecture** — No backend required, all processing happens in the browser

### Course Requirements Demonstrated

| Requirement | Implementation |
|-------------|----------------|
| HTML Structure | Semantic HTML5 with ARIA attributes |
| CSS Styling | Custom CSS with variables, no frameworks |
| JavaScript Logic | Pure vanilla JS, no libraries |
| Responsive Design | Media queries for mobile/tablet |
| External Resources | JSZip via CDN |

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Structure | HTML5 | Page markup with semantic elements |
| Styling | CSS3 | Premium dark theme with cyan accents |
| Interactivity | Vanilla JavaScript (ES6+) | All app logic |
| ZIP Creation | JSZip via CDN | Client-side file bundling |
| Hosting | Cloudflare Pages | Fast global CDN distribution |

---

## How It Works

### Architecture

1. **User writes code** in the editor textareas (HTML, CSS, or JS tabs)
2. **User clicks Run** or uses device switcher
3. **JavaScript builds a complete HTML document** by combining user's code with isolation styles
4. **The document is injected** into a sandboxed iframe using `srcdoc`
5. **User sees live preview** in the right panel

### CSS Isolation

The preview iframe uses a `.runner-preview` wrapper class with `!important` resets to ensure user styles don't leak out and parent page styles don't affect the preview:

```css
.runner-preview, .runner-preview *, .runner-preview *::before, .runner-preview *::after {
    box-sizing: border-box !important;
    margin: 0 !important;
    padding: 0 !important;
}
```

### Sandboxed Execution

The iframe uses `sandbox="allow-scripts"` to run user JavaScript safely without allowing access to the parent page, cookies, or local storage.

---

## Design System

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Cyan | `#00d4ff` | Primary accent, active states |
| Mint | `#00ffcc` | Secondary accent, highlights |
| Background | `#0a0a0f` | Main background |
| Surface | `#101018` | Cards, panels |
| Border | `#252535` | Subtle borders |

### Typography

- **Display/Body:** Geist (via Google Fonts)
- **Code:** Geist Mono / JetBrains Mono

---

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome 90+ | ✅ Full |
| Firefox 88+ | ✅ Full |
| Safari 14+ | ✅ Full |
| Edge 90+ | ✅ Full |

---

## License

All rights reserved. This project was created for educational purposes as part of the SWE402 Internet Programming course.

---

## Author

**H190K**

- GitHub: [@H190K](https://github.com/H190K)
- Course: SWE402 Internet Programming

---

**Course:** SWE402 Internet Programming  
**Project:** HTML Runner — Live Code Preview Tool  
**Live Site:** [https://htmlrunner.h190k.com/](https://htmlrunner.h190k.com/)  
**Repository:** [https://github.com/H190K/HTML-wraper](https://github.com/H190K/HTML-wraper)
