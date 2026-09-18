import { html, raw, esc } from '../util.js';
import { chip } from '../components.js';

function schools(ctx) { return (ctx.content && ctx.content.education) || []; }

function findSchool(ctx, id) {
  return schools(ctx).find((s) => `school-${s.id}` === id);
}

function schoolLabel(school) {
  return `${school.degree || ''}${school.degree && school.major ? ' · ' : ''}${school.major || ''}`;
}

export default {
  key: () => 'education',
  title: () => 'Education',

  status(ctx) {
    const list = schools(ctx);
    const school = findSchool(ctx, ctx.cursor) || list[0];
    if (!school) return { left: 'Education', right: '' };
    const start = school.start ? school.start.slice(0, 4) : '';
    const end = school.end ? school.end.slice(0, 4) : 'Present';
    return { left: 'Education', right: `${start} – ${end}` };
  },

  renderTop(ctx) {
    const list = schools(ctx);
    const school = findSchool(ctx, ctx.cursor) || list[0];
    if (!school) return html`<div class="empty-card card">no education yet</div>`;

    const honors = school.honors || [];
    const coursework = school.coursework || [];

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
        ${raw(coursework.length ? html`<div class="t-label edu-coursework-label">coursework</div>
        <div class="chip-row">${raw(coursework.map((c) => chip(c.code ? `${c.code} ${c.name}` : c.name)).join(''))}</div>` : '')}
      </div>
    </div>`;
  },

  renderTouch(ctx) {
    const list = schools(ctx);
    if (!list.length) return html`<div class="empty-card card">no education yet</div>`;
    const cursor = ctx.cursor;

    return html`<div class="touch-pad">
      <div class="library-header">
        <span class="t-small library-header__title">Schools</span>
        <span class="t-label">education</span>
      </div>
      <div class="school-list" id="school-list">
        ${raw(list.map((s) => {
          const id = `school-${s.id}`;
          const hi = id === cursor;
          return `<button type="button" class="row${hi ? ' is-highlighted' : ''}" data-item="${id}" tabindex="${hi ? 0 : -1}">
            <span class="row__date">${esc(s.start ? s.start.slice(0, 4) : '')}</span>
            <span class="row__dot" aria-hidden="true"></span>
            <span class="row__text">${esc(schoolLabel(s))} @ ${esc(s.short || s.school)}</span>
          </button>`;
        }).join(''))}
      </div>
    </div>`;
  },

  items(ctx) {
    return schools(ctx).map((s, i) => ({ id: `school-${s.id}`, row: i, col: 0, action: null }));
  },

  defaultCursor(ctx) {
    const list = schools(ctx);
    return list.length ? `school-${list[0].id}` : null;
  },

  y: () => null,

  hint: () => '▲▼ scroll',
};
