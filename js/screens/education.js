import { html, raw, esc } from '../util.js';
import { getState, setState } from '../state.js';
import { render, showToast } from '../render.js';
import { formatMonthYear } from '../content.js';
import { chip, sticker } from '../components.js';

const TAB_DEFS = [
  { tab: 'coursework', id: 'tab-coursework', label: 'Coursework' },
  { tab: 'awards', id: 'tab-awards', label: 'Awards & certs' },
  { tab: 'clubs', id: 'tab-clubs', label: 'Clubs' },
];

function schools(ctx) { return (ctx.content && ctx.content.education) || []; }

function schoolIndex(ctx) {
  const s = getState();
  const idx = s.schoolIndex || 0;
  return Math.min(Math.max(0, idx), Math.max(0, schools(ctx).length - 1));
}

function currentSchool(ctx) {
  return schools(ctx)[schoolIndex(ctx)];
}

function visibleTabs(school) {
  if (!school) return [];
  return TAB_DEFS.filter((t) => (school[t.tab] || []).length > 0);
}

function resolveTab(ctx, school) {
  const tabs = visibleTabs(school);
  if (!tabs.length) return null;
  const fromRoute = ctx.route.name === 'education-tab' ? ctx.params.tab : null;
  const stored = ctx.state.tab.education;
  const want = fromRoute || stored;
  return tabs.find((t) => t.tab === want) ? want : tabs[0].tab;
}

function syncTab(tab) {
  const url = new URL(window.location.href);
  url.hash = `#/education/${tab}`;
  window.history.replaceState(null, '', url);
  const s = getState();
  setState({ tab: { ...s.tab, education: tab } });
}

function setSchool(idx) {
  setState({ schoolIndex: idx });
}

export default {
  key: () => 'education',
  title: () => 'Education',

  status(ctx) {
    const school = currentSchool(ctx);
    if (!school) return { left: 'Education', right: '' };
    return { left: 'Education', right: `${school.start ? school.start.slice(0, 4) : ''} – ${school.end ? school.end.slice(0, 4) : 'Present'}` };
  },

  renderTop(ctx) {
    const school = currentSchool(ctx);
    if (!school) return html`<div class="empty-card card">no education yet</div>`;

    const cursor = ctx.cursor || '';
    if (cursor.startsWith('course-')) {
      const i = Number(cursor.slice(7));
      const c = (school.coursework || [])[i];
      if (c) {
        return html`<div class="card edu-detail panel-fade">
          <div class="t-title">${c.code ? `${c.code} ` : ''}${c.name}</div>
          ${raw(c.term ? html`<div class="t-label">${c.term}</div>` : '')}
          ${raw(c.note ? html`<p class="t-body">${c.note}</p>` : '')}
        </div>`;
      }
    }
    if (cursor.startsWith('award-')) {
      const a = (school.awards || []).find((x) => `award-${x.id}` === cursor);
      if (a) {
        return html`<div class="card edu-detail panel-fade">
          <div class="t-label">${a.kind}</div>
          <div class="t-title">${a.title}</div>
          <div class="t-subtitle">${a.issuer || ''}${a.issuer && a.date ? ' · ' : ''}${a.date ? formatMonthYear(a.date) : ''}</div>
          ${raw(a.description ? html`<p class="t-body">${a.description}</p>` : '')}
          ${raw(a.href ? '<div class="t-label">↗ view</div>' : '')}
        </div>`;
      }
    }
    if (cursor.startsWith('club-')) {
      const i = Number(cursor.slice(5));
      const c = (school.clubs || [])[i];
      if (c) {
        return html`<div class="card edu-detail panel-fade">
          <div class="t-title">${c.name}</div>
          <div class="t-subtitle">${c.role || ''}</div>
          ${raw(c.years ? html`<div class="t-label">${c.years}</div>` : '')}
        </div>`;
      }
    }

    const honors = school.honors || [];
    return html`<div class="card edu-school panel-fade">
      <div class="edu-school__crest">
        ${raw(school.crest
          ? html`<img src="${school.crest}" alt="" width="96" height="96">`
          : `<div class="crest-fallback" aria-hidden="true">${esc((school.short || school.school || '?').slice(0, 2).toUpperCase())}</div>`)}
      </div>
      <div class="edu-school__col">
        <div class="t-label">degree</div>
        <div class="t-title">${school.degree}${school.major ? ` in ${school.major}` : ''}</div>
        <div class="t-subtitle">${school.school}${school.location ? ` · ${school.location}` : ''}</div>
        <div class="chip-row">
          ${raw(school.gpa ? chip(`GPA ${school.gpa}`) : '')}
          ${raw(school.minor ? chip(`minor: ${school.minor}`) : '')}
          ${raw(honors.map((h) => chip(h)).join(''))}
        </div>
      </div>
    </div>`;
  },

  renderTouch(ctx) {
    const school = currentSchool(ctx);
    if (!school) return html`<div class="empty-card card">no education yet</div>`;
    const cursor = ctx.cursor;
    const tabs = visibleTabs(school);
    const active = resolveTab(ctx, school);
    const multi = schools(ctx).length > 1;

    let panel = '';
    if (active === 'coursework') {
      panel = `<div class="chip-row chip-row--wrap">${(school.coursework || []).map((c, i) => {
        const id = `course-${i}`;
        const hi = id === cursor;
        return `<button type="button" class="chip chip--course chip--item${hi ? ' is-highlighted' : ''}" data-item="${id}" tabindex="${hi ? 0 : -1}">${esc(c.code ? `${c.code} ${c.name}` : c.name)}</button>`;
      }).join('')}</div>`;
    } else if (active === 'awards') {
      panel = `<div class="t-label edu-sticker-label">sticker book</div>
        <div class="sticker-grid">${(school.awards || []).map((a) => {
          const id = `award-${a.id}`;
          const hi = id === cursor;
          return sticker({ id, kind: a.kind, label: a.title, highlighted: hi });
        }).join('')}</div>`;
    } else if (active === 'clubs') {
      panel = `<div class="club-list">${(school.clubs || []).map((c, i) => {
        const id = `club-${i}`;
        const hi = id === cursor;
        return `<button type="button" class="row${hi ? ' is-highlighted' : ''}" data-item="${id}" tabindex="${hi ? 0 : -1}">
          <span class="row__date">${esc(c.years || '')}</span>
          <span class="row__dot" aria-hidden="true"></span>
          <span class="row__text">${esc(c.name)} · ${esc(c.role || '')}</span>
        </button>`;
      }).join('')}</div>`;
    }

    return html`<div class="touch-pad">
      ${raw(multi ? html`<div class="school-switch${cursor === 'school-switch' ? ' is-highlighted' : ''}" data-item="school-switch" tabindex="${cursor === 'school-switch' ? 0 : -1}">◀ ${school.short || school.school} ▶</div>` : '')}
      ${raw(tabs.length ? `<div class="tabs" role="tablist">${tabs.map((t) => {
        const isActive = t.tab === active;
        const hi = t.id === cursor;
        return `<button type="button" role="tab" class="tab${isActive ? ' is-active' : ''}${hi ? ' is-highlighted' : ''}" aria-selected="${isActive}" data-item="${t.id}" tabindex="${hi ? 0 : -1}">${t.label}</button>`;
      }).join('')}</div>` : '')}
      <div class="tab-panel panel-fade">${raw(panel)}</div>
    </div>`;
  },

  items(ctx) {
    const school = currentSchool(ctx);
    if (!school) return [];
    const tabs = visibleTabs(school);
    const active = resolveTab(ctx, school);
    const list = [];
    if (schools(ctx).length > 1) list.push({ id: 'school-switch', action: null });
    tabs.forEach((t) => list.push({ id: t.id, action: null }));
    if (active === 'coursework') {
      (school.coursework || []).forEach((_, i) => list.push({ id: `course-${i}`, action: null }));
    } else if (active === 'awards') {
      (school.awards || []).forEach((a) => list.push({ id: `award-${a.id}`, action: a.href ? () => window.open(a.href, '_blank', 'noopener,noreferrer') : null }));
    } else if (active === 'clubs') {
      (school.clubs || []).forEach((_, i) => list.push({ id: `club-${i}`, action: null }));
    }
    return list;
  },

  defaultCursor(ctx) {
    const school = currentSchool(ctx);
    if (!school) return null;
    const tabs = visibleTabs(school);
    return tabs.length ? tabs[0].id : null;
  },

  onHighlight(ctx, itemId) {
    const match = TAB_DEFS.find((t) => t.id === itemId);
    if (match) syncTab(match.tab);
  },

  beforeMove(ctx, direction) {
    if (ctx.cursor === 'school-switch' && (direction === 'left' || direction === 'right')) {
      const total = schools(ctx).length;
      if (total < 2) return { consumed: true };
      const idx = schoolIndex(ctx);
      const next = direction === 'right' ? (idx + 1) % total : (idx - 1 + total) % total;
      setSchool(next);
      render();
      return { consumed: true };
    }
    return null;
  },

  y(ctx) {
    const school = currentSchool(ctx);
    if (!school) return null;
    const tabs = visibleTabs(school);
    if (tabs.length < 2) return null;
    return {
      label: 'next tab',
      run: () => {
        const active = resolveTab(ctx, school);
        const idx = tabs.findIndex((t) => t.tab === active);
        const next = tabs[(idx + 1) % tabs.length];
        syncTab(next.tab);
        showToast(`tab: ${next.label.toLowerCase()}`);
        render();
      },
    };
  },

  hint(ctx) {
    const school = currentSchool(ctx);
    if (!school) return '';
    const tabs = visibleTabs(school);
    const active = resolveTab(ctx, school);
    const t = tabs.find((x) => x.tab === active);
    return t ? t.label : '';
  },
};
