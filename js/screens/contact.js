import { html, raw, copyToClipboard } from '../util.js';
import { showToast } from '../render.js';
import { renderPortrait } from '../ascii.js';
import { tile, stamp } from '../components.js';

function links(ctx) { return (ctx.content && ctx.content.links) || []; }

function openLink(link) {
  return () => {
    if (link.href && link.href.startsWith('mailto:')) {
      window.location.href = link.href;
    } else if (link.href) {
      window.open(link.href, '_blank', 'noopener,noreferrer');
    }
  };
}

export default {
  key: () => 'contact',
  title: () => 'Contact',
  status: () => ({ left: 'Contact · new letter', right: '' }),

  renderTop(ctx) {
    const profile = (ctx.content && ctx.content.profile) || {};
    const all = links(ctx);
    const hi = all.find((l) => `link-${l.id}` === ctx.cursor);
    const line = hi ? `${(hi.label || '').toLowerCase()} · ${hi.handle || ''}` : (profile.replyNote || '');
    const portraitText = renderPortrait(46, ctx.state.settings.darkScreens);

    return html`<div class="card letter panel-fade">
      <div class="letter__stamp">${raw(stamp({ portraitText, caption: `${profile.location || ''} 00¢` }))}</div>
      <div class="letter__to">to: ${profile.name || ''}</div>
      <div class="letter__from">from: you</div>
      <div class="letter__say">say hi! ✎</div>
      <div class="letter__line">${line}</div>
    </div>`;
  },

  renderTouch(ctx) {
    const all = links(ctx).slice(0, 6);
    const cursor = ctx.cursor;
    return html`<div class="touch-pad">
      <div class="tile-grid tile-grid--links">
        ${raw(all.map((l) => tile({
          id: `link-${l.id}`,
          iconName: l.icon,
          label: l.label,
          sub: l.handle,
          highlighted: `link-${l.id}` === cursor,
        })).join(''))}
      </div>
    </div>`;
  },

  items(ctx) {
    const all = links(ctx).slice(0, 6);
    return all.map((l, i) => ({ id: `link-${l.id}`, row: Math.floor(i / 2), col: i % 2, action: openLink(l) }));
  },

  defaultCursor(ctx) {
    const all = links(ctx);
    return all.length ? `link-${all[0].id}` : null;
  },

  y(ctx) {
    const all = links(ctx);
    const target = all.find((l) => l.copy);
    if (!target) return null;
    return {
      label: 'copy email',
      run: async () => {
        const ok = await copyToClipboard(target.value || target.handle || '');
        if (ok) showToast('email copied!');
        else showToast(`copy failed: ${target.value || target.handle || ''}`);
      },
    };
  },

  hint: () => 'tap to open',
};
