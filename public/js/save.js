// Saves live in this browser first; run.py keeps a copy on disk, or in the cloud on Vercel.
import { MAPS } from './data.js';

const KEY = 'tyrants-nest-save';
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function blank() {
  const code = Array.from(crypto.getRandomValues(new Uint8Array(10)), b => CODE_CHARS[b % CODE_CHARS.length]).join('');
  return { v: 1, t: 0, code, profile: { feathers: 0, xp: 0, beaten: 0, best: {}, wins: {}, roost: {} }, run: null };
}

// Fills in anything missing so older or damaged saves still load.
export function normalize(data) {
  const b = blank();
  if (!data || typeof data !== 'object') return b;
  const p = data.profile && typeof data.profile === 'object' ? data.profile : {};
  return {
    ...b, ...data,
    code: typeof data.code === 'string' ? data.code : b.code,
    t: +data.t || 0,
    profile: {
      ...p, feathers: +p.feathers || 0, beaten: +p.beaten || 0, best: { ...p.best }, wins: { ...p.wins }, roost: { ...p.roost },
      // saves from before XP existed get credit for the rounds they already reached
      xp: p.xp != null ? +p.xp || 0 : MAPS.reduce((sum, m, i) => sum + (+p.best?.[m.id] || 0) * (i + 1), 0),
    },
  };
}

export function loadLocal() {
  try { return normalize(JSON.parse(localStorage.getItem(KEY))); } catch { return blank(); }
}

export function persist(save) {
  save.t = Date.now();
  const body = JSON.stringify(save);
  try { localStorage.setItem(KEY, body); } catch { /* private mode or full storage: the server copy still works */ }
  fetch(`/api/save?code=${encodeURIComponent(save.code)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }).catch(() => {});
}

// { store: 'file' | 'redis' | null, data } where store is null when there is no save server.
export async function pull(code) {
  try {
    const res = await fetch(`/api/save?code=${encodeURIComponent(code)}`);
    if (!res.ok) return { store: null };
    return { store: res.headers.get('X-Save-Store'), data: await res.json() };
  } catch {
    return { store: null };
  }
}
