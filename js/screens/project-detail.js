import { html, raw, esc } from '../util.js';
import { navigate } from '../router.js';
import { setPendingTransition, requestFocusOnNextRender, render } from '../render.js';
import { getState, setState } from '../state.js';
import { chip } from '../components.js';
import { prefersReducedMotion } from '../util.js';

function findProject(ctx) {
  return ((ctx.content && ctx.content.projects) || []).find((p) => p.id === ctx.params.id);
}

function galleryKey(project) { return `project:${project.id}`; }

function galleryIndex(ctx, project) {
  const idx = ctx.state.galleryIndex[galleryKey(project)] || 0;
  const len = (project.images || []).length || 1;
  return Math.min(idx, len - 1);
}

function setGalleryIndex(project, idx) {
  const s = getState();
  const len = (project.images || []).length || 1;
  const clamped = Math.max(0, Math.min(len - 1, idx));
  setState({ galleryIndex: { ...s.galleryIndex, [galleryKey(project)]: clamped } });
}

function visibleTabs(project) {
  const tabs = [];
  if (project.overview && (project.overview.problem || project.overview.built)) tabs.push({ id: 'tab-overview', tab: 'overview', label: 'Overview' });
  if (project.role && (project.role.summary || (project.role.bullets || []).length)) tabs.push({ id: 'tab-role', tab: 'role', label: 'My role' });
  if ((project.stack || []).length) tabs.push({ id: 'tab-stack', tab: 'stack', label: 'Stack' });
  if ((project.results || []).length) tabs.push({ id: 'tab-results', tab: 'results', label: 'Results' });
  return tabs;
}

function activeTab(ctx, project) {
  const tabs = visibleTabs(project);
  if (!tabs.length) return null;
  const key = galleryKey(project);
  const stored = ctx.state.tab[key];
  if (stored && tabs.find((t) => t.tab === stored)) return stored;
  return tabs[0].tab;
}

function setActiveTab(project, tab) {
  const s = getState();
  setState({ tab: { ...s.tab, [galleryKey(project)]: tab } });
}

function isVideo(src) { return /\.(mp4|webm)$/i.test(src || ''); }

function backToProjects() {
  setPendingTransition('back');
  requestFocusOnNextRender();
  navigate('#/projects');
}

export default {
  key: (params) => `project:${params.id}`,
  title(ctx) { const p = findProject(ctx); return p ? p.title : 'Project'; },

  status(ctx) {
    const p = findProject(ctx);
    if (!p) return { left: '', right: '' };
    const idx = galleryIndex(ctx, p);
    const len = (p.images || []).length;
    return { left: p.title, right: len ? `◉ ${idx + 1} / ${len}` : '' };
  },

  renderTop(ctx) {
    const p = findProject(ctx);
    if (!p) return '';
    const images = p.images || [];
    const idx = galleryIndex(ctx, p);
    const img = images[idx];
    const hi = ctx.cursor === 'gallery';
    const reduced = prefersReducedMotion();

    let media;
    if (img && img.src && isVideo(img.src)) {
      media = html`<video class="gallery__media" src="${img.src}" ${raw(reduced ? '' : 'autoplay loop')} muted playsinline aria-label="${img.alt || ''}"></video>`;
    } else if (img && img.src) {
      media = html`<img class="gallery__media" src="${img.src}" alt="${img.alt || ''}" loading="eager">`;
    } else {
      media = '<div class="hatch gallery__media gallery__media--hatch"></div>';
    }

    return html`<div class="gallery${hi ? ' is-highlighted' : ''} panel-fade" data-item="gallery" tabindex="${hi ? 0 : -1}" aria-label="Gallery, image ${idx + 1} of ${images.length || 1}">
      <div class="gallery__frame">
        ${raw(media)}
        ${raw(img && img.caption ? html`<span class="gallery__caption">${img.caption}</span>` : '')}
        ${raw(images.length > 1
          ? `<span class="gallery__dots" aria-hidden="true">${images.map((_, i) => `<span class="gallery__dot${i === idx ? ' is-active' : ''}"></span>`).join('')}</span>`
          : '')}
      </div>
    </div>`;
  },

  renderTouch(ctx) {
    const p = findProject(ctx);
    if (!p) return '';
    const tabs = visibleTabs(p);
    const active = activeTab(ctx, p);
    const cursor = ctx.cursor;

    const tabsHtml = tabs.length
      ? raw(`<div class="tabs" role="tablist">${tabs.map((t) => {
          const isActive = t.tab === active;
          const hi = t.id === cursor;
          return `<button type="button" role="tab" class="tab${isActive ? ' is-active' : ''}${hi ? ' is-highlighted' : ''}" aria-selected="${isActive}" data-item="${t.id}" tabindex="${hi ? 0 : -1}">${t.label}</button>`;
        }).join('')}</div>`)
      : '';

    let panel = '';
    if (active === 'overview') {
      panel = (p.overview && p.overview.problem ? html`<div class="t-body-bold">The problem</div><p class="t-body">${p.overview.problem}</p>` : '')
        + (p.overview && p.overview.built ? html`<div class="t-body-bold">What I built</div><p class="t-body">${p.overview.built}</p>` : '');
    } else if (active === 'role') {
      panel = (p.role && p.role.summary ? html`<p class="t-body">${p.role.summary}</p>` : '')
        + `<ul class="bullet-list">${((p.role && p.role.bullets) || []).map((b) => `<li>▸ ${esc(b)}</li>`).join('')}</ul>`;
    } else if (active === 'stack') {
      panel = `<div class="chip-row">${(p.stack || []).map((s) => chip(s)).join('')}</div>`;
    } else if (active === 'results') {
      panel = `<ul class="bullet-list">${(p.results || []).map((r) => `<li>▸ ${esc(r)}</li>`).join('')}</ul>`;
    }

    const actHi = (id) => id === cursor;
    return html`<div class="touch-pad project-touch">
      ${tabsHtml}
      <div class="tab-panel panel-fade" role="tabpanel">${raw(panel)}</div>
      <div class="actions-row">
        <button type="button" class="btn-ghost${actHi('act-back') ? ' is-highlighted' : ''}" data-item="act-back" tabindex="${actHi('act-back') ? 0 : -1}">◀ Back</button>
        ${raw(p.links && p.links.source ? html`<button type="button" class="btn-ghost${actHi('act-source') ? ' is-highlighted' : ''}" data-item="act-source" tabindex="${actHi('act-source') ? 0 : -1}">&lt;/&gt; Source</button>` : '')}
        ${raw(p.links && p.links.demo ? html`<button type="button" class="btn-ghost${actHi('act-demo') ? ' is-highlighted' : ''}" data-item="act-demo" tabindex="${actHi('act-demo') ? 0 : -1}">▶ Demo</button>` : '')}
        ${raw(p.links && p.links.live ? html`<button type="button" class="btn-primary${actHi('act-live') ? ' is-highlighted' : ''}" data-item="act-live" tabindex="${actHi('act-live') ? 0 : -1}">↗ Live</button>` : '')}
      </div>
    </div>`;
  },

  items(ctx) {
    const p = findProject(ctx);
    if (!p) return [];
    const tabs = visibleTabs(p);
    const list = [{ id: 'gallery', row: 0, col: 0, action: null }];
    tabs.forEach((t, i) => list.push({ id: t.id, row: 1, col: i, action: null }));
    let col = 0;
    list.push({ id: 'act-back', row: 2, col: col++, action: backToProjects });
    if (p.links && p.links.source) list.push({ id: 'act-source', row: 2, col: col++, action: () => window.open(p.links.source, '_blank', 'noopener,noreferrer') });
    if (p.links && p.links.demo) list.push({ id: 'act-demo', row: 2, col: col++, action: () => window.open(p.links.demo, '_blank', 'noopener,noreferrer') });
    if (p.links && p.links.live) list.push({ id: 'act-live', row: 2, col: col++, action: () => window.open(p.links.live, '_blank', 'noopener,noreferrer') });
    return list;
  },

  defaultCursor: () => 'tab-overview',

  onHighlight(ctx, itemId) {
    const p = findProject(ctx);
    if (!p) return;
    const tabs = visibleTabs(p);
    const match = tabs.find((t) => t.id === itemId);
    if (match) setActiveTab(p, match.tab);
  },

  onItemClick(ctx, itemId, event) {
    if (itemId !== 'gallery') return null;
    const p = findProject(ctx);
    if (!p || (p.images || []).length < 2) return { handled: true };
    const frame = event.currentTarget.querySelector('.gallery__frame') || event.currentTarget;
    const rect = frame.getBoundingClientRect();
    const isNext = event.clientX - rect.left > rect.width / 2;
    const idx = galleryIndex(ctx, p);
    setGalleryIndex(p, idx + (isNext ? 1 : -1));
    render();
    return { handled: true };
  },

  beforeMove(ctx, direction) {
    if (ctx.cursor !== 'gallery' || (direction !== 'left' && direction !== 'right')) return null;
    const p = findProject(ctx);
    if (!p || (p.images || []).length < 2) return { consumed: true };
    const idx = galleryIndex(ctx, p);
    setGalleryIndex(p, idx + (direction === 'right' ? 1 : -1));
    render();
    return { consumed: true };
  },

  y(ctx) {
    const p = findProject(ctx);
    if (!p || !p.links) return null;
    if (p.links.live) return { label: 'live site', run: () => window.open(p.links.live, '_blank', 'noopener,noreferrer') };
    if (p.links.demo) return { label: 'demo', run: () => window.open(p.links.demo, '_blank', 'noopener,noreferrer') };
    if (p.links.source) return { label: 'source', run: () => window.open(p.links.source, '_blank', 'noopener,noreferrer') };
    return null;
  },

  hint(ctx) {
    const p = findProject(ctx);
    if (!p) return '';
    const tabs = visibleTabs(p);
    const active = activeTab(ctx, p);
    const idx = tabs.findIndex((t) => t.tab === active);
    return tabs.length ? `tab ${idx + 1} / ${tabs.length}` : '';
  },
};
