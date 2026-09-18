import { html, raw, esc } from '../util.js';
import { navigate } from '../router.js';
import { setPendingTransition, requestFocusOnNextRender, showToast, openOverlay } from '../render.js';
import { formatDateRange, yearOf, yearsBetween } from '../content.js';
import { chip } from '../components.js';

function sortedRoles(ctx) {
  return [...((ctx.content && ctx.content.experience) || [])].sort((a, b) => (b.start || '').localeCompare(a.start || ''));
}

function findRole(ctx, id) {
  return ((ctx.content && ctx.content.experience) || []).find((r) => r.id === id);
}

function openRole(id) {
  return () => {
    setPendingTransition('forward');
    requestFocusOnNextRender();
    navigate(`#/resume/${encodeURIComponent(id)}`);
  };
}

function downloadPdf(ctx) {
  const url = ctx.content && ctx.content.profile && ctx.content.profile.resumePdf;
  if (!url) return;
  showToast('downloading resume…');
  const a = document.createElement('a');
  a.href = url;
  a.download = '';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export default {
  key: () => 'resume',
  title: () => 'Resume',

  status(ctx) {
    const roles = sortedRoles(ctx);
    const idx = roles.findIndex((r) => `role-${r.id}` === ctx.cursor);
    const right = idx >= 0 ? `${idx + 1} / ${roles.length}` : `${roles.length} / ${roles.length}`;
    return { left: 'Resume · experience', right };
  },

  renderTop(ctx) {
    const roles = sortedRoles(ctx);
    if (ctx.cursor === 'btn-skills' || ctx.cursor === 'btn-pdf') {
      const years = roles.length ? Math.round(yearsBetween(roles[roles.length - 1].start, roles[0].end) * 10) / 10 : 0;
      const groups = ((ctx.content && ctx.content.skills) || []).slice(0, 3);
      return html`<div class="card resume-summary panel-fade">
        <div class="t-title">${roles.length} roles · ${years} yrs</div>
        ${raw(groups.map((g) => `<div class="skills-group"><div class="skills-group__label">${esc(g.group)}</div><div class="chip-row">${(g.items || []).map((i) => chip(i)).join('')}</div></div>`).join(''))}
      </div>`;
    }

    const role = findRole(ctx, (ctx.cursor || '').replace(/^role-/, '')) || roles[0];
    if (!role) return html`<div class="empty-card card">no experience yet</div>`;

    const bullets = role.bullets || [];
    const shown = bullets.slice(0, 3);
    const more = bullets.length - shown.length;
    const skills = (role.skills || []).slice(0, 4);

    return html`<div class="card resume-role panel-fade">
      <div class="resume-role__head">
        <span class="t-title">${role.role}</span>
        <span class="t-small resume-role__dates">${formatDateRange(role.start, role.end)}</span>
      </div>
      <div class="t-subtitle">@ ${role.company}${role.location ? ` · ${role.location}` : ''}</div>
      <ul class="bullet-list">
        ${raw(shown.map((b) => `<li>▸ ${esc(b)}</li>`).join(''))}
        ${raw(more > 0 ? html`<li class="bullet-list__more">+ ${more} more · ⓐ open</li>` : '')}
      </ul>
      ${raw(skills.length ? html`<div class="chip-row">${raw(skills.map((s) => chip(s)).join(''))}</div>` : '')}
    </div>`;
  },

  renderTouch(ctx) {
    const roles = sortedRoles(ctx);
    const cursor = ctx.cursor;
    return html`<div class="touch-pad">
      <div class="library-header">
        <span class="t-small library-header__title">Timeline</span>
        <span class="t-label">experience</span>
      </div>
      <div class="role-list" id="role-list">
        ${raw(roles.map((r) => {
          const id = `role-${r.id}`;
          const hi = id === cursor;
          return `<button type="button" class="row${hi ? ' is-highlighted' : ''}" data-item="${id}" tabindex="${hi ? 0 : -1}">
            <span class="row__date">${yearOf(r.start)}</span>
            <span class="row__dot" aria-hidden="true"></span>
            <span class="row__text">${esc(r.role)} @ ${esc(r.company)}</span>
          </button>`;
        }).join(''))}
      </div>
      <div class="footer-row">
        <button type="button" class="btn-ghost${cursor === 'btn-skills' ? ' is-highlighted' : ''}" data-item="btn-skills" tabindex="${cursor === 'btn-skills' ? 0 : -1}">Skills ▸</button>
        <button type="button" class="btn-primary${cursor === 'btn-pdf' ? ' is-highlighted' : ''}" data-item="btn-pdf" tabindex="${cursor === 'btn-pdf' ? 0 : -1}">↓ Save Kartik-Resume.pdf</button>
      </div>
    </div>`;
  },

  items(ctx) {
    const roles = sortedRoles(ctx);
    const list = roles.map((r, i) => ({ id: `role-${r.id}`, row: i, col: 0, action: openRole(r.id) }));
    const n = roles.length;
    list.push({ id: 'btn-skills', row: n, col: 0, action: () => openOverlay('skills') });
    list.push({ id: 'btn-pdf', row: n, col: 1, action: () => downloadPdf(ctx) });
    return list;
  },

  defaultCursor(ctx) {
    const roles = sortedRoles(ctx);
    return roles.length ? `role-${roles[0].id}` : 'btn-skills';
  },

  y(ctx) {
    const url = ctx.content && ctx.content.profile && ctx.content.profile.resumePdf;
    if (!url) return null;
    return { label: 'Kartik-Resume.pdf', run: () => downloadPdf(ctx) };
  },

  hint: () => '▲▼ scroll',
};
