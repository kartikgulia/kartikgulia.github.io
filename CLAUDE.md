# CLAUDE.md

This repo is a personal portfolio site built as an original handheld-console UI and hosted on GitHub Pages.

## Read first
- **`SPEC.md` is the source of truth.** Read it fully before writing any code. When it's unclear, choose the option closest to the spec's intent and record the choice in the **Decisions log** at the bottom of `SPEC.md`.
- Build in the milestone order from SPEC §15 (M1 → M6). Finish and check each milestone's acceptance criteria before starting the next, then commit.

## Hard rules
- Plain HTML, CSS and vanilla JS (ES modules) only. **Do not add** npm, package.json, bundlers, TypeScript, frameworks, CSS libraries, or external JS from a CDN. Google Fonts `<link>` is the only external resource.
- All user-facing content goes in `content/content.json`. Don't hardcode names, projects or links in HTML/JS.
- Run every string from content through the `html` escaping helper (SPEC §14.3). Don't set raw `innerHTML` with content values.
- Define colors, sizes and timings as CSS custom properties in `css/tokens.css`. Don't put raw hex values anywhere else.
- Face buttons form a diamond: **X top, Y left, A right, B bottom**. A = select, B = back, X = home, Y = contextual (SPEC §1, §8).
- Hover, d-pad, arrow keys and Tab all drive one shared highlight (SPEC §6).
- Don't use Nintendo, Xbox or any third-party brand names, logos or icons.
- Don't modify `assets/ascii-portrait.txt`.
- Wrap all `localStorage` / `sessionStorage` access in try/catch.

## Run locally
```bash
python3 -m http.server 8080
# open http://localhost:8080
```
Opening `index.html` from the filesystem won't work, because ES modules and `fetch` need a server.

## Check your work
- Before calling a milestone done, go through its acceptance criteria (SPEC §15) and the relevant items in the test checklist (SPEC §16).
- Test at 390×844, 768×1024, 1280×800 and 1920×1080. Also test with `prefers-reduced-motion: reduce` emulated.
- There should be no errors in the browser console.

## Deploy
Push to the `main` branch of `USERNAME.github.io`, then go to Settings → Pages and set Source to "Deploy from a branch", with `main` and `/ (root)`. Keep the empty `.nojekyll` file in the repo root.
