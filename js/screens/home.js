import { html, raw, esc } from '../util.js';
import { navigate } from '../router.js';
import { setPendingTransition, requestFocusOnNextRender, openOverlay } from '../render.js';
import { renderPortrait, portraitFailed } from '../ascii.js';
import { chip, tile } from '../components.js';

function goto(hash) {
  return () => {
    setPendingTransition('forward');
    requestFocusOnNextRender();
    navigate(hash);
  };
}

function clockText() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm} ▮▮▮`;
}

function dateText() {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const day = now.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase().slice(0, 3);
  return `${mm}/${dd} ${day}`;
}

const TILES = [
  { id: 'tile-projects', icon: 'folder', label: 'Projects', hash: '#/projects', row: 0, col: 0 },
  { id: 'tile-resume', icon: 'document', label: 'Resume', hash: '#/resume', row: 0, col: 1 },
  { id: 'tile-education', icon: 'gradcap', label: 'Education', hash: '#/education', row: 1, col: 0 },
  { id: 'tile-contact', icon: 'mail', label: 'Contact', hash: '#/contact', row: 1, col: 1 },
];

export default {
  key: () => 'home',
  title: () => 'Home',
  status: () => ({ left: dateText(), right: clockText() }),

  renderTop(ctx) {
    const profile = (ctx.content && ctx.content.profile) || {};
    const cols = ctx.layout === 'mobile' ? 40 : 46;
    const portraitText = renderPortrait(cols, ctx.state.settings.darkScreens);
    const greeting = ctx.state.firstVisitThisSession ? 'hello' : 'welcome back';

    return html`<div class="home-top">
      <div class="card home-portrait-card">
        ${raw(portraitFailed() || !portraitText
          ? `<div class="portrait-fallback" aria-hidden="true">${esc((profile.name || '?').slice(0, 2).toUpperCase())}</div>`
          : html`<pre class="portrait" aria-hidden="true">${portraitText}</pre>`)}
        <span class="sr-only">ASCII portrait of ${profile.name || ''}</span>
      </div>
      <div class="home-text">
        <div class="home-text__label">${greeting}</div>
        <div class="home-text__hero">hi! i'm<br>${profile.name || '[YOUR NAME]'}</div>
        ${raw(profile.tagline ? html`<div class="home-text__tagline">${profile.tagline}</div>` : '')}
        ${raw(profile.status && profile.status.open ? html`<div class="chip-wrap">${raw(chip('● ' + (profile.status.label || ''), { success: true }))}</div>` : '')}
      </div>
    </div>`;
  },

  renderTouch(ctx) {
    const cursor = ctx.cursor;
    return html`<div class="tile-grid tile-grid--2x2">
      ${raw(TILES.map((t) => tile({ id: t.id, iconName: t.icon, label: t.label, highlighted: t.id === cursor })).join(''))}
    </div>`;
  },

  items: () => TILES.map((t) => ({ id: t.id, row: t.row, col: t.col, action: goto(t.hash) })),

  defaultCursor: () => 'tile-projects',

  y: () => ({ label: 'settings', run: () => openOverlay('settings') }),

  hint: () => 'tap an app',
};
