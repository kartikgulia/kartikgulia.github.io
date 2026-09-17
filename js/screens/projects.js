import { html, raw } from '../util.js';
import { navigate } from '../router.js';
import { setPendingTransition, requestFocusOnNextRender, showToast, render } from '../render.js';
import { getCursor, setState, getState } from '../state.js';
import { sortProjects, nextSortMode, sortModeLabel } from '../content.js';
import { cart, chip } from '../components.js';
import { pageCount } from '../nav.js';

const PER_PAGE = 6;

function cols(ctx) { return ctx.layout === 'mobile' ? 2 : 3; }
function sortedProjects(ctx) { return sortProjects((ctx.content && ctx.content.projects) || [], ctx.state.sort.projects); }
function pagesFor(ctx) { return pageCount(sortedProjects(ctx).length, PER_PAGE); }

function currentPage(ctx) {
  const sorted = sortedProjects(ctx);
  const cur = getCursor('projects');
  if (cur) {
    const idx = sorted.findIndex((p) => `p-${p.id}` === cur);
    if (idx >= 0) return Math.floor(idx / PER_PAGE);
  }
  const p = (ctx.state.page && ctx.state.page.projects) || 0;
  return Math.min(Math.max(0, p), Math.max(0, pagesFor(ctx) - 1));
}

function pageSlice(sorted, page) {
  return sorted.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
}

function openDetail(id) {
  return () => {
    setPendingTransition('forward');
    requestFocusOnNextRender();
    navigate(`#/projects/${encodeURIComponent(id)}`);
  };
}

export default {
  key: () => 'projects',
  title: () => 'Projects',

  status(ctx) {
    const sorted = sortedProjects(ctx);
    const idx = sorted.findIndex((p) => `p-${p.id}` === ctx.cursor);
    return { left: 'Projects', right: sorted.length ? `${Math.max(1, idx + 1)} / ${sorted.length}` : '0 / 0' };
  },

  renderTop(ctx) {
    const sorted = sortedProjects(ctx);
    if (!sorted.length) {
      return html`<div class="empty-card card">no projects yet: check back soon</div>`;
    }
    const project = sorted.find((p) => `p-${p.id}` === ctx.cursor) || sorted[0];
    const stack = project.stack || [];
    const shown = stack.slice(0, 4);
    const extra = stack.length - shown.length;

    return html`<div class="project-top panel-fade">
      <div class="project-top__cover">
        ${raw(project.cover
          ? html`<img src="${project.cover}" alt="" loading="lazy">`
          : '<div class="hatch project-top__cover-hatch"></div>')}
      </div>
      <div class="project-top__col">
        <div class="t-label">${project.year || ''}${project.year && project.type ? ' · ' : ''}${project.type || ''}</div>
        <div class="t-title">${project.title}</div>
        ${raw(project.summary ? html`<div class="t-body project-top__summary">${project.summary}</div>` : '')}
        <div class="chip-row">
          ${raw(shown.map((s) => chip(s)).join(''))}
          ${extra > 0 ? raw(chip(`+${extra}`)) : ''}
        </div>
        <div class="detail-actions">
          <button type="button" class="btn-primary" data-detail-action="open">Open</button>
          ${raw(project.links && project.links.source ? html`<button type="button" class="btn-ghost" data-detail-action="source" data-href="${project.links.source}">Source</button>` : '')}
        </div>
      </div>
    </div>`;
  },

  renderTouch(ctx) {
    const sorted = sortedProjects(ctx);
    const sortLabel = sortModeLabel(ctx.state.sort.projects);

    if (!sorted.length) {
      return html`<div class="touch-pad">
        <div class="library-header">
          <span class="t-small library-header__title">Library</span>
        </div>
        <div class="empty-card card">no projects yet: check back soon</div>
      </div>`;
    }

    const page = currentPage(ctx);
    const items = pageSlice(sorted, page);
    const c = cols(ctx);

    return html`<div class="touch-pad">
      <div class="library-header">
        <span class="t-small library-header__title">Library</span>
        <span class="t-label library-header__sort">sort: ${sortLabel} ▾</span>
      </div>
      <div class="cart-grid" style="--cols:${String(c)}">
        ${raw(items.map((p) => cart({ id: `p-${p.id}`, cover: p.cover, title: p.title, highlighted: `p-${p.id}` === ctx.cursor })).join(''))}
      </div>
    </div>`;
  },

  items(ctx) {
    const sorted = sortedProjects(ctx);
    if (!sorted.length) return [];
    const page = currentPage(ctx);
    const items = pageSlice(sorted, page);
    const c = cols(ctx);
    return items.map((p, i) => ({
      id: `p-${p.id}`,
      row: Math.floor(i / c),
      col: i % c,
      action: openDetail(p.id),
    }));
  },

  defaultCursor(ctx) {
    const sorted = sortedProjects(ctx);
    if (!sorted.length) return null;
    const page = currentPage(ctx);
    const first = pageSlice(sorted, page)[0];
    return first ? `p-${first.id}` : null;
  },

  onEdge(ctx, direction) {
    if (direction !== 'left' && direction !== 'right') return null;
    const sorted = sortedProjects(ctx);
    const c = cols(ctx);
    const page = currentPage(ctx);
    const items = pageSlice(sorted, page);
    const idx = items.findIndex((p) => `p-${p.id}` === ctx.cursor);
    if (idx < 0) return null;
    const col = idx % c;
    const row = Math.floor(idx / c);
    const pages = pagesFor(ctx);
    if (direction === 'right' && col === c - 1 && page + 1 < pages) {
      const nextItems = pageSlice(sorted, page + 1);
      const target = nextItems[row * c] || nextItems[0];
      return target ? `p-${target.id}` : null;
    }
    if (direction === 'left' && col === 0 && page > 0) {
      const prevItems = pageSlice(sorted, page - 1);
      const target = prevItems[row * c + (c - 1)] || prevItems[prevItems.length - 1];
      return target ? `p-${target.id}` : null;
    }
    return null;
  },

  y(ctx) {
    const sorted = sortedProjects(ctx);
    if (!sorted.length) return null;
    return {
      label: 'sort',
      run: () => {
        const s = getState();
        const next = nextSortMode(s.sort.projects);
        setState({ sort: { ...s.sort, projects: next } });
        showToast(`sorted: ${sortModeLabel(next)}`);
        render();
      },
    };
  },

  hint(ctx) {
    const sorted = sortedProjects(ctx);
    if (!sorted.length) return '';
    const page = currentPage(ctx);
    return `page ${page + 1} / ${pagesFor(ctx)} ▸`;
  },
};
