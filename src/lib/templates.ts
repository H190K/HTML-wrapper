import type { Template } from './types';

const hello: Template = {
  id: 'hello',
  name: 'Hello, Runner',
  description: 'A tiny stopwatch that shows how the three lanes and the console work together.',
  project: {
    html: `<main>
  <h1>Hello, Runner.</h1>
  <p>
    This page is built from the three lanes on the left.
    Change any of them, then press <kbd>Ctrl</kbd> + <kbd>Enter</kbd>
    (<kbd>Cmd</kbd> on a Mac) to run it again.
  </p>

  <output id="clock">0.00</output>

  <div class="actions">
    <button id="start" type="button">Start</button>
    <button id="split" type="button" disabled>Split</button>
  </div>
  <p class="hint">Splits are logged to the console below the preview.</p>
</main>
`,
    css: `* { box-sizing: border-box; }

body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 2rem;
  font: 16px/1.6 system-ui, sans-serif;
  color: #1b1a17;
  background: #f6f4ee;
}

main { max-width: 34rem; }

h1 {
  margin: 0 0 0.5rem;
  font-size: clamp(2.25rem, 7vw, 3.5rem);
  line-height: 1;
  letter-spacing: -0.03em;
}

kbd {
  padding: 0.05em 0.4em;
  border: 1px solid #c9c4b6;
  border-bottom-width: 2px;
  border-radius: 4px;
  font: 0.85em ui-monospace, monospace;
  background: #fff;
}

#clock {
  display: block;
  margin: 1.5rem 0 1rem;
  font: 600 clamp(3rem, 14vw, 5.5rem)/1 ui-monospace, monospace;
  font-variant-numeric: tabular-nums;
  color: #d93d22; /* try a different colour here */
}

.actions { display: flex; gap: 0.5rem; }

button {
  padding: 0.6rem 1.2rem;
  border: 1px solid #1b1a17;
  border-radius: 6px;
  font: inherit;
  font-weight: 600;
  background: #1b1a17;
  color: #fff;
  cursor: pointer;
}
button + button { background: transparent; color: inherit; }
button:disabled { opacity: 0.4; cursor: not-allowed; }

.hint { font-size: 0.875rem; color: #6d6a5f; }
`,
    js: `const clock = document.querySelector('#clock');
const startBtn = document.querySelector('#start');
const splitBtn = document.querySelector('#split');

let startedAt = 0;
let frame = 0;
let splits = 0;

function tick() {
  clock.textContent = ((performance.now() - startedAt) / 1000).toFixed(2);
  frame = requestAnimationFrame(tick);
}

startBtn.addEventListener('click', () => {
  if (frame) {
    cancelAnimationFrame(frame);
    frame = 0;
    startBtn.textContent = 'Start';
    splitBtn.disabled = true;
    console.info('Stopped at', clock.textContent + ' s');
    return;
  }
  startedAt = performance.now();
  splits = 0;
  startBtn.textContent = 'Stop';
  splitBtn.disabled = false;
  tick();
});

splitBtn.addEventListener('click', () => {
  splits += 1;
  console.log('Split ' + splits + ':', clock.textContent + ' s');
});

console.log('Ready. Press Start.');
`,
  },
};

const card: Template = {
  id: 'card',
  name: 'Profile card',
  description: 'A responsive profile card with a follow toggle.',
  project: {
    html: `<article class="card">
  <div class="avatar" aria-hidden="true">AM</div>
  <h1>Ada Mensah</h1>
  <p class="role">Frontend engineer, Accra</p>
  <p class="bio">
    Builds fast interfaces for slow networks. Currently teaching
    a weekend class on accessible forms.
  </p>
  <dl class="stats">
    <div><dt>Posts</dt><dd>128</dd></div>
    <div><dt>Followers</dt><dd id="followers">2,431</dd></div>
    <div><dt>Following</dt><dd>87</dd></div>
  </dl>
  <button id="follow" type="button" aria-pressed="false">Follow</button>
</article>
`,
    css: `* { box-sizing: border-box; }

body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  font: 16px/1.5 system-ui, sans-serif;
  background: #e9edf2;
  color: #17202b;
}

.card {
  width: min(100%, 22rem);
  padding: 2rem 1.75rem 1.75rem;
  border: 1px solid #c8d1dc;
  border-radius: 10px;
  background: #fff;
  box-shadow: 6px 6px 0 #17202b;
  text-align: center;
}

.avatar {
  width: 4.5rem;
  height: 4.5rem;
  margin: 0 auto 1rem;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #1d5fbf;
  color: #fff;
  font-weight: 700;
  font-size: 1.25rem;
}

h1 { margin: 0; font-size: 1.4rem; }
.role { margin: 0.15rem 0 1rem; color: #5a6878; font-size: 0.9rem; }
.bio { margin: 0 0 1.25rem; }

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin: 0 0 1.5rem;
  border-block: 1px solid #e1e6ec;
}
.stats div { padding: 0.75rem 0; }
.stats div + div { border-left: 1px solid #e1e6ec; }
dt { font-size: 0.75rem; color: #5a6878; }
dd { margin: 0; font-weight: 700; font-variant-numeric: tabular-nums; }

button {
  width: 100%;
  padding: 0.7rem;
  border: 1px solid #17202b;
  border-radius: 6px;
  background: #17202b;
  color: #fff;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}
button[aria-pressed="true"] { background: #fff; color: #17202b; }
`,
    js: `const button = document.querySelector('#follow');
const followers = document.querySelector('#followers');
let count = 2431;

button.addEventListener('click', () => {
  const following = button.getAttribute('aria-pressed') !== 'true';
  count += following ? 1 : -1;
  button.setAttribute('aria-pressed', String(following));
  button.textContent = following ? 'Following' : 'Follow';
  followers.textContent = count.toLocaleString('en-US');
  console.log(following ? 'Followed' : 'Unfollowed', '- followers:', count);
});
`,
  },
};

const clock: Template = {
  id: 'clock',
  name: 'Analog clock',
  description: 'A CSS clock face driven by requestAnimationFrame.',
  project: {
    html: `<div class="clock" role="img" aria-label="Analog clock">
  <div class="hand hour"></div>
  <div class="hand minute"></div>
  <div class="hand second"></div>
  <div class="pin"></div>
</div>
<p id="digital"></p>
`,
    css: `body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 1.5rem;
  background: #16150f;
  color: #efece3;
  font: 500 1.25rem/1 ui-monospace, monospace;
}

.clock {
  position: relative;
  width: min(70vmin, 320px);
  aspect-ratio: 1;
  border: 2px solid #efece3;
  border-radius: 50%;
  /* hour ticks: thin wedges every 30deg, then a disc (::after) covers the middle */
  background: repeating-conic-gradient(from -1deg, #efece3 0 2deg, transparent 2deg 30deg);
}

.clock::after {
  content: '';
  position: absolute;
  inset: 7%;
  border-radius: 50%;
  background: #16150f;
}

.hand {
  position: absolute;
  left: 50%;
  bottom: 50%;
  z-index: 1;
  transform-origin: 50% 100%;
  border-radius: 3px;
}
.hour   { width: 6px; height: 26%; margin-left: -3px; background: #efece3; }
.minute { width: 4px; height: 38%; margin-left: -2px; background: #efece3; }
.second { width: 2px; height: 42%; margin-left: -1px; background: #ff5a3c; }

.pin {
  position: absolute;
  inset: 50% auto auto 50%;
  z-index: 2;
  width: 12px;
  height: 12px;
  margin: -6px 0 0 -6px;
  border-radius: 50%;
  background: #ff5a3c;
}

#digital { margin: 0; font-variant-numeric: tabular-nums; letter-spacing: 0.08em; }
`,
    js: `const hands = {
  hour: document.querySelector('.hour'),
  minute: document.querySelector('.minute'),
  second: document.querySelector('.second'),
};
const digital = document.querySelector('#digital');

function render() {
  const now = new Date();
  const s = now.getSeconds() + now.getMilliseconds() / 1000;
  const m = now.getMinutes() + s / 60;
  const h = (now.getHours() % 12) + m / 60;

  hands.second.style.transform = 'rotate(' + s * 6 + 'deg)';
  hands.minute.style.transform = 'rotate(' + m * 6 + 'deg)';
  hands.hour.style.transform = 'rotate(' + h * 30 + 'deg)';
  digital.textContent = now.toLocaleTimeString('en-GB');

  requestAnimationFrame(render);
}

render();
`,
  },
};

const todo: Template = {
  id: 'todo',
  name: 'Todo list',
  description: 'Add, complete and remove tasks, with a live count.',
  project: {
    html: `<main>
  <h1>Today</h1>
  <form id="add">
    <label for="task" class="sr-only">New task</label>
    <input id="task" placeholder="Add a task and press Enter" autocomplete="off" required>
    <button>Add</button>
  </form>
  <ul id="list"></ul>
  <p id="count" aria-live="polite"></p>
</main>
`,
    css: `* { box-sizing: border-box; }

body {
  margin: 0;
  padding: 3rem 1.25rem;
  font: 16px/1.5 system-ui, sans-serif;
  background: #fbfaf6;
  color: #16150f;
}

main { max-width: 30rem; margin: 0 auto; }
h1 { margin: 0 0 1rem; font-size: 2rem; letter-spacing: -0.02em; }

form { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
input {
  flex: 1;
  min-width: 0;
  padding: 0.65rem 0.8rem;
  border: 1px solid #16150f;
  border-radius: 6px;
  font: inherit;
}
form button {
  padding: 0 1.1rem;
  border: 0;
  border-radius: 6px;
  background: #1f6b4a;
  color: #fff;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

ul { list-style: none; margin: 0; padding: 0; border-top: 1px solid #d9d4c6; }
li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 0.25rem;
  border-bottom: 1px solid #d9d4c6;
}
li label { flex: 1; cursor: pointer; }
li input:checked + label { color: #8a867a; text-decoration: line-through; }
li input { accent-color: #1f6b4a; width: 1.1rem; height: 1.1rem; }
.remove {
  border: 0;
  background: none;
  color: #8a867a;
  font: inherit;
  cursor: pointer;
}
.remove:hover { color: #b3261e; }

#count { color: #6d6a5f; font-size: 0.875rem; }

.sr-only {
  position: absolute;
  width: 1px; height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
`,
    js: `const form = document.querySelector('#add');
const input = document.querySelector('#task');
const list = document.querySelector('#list');
const count = document.querySelector('#count');

// The preview is sandboxed, so tasks live in memory only.
let tasks = [
  { id: 1, text: 'Write some HTML', done: true },
  { id: 2, text: 'Style it with CSS', done: false },
  { id: 3, text: 'Make it do something', done: false },
];
let nextId = 4;

function render() {
  list.replaceChildren(
    ...tasks.map((task) => {
      const li = document.createElement('li');
      const box = document.createElement('input');
      const label = document.createElement('label');
      const remove = document.createElement('button');

      box.type = 'checkbox';
      box.id = 'task-' + task.id;
      box.checked = task.done;
      box.addEventListener('change', () => {
        task.done = box.checked;
        render();
      });

      label.htmlFor = box.id;
      label.textContent = task.text;

      remove.className = 'remove';
      remove.textContent = 'Remove';
      remove.setAttribute('aria-label', 'Remove ' + task.text);
      remove.addEventListener('click', () => {
        tasks = tasks.filter((t) => t !== task);
        render();
      });

      li.append(box, label, remove);
      return li;
    }),
  );
  const left = tasks.filter((t) => !t.done).length;
  count.textContent = left === 0 ? 'All done.' : left + ' left to do';
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  tasks.push({ id: nextId++, text, done: false });
  console.log('Added:', text);
  input.value = '';
  render();
});

render();
`,
  },
};

const canvas: Template = {
  id: 'canvas',
  name: 'Canvas lanes',
  description: 'Eight runners race down their lanes on a 2D canvas. Click to restart.',
  project: {
    html: `<canvas id="track" aria-label="Animated race on eight lanes"></canvas>
<p>Click the track to restart the race.</p>
`,
    css: `html, body { margin: 0; height: 100%; }

body {
  display: grid;
  grid-template-rows: 1fr auto;
  background: #b8432c;
  color: #fff4ea;
  font: 14px/1 ui-monospace, monospace;
}

canvas { width: 100%; height: 100%; display: block; cursor: pointer; }
p { margin: 0; padding: 0.75rem 1rem; }
`,
    js: `const canvas = document.querySelector('#track');
const ctx = canvas.getContext('2d');
const LANES = 8;
let runners = [];
let finished = 0;

function resize() {
  const scale = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * scale;
  canvas.height = canvas.clientHeight * scale;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
}

function start() {
  finished = 0;
  runners = Array.from({ length: LANES }, (_, lane) => ({
    lane,
    x: 0,
    speed: 0.9 + Math.random() * 0.6,
    place: 0,
  }));
  console.log('On your marks.');
}

function draw() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const laneH = h / LANES;
  const finish = w - 40;
  if (w < 120) return requestAnimationFrame(draw); // not laid out yet

  ctx.fillStyle = '#b8432c';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(255, 244, 234, 0.7)';
  ctx.lineWidth = 1;
  for (let i = 1; i < LANES; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * laneH);
    ctx.lineTo(w, i * laneH);
    ctx.stroke();
  }
  ctx.fillStyle = '#fff4ea';
  ctx.fillRect(finish, 0, 3, h);

  ctx.font = '600 12px ui-monospace, monospace';
  for (const r of runners) {
    if (!r.place) {
      r.x = Math.min(finish, r.x + r.speed * (1 + Math.sin(r.x / 30) * 0.15));
      if (r.x >= finish) {
        r.place = ++finished;
        if (r.place === 1) console.info('Lane ' + (r.lane + 1) + ' wins.');
      }
    }
    const y = r.lane * laneH + laneH / 2;
    ctx.fillStyle = 'rgba(255, 244, 234, 0.6)';
    ctx.fillText(String(r.lane + 1).padStart(2, '0'), 8, y + 4);
    ctx.fillStyle = r.place === 1 ? '#16150f' : '#fff4ea';
    ctx.beginPath();
    ctx.arc(32 + r.x * ((finish - 32) / finish), y, Math.min(8, laneH / 3), 0, Math.PI * 2);
    ctx.fill();
  }
  requestAnimationFrame(draw);
}

window.addEventListener('resize', resize);
canvas.addEventListener('click', start);
resize();
start();
draw();
`,
  },
};

export const TEMPLATES: readonly Template[] = [hello, card, clock, todo, canvas];

export const DEFAULT_TEMPLATE_ID = 'hello';

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
