import { html, raw, esc } from '../util.js';
import { showToast } from '../render.js';
import { formatDateRange } from '../content.js';
import { chip } from '../components.js';

function findRole(ctx) {
  return ((ctx.content && ctx.content.experience) || []).find((r) => r.id === ctx.params.id);
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
  key: (params) => `role-detail:${params.id}`,
  title(ctx) { const r = findRole(ctx); return r ? r.role : 'Role'; },
  status: () => ({ left: 'Resume · role', right: '' }),

  renderTop(ctx) {
    const r = findRole(ctx);
    if (!r) return '';
    return html`<div class="card resume-role panel-fade">
      <div class="resume-role__head">
        <span class="t-title">${r.role}</span>
        <span class="t-small resume-role__dates">${formatDateRange(r.start, r.end)}</span>
      </div>
      <div class="t-subtitle">@ ${r.company}${r.location ? ` · ${r.location}` : ''}</div>
      ${raw(r.type ? html`<div class="chip-row">${raw(chip(r.type))}</div>` : '')}
    </div>`;
  },

  renderTouch(ctx) {
    const r = findRole(ctx);
    if (!r) return '';
    return html`<div class="touch-pad">
      <div class="card role-detail-card" id="scroll-region">
        <ul class="bullet-list">
          ${raw((r.bullets || []).map((b) => `<li>▸ ${esc(b)}</li>`).join(''))}
        </ul>
        ${raw((r.skills || []).length ? html`<div class="t-body-bold">Skills used</div><div class="chip-row">${raw((r.skills || []).map((s) => chip(s)).join(''))}</div>` : '')}
      </div>
    </div>`;
  },

  items: () => [],
  defaultCursor: () => null,

  y(ctx) {
    const url = ctx.content && ctx.content.profile && ctx.content.profile.resumePdf;
    if (!url) return null;
    return { label: 'resume.pdf', run: () => downloadPdf(ctx) };
  },

  hint: () => '▲▼ scroll',
};
