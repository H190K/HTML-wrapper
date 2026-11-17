# HTML Runner: architecture

HTML Runner is a static, fully client-side playground: write HTML, CSS and JavaScript, see it run in a sandboxed preview. No backend, no accounts, no tracking. Everything a user types stays in their browser unless they create a share link (and then it lives only in the URL).

## Stack

| Concern | Choice | Why |
| --- | --- | --- |
| Framework | Astro 7, static output | Zero-JS marketing pages, islands only where needed |
| Islands | React 19 (`client:load` / `client:only="react"`) | The playground is one interactive island |
| Styling | Tailwind CSS v4 + CSS custom-property tokens in `src/styles/global.css` | One source of truth for colour/type/motion |
| UI primitives | shadcn-style components in `src/components/ui` built on `radix-ui`, `class-variance-authority`, `cn()` | Accessible, owned in-repo |
| State | `nanostores` + `@nanostores/react` | Tiny, framework-agnostic, the Astro-native answer to Redux |
| Editor | CodeMirror 6 | Real highlighting, small, accessible |
| Panels | `react-resizable-panels` | Keyboard-accessible splitters |
| Motion | `motion` (React) + CSS transitions | Transform/opacity only |
| Zip / share | `fflate` | Zip export and deflate for share links in one small dependency |
| Fonts | Archivo Variable (width axis) + JetBrains Mono Variable, self-hosted via Fontsource | No third-party font requests |
| Tests | Vitest for `src/lib` | Pure logic is unit tested |

## Routes

| Route | File | Notes |
| --- | --- | --- |
| `/` | `src/pages/index.astro` | Landing page. Static, minimal JS |
| `/app` | `src/pages/app.astro` | The playground. Full-viewport app shell |
| `/about` | `src/pages/about.astro` | Renders `src/about.md` |
| 404 | `src/pages/404.astro` | Becomes `dist/404.html` |

Query/hash contract for `/app`:

- `/app?template=<id>` loads a starter template (ids: `hello`, `card`, `clock`, `todo`, `canvas`).
- `/app#code=<payload>` loads a shared project. Payload = base64url(deflate(JSON `{html,css,js}`)).
- Otherwise the last project is restored from `localStorage`, falling back to the `hello` template.

## Directory layout

```
src/
  layouts/Base.astro          head, meta, theme bootstrap (architecture-owned)
  styles/global.css           tokens + base (architecture-owned)
  styles/site.css             landing/about/404-only styles
  styles/playground.css       playground-only styles (CodeMirror theme vars etc.)
  lib/                        framework-free logic, unit tested
    types.ts                  shared contracts (architecture-owned)
    devices.ts                device presets (architecture-owned)
    cn.ts                     class merge helper
    preview.ts                buildPreviewDocument()
    share.ts                  encodeProject() / decodeProject()
    export.ts                 zip + standalone HTML export
    storage.ts                localStorage persistence
    templates.ts              starter templates
  stores/playground.ts        nanostores state + actions
  components/
    ui/                       shared primitives (Button, Tooltip, Dialog, ...)
    site/                     landing/about/404 pieces (Astro components first)
    playground/               the playground island (React)
    brand/                    Logo mark + wordmark
  pages/
public/                       favicon.svg, favicon.png, apple-touch-icon.png, og.png, site.webmanifest, robots.txt
```

## Library contracts (`src/lib`)

```ts
// preview.ts
buildPreviewDocument(project: Project, opts: { runId: number }): string
// Returns a complete HTML document for iframe `srcdoc`. Injects, before user code, a bridge script that:
//  - wraps console.log/info/warn/error and posts PreviewMessage {type:'console'} to parent
//  - reports uncaught errors and unhandled rejections as level 'error'
//  - posts {type:'ready', durationMs} on window load
// User JS goes in its own <script> so a syntax error is reported, not fatal to the bridge.
// Must escape `</script>` in user JS and `</style>` in user CSS.

// share.ts
encodeProject(project: Project): string          // base64url(deflate(JSON))
decodeProject(payload: string): Project | null   // null on any malformed input, never throws

// export.ts
buildStandaloneHtml(project: Project): string            // one self-contained .html
buildZip(project: Project): Uint8Array                   // index.html + style.css + script.js
downloadBlob(data: BlobPart, filename: string, mime: string): void

// storage.ts
loadProject(): Project | null
saveProject(project: Project): void              // callers debounce

// templates.ts
TEMPLATES: readonly Template[]                   // ids: hello, card, clock, todo, canvas
getTemplate(id: string): Template | undefined
```

## State (`src/stores/playground.ts`)

Atoms: `$project`, `$activeLang`, `$device`, `$autoRun`, `$consoleEntries`, `$consoleOpen`, `$run` (`{ id, startedAt, durationMs | null }`), `$previewDoc` (the srcdoc string of the last run).

Actions: `setCode(lang, value)`, `run()`, `resetTo(project)`, `clearConsole()`, `pushConsole(entry)`, `markReady(runId, durationMs)`.

`run()` increments the run id, clears the console, and sets `$previewDoc`. With auto-run on, `setCode` schedules a debounced `run()` (about 400 ms). Messages from stale run ids are ignored.

## Preview sandbox: the security boundary

User code (and code from share links, which is untrusted) runs in:

```html
<iframe sandbox="allow-scripts allow-modals allow-forms allow-popups" srcdoc="..."></iframe>
```

`allow-same-origin` is never set. The frame therefore has an opaque origin: it cannot read the app's `localStorage`, cookies, or DOM. The shell only accepts `message` events whose `event.source` is the preview frame's `contentWindow` and whose data has `source: 'html-runner'`. Console arguments are stringified inside the sandbox and rendered as text, never as HTML.

## Design system: "track meet"

The product is called Runner, so the visual language comes from an athletics track, used with restraint.

- **Palette**: chalk paper, asphalt ink, one tartan-track accent (`--track`). Each language has a lane colour (`--lane-html`, `--lane-css`, `--lane-js`), used only as small markers. Light and dark themes are both first-class; tokens live in `global.css`.
- **Type**: Archivo Variable. Headlines use the `display` utility (wide, heavy, tight). Body is Archivo at normal width. JetBrains Mono for code and for `label-caps` meta labels (lane numbers, panel titles, timings).
- **Motifs**: lane numbers (`01 HTML`, `02 CSS`, `03 JS`), hairline lane dividers, a stopwatch readout for render time. The Run button is the single loudest element on any screen.
- **Shape**: hard 1px rules, small radii (3 to 10px), flat surfaces. Depth comes from borders and offset solid shadows, never blur glows.
- **Motion**: purposeful, short (120 to 320ms), `--ease-out-quart`. Animate transform and opacity only. Everything respects `prefers-reduced-motion`.
- **Avoid**: purple/blue gradients, glassmorphism, glow, emoji as icons, centred "hero + three feature cards" boilerplate, generic stock copy.

Theme: `document.documentElement.dataset.theme` is `light` or `dark`, persisted under `localStorage['html-runner:theme']`, resolved before first paint in `Base.astro`.
