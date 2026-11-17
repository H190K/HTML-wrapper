// Converts text set in the project's self-hosted variable fonts (Archivo, JetBrains Mono)
// into SVG path data, so raster assets (OG card, icons) render identically under sharp/librsvg,
// which cannot see web fonts.
//
// fontkitten (already in node_modules via Astro) parses WOFF2 but does not apply gvar deltas to
// WOFF2-transformed glyphs, so we apply the variation ourselves.
import { create } from 'fontkitten';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const FONT_DIRS = {
  archivo: ['@fontsource-variable/archivo/files', 'archivo-latin-wdth-normal.woff2'],
  mono: ['@fontsource-variable/jetbrains-mono/files', 'latin-wght-normal'],
};

const cache = new Map();

function loadFont(family) {
  if (cache.has(family)) return cache.get(family);
  const [dir, match] = FONT_DIRS[family];
  const abs = join(process.cwd(), 'node_modules', dir);
  const file = readdirSync(abs).find((f) => f.includes(match) && !f.includes('ext'));
  if (!file) throw new Error(`Font not found for ${family}`);
  const buf = new Uint8Array(readFileSync(join(abs, file)));
  const font = create(buf);
  const entry = { font, buf, variations: new Map() };
  cache.set(family, entry);
  return entry;
}

function variant(entry, axes) {
  const key = JSON.stringify(axes);
  if (entry.variations.has(key)) return entry.variations.get(key);
  const { font, buf } = entry;
  const coords = font.fvar.axis.map((a) => {
    const tag = a.axisTag.trim();
    const v = axes[tag] ?? a.defaultValue;
    return Math.max(a.minValue, Math.min(a.maxValue, v));
  });
  const v = new font.constructor(new font.stream.constructor(buf), coords);
  const processor = v._variationProcessor;
  const out = { v, processor };
  entry.variations.set(key, out);
  return out;
}

const mk = (x, y, onCurve, endContour) => ({
  x,
  y,
  onCurve,
  endContour,
  copy() {
    return mk(this.x, this.y, this.onCurve, this.endContour);
  },
});

/**
 * Outline points for one glyph at the requested variation. Outlines are decoded from the
 * default (un-varied) font and the gvar deltas applied here; composites are flattened.
 * Returns flat points (with end-of-contour flags) and the varied advance width.
 */
function variedGlyph(base, v, processor, id) {
  const raw = base.getGlyph(id)._decode();
  const baseAdvance = base.getGlyph(id).advanceWidth;
  let points = [];
  if (raw && raw.numberOfContours < 0) {
    for (const c of raw.components) {
      const sub = variedGlyph(base, v, processor, c.glyphID).points;
      for (const p of sub) {
        points.push(
          mk(
            p.x * c.scaleX + p.y * c.scale01 + c.dx,
            p.y * c.scaleY + p.x * c.scale10 + c.dy,
            p.onCurve,
            p.endContour,
          ),
        );
      }
    }
  } else if (raw && raw.points) {
    points = raw.points.map((p) => mk(p.x, p.y, p.onCurve, p.endContour));
  }
  let advance = baseAdvance;
  if (processor) {
    // gvar expects the outline points followed by 4 phantom points (h-origin, h-advance, v-origin, v-advance).
    const work = points.map((p) => p.copy());
    if (raw && raw.numberOfContours < 0) {
      // Composite deltas apply to component offsets; tiny for these fonts, so skip them.
    } else {
      work.push(mk(0, 0, false, true), mk(baseAdvance, 0, false, true), mk(0, 0, false, true), mk(0, 0, false, true));
      processor.transformPoints(id, work);
      if (!v.HVAR) advance = work[work.length - 3].x - work[work.length - 4].x;
      points = work.slice(0, points.length);
    }
    if (v.HVAR) advance = baseAdvance + processor.getAdvanceAdjustment(id, v.HVAR);
  }
  return { points, advance };
}

function glyphContours(base, v, processor, id) {
  const { points, advance } = variedGlyph(base, v, processor, id);
  const contours = [];
  let cur = [];
  for (const p of points) {
    cur.push({ x: p.x, y: p.y, on: p.onCurve });
    if (p.endContour) {
      contours.push(cur);
      cur = [];
    }
  }
  return { contours, advance };
}

function contoursToPath(contours, ox, oy, scale) {
  const X = (x) => +(ox + x * scale).toFixed(2);
  const Y = (y) => +(oy - y * scale).toFixed(2);
  let d = '';
  for (const c of contours) {
    if (!c.length) continue;
    let start = c.findIndex((p) => p.on);
    let first;
    if (start === -1) {
      first = { x: (c[0].x + c[c.length - 1].x) / 2, y: (c[0].y + c[c.length - 1].y) / 2, on: true };
      start = 0;
    } else first = c[start];
    d += `M${X(first.x)} ${Y(first.y)}`;
    const n = c.length;
    let ctrl = null;
    for (let k = 1; k <= n; k++) {
      const p = c[(start + k) % n];
      const target = k === n && c[start].on ? first : p;
      if (target.on) {
        if (ctrl) d += `Q${X(ctrl.x)} ${Y(ctrl.y)} ${X(target.x)} ${Y(target.y)}`;
        else d += `L${X(target.x)} ${Y(target.y)}`;
        ctrl = null;
      } else {
        if (ctrl) {
          const mx = (ctrl.x + target.x) / 2;
          const my = (ctrl.y + target.y) / 2;
          d += `Q${X(ctrl.x)} ${Y(ctrl.y)} ${X(mx)} ${Y(my)}`;
        }
        ctrl = target;
      }
    }
    if (ctrl) d += `Q${X(ctrl.x)} ${Y(ctrl.y)} ${X(first.x)} ${Y(first.y)}`;
    d += 'Z';
  }
  return d;
}

/**
 * Lay out a single line of text as an SVG path.
 * @param {string} text
 * @param {{family?: 'archivo'|'mono', size: number, x?: number, y?: number, axes?: Record<string, number>, tracking?: number, anchor?: 'start'|'middle'|'end'}} opts
 *   y is the baseline. tracking is in em.
 * @returns {{d: string, width: number}}
 */
export function textPath(text, opts) {
  const { family = 'archivo', size, x = 0, y = 0, axes = {}, tracking = 0, anchor = 'start' } = opts;
  const entry = loadFont(family);
  const { v, processor } = variant(entry, axes);
  const scale = size / entry.font.unitsPerEm;
  const ids = entry.font.glyphsForString(text).map((g) => g.id);
  const glyphs = ids.map((id) => glyphContours(entry.font, v, processor, id));
  const track = tracking * entry.font.unitsPerEm;
  const totalUnits = glyphs.reduce((s, g, i) => s + g.advance + (i < glyphs.length - 1 ? track : 0), 0);
  const width = totalUnits * scale;
  let pen = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x;
  let d = '';
  for (const g of glyphs) {
    d += contoursToPath(g.contours, pen, y, scale);
    pen += (g.advance + track) * scale;
  }
  return { d, width };
}
