// HTML helpers for shared components — SPEC §5
import { html, raw, esc } from './util.js';

const ICON_PATHS = {
  folder: '<path d="M3 8h9l3 3h12v15H3z"/>',
  document: '<path d="M8 3h10l5 5v19H8z"/><path d="M11 14h9M11 19h9"/>',
  gradcap: '<path d="M2 12l13-6 13 6-13 6z"/><path d="M8 15v6c4 3 10 3 14 0v-6"/>',
  mail: '<rect x="3" y="7" width="24" height="16" rx="2"/><path d="M3 8l12 9 12-9"/>',
  code: '<path d="M11 9l-6 6 6 6M19 9l6 6-6 6"/>',
  person: '<rect x="3" y="6" width="24" height="18" rx="3"/><circle cx="11" cy="14" r="3"/><path d="M17 12h6M17 17h6M7 21c1-3 7-3 8 0"/>',
  link: '<path d="M13 17l4-4M10 20l-2 2a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0M20 10l2-2a4 4 0 0 0-6-6l-4 4a4 4 0 0 0 0 6"/>',
};

export function icon(name, size = 28) {
  const path = ICON_PATHS[name] || ICON_PATHS.link;
  return raw(
    `<svg class="icon" viewBox="0 0 30 30" width="${size}" height="${size}" stroke-width="2" stroke="currentColor" fill="none" aria-hidden="true">${path}</svg>`
  );
}

// A generic focusable, data-item-tagged element (button or anchor).
function itemAttrs(id, highlighted, extra = '') {
  return `data-item="${esc(id)}" tabindex="${highlighted ? 0 : -1}"${extra}`;
}

export function tile({ id, iconName, label, sub, highlighted, href }) {
  const tag = href ? 'a' : 'button';
  const hrefAttr = href ? ` href="${esc(href)}" target="_blank" rel="noopener noreferrer"` : ' type="button"';
  return html`<${raw(tag)} class="tile${highlighted ? ' is-highlighted' : ''}" ${raw(itemAttrs(id, highlighted))}${raw(hrefAttr)}>
    ${icon(iconName)}
    <span class="tile__label">${label}</span>
    ${raw(sub ? html`<span class="tile__sub">${sub}</span>` : '')}
  </${raw(tag)}>`;
}

export function cart({ id, cover, title, highlighted }) {
  const coverInner = cover
    ? raw(html`<img class="cart__cover" src="${cover}" alt="" loading="lazy">`)
    : raw('<div class="cart__cover cart__cover--hatch"></div>');
  return html`<button type="button" class="cart${highlighted ? ' is-highlighted' : ''}" ${raw(itemAttrs(id, highlighted))}>
    ${coverInner}
    <span class="cart__title">${title}</span>
  </button>`;
}

export function row({ id, dateLabel, text, highlighted }) {
  return html`<button type="button" class="row${highlighted ? ' is-highlighted' : ''}" ${raw(itemAttrs(id, highlighted))}>
    <span class="row__date">${dateLabel}</span>
    <span class="row__dot" aria-hidden="true"></span>
    <span class="row__text">${text}</span>
  </button>`;
}

export function chip(text, { success = false } = {}) {
  return html`<span class="chip${success ? ' chip--success' : ''}">${text}</span>`;
}

export function chipItem({ id, text, highlighted }) {
  return html`<button type="button" class="chip chip--item${highlighted ? ' is-highlighted' : ''}" ${raw(itemAttrs(id, highlighted))}>${text}</button>`;
}

export function tabs(tabList, activeId, highlightedId) {
  const items = tabList
    .map((t) => {
      const active = t.id === activeId;
      const hi = t.id === highlightedId;
      return html`<button type="button" role="tab" class="tab${active ? ' is-active' : ''}${hi ? ' is-highlighted' : ''}" aria-selected="${active ? 'true' : 'false'}" ${raw(itemAttrs(t.id, hi))}>${t.label}</button>`;
    })
    .join('');
  return raw(`<div class="tabs" role="tablist">${items}</div>`);
}

export function btnPrimary({ id, label, highlighted, disabled }) {
  return html`<button type="button" class="btn-primary${highlighted ? ' is-highlighted' : ''}"${disabled ? ' disabled aria-disabled="true"' : ''} ${raw(itemAttrs(id, highlighted))}>${label}</button>`;
}

export function btnGhost({ id, label, highlighted }) {
  return html`<button type="button" class="btn-ghost${highlighted ? ' is-highlighted' : ''}" ${raw(itemAttrs(id, highlighted))}>${label}</button>`;
}

const STICKER_ROTATIONS = (id) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  const t = ((hash % 1000) + 1000) % 1000 / 1000; // 0..1
  return (t * 12 - 6).toFixed(1); // -6..6
};

export function sticker({ id, kind, label, highlighted }) {
  const rot = STICKER_ROTATIONS(id);
  return html`<button type="button" class="sticker sticker--${raw(esc(kind))}${highlighted ? ' is-highlighted' : ''}" style="--rot:${raw(rot)}deg" ${raw(itemAttrs(id, highlighted))}>${label}</button>`;
}

export function stamp({ portraitText, caption }) {
  return html`<div class="stamp" aria-hidden="true">
    <pre class="stamp__portrait">${portraitText || ''}</pre>
    <span class="stamp__caption">${caption}</span>
  </div>`;
}

export function hatch() {
  return raw('<div class="hatch"></div>');
}
