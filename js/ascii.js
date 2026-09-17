// ASCII portrait downsampler — SPEC §11
const RAMP = ' .:-=+*#%@';
const RAMP_INDEX = new Map([...RAMP].map((c, i) => [c, i]));

let rawText = null;
let loadFailed = false;
const cache = new Map();

export async function loadPortrait(url = 'assets/ascii-portrait.txt') {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    rawText = await res.text();
  } catch {
    loadFailed = true;
    rawText = null;
  }
  return rawText;
}

export function portraitFailed() {
  return loadFailed;
}

function densityGrid() {
  const lines = rawText.replace(/\r\n/g, '\n').split('\n');
  while (lines.length && lines[lines.length - 1] === '') lines.pop();
  const srcCols = Math.max(...lines.map((l) => l.length));
  const srcRows = lines.length;
  const grid = new Float64Array(srcCols * srcRows);
  for (let r = 0; r < srcRows; r++) {
    const line = lines[r];
    for (let c = 0; c < srcCols; c++) {
      const ch = c < line.length ? line[c] : ' ';
      const idx = RAMP_INDEX.has(ch) ? RAMP_INDEX.get(ch) : 0;
      grid[r * srcCols + c] = idx / 9;
    }
  }
  return { grid, srcCols, srcRows };
}

export function renderPortrait(cols, invert) {
  if (!rawText) return null;
  const key = `${cols}:${invert}`;
  if (cache.has(key)) return cache.get(key);

  const { grid, srcCols, srcRows } = densityGrid();
  const block = srcCols / cols;
  const outRows = Math.floor(srcRows / block);

  const cellAverages = [];
  for (let or_ = 0; or_ < outRows; or_++) {
    for (let oc = 0; oc < cols; oc++) {
      const r0 = Math.floor(or_ * block);
      const r1 = Math.max(r0 + 1, Math.floor((or_ + 1) * block));
      const c0 = Math.floor(oc * block);
      const c1 = Math.max(c0 + 1, Math.floor((oc + 1) * block));
      let sum = 0;
      let n = 0;
      for (let r = r0; r < r1 && r < srcRows; r++) {
        for (let c = c0; c < c1 && c < srcCols; c++) {
          sum += grid[r * srcCols + c];
          n++;
        }
      }
      cellAverages.push(n ? sum / n : 0);
    }
  }

  const sorted = [...cellAverages].sort((a, b) => a - b);
  const pct = (p) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
  const lo = pct(0.02);
  const hi = pct(0.995);
  const range = hi - lo || 1;

  const lines = [];
  for (let r = 0; r < outRows; r++) {
    let line = '';
    for (let c = 0; c < cols; c++) {
      const raw = cellAverages[r * cols + c];
      const d = Math.min(1, Math.max(0, (raw - lo) / range));
      let ch;
      if (invert) {
        if (raw < 0.06) {
          ch = ' ';
        } else {
          const v = 0.1 + 0.85 * (1 - d);
          ch = RAMP[Math.round(v * 9)];
        }
      } else {
        ch = RAMP[Math.round(d * 9)];
      }
      line += ch;
    }
    lines.push(line.replace(/\s+$/, ''));
  }

  const result = lines.join('\n');
  cache.set(key, result);
  return result;
}
