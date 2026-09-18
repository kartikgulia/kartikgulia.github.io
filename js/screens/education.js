import { html, raw, esc } from '../util.js';
import { chip } from '../components.js';
import { getState, setState } from '../state.js';
import { render } from '../render.js';

function schools(ctx) { return (ctx.content && ctx.content.education) || []; }

function findSchool(ctx, id) {
  return schools(ctx).find((s) => `school-${s.id}` === id);
}

function schoolLabel(school) {
  return `${school.degree || ''}${school.degree && school.major ? ' · ' : ''}${school.major || ''}`;
}

// The top screen shows whichever school was last clicked/selected, not
// whatever the cursor happens to be hovering — it stays put until another
// school is chosen. Reuses the existing per-screen `tab` state bucket.
function selectedSchoolId(ctx) {
  const list = schools(ctx);
  if (!list.length) return null;
  const stored = ctx.state.tab.education;
  if (stored && list.some((s) => `school-${s.id}` === stored)) return stored;
  return `school-${list[0].id}`;
}

function selectSchool(id) {
  const s = getState();
  if (s.tab.education === id) return;
  setState({ tab: { ...s.tab, education: id } });
  render();
}

export default {
  key: () => 'education',
  title: () => 'Education',

  status(ctx) {
    const school = findSchool(ctx, selectedSchoolId(ctx));
    if (!school) return { left: 'Education', right: '' };
    const start = school.start ? school.start.slice(0, 4) : '';
    const end = school.end ? school.end.slice(0, 4) : 'Present';
    return { left: 'Education', right: `${start} – ${end}` };
  },

  renderTop(ctx) {
    const school = findSchool(ctx, selectedSchoolId(ctx));
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
    const selected = selectedSchoolId(ctx);

    return html`<div class="touch-pad">
      <div class="library-header">
        <span class="t-small library-header__title">Schools</span>
        <span class="t-label">education</span>
      </div>
      <div class="school-list" id="school-list">
        ${raw(list.map((s) => {
          const id = `school-${s.id}`;
          const hi = id === cursor;
          const sel = id === selected;
          return `<button type="button" class="row${hi ? ' is-highlighted' : ''}${sel ? ' is-selected' : ''}" data-item="${id}" tabindex="${hi ? 0 : -1}">
            <span class="row__date">${esc(s.start ? s.start.slice(0, 4) : '')}</span>
            <span class="row__dot" aria-hidden="true"></span>
            <span class="row__text">${esc(schoolLabel(s))} @ ${esc(s.short || s.school)}</span>
          </button>`;
        }).join(''))}
      </div>
    </div>`;
  },

  items(ctx) {
    return schools(ctx).map((s, i) => ({ id: `school-${s.id}`, row: i, col: 0, action: () => selectSchool(`school-${s.id}`) }));
  },

  defaultCursor(ctx) {
    const list = schools(ctx);
    return list.length ? `school-${list[0].id}` : null;
  },

  y: () => null,

  hint: () => '▲▼ scroll · Ⓐ view',
};
