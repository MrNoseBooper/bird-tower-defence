// Little synthesized sound effects, so there are no audio files to ship. Muting is remembered in this browser.
const KEY = 'tyrants-nest-muted';
let ac = null, last = 0, streak = 0;
export let muted = (() => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } })();

export function toggleMute() {
  muted = !muted;
  try { localStorage.setItem(KEY, muted ? '1' : '0'); } catch { /* private mode: just this session */ }
  return muted;
}

function audio() {
  ac ??= new AudioContext();
  if (ac.state === 'suspended') ac.resume(); // browsers start audio paused until the player clicks
  return ac;
}

// One note sliding from `from` to `to` Hz while it fades out.
function blip(type, from, to, dur, vol, delay = 0) {
  const a = audio(), t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(from, t);
  o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur);
}

// A fading puff of muffled noise, for pops and booms.
function puff(dur, vol, cutoff) {
  const a = audio(), src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  const buf = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  src.buffer = buf;
  f.type = 'lowpass';
  f.frequency.value = cutoff;
  g.gain.value = vol;
  src.connect(f).connect(g).connect(a.destination);
  src.start();
}

// A pop and a berry chime. Kills in quick succession climb in pitch.
export function kill(big) {
  if (muted) return;
  const now = performance.now() / 1000;
  streak = now - last < 0.6 ? Math.min(streak + 1, 12) : 0;
  if (now - last < 0.035) return; // a swarm dying at once is one sound, not fifty
  last = now;
  const up = 1 + streak * 0.05;
  if (big) { puff(0.25, 0.5, 900); blip('square', 220 * up, 70, 0.22, 0.12); }
  else { puff(0.07, 0.3, 2500); blip('square', 660 * up, 330 * up, 0.08, 0.06); }
  blip('sine', 1320 * up, 1760 * up, 0.07, 0.05, 0.04);
}

// A boom and a little fanfare.
export function boss() {
  if (muted) return;
  puff(0.9, 0.8, 500);
  blip('sawtooth', 160, 40, 0.8, 0.15);
  [523, 659, 784, 1047].forEach((f, i) => blip('square', f, f * 1.01, 0.14, 0.07, 0.3 + i * 0.11));
}
