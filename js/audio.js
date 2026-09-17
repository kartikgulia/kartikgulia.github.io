// Synthesized sound effects — SPEC §9.2. No audio files.
const MASTER_GAIN = 0.08;

let ctx = null;
let lastCursorPlay = 0;

function ensureCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// Primes the AudioContext; call this from a user-gesture handler.
export function primeAudio() {
  ensureCtx();
}

function tone(type, freq, startOffset, duration) {
  const c = ensureCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = c.currentTime + startOffset;
  const attack = Math.min(0.006, duration / 4);
  const t1 = t0 + duration / 1000;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(MASTER_GAIN, t0 + attack);
  gain.gain.linearRampToValueAtTime(0, t1);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t1 + 0.01);
}

const RECIPES = {
  cursor: () => tone('square', 880, 0, 28),
  confirm: () => {
    tone('square', 660, 0, 40);
    tone('square', 990, 0.04, 60);
  },
  back: () => {
    tone('square', 660, 0, 40);
    tone('square', 440, 0.04, 60);
  },
  toggle: () => tone('triangle', 520, 0, 50),
  boot: () => {
    [523, 659, 784, 1047].forEach((f, i) => tone('triangle', f, i * 0.07, 70));
  },
  error: () => tone('square', 220, 0, 120),
};

export function playSound(name, soundEnabled) {
  if (!soundEnabled) return;
  if (name === 'cursor') {
    const now = performance.now();
    if (now - lastCursorPlay < 45) return;
    lastCursorPlay = now;
  }
  const recipe = RECIPES[name];
  if (recipe) recipe();
}
