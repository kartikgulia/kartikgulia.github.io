// Renders both screens, applies transitions, updates glow/dim/aria — SPEC §7–9, §12
import { getState, setState, getCursor, setCursor, persistSettings } from './state.js';
import { parentHash, parseRoute, currentHash } from './router.js';
import { getScreen } from './screens/index.js';
import { html, raw, esc, prefersReducedMotion } from './util.js';
import { playSound } from './audio.js';

const topBody = document.getElementById('top-body');
const touchBody = document.getElementById('touch-body');
const statusLeft = document.getElementById('status-top-left');
const statusRight = document.getElementById('status-top-right');
const hintLeft = document.getElementById('hint-left');
const hintRight = document.getElementById('hint-right');
const toastEl = document.getElementById('toast');
const overlayRoot = document.getElementById('overlay-root');
const liveRegion = document.getElementById('live-region');
const fbtns = {
  x: document.querySelector('.fbtn[data-btn="x"]'),
  y: document.querySelector('.fbtn[data-btn="y"]'),
  a: document.querySelector('.fbtn[data-btn="a"]'),
  b: document.querySelector('.fbtn[data-btn="b"]'),
};
const pillTheme = document.getElementById('pill-theme');
const pillSound = document.getElementById('pill-sound');

let content = null;
let lastRouteKey = null;
let pendingTransition = 'fade'; // 'forward' | 'back' | 'fade'
let focusNextRender = false;
let toastTimer = null;

export function setContent(c) {
  content = c;
}

export function setPendingTransition(type) {
  pendingTransition = type;
}

export function requestFocusOnNextRender() {
  focusNextRender = true;
}

function buildCtx(route) {
  const layout = document.documentElement.getAttribute('data-layout') || 'device';
  return { route, params: route.params, content, state: getState(), layout };
}

function resolveCursor(screen, ctx, items) {
  const screenKey = screen.key(ctx.params);
  const ids = new Set(items.map((i) => i.id));
  let cursor = getCursor(screenKey);
  if (!cursor || !ids.has(cursor)) {
    cursor = screen.defaultCursor ? screen.defaultCursor(ctx) : items[0] && items[0].id;
    if (cursor) setCursor(screenKey, cursor);
  }
  return { screenKey, cursor };
}

export function getActiveScreenAndCtx() {
  const route = parseRoute(currentHash());
  const screen = getScreen(route.name);
  const ctx = buildCtx(route);
  const items = screen.items ? screen.items(ctx) : [];
  const { screenKey, cursor } = resolveCursor(screen, ctx, items);
  ctx.screenKey = screenKey;
  ctx.cursor = cursor;
  ctx.items = items;
  return { screen, ctx };
}

export function getOverlayItems() {
  const overlay = getState().overlay;
  if (overlay === 'settings') {
    return [
      { id: 'set-dark', row: 0, col: 0, action: toggleDarkScreens },
      { id: 'set-sound', row: 1, col: 0, action: toggleSound },
    ];
  }
  return [];
}

export function getActiveItems() {
  const overlay = getState().overlay;
  if (overlay) return getOverlayItems();
  return getActiveScreenAndCtx().ctx.items;
}

// Single entry point for all cursor changes (hover, click, keyboard, d-pad).
export function moveCursorTo(newId, { fromKeyboard = false, silent = false } = {}) {
  if (!newId) return;
  const overlay = getState().overlay;
  const { screen, ctx } = getActiveScreenAndCtx();
  const key = overlay ? `overlay:${overlay}` : ctx.screenKey;
  const prev = getCursor(key);
  if (prev === newId) return;
  setCursor(key, newId);
  if (!silent) playSound('cursor', getState().settings.sound);
  if (!overlay && screen.onHighlight) screen.onHighlight(ctx, newId);
  if (fromKeyboard) requestFocusOnNextRender();
  render();
}

// ---------- Settings actions (shared by pills + overlay) ----------

export function toggleDarkScreens() {
  const s = getState();
  const next = !s.settings.darkScreens;
  setState({ settings: { ...s.settings, darkScreens: next } });
  persistSettings();
  document.documentElement.setAttribute('data-screens', next ? 'dark' : 'light');
  playSound('toggle', s.settings.sound);
  announce(`Dark screens ${next ? 'on' : 'off'}`);
  render();
}

export function toggleSound() {
  const s = getState();
  const next = !s.settings.sound;
  setState({ settings: { ...s.settings, sound: next } });
  persistSettings();
  if (next) playSound('confirm', true);
  announce(`Sound ${next ? 'on' : 'off'}`);
  render();
}

export function openOverlay(name) {
  setState({ overlay: name });
  render();
}

export function closeOverlay() {
  setState({ overlay: null });
  render();
}

// ---------- Toast ----------

export function showToast(text) {
  clearTimeout(toastTimer);
  toastEl.textContent = text;
  toastEl.hidden = false;
  requestAnimationFrame(() => toastEl.classList.add('is-visible'));
  announce(text);
  const duration = prefersReducedMotion() ? 600 : 1800;
  toastTimer = setTimeout(() => {
    toastEl.classList.remove('is-visible');
    setTimeout(() => { toastEl.hidden = true; }, 200);
  }, duration);
}

export function announce(text) {
  liveRegion.textContent = '';
  requestAnimationFrame(() => { liveRegion.textContent = text; });
}

// ---------- Overlay rendering ----------

function renderOverlayUI() {
  const overlay = getState().overlay;
  if (!overlay) {
    overlayRoot.hidden = true;
    overlayRoot.innerHTML = '';
    return;
  }
  overlayRoot.hidden = false;
  const { cursor } = (() => {
    const items = getOverlayItems();
    const ids = new Set(items.map((i) => i.id));
    let c = getCursor(`overlay:${overlay}`);
    if (!c || !ids.has(c)) {
      c = items[0] ? items[0].id : null;
      if (c) setCursor(`overlay:${overlay}`, c);
    }
    return { cursor: c };
  })();

  if (overlay === 'settings') {
    const s = getState().settings;
    overlayRoot.innerHTML = html`<div class="overlay__card card">
      <div class="overlay__title">Settings</div>
      <div class="settings-row">
        <button type="button" class="settings-toggle${cursor === 'set-dark' ? ' is-highlighted' : ''}" data-item="set-dark" tabindex="${cursor === 'set-dark' ? 0 : -1}" aria-pressed="${raw(s.darkScreens ? 'true' : 'false')}">
          <span>Dark screens</span><span class="settings-toggle__state">${s.darkScreens ? 'ON' : 'OFF'}</span>
        </button>
        <button type="button" class="settings-toggle${cursor === 'set-sound' ? ' is-highlighted' : ''}" data-item="set-sound" tabindex="${cursor === 'set-sound' ? 0 : -1}" aria-pressed="${raw(s.sound ? 'true' : 'false')}">
          <span>Sound</span><span class="settings-toggle__state">${s.sound ? 'ON' : 'OFF'}</span>
        </button>
      </div>
      <div class="overlay__footer">Ⓑ close</div>
    </div>`;
  } else if (overlay === 'skills') {
    const groups = (content && content.skills) || [];
    overlayRoot.innerHTML = html`<div class="overlay__card card">
      <div class="overlay__title">Skills</div>
      <div class="skills-groups">
        ${raw(groups.map((g) => html`<div class="skills-group">
          <div class="skills-group__label">${g.group}</div>
          <div class="chip-row">${raw((g.items || []).map((i) => `<span class="chip">${esc(i)}</span>`).join(''))}</div>
        </div>`).join(''))}
      </div>
      <div class="overlay__footer">Ⓑ close</div>
    </div>`;
  }
}

// ---------- Button glow / dim ----------

function updateButtons(screen, ctx) {
  const state = getState();
  const overlay = state.overlay;
  const items = getActiveItems();
  const currentItem = overlay
    ? items.find((i) => i.id === getCursor(`overlay:${overlay}`)) || items[0]
    : items.find((i) => i.id === ctx.cursor);

  const hasAction = !!(currentItem && currentItem.action);
  const reduced = prefersReducedMotion();

  fbtns.a.classList.toggle('is-dim', !hasAction);
  fbtns.a.classList.toggle('is-pulse', hasAction && !reduced);
  fbtns.a.classList.toggle('is-lit', hasAction && reduced);
  fbtns.a.setAttribute('aria-disabled', hasAction ? 'false' : 'true');
  fbtns.a.setAttribute('aria-label', `A: ${hasAction ? 'open' : 'no action'}`);

  const isHome = ctx.route.name === 'home';
  const hasParent = !!overlay || (!isHome && parentHash(ctx.route) !== null);
  fbtns.b.classList.toggle('is-dim', !hasParent);
  fbtns.b.classList.toggle('is-lit', hasParent);
  fbtns.b.setAttribute('aria-disabled', hasParent ? 'false' : 'true');

  fbtns.x.classList.toggle('is-dim', isHome && !overlay);
  fbtns.x.setAttribute('aria-disabled', isHome && !overlay ? 'true' : 'false');

  const yAction = !overlay && screen.y ? screen.y(ctx) : null;
  fbtns.y.classList.toggle('is-dim', !yAction);
  fbtns.y.setAttribute('aria-disabled', yAction ? 'false' : 'true');
  fbtns.y.setAttribute('aria-label', `Y: ${yAction ? yAction.label : 'no action'}`);

  pillTheme.setAttribute('aria-pressed', state.settings.darkScreens ? 'true' : 'false');
  pillTheme.textContent = state.settings.darkScreens ? '☀ THEME' : '☾ THEME';
  pillSound.setAttribute('aria-pressed', state.settings.sound ? 'true' : 'false');
  pillSound.textContent = state.settings.sound ? '♪ MUTED' : '♪ SOUND';

  // Hint line
  if (overlay) {
    hintLeft.textContent = '';
    hintRight.textContent = '';
  } else {
    hintLeft.textContent = (screen.hint && screen.hint(ctx)) || '';
    hintRight.textContent = yAction ? `Ⓨ ${yAction.label}` : '';
  }
}

// ---------- Focus ----------

function applyFocus(ctx) {
  if (!focusNextRender) return;
  focusNextRender = false;
  const overlay = getState().overlay;
  const id = overlay ? getCursor(`overlay:${overlay}`) : ctx.cursor;
  if (!id) return;
  const el = document.querySelector(`[data-item="${CSS.escape(id)}"]`);
  if (el && typeof el.focus === 'function') el.focus({ preventScroll: true });
}

// ---------- Main render ----------

export function render() {
  const { screen, ctx } = getActiveScreenAndCtx();

  const statusInfo = screen.status ? screen.status(ctx) : { left: '', right: '' };
  statusLeft.textContent = statusInfo.left || '';
  statusRight.textContent = statusInfo.right || '';

  topBody.innerHTML = screen.renderTop ? screen.renderTop(ctx) : '';
  touchBody.innerHTML = screen.renderTouch ? screen.renderTouch(ctx) : '';

  renderOverlayUI();
  updateButtons(screen, ctx);
  applyFocus(ctx);

  document.title = screen.title ? `${(content && content.profile && content.profile.name) || 'Portfolio'} · ${screen.title(ctx)}` : 'portfolio';

  return { screen, ctx };
}

export function renderWithTransition() {
  const route = parseRoute(currentHash());
  const routeKey = route.name + JSON.stringify(route.params);
  const reduced = prefersReducedMotion();

  if (lastRouteKey === null || lastRouteKey === routeKey || reduced) {
    lastRouteKey = routeKey;
    const result = render();
    announceRoute(result.screen, result.ctx);
    return;
  }

  const type = pendingTransition;
  pendingTransition = 'fade';
  lastRouteKey = routeKey;

  const outClass = type === 'back' ? 'leaving-back' : type === 'forward' ? 'leaving-forward' : 'leaving-fade';
  const inClass = type === 'back' ? 'entering-back' : type === 'forward' ? 'entering-forward' : 'entering-fade';

  topBody.classList.add(outClass);
  touchBody.classList.add(outClass);

  const outMs = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--d-screen-out')) || 120;

  setTimeout(() => {
    topBody.classList.remove(outClass);
    touchBody.classList.remove(outClass);
    const result = render();
    topBody.classList.add(inClass);
    touchBody.classList.add(inClass);
    setTimeout(() => {
      topBody.classList.remove(inClass);
      touchBody.classList.remove(inClass);
    }, 400);
    announceRoute(result.screen, result.ctx);
  }, outMs);
}

// Lightweight periodic refresh of the status bar text only (e.g. the Home clock).
export function refreshStatus() {
  if (getState().overlay) return;
  const route = parseRoute(currentHash());
  const screen = getScreen(route.name);
  if (!screen.status) return;
  const ctx = buildCtx(route);
  const info = screen.status(ctx);
  statusLeft.textContent = info.left || '';
  statusRight.textContent = info.right || '';
}

function announceRoute(screen, ctx) {
  const title = screen.title ? screen.title(ctx) : '';
  const count = ctx.items ? ctx.items.length : 0;
  announce(count ? `${title}, ${count} items` : title);
}
