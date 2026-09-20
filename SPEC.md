# Handheld Portfolio: Design & Build Specification

> **For Claude Code:** this file is the source of truth for building the site. Read it fully before writing code. Build in the milestone order in §15. When something here is ambiguous, pick the option that best matches the mockups, write down what you chose under **Decisions log** at the bottom of this file, and keep going. Do not add frameworks, build tools or dependencies beyond what §2 allows.

**Visual reference:** the "F3 · Section mockups" page on the *Portfolio Wireframes* design canvas: https://claude.ai/artifact/5DeHbCnd9PZvXTrTAKRWMo
The mockups show layout and style. Where the mockups and this spec disagree, **this spec wins**. Known differences are listed in §1.2.

---

## 0. Concept in one paragraph

The portfolio is an original, DSi-era-inspired **flip handheld console** drawn in HTML/CSS and centered in the browser. The **top screen** shows details and the visitor's ASCII portrait. The **bottom "touch" screen** is where options are highlighted and chosen. A **d-pad** (left) moves a highlight, and four **face buttons** in a diamond (right: **X** top, **Y** left, **A** right, **B** bottom) act on it. **A** opens, **B** goes back, **X** goes Home, and **Y** runs one shortcut specific to the current screen. Mouse hover, touch, keyboard and the on-device buttons all drive **one shared highlight**. The look is late-90s/Y2K handheld made clean and modern: rounded shapes, a light blue grid, a pixel font for system text, and a sky-blue shell. No Nintendo names, logos or exact hardware shapes may appear anywhere.

---

## 1. Locked decisions

### 1.1 Decision table

| Area | Decision |
|---|---|
| Stack | Plain HTML + CSS + vanilla JS (ES modules). No build step, no npm, no framework. |
| Hosting | GitHub Pages user site: repo `USERNAME.github.io`, served from `main` branch root. |
| Face buttons | Diamond layout: **X** top, **Y** left, **A** right, **B** bottom. |
| A | Select/open the highlighted item. |
| B | Go back to the parent screen. Closes the overlay if one is open. |
| X | Go to Home from anywhere. Dimmed and inert on Home. |
| Y | One contextual shortcut per screen (see §8). Dimmed when there is none. |
| D-pad | Moves the highlight between items on the current screen. |
| Hover | Hovering an item **moves the highlight to it**. The item gets the highlight ring, **A glows**, and a cursor sound plays (if sound is on). |
| Top screen on Home | Stays on the profile (portrait + hello). It does **not** preview the hovered tile. |
| Top screen inside sections | Shows details of the highlighted item (this is the core of the mockups). |
| Button glow | **A** pulses whenever an actionable item is highlighted. **B** is lit whenever a parent screen exists. |
| Keyboard | Arrow keys = d-pad. **X / Y / A / B** letter keys press those buttons. **Enter** = A. **Esc** and **Backspace** = B. No WASD. |
| Gamepad API | Not in scope. |
| Phones | Stacked screens inside a thin shell border, with compact d-pad + ABXY controls below. |
| URLs | Hash routes (`/#/projects/my-app`). |
| Content | Single `content/content.json`. |
| Contact | **Links only, no form.** |
| Project detail | Opens **inside the device** (not a separate page). |
| Motion | Boot-up intro, screen transitions, button press animation. |
| Sound | Synthesized effects for cursor, confirm, back and boot. **Muted by default.** |
| Visitor settings | **Dark screens** on/off and **Sound** on/off, both remembered. |
| Shell color | Fixed at Sky `#9fd3ea`. Visitors can't change it. |
| Content at build time | Placeholders. The owner fills `content.json` later. |

### 1.2 Differences from the F3 mockups (apply these)

1. The **P / R / E / C** buttons become **X / Y / A / B** with the meanings above.
2. ◀ ▶ on the d-pad **no longer switch sections**. The d-pad moves the highlight.
3. The **Contact** bottom screen has **no form**. It shows link tiles instead (§8.7).
4. The pills under the bottom screen are **⌂ HOME · ☾ THEME · ♪ SOUND**.
5. The "open to [roles]" chip on Home is driven by `content.json` and hidden when `profile.status.open` is `false`.
6. The shell-color setting on the canvas is **not** a visitor feature.
7. A small **hint line** at the bottom edge of the touch screen shows what **Y** does on the current screen (e.g. `Ⓨ resume.pdf`). It does not list A or B (A's glow covers that).

---

## 2. Tech constraints

- **Allowed:** HTML5, modern CSS (custom properties, grid, flex, `clamp()`, `:focus-visible`, `@media (prefers-reduced-motion)`), vanilla JS ES2020 modules, Web Audio API, Clipboard API, `localStorage` / `sessionStorage` (always wrapped in try/catch).
- **Fonts:** Google Fonts via `<link>` with `display=swap`: **M PLUS Rounded 1c** (400, 700), **DotGothic16** (400), **IBM Plex Mono** (400).
- **Not allowed:** npm packages, bundlers, TypeScript, CSS frameworks, icon fonts, jQuery, analytics, cookies, external JS CDNs.
- **Browsers:** latest two versions of Chrome, Edge, Firefox and Safari (macOS + iOS), plus Chrome on Android.
- **Local dev:** `python3 -m http.server 8080` from the repo root. ES modules and `fetch` need a server; `file://` won't work.
- **Security:** never inject `content.json` strings with `innerHTML` unescaped. Use the `html` tagged-template helper in `js/util.js`, which escapes every interpolated value (§14.3). External links use `rel="noopener noreferrer"`.

---

## 3. Design tokens

Define all tokens in `css/tokens.css` as CSS custom properties on `:root`. Dark screens are applied with `[data-screens="dark"]` on `<html>`. **Only the screens change in dark mode.** The shell, page background and physical buttons stay the same.

### 3.1 Color

| Token | Light screens | Dark screens | Use |
|---|---|---|---|
| `--page-bg` | `#eceef1` | `#eceef1` | Browser background behind the device |
| `--shell` | `#9fd3ea` | `#9fd3ea` | Device body |
| `--shell-edge` | `rgba(0,0,0,.18)` | same | Shell border |
| `--shell-shade` | `rgba(0,0,0,.12)` | same | Hinge, pill backgrounds |
| `--bezel` | `#20242a` | `#20242a` | 10px border around each screen |
| `--screen-bg` | `#f4f6f8` | `#151a21` | Screen base |
| `--screen-grid` | `#e1e6ea` | `#1f262f` | 16px grid lines on the screen |
| `--surface` | `#ffffff` | `#1c232c` | Cards, tiles, status bar |
| `--border` | `#cfd6dd` | `#2d3641` | Card/tile borders |
| `--divider` | `#dfe4e8` | `#26303a` | Hairlines, placeholder bars |
| `--text` | `#2b3138` | `#e8eef3` | Primary text |
| `--text-muted` | `#5d6670` | `#8d99a5` | Labels, meta |
| `--link` | `#0f6fa3` | `#6fd3ff` | Inline accent text |
| `--accent` | `#0f7dba` | `#6fd3ff` | Highlight ring, primary buttons, active states |
| `--accent-ink` | `#ffffff` | `#0e1116` | Text on `--accent` |
| `--accent-halo` | `#d4ecf8` | `rgba(111,211,255,.18)` | Outer glow ring around highlighted items |
| `--accent-tint` | `#e6f4fb` | `#17303d` | Selected list-row fill |
| `--success` | `#1d7a3e` | `#6fdc97` | "Open to roles" chip text |
| `--success-border` | `#9fd8b3` | `#2f5a40` | "Open to roles" chip border |
| `--btn-face` | `#f7f8fa` | same | Face button fill |
| `--btn-edge` | `rgba(0,0,0,.25)` | same | Face button border |
| `--btn-glow` | `#0f7dba` | same | A pulse / B lit color on the shell |
| `--dpad` | `#2b3138` | same | D-pad |
| `--toast-bg` | `#2b3138` | `#e8eef3` | Toast |
| `--toast-ink` | `#ffffff` | `#0e1116` | Toast text |
| Sticker palette | award `#fff4d6`/`#e0b84a` · cert `#e6f4fb`/`#0f7dba` · hackathon `#fde8ee`/`#d9728f` | award `#3a3220`/`#e0b84a` · cert `#17303d`/`#6fd3ff` · hackathon `#3a2029`/`#e58aa4` | fill / border |

All text/background pairs above meet WCAG AA (4.5:1 for body text). Check again if values change.

### 3.2 Typography

| Token | Family | Size / line-height | Weight | Use |
|---|---|---|---|---|
| `--font-body` | `'M PLUS Rounded 1c', system-ui, sans-serif` | n/a | n/a | Everything by default |
| `--font-system` | `'DotGothic16', ui-monospace, monospace` | n/a | n/a | Status bar, labels, hint line, toasts |
| `--font-ascii` | `'IBM Plex Mono', ui-monospace, monospace` | n/a | n/a | Portrait only |
| `--t-hero` | body | 26px / 1.1 | 700 | Home "hi! i'm NAME" |
| `--t-title` | body | 22px / 1.15 | 700 | Screen titles (project, role, degree) |
| `--t-subtitle` | body | 14px / 1.35 | 400 | Company, school, meta lines in `--link` |
| `--t-body` | body | 13px / 1.5 | 400 | Paragraphs, list rows |
| `--t-small` | body | 12px / 1.4 | 400 | Tabs, secondary buttons |
| `--t-chip` | body | 11px / 1.2 (12px on mobile) | 400 | Chips |
| `--t-status` | system | 13px / 26px | 400 | Status bar |
| `--t-label` | system | 12px / 1.3 | 400 | Labels, hint line |
| `--t-button` | body | 14px | 700 | Face-button letters |
| `--t-pill` | body | 11px, letter-spacing .5px | 700 | HOME/THEME/SOUND pills |

### 3.3 Spacing, radius, elevation

- **Spacing scale:** `--s-1: 4px`, `--s-2: 6px`, `--s-3: 8px`, `--s-4: 10px`, `--s-5: 12px`, `--s-6: 14px`, `--s-7: 16px`, `--s-8: 22px`.
- **Radii:** `--r-shell-outer: 34px`, `--r-shell-hinge: 12px`, `--r-screen: 10px`, `--r-card: 12px`, `--r-tile: 14px`, `--r-chip: 999px`, `--r-dpad: 6px`.
- **Highlight ring:** `border: 3px solid var(--accent); box-shadow: 0 0 0 4px var(--accent-halo);`
- **Screen bezel:** `border: 10px solid var(--bezel)`.
- **Grid background:** `background-image: linear-gradient(var(--screen-grid) 1px, transparent 1px), linear-gradient(90deg, var(--screen-grid) 1px, transparent 1px); background-size: 16px 16px;`
- **Placeholder hatch** (images not yet provided): `repeating-linear-gradient(45deg, var(--surface) 0 6px, var(--divider) 6px 7px)`.

### 3.4 Motion tokens

| Token | Value |
|---|---|
| `--ease-out` | `cubic-bezier(.2,.8,.2,1)` |
| `--ease-in-out` | `cubic-bezier(.45,0,.55,1)` |
| `--d-press` | `90ms` |
| `--d-cursor` | `120ms` |
| `--d-screen-out` | `120ms` |
| `--d-screen-in` | `160ms` |
| `--d-stagger` | `40ms` |
| `--d-toast` | `1800ms` visible |
| `--d-glow` | `1600ms` per pulse cycle |

---

## 4. Device geometry & layout

### 4.1 Desktop device (natural size 780 × 762 px)

```
┌──────────────────────── TOP HALF 780×360, radius 34 34 12 12 ────────────────────────┐
│  speaker(3×2 dots)   [ TOP SCREEN 520×300 incl. 10px bezel → 500×280 inner ]   speaker │
└──────────────────────────────────────────────────────────────────────────────────────┘
          └──────────── HINGE 700×22, --shell-shade, radius 0 0 8 8 ────────────┘
┌──────────────────────── BOTTOM HALF 780×380, radius 12 12 34 34 ─────────────────────┐
│ D-PAD 3×38px grid │ [ TOUCH SCREEN 420×300 → 400×280 inner ]  │  FACE BUTTONS 3×46px │
│                   │   pills: ⌂ HOME  ☾ THEME  ♪ SOUND        │        (X)           │
│                   │                                           │     (Y)   (A)        │
│                   │                                           │        (B)           │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

- Horizontal padding: top half 40px, bottom half 36px. Content is spaced out with `justify-content: space-between`.
- The pills row sits 10px below the touch screen, centered.
- **Face buttons:** 46px circles in a 3×3 grid of 46px cells. X is at (col 2, row 1), Y at (1, 2), A at (3, 2), B at (2, 3).
- **D-pad:** 38px cells in a 3×3 grid. The center cell is filled. Outer corners have `--r-dpad` radius.
- Speaker dots: 5px circles, 6px gap, `rgba(0,0,0,.3)`.

### 4.2 Scaling on desktop and tablet

- Wrap the device in `.device-stage`, which fills the viewport and centers the device.
- Compute `scale = min(1.25, (innerWidth − 48) / 780, (innerHeight − 48) / 762)`. Set it as `--device-scale` and apply `transform: scale(var(--device-scale))` to `.device`. Recompute on `resize` (rAF-throttled).
- **Switch to the mobile layout** (§4.3) when `innerWidth < 700` **or** `scale < 0.7`. Toggle it with `data-layout="mobile|device"` on `<html>`. Don't use CSS media queries alone for this, because the scale also depends on height.

### 4.3 Mobile layout (`data-layout="mobile"`)

```
┌ shell frame: 12px padding, radius 24, fills 100dvw × 100dvh, --shell ┐
│ ┌ TOP SCREEN  (width 100%, height clamp(200px, 32dvh, 280px)) ┐     │
│ └──────────────────────────────────────────────────────────────┘     │
│   hinge strip 8px                                                    │
│ ┌ TOUCH SCREEN (width 100%, flex: 1, min-height 300px) ┐             │
│ └──────────────────────────────────────────────────────┘             │
│  controls row (height 132px):                                        │
│   D-PAD (3×40px)     ⌂ ☾ ♪ pills (stacked 3, center)    ABXY (3×44px)│
└──────────────────────────────────────────────────────────────────────┘
```

- Bezels shrink to 6px. Screen inner content uses the same components and reflows (see "Mobile" in each screen spec).
- Face buttons are 44px (minimum touch target) and the d-pad cells are 40px.
- If `innerHeight < 640`, the page scrolls vertically and the controls row stays sticky at the bottom (`position: sticky; bottom: 0`).
- Portrait columns: 40 on mobile (vs 46 on desktop).
- Tapping items works exactly like click (§6.4).

---

## 5. Components

Each component is a CSS class plus (where needed) a render helper in `js/components.js` that returns an escaped HTML string.

| Component | Class | Anatomy & states |
|---|---|---|
| **Screen** | `.screen`, `.screen--top`, `.screen--touch` | Bezel, grid background, `overflow: hidden`, flex column. Contains `.status` (top only) and `.screen__body`. |
| **Status bar** | `.status` | 26px tall, `--surface` fill, bottom hairline. Left: screen label (e.g. `Projects`). Right: counter (`3 / 12`) or clock `HH:MM` (visitor's local time, updated every minute) + a battery glyph `▮▮▮`. |
| **Card** | `.card` | `--surface`, 2px `--border`, `--r-card`. |
| **Tile** | `.tile` | A `<button>` or `<a>` card with an icon (28–30px stroke SVG) above a label. States: default; **highlighted** (ring + label 700 + icon stroke `--accent` + `translateY(-1px)`); **pressed** (`translateY(1px)`, ring stays). |
| **Cartridge** | `.cart` | Project tile: cover image (or hatch) filling the tile, title below (11px). Same states as Tile. |
| **List row** | `.row` | Card row: date label (44px), status dot (8px), text. **Highlighted** = ring + `--accent-tint` fill + weight 700 + dot `--accent`. |
| **Chip** | `.chip` | Pill, 1px `--border`, `--t-chip`. The `.chip--success` variant is used for "open to roles". |
| **Tabs** | `.tabs`, `.tab` | Row of pill tabs. **Active** = `--accent` fill + `--accent-ink` text. **Highlighted** (cursor on the tab) = ring. Active and highlighted can combine. |
| **Primary / ghost button** | `.btn-primary`, `.btn-ghost` | Pills. Highlighted = ring. |
| **Sticker** | `.sticker` | 78px circle with a kind-colored fill and border, rotated −6°…+6° (deterministic from the id hash), label 10px/700, centered and max 2 lines. Highlighted = ring (rotation kept). |
| **Stamp** | `.stamp` | 72×86 dashed `--accent` border containing the portrait at 46 cols / 2.2px and a system-font caption. |
| **Hint line** | `.hint` | Last line of the touch screen, `--t-label`, `--text-muted`, 0 12px 8px padding. Left: context (e.g. `page 1 / 2`). Right: `Ⓨ <action>` or nothing. |
| **Toast** | `.toast` | Centered at the bottom of the touch screen, 12px above the hint. `--toast-bg`, system font 12px, radius 999, padding 6px 12px. Enters with a fade and 4px rise and stays for `--d-toast`. Announced via the live region. |
| **Overlay** | `.overlay` | Covers the touch screen only: `--surface` 96% opacity, card in the center. Used for Settings and Skills. |
| **Face button** | `.fbtn[data-btn="x|y|a|b"]` | 46px circle, `--btn-face`, 2px `--btn-edge`, letter 14px/700. States: **idle**; **dim** (`opacity: .45`, `aria-disabled="true"`) when the action is unavailable; **lit** (B: 2px `--btn-glow` border + letter `--btn-glow`); **pulse** (A: `box-shadow` animates `0 0 0 0 → 0 0 0 6px` in `--btn-glow` at 35% alpha, then back, over `--d-glow` infinitely); **pressed** (`translateY(2px)`, `box-shadow: inset 0 2px 0 rgba(0,0,0,.2)`, `--d-press`). |
| **D-pad** | `.dpad`, `.dpad__up/down/left/right` | `<button>`s with aria-labels ("Move up", …). Pressed = that arm darkens to `#1a1e23` and shifts 1px. Arrow glyph 13px white. |
| **Pill** | `.pill` | `--shell-shade` fill, `--t-pill`. `aria-pressed` for THEME and SOUND. Pressed state is the same as face buttons. Label shows state: `☾ THEME` / `☀ THEME`, `♪ SOUND` / `♪ MUTED`. |
| **Portrait** | `.portrait` (`<pre>`) | `--font-ascii`, `line-height: 1.2`, `white-space: pre`, `aria-hidden="true"`, and a visually hidden text sibling: "ASCII portrait of NAME". Text color `--text` (light) / `--accent` (dark). |

**Icons** (inline SVG, `viewBox="0 0 30 30"`, `stroke-width: 2`, `stroke: currentColor`, `fill: none`):
- folder: `M3 8h9l3 3h12v15H3z`
- document: `M8 3h10l5 5v19H8z` + `M11 14h9M11 19h9`
- grad cap: `M2 12l13-6 13 6-13 6z` + `M8 15v6c4 3 10 3 14 0v-6`
- mail: rect `3,7,24,16 rx2` + `M3 8l12 9 12-9`
- code (GitHub tile): `M11 9l-6 6 6 6M19 9l6 6-6 6`
- person-card (LinkedIn tile): rect `3,6,24,18 rx3` + circle `11,14,3` + `M17 12h6M17 17h6M7 21c1-3 7-3 8 0`
- link (other): `M13 17l4-4M10 20l-2 2a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0M20 10l2-2a4 4 0 0 0-6-6l-4 4a4 4 0 0 0 0 6`

Do **not** use third-party brand logos. Link tiles use these generic icons plus a text label.

---

## 6. Interaction model

### 6.1 Core idea: one highlight per screen

- Every screen exports an ordered list of **focusable items**, each with `{ id, row, col, action? }`.
- The app state holds `cursor[screenKey] = itemId`. Exactly one item is highlighted at a time on the touch screen (and in the few screens where the top screen has items, see Project detail).
- Every input method moves or uses this same highlight:

| Input | Effect |
|---|---|
| Mouse **pointermove** onto an item | Highlight moves to that item. |
| Mouse **click** / touch **tap** on an item | Highlight moves to it, then **A** runs. |
| **Keyboard arrows** / on-screen **d-pad** | Highlight moves in that direction (§6.2). |
| **Tab / Shift+Tab** focusing an item | Highlight moves to it (`focus` event). |
| **Enter** / **A** key / on-screen **A** | Runs the highlighted item's action. |
| **Esc** / **Backspace** / **B** key / on-screen **B** | Back (§6.3). |
| **X** key / on-screen **X** / ⌂ HOME pill | Go Home. |
| **Y** key / on-screen **Y** | The current screen's Y action. |

- **Hover rule (important):** only real `pointermove` events move the highlight. Ignore `pointerenter`/`mouseover` fired because content re-rendered or scrolled under a resting cursor. Otherwise keyboard navigation would jump back to wherever the mouse is parked. Track `lastPointer = {x,y}` and act only when the pointer really moved **and** the element under it is a different item.
- Moving the highlight to a **different** item plays the `cursor` sound. Re-hovering the same item does nothing.
- When the pointer leaves all items, **the highlight stays** where it was (like a real handheld).
- Highlight changes set real DOM focus only when the change came from the keyboard or d-pad (`preventScroll: true`). Hover never steals focus.

### 6.2 D-pad movement

- Items live on a logical grid (`row`, `col`). Moving in a direction picks the item in the nearest row/col in that direction. For irregular layouts (e.g. chips that wrap), use **spatial navigation**: among items whose center lies in the pressed direction (±60° cone), choose the one with the smallest `primaryDistance + 0.5 × perpendicularDistance`, measured with `getBoundingClientRect()` centers.
- **Edges don't wrap.** Pressing into an edge plays a 90ms "bump" (2px nudge of the highlighted item toward the pressed direction and back) and no sound.
- **Exception, paged grids** (Projects): pressing ▶ from the last column when a next page exists goes to the next page, same row, column 1. ◀ from column 1 goes to the previous page's last column.
- **Key repeat:** holding an arrow key repeats after 350ms, then every 110ms. Holding an on-screen d-pad arm does the same (pointerdown starts, pointerup/leave/cancel stops).

### 6.3 Back (B) rules

- If an **overlay** is open, close it.
- Otherwise navigate to the route's **parent** (table in §7), not `history.back()`. This keeps B predictable even on deep links.
- On return, restore the parent screen's remembered cursor (e.g. the project tile you came from).
- On Home with no overlay, B is **dim** and does nothing.
- The browser's own back button still works through the hash history.

### 6.4 Button glow & dim rules (computed after every state change)

| Button | Dim when | Lit/pulse when |
|---|---|---|
| **A** | Nothing highlighted, or the highlighted item has no action | **Pulse** while an actionable item is highlighted |
| **B** | On Home with no overlay | **Lit** (static) whenever a parent or overlay exists |
| **X** | On Home | Never glows |
| **Y** | Current screen has no Y action | Never glows (the hint line explains it) |

- Reduced motion: A's pulse becomes a static lit state, like B.
- A pressed-state animation plays whenever a button's action fires, whether from a click, key or tap. Dimmed buttons still show the press animation but play no action and no sound.

### 6.5 Pills

- **⌂ HOME** = same as X.
- **☾ THEME** toggles dark screens. **♪ SOUND** toggles sound, and when turning it on plays the `confirm` sound as audible feedback.
- Pills are not part of the d-pad grid. They are reachable by Tab and mouse only.

### 6.6 Keyboard summary

| Key | Action |
|---|---|
| ↑ ↓ ← → | D-pad |
| `a` / `A`, `Enter` | A |
| `b` / `B`, `Esc`, `Backspace` | B |
| `x` / `X` | X (Home) |
| `y` / `Y` | Y |
| `Tab` / `Shift+Tab` | Move DOM focus: touch-screen items → top-screen items → face buttons → d-pad → pills |
| `PageUp` / `PageDown` | Scroll the scrollable region of the current screen (§8) |

- Ignore key events that have `ctrlKey`, `metaKey` or `altKey`, so browser shortcuts keep working.
- Call `preventDefault()` on arrow keys, Space and Backspace only when the app handles them.

---

## 7. Routing & state

### 7.1 Routes

| Hash | Screen | Parent (B) | Status label |
|---|---|---|---|
| `#/` (or empty) | Home | none | `[MM/DD] [DAY]` |
| `#/projects` | Projects | `#/` | `Projects` · `n / total` |
| `#/projects/:id` | Project detail | `#/projects` | project title · `◉ i / images` |
| `#/resume` | Resume | `#/` | `Resume · experience` · `n / total` |
| `#/resume/:id` | Role detail | `#/resume` | `Resume · role` |
| `#/education` | Education (coursework tab) | `#/` | `Education` · `[start – end]` |
| `#/education/:tab` (`coursework` \| `awards` \| `clubs`) | Education with that tab | `#/` | same |
| `#/contact` | Contact | `#/` | `Contact · new letter` |
| anything else | Home + toast `page not found` | none | none |

- An unknown `:id` redirects to its list screen with the toast `couldn't find that one`.
- Set `document.title` per route: `NAME · Projects`, `NAME · PROJECT TITLE`, etc.

### 7.2 State shape (`js/state.js`)

```js
{
  route: { name: 'home', params: {} },
  cursor: { home: 'tile-projects', projects: 'p-slug', 'project:slug': 'tab-overview', ... },
  page: { projects: 0 },
  tab: { 'project:slug': 'overview', education: 'coursework' },
  galleryIndex: { 'project:slug': 0 },
  overlay: null,                    // 'settings' | 'skills' | null
  settings: { darkScreens: false, sound: false }, // persisted
  sort: { projects: 'newest' },     // persisted in sessionStorage
  booted: false                     // sessionStorage
}
```

- A tiny store: `getState()`, `setState(patch)`, `subscribe(fn)`. Rendering is **one function** that re-renders both screens from state and then updates button glow. Keep it simple and synchronous. The content is small.
- **Persistence keys:** `hp.settings` (localStorage), `hp.booted` and `hp.sort` (sessionStorage). Wrap every read and write in try/catch and fall back to defaults.
- Initial `darkScreens` defaults to `false` **even if** the OS is in dark mode (the shell is light by design). The THEME pill is the only switch.

---

## 8. Screens

Each screen module in `js/screens/` exports:

```js
export default {
  key: (params) => 'projects',                 // cursor-memory key
  title: (ctx) => 'Projects',
  status: (ctx) => ({ left: 'Projects', right: '3 / 12' }),
  renderTop: (ctx) => html`...`,
  renderTouch: (ctx) => html`...`,
  items: (ctx) => [{ id, row, col, action: () => {} }], // in reading order
  defaultCursor: (ctx) => 'first-item-id',
  y: (ctx) => ({ label: 'resume.pdf', run: () => {} }) | null,
  hint: (ctx) => 'page 1 / 2',                  // left side of the hint line
};
```

Mark every rendered item with `data-item="<id>"`. The shared input layer maps DOM ↔ items.

Sizes below are **desktop inner sizes** (top 500×254 below the status bar, touch 400×280).

### 8.1 Home `#/`

**Top screen**
- Status: left `MM/DD DAY` (visitor locale, e.g. `09/17 THU`), right clock + battery.
- Body (flex row, 22px gap, 12px/22px padding, vertically centered):
  - `.card` (8px padding) with the portrait: 46 cols, 6.3px font (40 cols on mobile).
  - Text column (10px gap): label `welcome back, visitor` (or `hello, new visitor` on a first visit this session) · hero `hi! i'm<br>{profile.name}` · tagline (13px, muted) · `.chip--success` `● {profile.status.label}` if `status.open`.
- **The top screen does not change on hover.**

**Touch screen**
- A 2×2 grid of **tiles** (10px gap, 12px padding): **Projects** (folder), **Resume** (document), **Education** (grad cap), **Contact** (mail).
- Items: `tile-projects (0,0)`, `tile-resume (0,1)`, `tile-education (1,0)`, `tile-contact (1,1)`. Default cursor: `tile-projects`.
- A → navigate to that section.
- Hint line: left `tap an app`, right `Ⓨ settings`.

**Buttons:** X dim · B dim · **Y = open Settings overlay**.

**Settings overlay** (`overlay: 'settings'`) on the touch screen:
- Card titled `Settings` with two rows, each a toggle button with `aria-pressed`: `Dark screens  [ON|OFF]` and `Sound  [ON|OFF]`. A footer label reads `Ⓑ close`.
- Items: `set-dark (0,0)`, `set-sound (1,0)`. A toggles. B / Esc / Y close it. Focus returns to `tile-projects` or wherever the cursor was.
- These are the same settings as the THEME/SOUND pills, kept in sync.

**Mobile:** top screen shows the portrait at 40 cols and the hero at 22px. Tiles stay 2×2.

### 8.2 Projects `#/projects`

**Top screen** (details of the highlighted project, updates **as the cursor moves**)
- Status: `Projects` · `{indexInSorted+1} / {total}`.
- Body (flex row, 16px gap, 14px/16px padding):
  - Cover image, 200px wide × full body height, `object-fit: cover`, radius 10, 2px border. Hatch placeholder if no `cover`.
  - Column (8px gap): label `{year} · {type}` · title (22px) · summary (13px muted, 2 lines max with ellipsis) · up to 4 stack chips (`+N` chip if more) · buttons row pushed to the bottom: `Open` (primary, visual only; it mirrors A) and `Source` (ghost, only if `links.source`).
- Top-screen buttons are **not d-pad items**. They are clickable and Tab-focusable. `Open` = A, `Source` opens the source URL.

**Touch screen**
- Header row: `Library` (14px/700) on the left, label `sort: {newest|featured|a–z} ▾` on the right.
- Grid of **cartridges**: 3 columns × 2 rows = 6 per page (mobile: 2 columns × 3 rows = 6 per page).
- Items: one per visible project `p-{id}` with `(row, col)`. Default cursor: the first project (or the remembered one).
- A → `#/projects/{id}`.
- Paging: see §6.2. The hint shows `page {n} / {pages} ▸` on the left.
- Right side of the hint: `Ⓨ sort`.

**Buttons:** X Home · B → Home · **Y = cycle sort** `newest → featured → a–z → newest`, with toast `sorted: featured`. Sorting keeps the same project highlighted and jumps to the page that holds it.

**Sort definitions:** `newest` = `year` desc, then `order` asc. `featured` = `featured: true` first, then newest. `a–z` = `title` locale-compare.

**Empty state:** if `projects` is empty, the touch screen shows a card reading `no projects yet: check back soon`, the top screen shows the portrait card, and A is dim.

### 8.3 Project detail `#/projects/:id`

**Top screen: gallery**
- Status: project title (ellipsized) · `◉ {i+1} / {images.length}`.
- Body: the image fills the body with 10px margin, radius 10, 2px border, `object-fit: contain` on `--surface`. Caption pill at bottom-left (`rgba(43,49,56,.8)`, white 11px). Dots at bottom-right (8px, active `--accent`).
- The gallery is an item: `gallery (0,0)` (see the touch-screen grid below). While it's highlighted, ◀ ▶ change the image (no bump at the ends; nothing happens). Clicking the left or right half of the image goes to the previous or next image. Swiping works on touch (threshold 40px).
- GIFs and `.webm`/`.mp4` are allowed. Videos are `muted playsinline loop autoplay` and paused when `prefers-reduced-motion`.

**Touch screen: write-up**
- Tabs row: `Overview · My role · Stack · Results` (hide tabs with no content).
- Tab panel card (scrollable, `overflow-y: auto`, `PageUp/PageDown` scroll it, and mouse wheel/touch scroll natively):
  - **Overview:** `The problem` (bold 13px) + paragraph, `What I built` + paragraph.
  - **My role:** paragraph + bullet list.
  - **Stack:** chips grouped by `stack` entries.
  - **Results:** bullet list (numbers encouraged).
- Actions row: `◀ Back` (ghost, same as B) on the left, then `</> Source` (ghost), `▶ Demo` (ghost) and `↗ Live` (primary) on the right, each only if the link exists.
- **Item grid** (rows):
  - row 0: `gallery` (it lives on the top screen, but moving ▲ from the tabs reaches it; the ring draws on the top-screen image frame)
  - row 1: `tab-overview`, `tab-role`, `tab-stack`, `tab-results`
  - row 2: `act-back`, `act-source`, `act-live`
- **Selection follows focus on tabs:** moving the highlight onto a tab activates it immediately (no A needed). A on a tab does nothing, so A is dim there.
- A on `act-*` runs that action. External links open in a new tab.
- Default cursor: `tab-overview`.
- Hint: left `tab {n} / {tabs}`, right `Ⓨ live demo` (or `Ⓨ source` if no live link, or nothing).

**Buttons:** X Home · B → Projects (cursor restored to this project) · **Y = open live link** (fallback: demo, then source).

### 8.4 Resume `#/resume`

**Top screen** (details of the highlighted role)
- Status: `Resume · experience` · `{n} / {total}`.
- `.card` (12px/14px margin, 14px/16px padding, 7px gap):
  - Row: title (22px) on the left, date range label on the right (`Jun 2024 – Present`).
  - Subtitle `@ {company} · {location}` in `--link`.
  - Up to 3 bullets, each `▸` in `--accent` plus 13px text, 2 lines max with ellipsis. If there are more, the last line reads `+ {n} more · Ⓐ open`.
  - Skills chips row at the bottom (max 4).
- When the cursor is on the `Skills` or `resume.pdf` buttons, the top screen shows a summary card instead: `{total roles} roles · {years} yrs` plus the top skill groups.

**Touch screen**
- Header: `Timeline` on the left, label `experience` on the right.
- Vertical list of **rows** (6px gap), newest first: `{startYear}` label · dot · `{role} @ {company}`. It scrolls if it overflows. Keep the highlighted row in view (`scrollIntoView({block:'nearest'})`).
- Footer row: `Skills ▸` (ghost) on the left, `↓ Save resume.pdf` (primary) on the right.
- Items: `role-{id}` rows (col 0), then `btn-skills (n,0)` and `btn-pdf (n,1)`.
- A on a role → `#/resume/{id}`. A on `btn-skills` → Skills overlay. A on `btn-pdf` → download `profile.resumePdf` (an `<a download>` click).
- Hint: left `▲▼ scroll`, right `Ⓨ resume.pdf`.

**Buttons:** X Home · B → Home · **Y = download resume PDF** + toast `downloading resume…`. If no PDF is configured, Y is dim.

**Skills overlay:** a card with skill groups (`group` label + chips). It scrolls. B closes it. It has no items, so A is dim.

### 8.5 Role detail `#/resume/:id`

- **Top:** status `Resume · role`. The card shows title, company, location, dates, and a `type` chip if present (e.g. `internship`).
- **Touch:** a scrollable card with **all** bullets, then `Skills used` chips. Items: none except the scroll region, so ▲▼ scroll by 40px and A is dim.
- Hint: left `▲▼ scroll`, right `Ⓨ resume.pdf`.
- **Buttons:** X Home · B → Resume (cursor restored) · Y = download PDF.

### 8.6 Education `#/education/:tab?`

**Top screen**
- Status: `Education` · `{start} – {end}` of the selected school.
- `.card` (12px/14px margin, 16px padding, row with 18px gap):
  - Crest image, 96px circle (a dashed placeholder circle with initials if none).
  - Column: label `degree` · title `{degree} in {major}` (21px) · subtitle `{school} · {location}` · chips row: `GPA {gpa}` (if present), `minor: {minor}` (if present), honors chips.
- **When a course, sticker or club is highlighted**, the card is replaced by a detail card for it:
  - Course: `{code} {name}` title, `{term}` label, optional one-line note.
  - Award/cert/hackathon: kind label, title, `{issuer} · {date}`, optional description, `↗ view` if `href`.
  - Club: name, role, years.
- The school card comes back when the cursor returns to the tabs.

**Touch screen**
- If `education.length > 1`: a school switcher row at the very top (`◀ {school short name} ▶`), item `school-switch`. ◀ ▶ switch schools while it's highlighted.
- Tabs: `Coursework · Awards & certs · Clubs` (hide empty tabs). Selection follows focus. The tab is reflected in the hash via `history.replaceState` (no new history entry).
- Panels:
  - **Coursework:** wrapping **chips** (12px text, 5px/10px padding, 6px gap). Items are spatially navigated.
  - **Awards & certs:** label `sticker book`, then a row/grid of **stickers** (4 per row on desktop, 3 on mobile). Kind colors come from the sticker palette.
  - **Clubs:** list rows `{name} · {role}`.
- Items: `school-switch?`, `tab-*`, then panel items `course-{i}` / `award-{id}` / `club-{i}`.
- A on an award with `href` opens it in a new tab. A on a course or club does nothing (the top screen already shows it), so A is dim.
- Hint: left `{tab name}`, right `Ⓨ next tab`.

**Buttons:** X Home · B → Home · **Y = next tab** (wraps around).

### 8.7 Contact `#/contact`

**Top screen: "letter"**
- Status: `Contact · new letter`.
- Card with ruled lines (26px line spacing), 12px/14px margin, 14px/18px padding:
  - `to: {profile.name}` · `from: you` (muted).
  - `say hi! ✎` (18px/700).
  - A line that **changes with the highlighted link**: e.g. `email · you@example.com`, `github · github.com/USERNAME`. If nothing is highlighted, show `{profile.replyNote}`.
  - **Stamp** in the top-right corner (§5) with caption `{profile.location} 00¢`.

**Touch screen: link tiles**
- A grid of **tiles** from `links[]` (2 columns; rows as needed; max 6), each with a generic icon (§5) and label. Below each label: the handle in 11px muted (e.g. `@USERNAME`).
- Items: `link-{id}` in grid order. Default cursor: the first link.
- A → open the link: `mailto:` in the same tab, everything else in a new tab.
- Hint: left `tap to open`, right `Ⓨ copy email` (only if a link has `copy: true`).

**Buttons:** X Home · B → Home · **Y = copy** the first `copy: true` link's `value` to the clipboard, with toast `email copied!`. If the Clipboard API fails, show toast `copy failed: {value}` so it can be copied by hand.

### 8.8 Boot sequence (first visit per session)

Shown only when `sessionStorage['hp.booted']` is not set **and** motion is allowed.

| Time | Top screen | Touch screen |
|---|---|---|
| 0–250ms | `--bezel` color (screen "off") | off |
| 250–450ms | Flicker: `--screen-bg` at opacity 0 → .6 → .2 → 1 (steps) | same, 60ms later |
| 450–1250ms | Portrait (46 cols) **draws row by row** from the top in `--text`; status bar shows `booting…` | Centered system-font text `[NAME]'s portfolio` fades in, then a 3-dot loader |
| 1250–1500ms | Status switches to the date/clock; hero text fades in | Tiles fade/scale in (0.96 → 1), staggered 40ms |
| 1500ms | Done: set `hp.booted`, enable input | |

- **Any input** (key, click, tap) skips straight to the end state.
- The boot sound plays only if sound is already enabled (it's off by default, so first visits are silent).
- A **deep link** (a hash other than `#/`) skips the boot entirely.
- Reduced motion: no boot, render the end state immediately.

---

## 9. Motion & sound

### 9.1 Transitions

- **Going deeper** (A, or any navigation to a child route): each screen's body runs out (`opacity 1→0`, `translateX 0→−16px`, `--d-screen-out`, `--ease-out`), content swaps, then runs in (`opacity 0→1`, `translateX 16px→0`, `--d-screen-in`). The touch screen starts `--d-stagger` after the top screen.
- **Going back** (B / parent): the same with the X direction reversed.
- **Home via X, or a sibling jump** (e.g. deep link change): cross-fade only (`--d-screen-out` + `--d-screen-in`).
- **Status bar** text swaps without animation.
- **Highlight move:** the ring appears on the new item with `transform: scale(.96) → 1` over `--d-cursor`. The old item drops its ring instantly.
- **Tab switch / gallery image change / top-screen detail swap on cursor move:** 100ms opacity cross-fade on the panel only.
- **Input during a transition:** queue at most **one** pending action and run it when the transition ends. Drop anything beyond that.
- **Reduced motion** (`prefers-reduced-motion: reduce`): no translate/scale. All screen changes are an 80ms opacity fade, the A pulse is static, there's no boot, and videos are paused.

### 9.2 Sound (`js/audio.js`)

- Web Audio only, synthesized. **No audio files.**
- **Muted by default.** Create the `AudioContext` lazily on the first user gesture after sound is enabled.
- Master gain `0.08`. Every sound runs through a short attack/decay envelope so there are no clicks.

| Name | Trigger | Recipe |
|---|---|---|
| `cursor` | Highlight moves to a different item | square 880Hz, 28ms, decay 25ms |
| `confirm` | A action fires (and sound toggled on) | square 660Hz 40ms → 990Hz 60ms |
| `back` | B action fires | square 660Hz 40ms → 440Hz 60ms |
| `bump` | (none; edges are silent) | n/a |
| `toggle` | THEME toggled | triangle 520Hz, 50ms |
| `boot` | End of boot (only if enabled) | triangle arpeggio 523 → 659 → 784 → 1047Hz, 70ms each |
| `error` | Unknown route toast | square 220Hz, 120ms |

- Throttle `cursor` to one play per 45ms (so key repeat doesn't stack).

---

## 10. Content model: `content/content.json`

All user-facing text comes from this file, except fixed UI labels (tab names, `Library`, `Timeline`, etc.). Dates use `"YYYY-MM"`, and `null` `end` means **Present**. The owner edits only this file (plus images and the PDF) to update the site.

```json
{
  "profile": {
    "name": "[YOUR NAME]",
    "tagline": "[one line: what you build]",
    "location": "[CITY]",
    "status": { "open": true, "label": "open to [roles / internships]" },
    "replyNote": "I usually reply within [N] days.",
    "portrait": "assets/ascii-portrait.txt",
    "resumePdf": "assets/resume.pdf",
    "siteUrl": "https://USERNAME.github.io/"
  },
  "links": [
    { "id": "email",    "label": "Email",    "handle": "you@example.com",       "href": "mailto:you@example.com",            "icon": "mail",   "copy": true, "value": "you@example.com" },
    { "id": "github",   "label": "GitHub",   "handle": "@USERNAME",             "href": "https://github.com/USERNAME",       "icon": "code" },
    { "id": "linkedin", "label": "LinkedIn", "handle": "in/USERNAME",           "href": "https://www.linkedin.com/in/USERNAME", "icon": "person" }
  ],
  "projects": [
    {
      "id": "project-one",
      "order": 1,
      "title": "[PROJECT ONE]",
      "year": 2026,
      "type": "web app",
      "featured": true,
      "summary": "[one sentence: what it does and who it's for]",
      "stack": ["[stack]", "[stack]", "[stack]"],
      "cover": "assets/img/projects/project-one/cover.png",
      "images": [
        { "src": "assets/img/projects/project-one/1.png", "alt": "[describe the screenshot]", "caption": "[caption]" }
      ],
      "overview": { "problem": "[the problem]", "built": "[what I built]" },
      "role": { "summary": "[my role]", "bullets": ["[bullet]"] },
      "results": ["[result with a number]"],
      "links": { "source": "https://github.com/USERNAME/project-one", "live": "https://example.com", "demo": "https://example.com/demo.mp4" }
    }
  ],
  "experience": [
    {
      "id": "role-one",
      "role": "[ROLE TITLE]",
      "company": "[COMPANY]",
      "location": "[CITY / Remote]",
      "type": "internship",
      "start": "2025-06",
      "end": null,
      "bullets": ["[impact bullet]", "[impact bullet]"],
      "skills": ["[skill]", "[skill]"]
    }
  ],
  "education": [
    {
      "id": "school-one",
      "school": "[SCHOOL NAME]",
      "short": "[SCHOOL]",
      "location": "[CITY]",
      "degree": "[DEGREE]",
      "major": "[MAJOR]",
      "minor": "[MINOR]",
      "gpa": "[X.XX]",
      "start": "2022-09",
      "end": "2026-05",
      "honors": ["[honor]"],
      "crest": "assets/img/crest.png",
      "coursework": [{ "code": "[CS 101]", "name": "[COURSE]", "term": "[Fall 2024]", "note": "" }],
      "awards": [{ "id": "award-one", "kind": "award", "title": "[AWARD]", "issuer": "[ISSUER]", "date": "2025-04", "description": "", "href": "" }],
      "clubs": [{ "name": "[CLUB]", "role": "[ROLE]", "years": "[2023–2025]" }]
    }
  ],
  "skills": [
    { "group": "Languages", "items": ["[skill]"] },
    { "group": "Tools", "items": ["[skill]"] }
  ]
}
```

**Rules**
- Every field except `id`, `title`/`role`/`school`, `name` and `label` is optional. The UI hides anything missing instead of showing empty placeholders.
- `awards[].kind` ∈ `award | cert | hackathon`, which picks the sticker color.
- Ship the repo with **clearly bracketed placeholder content** (like above): 7 projects (so paging shows), 3 roles, 1 school with 6 courses, 4 awards and 2 clubs, and 3 links. Placeholder images use the hatch fallback (no image files needed).
- On load, `js/content.js` runs a light validator. It logs `console.warn` for missing required fields and duplicate ids, and never throws. If `content.json` fails to load, the top screen shows `couldn't load content.json` and the touch screen shows a `retry` tile.

---

## 11. ASCII portrait

- `assets/ascii-portrait.txt` is already in the repo: a 400 × 237 character ASCII image using the density ramp `" .:-=+*#%@"` (light → dark). Don't edit or reformat it.
- `js/ascii.js` downsamples it at runtime and caches by `(cols, invert)`:
  1. Split into lines and pad to the max width. Convert each char to a density `d = rampIndex / 9` (unknown chars = 0).
  2. `block = srcCols / cols`. Output rows = `floor(srcRows / block)` (source and output cells have the same aspect ratio).
  3. For each output cell, average `d` over its block.
  4. Normalize with the 2nd and 99.5th percentiles, then clamp to 0..1.
  5. **Light screens:** char = `ramp[round(d × 9)]`. **Dark screens (`invert`):** `v = 0.1 + 0.85 × (1 − d)`, except where the raw average `< 0.06` (background), which becomes a space. Char = `ramp[round(v × 9)]`.
  6. Trim trailing spaces on each line.
- Sizes used: Home 46 cols @ 6.3px (mobile 40 @ 6px) · Boot 46 cols @ 6.3px · Stamp 46 cols @ 2.2px.
- The portrait `<pre>` is `aria-hidden`, with a visually hidden label `ASCII portrait of {name}`.
- **Fallback:** if the file fails to load, show a 96px circle with initials.

---

## 12. Accessibility

- **Semantics:** the device is a `<main>` with two `<section>`s labelled `Top screen` / `Touch screen`. Face buttons, d-pad arms and pills are real `<button>`s with `aria-label`s (`A: open`, `B: back`, `X: home`, `Y: {action or "no action"}`). Update the Y label per screen. Items are `<button>` or `<a href>`.
- **Focus:** a visible `:focus-visible` outline (`2px solid var(--accent)`, `outline-offset: 2px`) in addition to the highlight ring. Use a roving `tabindex` inside the touch screen: only the highlighted item has `tabindex="0"`, the others `-1`. Tab goes screen → device controls → pills.
- **Live region:** a single visually hidden `aria-live="polite"` element announces the route title on navigation (e.g. "Projects, 12 items"), toast text, and setting changes. **Don't** announce every cursor move; the focused element's own name covers that.
- **Tabs:** `role="tablist"` / `role="tab"` / `aria-selected`, with the panel as `role="tabpanel"`.
- **Contrast:** AA for all text (§3.1). Never show state with color alone. The highlight also uses a ring and bold text.
- **Motion:** respect `prefers-reduced-motion` (§9.1).
- **Targets:** ≥ 44×44px on mobile for every control.
- **Images:** all project images need `alt` from content. Decorative icons are `aria-hidden`.
- **Language:** `<html lang="en">`.
- **No-JS:** a `<noscript>` block with the owner's name, tagline, contact links and a resume PDF link, styled simply.

---

## 13. SEO, meta, performance

- `<title>{name} · portfolio</title>`, meta description = `tagline`. Open Graph and Twitter tags use `assets/og.png` (1200×630). Build a placeholder OG image as a static PNG in the repo, e.g. the device on the page background with a text label. Use a generic handheld emoji-free favicon: a 32px SVG of a rounded two-screen device in `#9fd3ea` + `#20242a`.
- Since content is JSON-rendered, also inline a **hidden-from-view but crawlable** summary in `index.html` (`<div class="sr-only" id="crawl-summary">`) that `main.js` fills from `content.json` on load, *and* keep the `<noscript>` fallback. (Static crawlers only see the `<noscript>` block, which is acceptable for this site.)
- **Performance budget:** total JS < 60KB unminified, CSS < 40KB, no layout shift after fonts load (`size-adjust` not required; just reserve fixed screen sizes). First render of the device shell must not wait on `content.json` (the shell is static HTML).
- Preconnect to `fonts.googleapis.com` and `fonts.gstatic.com`.
- Images: recommend ≤ 1000px wide WebP/PNG, with `loading="lazy"` except the current gallery image.

---

## 14. Repository structure & code conventions

### 14.1 Files

```
/
├── index.html              # static device markup, screen containers, noscript, meta
├── favicon.svg
├── .nojekyll               # so GitHub Pages serves files as-is
├── README.md               # how to run locally, edit content, deploy
├── SPEC.md                 # this file
├── css/
│   ├── tokens.css          # §3
│   ├── base.css            # reset, fonts, sr-only, focus
│   ├── device.css          # shell, screens, buttons, d-pad, pills, scaling, mobile layout
│   ├── components.css      # cards, tiles, carts, rows, chips, tabs, stickers, stamp, toast, overlay
│   └── motion.css          # transitions, pulse, press, boot, reduced-motion overrides
├── js/
│   ├── main.js             # bootstrap: load content, init store, router, input, render loop
│   ├── state.js            # store (§7.2) + persistence
│   ├── router.js           # hash parsing, parent map, navigate(), title
│   ├── input.js            # keyboard, pointer, touch, d-pad repeat, button dispatch, hover rule
│   ├── nav.js              # grid + spatial navigation, paging, bump
│   ├── render.js           # renders both screens, applies transitions, updates glow/dim/aria
│   ├── components.js       # html helpers for cards, tiles, chips, etc.
│   ├── content.js          # fetch + validate content.json, date formatting, sorting
│   ├── ascii.js            # §11
│   ├── audio.js            # §9.2
│   ├── boot.js             # §8.8
│   ├── util.js             # html`` escaper, clamp, throttle, storage wrappers, clipboard
│   └── screens/
│       ├── home.js
│       ├── projects.js
│       ├── project-detail.js
│       ├── resume.js
│       ├── role-detail.js
│       ├── education.js
│       └── contact.js
├── content/
│   └── content.json
└── assets/
    ├── ascii-portrait.txt
    ├── resume.pdf          # placeholder 1-page PDF until the owner adds theirs
    ├── og.png
    └── img/
        └── projects/…
```

### 14.2 Conventions

- ES modules with `type="module"`. Two-space indent. Single quotes. No semicolon debates: use semicolons.
- **No global mutable state** outside `state.js`.
- CSS: BEM-ish class names from §5. Use tokens only (no raw hex outside `tokens.css`). Base styles are desktop-first; mobile overrides go under `[data-layout="mobile"]`.
- Every screen module is pure: its render functions only read `ctx` (state + content) and return strings. Side effects happen in `actions` / `y().run`.
- Event handling: one delegated listener per screen container (`[data-item]`) plus one global `keydown`.

### 14.3 Escaping helper (required)

```js
// util.js
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
export const raw = (s) => ({ __raw: s });
export function html(strings, ...vals) {
  return strings.reduce((out, s, i) => {
    const v = vals[i - 1];
    const str = Array.isArray(v) ? v.map((x) => (x && x.__raw !== undefined ? x.__raw : esc(x))).join('')
      : v && v.__raw !== undefined ? v.__raw : esc(v);
    return out + str + s;
  });
}
```

Nested helper output must be wrapped in `raw()` (components return `raw(...)`).

---

## 15. Milestones & acceptance criteria

Build and verify each milestone before starting the next. Commit at the end of each one.

**M1 · Static device & tokens**
- `index.html` renders the device shell at 780×762 natural size, scaled per §4.2, with both screens, d-pad, ABXY diamond (X top, Y left, A right, B bottom) and the three pills.
- The mobile layout switches at the §4.2 thresholds (check at 390×844, 768×1024, 1280×800 and 1920×1080).
- ✅ The screens show the grid background. Nothing overflows at any tested size, and there's no horizontal page scroll.

**M2 · State, routing, input, glow**
- Store, hash router with parent map, input layer (keyboard, pointer with the hover rule, touch, d-pad repeat), press animations, glow/dim rules, toast, live region.
- A stub screen for every route renders the route name plus a few fake items to test navigation.
- ✅ Arrow keys, on-screen d-pad and hover all move the **same** highlight. A pulses when an item is highlighted, and B is lit off Home. X/Y/A/B letter keys press the matching on-screen button (visible press). Esc/Backspace = B. Browser back works. A resting mouse doesn't steal the highlight during keyboard use.

**M3 · Content, ASCII, Home, Projects, Project detail**
- `content.json` with placeholder data as specified in §10, the validator, the ASCII downsampler, and the Home, Settings overlay, Projects (sorting, paging) and Project detail (gallery, tabs, actions) screens.
- ✅ Everything in §8.1–8.3 works by mouse, keyboard and touch. The cursor is restored when returning with B. Y actions work, with correct hint text and dimming. Deep link `#/projects/project-one` opens directly.

**M4 · Resume, Role detail, Education, Contact**
- ✅ §8.4–8.7 fully work: PDF download, Skills overlay, education tabs synced with the hash, stickers, top-screen detail swaps, contact link tiles, and copy email with toast (including the failure path).

**M5 · Motion & sound**
- Boot sequence, screen transitions, cursor ring animation, input queueing during transitions, reduced-motion variants, synthesized sounds, SOUND/THEME pills and settings persistence.
- ✅ With reduced motion emulated there's no boot and only fades. Sound is off on first visit, and turning it on persists across reloads. Dark screens persist and only screens change color.

**M6 · Polish, a11y, deploy**
- Accessibility pass (§12), `<noscript>`, meta/OG/favicon, `README.md`, `.nojekyll`, performance budget check.
- ✅ Keyboard-only walkthrough of every screen passes. The Lighthouse (mobile) accessibility score is ≥ 95. No console errors. Placeholder content is clearly bracketed. The deploy steps in the README work: push to `USERNAME.github.io` → Settings → Pages → Deploy from branch `main` / root.

---

## 16. Test checklist (manual, run at the end of each relevant milestone)

- [ ] Hover each Home tile: the ring moves, A pulses, a cursor blip plays when sound is on, and **the top screen stays on the profile**.
- [ ] Click each Home tile and confirm it opens the right section with a slide transition.
- [ ] Arrow keys on Home: 2×2 movement and edge bump, with no wrap.
- [ ] Projects: navigate past column 3 to page 2 and back; Y cycles sort and keeps the highlighted project; A opens detail; B returns with the cursor on the same project.
- [ ] Project detail: ▲ from the tabs reaches the gallery, ◀▶ change images, tabs activate on highlight, and Source/Live open new tabs.
- [ ] Resume: the list scrolls to keep the highlighted row visible; Y downloads the PDF; the Skills overlay closes with B.
- [ ] Education: Y cycles tabs, the hash updates without adding history entries, and highlighting a sticker swaps the top card.
- [ ] Contact: the highlighted tile's handle appears on the letter; A opens `mailto:`/new tab; Y copies email and shows the toast.
- [ ] X from any screen goes Home. X is dim on Home. B is dim on Home.
- [ ] THEME and SOUND pills toggle and persist across reloads.
- [ ] Deep links to every route work on a fresh load, and there's no boot on deep links.
- [ ] Boot runs once per session, is skippable with any input, and doesn't run with reduced motion.
- [ ] Mobile (390×844): all controls ≥ 44px, tapping items works, the controls row is reachable, and there's no horizontal scroll.
- [ ] Tab-only navigation reaches everything, with a visible focus ring.
- [ ] Missing optional fields (remove `links.live`, `gpa`, `crest`, all `clubs`) hide cleanly.
- [ ] Broken `content.json` shows the error state and retry.

---

## 17. Out of scope (don't build)

Contact form or any backend · Gamepad API · visitor shell-color picker · ASCII "lens" filters · blog/"now" page · analytics · cookies · i18n · CMS · automated test framework (optional later) · custom domain (CNAME) · service worker/offline.

---

## 18. Owner to-do (not for Claude Code)

- Replace every `[BRACKETED]` value in `content/content.json`.
- Add `assets/resume.pdf`, project images, and an optional crest. (`assets/ascii-portrait.txt` is already in place.)
- Replace `USERNAME` in links, `siteUrl`, and the README.

---

## Decisions log

*Claude Code: write down any choice you made that this spec didn't cover, with a one-line reason.*

- Built all six milestones in one pass rather than stopping between them, since the whole site is one coherent interaction system (shared store/router/input layer) that's hard to test in true isolation; verified against §15/§16 at the end instead.
- Screen modules get two extra optional hooks beyond the §8 contract — `beforeMove(ctx, direction)` (intercept a d-pad direction, e.g. gallery ◀▶ or school-switch ◀▶) and `onEdge(ctx, direction)` (Projects' page-wrap exception) and `onHighlight(ctx, id)` (tabs that activate on highlight) and `onItemClick(ctx, id, event)` (gallery tap-half-to-navigate). Needed because §6.2/§8.3/§8.6 describe per-screen input behavior the generic `items()` contract can't express.
- `state.schoolIndex` (current school index for the multi-school switcher) and `state.firstVisitThisSession` (drives Home's greeting line) were added to the §7.2 state shape since the spec's example object doesn't list them but §8.1 and §8.6 require the underlying behavior.
- Education's cursor/nav uses pure spatial (DOM-rect) navigation for its whole item list (no row/col assigned), rather than mixing grid-based and spatial nav on one screen — simpler than branching, and correct per §6.2's spatial-nav requirement for wrapping chips/stickers.
- The `<noscript>` fallback (§12) is static placeholder markup written once at build time (same bracketed values as `content.json`), not filled by JS — `<noscript>` content is never part of the live DOM when scripting is enabled, so it can't be populated from `content.json` at runtime.
- `assets/og.png` and `assets/resume.pdf` placeholders were generated with small one-off Node scripts (deleted after use, not part of the shipped repo) since no image/PDF tooling was otherwise available.
- Project `links` gained an optional `demo` key (e.g. a demo video) alongside `source` and `live`, since some projects have one but not the other; Y prefers live, then demo, then source.
- Total unminified JS is ~90KB against the §13 budget of 60KB. The feature set (routing, spatial nav, ASCII downsampler, synthesized audio, boot sequence, 7 screens) didn't compress under budget without cutting functionality or readability; flagging this as a known deviation rather than a silent miss.
- `computeScale()` skips updating `data-layout`/`--device-scale` when the stage reports 0×0 (can happen transiently before first layout) instead of forcing mobile mode on bogus dimensions.
- Tab order does not exactly follow §12's "touch-screen items → top-screen items → face buttons → d-pad → pills" sequence; it follows DOM order (top screen → d-pad → touch screen → pills → face buttons) instead. Getting the exact prescribed cross-region order would need positive `tabindex` values, which are more fragile than the roving `tabindex="-1"/"0"` pattern used within each region. Everything remains keyboard-reachable with a visible focus ring, just not in that exact order.
