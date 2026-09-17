// Grid + spatial navigation, paging, bump — SPEC §6.2

const DIR_VEC = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const DIR_ANGLE = { up: -90, down: 90, left: 180, right: 0 };

// Nearest-neighbor movement using logical row/col (regular grids).
export function gridMove(items, currentId, direction) {
  const cur = items.find((i) => i.id === currentId);
  if (!cur) return null;
  const [vx, vy] = DIR_VEC[direction];
  let best = null;
  let bestScore = Infinity;
  for (const it of items) {
    if (it.id === currentId) continue;
    const dc = it.col - cur.col;
    const dr = it.row - cur.row;
    const primary = vx !== 0 ? dc * vx : dr * vy;
    if (primary <= 0) continue;
    const perpendicular = vx !== 0 ? Math.abs(dr) : Math.abs(dc);
    const score = primary + 0.5 * perpendicular;
    if (score < bestScore) {
      bestScore = score;
      best = it;
    }
  }
  return best ? best.id : null;
}

// Spatial navigation using real DOM rect centers (irregular / wrapping layouts).
// rects: Map<id, {x, y}> of element centers.
export function spatialMove(rects, currentId, direction) {
  const cur = rects.get(currentId);
  if (!cur) return null;
  const dirAngle = DIR_ANGLE[direction];
  const rad = (dirAngle * Math.PI) / 180;
  let best = null;
  let bestScore = Infinity;
  for (const [id, rect] of rects) {
    if (id === currentId) continue;
    const dx = rect.x - cur.x;
    const dy = rect.y - cur.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) continue;
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI - dirAngle;
    angle = ((angle + 180) % 360 + 360) % 360 - 180;
    if (Math.abs(angle) > 60) continue;
    const primary = dx * Math.cos(rad) + dy * Math.sin(rad);
    const perpendicular = Math.abs(-dx * Math.sin(rad) + dy * Math.cos(rad));
    const score = primary + 0.5 * perpendicular;
    if (score < bestScore) {
      bestScore = score;
      best = id;
    }
  }
  return best;
}

export function rectsFromContainer(container) {
  const rects = new Map();
  container.querySelectorAll('[data-item]').forEach((el) => {
    const r = el.getBoundingClientRect();
    rects.set(el.dataset.item, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
  });
  return rects;
}

// Moves within an items array. Items with numeric row/col use gridMove;
// otherwise falls back to DOM-rect spatial navigation.
export function move(items, currentId, direction, container) {
  const hasGrid = items.every((i) => typeof i.row === 'number' && typeof i.col === 'number');
  if (hasGrid) {
    const next = gridMove(items, currentId, direction);
    if (next) return next;
    // Grid movement found nothing (e.g. wrapped chip rows) — try spatial as a fallback.
  }
  if (container) {
    const rects = rectsFromContainer(container);
    const ids = new Set(items.map((i) => i.id));
    for (const id of [...rects.keys()]) if (!ids.has(id)) rects.delete(id);
    return spatialMove(rects, currentId, direction) || null;
  }
  return null;
}

export function pageCount(total, perPage) {
  return Math.max(1, Math.ceil(total / perPage));
}

let bumpTimer = null;
export function bump(el, direction) {
  if (!el) return;
  const cls = `bump-${direction}`;
  el.classList.remove('bump-up', 'bump-down', 'bump-left', 'bump-right');
  // Force reflow so the animation restarts if the same class is reapplied quickly.
  void el.offsetWidth;
  el.classList.add(cls);
  clearTimeout(bumpTimer);
  bumpTimer = setTimeout(() => el.classList.remove(cls), 120);
}
