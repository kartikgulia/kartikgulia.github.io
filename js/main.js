// Bootstrap: load content, init store, router, input, render loop — SPEC §14.1
import { getState } from './state.js';
import { loadContent } from './content.js';
import { loadPortrait } from './ascii.js';
import { parseRoute, currentHash, navigate, onRouteChange } from './router.js';
import { setContent, renderWithTransition, showToast, setPendingTransition, refreshStatus } from './render.js';
import { playSound } from './audio.js';
import { initInput } from './input.js';
import { runBoot } from './boot.js';
import { rafThrottle, esc } from './util.js';

let content = null;

function applyTheme() {
  const dark = getState().settings.darkScreens;
  document.documentElement.setAttribute('data-screens', dark ? 'dark' : 'light');
}

// ---------- Scaling & layout (§4.2) ----------

function computeScale() {
  const stage = document.getElementById('device-stage');
  const w = stage.clientWidth;
  const h = stage.clientHeight;
  if (w <= 0 || h <= 0) return; // stage not laid out yet (e.g. pane hidden) — keep the current layout
  const scale = Math.min(1.25, (w - 48) / 780, (h - 48) / 762);
  const mobile = w < 700 || scale < 0.7;
  document.documentElement.setAttribute('data-layout', mobile ? 'mobile' : 'device');
  if (!mobile) {
    document.documentElement.style.setProperty('--device-scale', String(Math.max(0.3, scale)));
  }
  const stickyControls = mobile && h < 640;
  document.documentElement.classList.toggle('controls-sticky', stickyControls);
}

const onResize = rafThrottle(computeScale);

// ---------- Route validation (unknown :id redirects) ----------

function validateRoute(route) {
  if (!content) return true;
  if (route.name === 'project-detail') {
    const exists = (content.projects || []).some((p) => p.id === route.params.id);
    if (!exists) {
      setPendingTransition('fade');
      navigate('#/projects', { replace: true });
      showToast("couldn't find that one");
      return false;
    }
  }
  if (route.name === 'role-detail') {
    const exists = (content.experience || []).some((r) => r.id === route.params.id);
    if (!exists) {
      setPendingTransition('fade');
      navigate('#/resume', { replace: true });
      showToast("couldn't find that one");
      return false;
    }
  }
  if (route.name === 'not-found') {
    setPendingTransition('fade');
    navigate('#/', { replace: true });
    showToast('page not found');
    playSound('error', getState().settings.sound);
    return false;
  }
  return true;
}

function handleRouteChange() {
  const route = parseRoute(currentHash());
  if (!validateRoute(route)) return;
  renderWithTransition();
}

// ---------- Crawlable summary + noscript (§13, §12) ----------

function fillCrawlSummary() {
  const el = document.getElementById('crawl-summary');
  const profile = content.profile || {};
  const parts = [];
  parts.push(`<h1>${esc(profile.name || '')}</h1>`);
  if (profile.tagline) parts.push(`<p>${esc(profile.tagline)}</p>`);
  (content.projects || []).forEach((p) => parts.push(`<p>${esc(p.title)} — ${esc(p.summary || '')}</p>`));
  el.innerHTML = parts.join('');

  document.title = `${profile.name || 'Portfolio'} · portfolio`;
  const desc = document.querySelector('meta[name="description"]');
  if (desc && profile.tagline) desc.setAttribute('content', profile.tagline);
}

function showLoadError() {
  document.getElementById('top-body').innerHTML = '<div class="empty-card card">couldn’t load content.json</div>';
  document.getElementById('touch-body').innerHTML = '<div class="tile-grid"><button type="button" class="tile" id="retry-btn"><span class="tile__label">retry</span></button></div>';
  document.getElementById('retry-btn').addEventListener('click', () => window.location.reload());
}

async function init() {
  computeScale();
  window.addEventListener('resize', onResize);

  applyTheme();

  let portraitPromise = loadPortrait();

  try {
    content = await loadContent();
  } catch (err) {
    console.warn('[content] failed to load content.json', err);
    showLoadError();
    return;
  }

  await portraitPromise;

  window.__hpContent = content;
  setContent(content);
  fillCrawlSummary();

  initInput();
  onRouteChange(handleRouteChange);

  const route = parseRoute(currentHash());
  validateRoute(route);
  renderWithTransition();

  runBoot(() => {
    renderWithTransition();
  });

  setInterval(refreshStatus, 30000);
}

init();
