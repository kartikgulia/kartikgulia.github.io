// Keyboard, pointer, touch, d-pad repeat, button dispatch, hover rule — SPEC §6
import { getState, getCursor } from './state.js';
import { navigate, parentHash, parseRoute, currentHash } from './router.js';
import {
  getActiveScreenAndCtx,
  getActiveItems,
  moveCursorTo,
  setPendingTransition,
  requestFocusOnNextRender,
  closeOverlay,
  toggleDarkScreens,
  toggleSound,
} from './render.js';
import { move, bump } from './nav.js';
import { playSound, primeAudio } from './audio.js';

const REPEAT_DELAY = 350;
const REPEAT_INTERVAL = 110;

let lastPointer = { x: -1, y: -1 };
let repeatTimer = null;
let repeatInterval = null;

function soundOn() { return getState().settings.sound; }

function pressAnimate(el) {
  if (!el) return;
  el.classList.add('is-pressed');
  setTimeout(() => el.classList.remove('is-pressed'), 100);
}

// ---------- A / B / X / Y ----------

function currentHighlightEl() {
  const overlay = getState().overlay;
  const id = overlay ? getCursor(`overlay:${overlay}`) : getActiveScreenAndCtx().ctx.cursor;
  if (!id) return null;
  return document.querySelector(`[data-item="${CSS.escape(id)}"]`);
}

function runA() {
  const fbtn = document.querySelector('.fbtn[data-btn="a"]');
  pressAnimate(fbtn);
  const overlay = getState().overlay;
  const items = getActiveItems();
  const id = overlay ? getCursor(`overlay:${overlay}`) : getActiveScreenAndCtx().ctx.cursor;
  const item = items.find((i) => i.id === id);
  if (item && item.action) {
    playSound('confirm', soundOn());
    item.action();
  }
}

function runB() {
  const fbtn = document.querySelector('.fbtn[data-btn="b"]');
  pressAnimate(fbtn);
  const state = getState();
  if (state.overlay) {
    playSound('back', soundOn());
    closeOverlay();
    return;
  }
  const route = parseRoute(currentHash());
  const parent = parentHash(route);
  if (!parent) return;
  playSound('back', soundOn());
  setPendingTransition('back');
  requestFocusOnNextRender();
  navigate(parent);
}

function runX() {
  const fbtn = document.querySelector('.fbtn[data-btn="x"]');
  pressAnimate(fbtn);
  const route = parseRoute(currentHash());
  const state = getState();
  if (route.name === 'home' && !state.overlay) return;
  if (state.overlay) closeOverlay();
  setPendingTransition('fade');
  requestFocusOnNextRender();
  navigate('#/');
}

function runY() {
  const fbtn = document.querySelector('.fbtn[data-btn="y"]');
  pressAnimate(fbtn);
  const state = getState();
  if (state.overlay === 'settings') {
    playSound('back', soundOn());
    closeOverlay();
    return;
  }
  const { screen, ctx } = getActiveScreenAndCtx();
  const yAction = screen.y && screen.y(ctx);
  if (yAction) {
    playSound('confirm', soundOn());
    yAction.run();
  }
}

// ---------- Scrolling ----------

function getScrollRegion() {
  const touchBody = document.getElementById('touch-body');
  const candidates = touchBody.querySelectorAll('.role-list, .tab-panel, .role-detail-card, .cart-grid');
  for (const el of candidates) {
    if (el.scrollHeight > el.clientHeight + 1) return el;
  }
  const overlayCard = document.querySelector('.overlay__card');
  if (overlayCard && overlayCard.scrollHeight > overlayCard.clientHeight + 1) return overlayCard;
  return touchBody;
}

function scrollBy(amount) {
  getScrollRegion().scrollBy({ top: amount, behavior: 'smooth' });
}

// ---------- Direction handling (d-pad / arrows) ----------

function handleDirection(direction) {
  const overlay = getState().overlay;
  const items = getActiveItems();
  const container = document.getElementById('touch-body');

  if (overlay) {
    const cursor = getCursor(`overlay:${overlay}`);
    const next = move(items, cursor, direction, container);
    if (next) {
      moveCursorTo(next, { fromKeyboard: true });
    } else {
      bump(currentHighlightEl(), direction);
    }
    return;
  }

  const { screen, ctx } = getActiveScreenAndCtx();

  if (!items.length) {
    if (direction === 'up') return scrollBy(-40);
    if (direction === 'down') return scrollBy(40);
    return;
  }

  if (screen.beforeMove) {
    const result = screen.beforeMove(ctx, direction);
    if (result && result.consumed) return;
    if (result && result.cursor) {
      moveCursorTo(result.cursor, { fromKeyboard: true });
      return;
    }
  }

  let next = move(items, ctx.cursor, direction, container);
  if (!next && screen.onEdge) next = screen.onEdge(ctx, direction);

  if (next) {
    moveCursorTo(next, { fromKeyboard: true });
  } else {
    bump(currentHighlightEl(), direction);
  }
}

function startRepeat(direction, sourceEl) {
  stopRepeat();
  pressAnimate(sourceEl);
  handleDirection(direction);
  repeatTimer = setTimeout(() => {
    repeatInterval = setInterval(() => handleDirection(direction), REPEAT_INTERVAL);
  }, REPEAT_DELAY);
}

function stopRepeat() {
  clearTimeout(repeatTimer);
  clearInterval(repeatInterval);
  repeatTimer = null;
  repeatInterval = null;
}

// ---------- Keyboard ----------

function onKeyDown(e) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  primeAudio();

  const dirMap = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
  if (dirMap[e.key]) {
    e.preventDefault();
    if (e.repeat) return; // browser key-repeat is throttled ourselves
    handleDirection(dirMap[e.key]);
    return;
  }

  if (e.key === 'Enter') { e.preventDefault(); runA(); return; }
  if (e.key === 'Escape') { e.preventDefault(); runB(); return; }
  if (e.key === 'Backspace') { e.preventDefault(); runB(); return; }

  const k = e.key.toLowerCase();
  if (k === 'a') return runA();
  if (k === 'b') return runB();
  if (k === 'x') return runX();
  if (k === 'y') return runY();

  if (e.key === 'PageUp') { e.preventDefault(); scrollBy(-120); return; }
  if (e.key === 'PageDown') { e.preventDefault(); scrollBy(120); return; }
}

function onKeyUp(e) {
  const dirMap = { ArrowUp: 1, ArrowDown: 1, ArrowLeft: 1, ArrowRight: 1 };
  if (dirMap[e.key]) stopRepeat();
}

// ---------- Pointer hover rule ----------

function onPointerMove(e) {
  if (e.pointerType && e.pointerType !== 'mouse') return;
  const moved = Math.abs(e.clientX - lastPointer.x) > 0.5 || Math.abs(e.clientY - lastPointer.y) > 0.5;
  lastPointer = { x: e.clientX, y: e.clientY };
  if (!moved) return;
  const target = e.target.closest('[data-item]');
  if (!target) return;
  const id = target.dataset.item;
  const overlay = getState().overlay;
  const currentId = overlay ? getCursor(`overlay:${overlay}`) : getActiveScreenAndCtx().ctx.cursor;
  if (id === currentId) return;
  moveCursorTo(id, { fromKeyboard: false });
}

// ---------- Click / tap on items ----------

function onClick(e) {
  primeAudio();

  const detailAction = e.target.closest('[data-detail-action]');
  if (detailAction) {
    const kind = detailAction.dataset.detailAction;
    if (kind === 'open') { runA(); }
    else if (kind === 'source') { window.open(detailAction.dataset.href, '_blank', 'noopener,noreferrer'); }
    return;
  }

  const itemEl = e.target.closest('[data-item]');
  if (itemEl) {
    const id = itemEl.dataset.item;
    if (id === 'gallery' && gallerySwiped) { gallerySwiped = false; return; }
    const overlay = getState().overlay;
    if (overlay) {
      moveCursorTo(id, { fromKeyboard: false });
      runA();
      return;
    }
    const { screen, ctx } = getActiveScreenAndCtx();
    moveCursorTo(id, { fromKeyboard: false });
    if (screen.onItemClick) {
      const result = screen.onItemClick(ctx, id, e);
      if (result && result.handled) return;
    }
    runA();
    return;
  }

  const pill = e.target.closest('[data-pill]');
  if (pill) {
    pressAnimate(pill);
    const kind = pill.dataset.pill;
    if (kind === 'home') runX();
    else if (kind === 'theme') toggleDarkScreens();
    else if (kind === 'sound') toggleSound();
    return;
  }

  const fbtn = e.target.closest('.fbtn');
  if (fbtn) {
    const kind = fbtn.dataset.btn;
    if (kind === 'a') runA();
    else if (kind === 'b') runB();
    else if (kind === 'x') runX();
    else if (kind === 'y') runY();
  }
}

// ---------- Focus (Tab) moves the highlight ----------

function onFocusIn(e) {
  const itemEl = e.target.closest && e.target.closest('[data-item]');
  if (!itemEl) return;
  const id = itemEl.dataset.item;
  const overlay = getState().overlay;
  const currentId = overlay ? getCursor(`overlay:${overlay}`) : getActiveScreenAndCtx().ctx.cursor;
  if (id === currentId) return;
  moveCursorTo(id, { fromKeyboard: false, silent: true });
}

// ---------- On-screen d-pad ----------

function bindDpad() {
  const dpad = document.getElementById('dpad');
  dpad.querySelectorAll('[data-dpad]').forEach((btn) => {
    const dir = btn.dataset.dpad;
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      primeAudio();
      startRepeat(dir, btn);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((evt) => {
      btn.addEventListener(evt, () => { stopRepeat(); btn.classList.remove('is-pressed'); });
    });
  });
}

// ---------- Touch swipe on gallery ----------

let gallerySwiped = false;

function bindGallerySwipe() {
  const topBody = document.getElementById('top-body');
  let startX = null;
  let startY = null;

  topBody.addEventListener('pointerdown', (e) => {
    const gallery = e.target.closest('[data-item="gallery"]');
    if (!gallery) return;
    startX = e.clientX;
    startY = e.clientY;
    gallerySwiped = false;
  });

  topBody.addEventListener('pointerup', (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    startX = null;
    startY = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      gallerySwiped = true;
      handleDirection(dx < 0 ? 'right' : 'left');
    }
  });
}

// ---------- Boot skip ----------

let bootSkipHandler = null;
export function setBootSkipHandler(fn) { bootSkipHandler = fn; }

function maybeSkipBoot() {
  if (bootSkipHandler) bootSkipHandler();
}

export function initInput() {
  const device = document.getElementById('device');
  device.addEventListener('pointermove', onPointerMove);
  device.addEventListener('click', (e) => { maybeSkipBoot(); onClick(e); });
  device.addEventListener('focusin', onFocusIn);
  document.addEventListener('keydown', (e) => { maybeSkipBoot(); onKeyDown(e); });
  document.addEventListener('keyup', onKeyUp);
  document.addEventListener('pointerdown', () => maybeSkipBoot(), { capture: true });
  bindDpad();
  bindGallerySwipe();
}
