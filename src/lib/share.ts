import { deflateSync, inflateSync, strFromU8, strToU8 } from 'fflate';
import type { Project } from './types';

/** Shared links longer than this are rejected outright (about 2 MB of URL). */
const MAX_PAYLOAD = 2_000_000;

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Validates an unknown value as a Project. Missing fields become empty strings; wrong types fail. */
export function asProject(value: unknown): Project | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  const keys = ['html', 'css', 'js'] as const;
  if (!keys.some((k) => k in v)) return null;
  const out: Project = { html: '', css: '', js: '' };
  for (const k of keys) {
    if (v[k] === undefined) continue;
    if (typeof v[k] !== 'string') return null;
    out[k] = v[k] as string;
  }
  return out;
}

/** base64url(deflate(JSON {html,css,js})) */
export function encodeProject(project: Project): string {
  const json = JSON.stringify({ html: project.html, css: project.css, js: project.js });
  return toBase64Url(deflateSync(strToU8(json), { level: 9 }));
}

/** Returns null on any malformed input. Never throws. */
export function decodeProject(payload: string): Project | null {
  try {
    if (typeof payload !== 'string') return null;
    const clean = payload.trim();
    if (!clean || clean.length > MAX_PAYLOAD || !/^[A-Za-z0-9_-]+$/.test(clean)) return null;
    const json = strFromU8(inflateSync(fromBase64Url(clean)));
    return asProject(JSON.parse(json));
  } catch {
    return null;
  }
}
