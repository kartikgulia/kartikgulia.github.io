// Escaping helper, storage wrappers, small utilities — SPEC §14.3

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
export const raw = (s) => ({ __raw: s });

export function html(strings, ...vals) {
  return strings.reduce((out, s, i) => {
    const v = vals[i - 1];
    const str = Array.isArray(v)
      ? v.map((x) => (x && x.__raw !== undefined ? x.__raw : esc(x))).join('')
      : v && v.__raw !== undefined ? v.__raw : esc(v);
    return out + str + s;
  });
}

export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

export function throttle(fn, ms) {
  let last = 0;
  let timer = null;
  return (...args) => {
    const now = performance.now();
    const remaining = ms - (now - last);
    if (remaining <= 0) {
      last = now;
      fn(...args);
    } else {
      clearTimeout(timer);
      timer = setTimeout(() => {
        last = performance.now();
        fn(...args);
      }, remaining);
    }
  };
}

export function rafThrottle(fn) {
  let scheduled = false;
  return (...args) => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      fn(...args);
    });
  };
}

const memoryStore = new Map();

export const storage = {
  get(kind, key, fallback) {
    try {
      const store = kind === 'local' ? localStorage : sessionStorage;
      const v = store.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch {
      return memoryStore.has(key) ? memoryStore.get(key) : fallback;
    }
  },
  set(kind, key, value) {
    try {
      const store = kind === 'local' ? localStorage : sessionStorage;
      store.setItem(key, JSON.stringify(value));
    } catch {
      memoryStore.set(key, value);
    }
  },
};

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export const prefersReducedMotion = () =>
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
