# Portfolio

My personal portfolio site, built as an interactive handheld console and hosted on GitHub Pages.

> Status: not built yet. This folder has the design spec and assets. Claude Code builds the site from `SPEC.md`.

## What's here

| File | Purpose |
|---|---|
| `SPEC.md` | Full design and build specification (the source of truth) |
| `CLAUDE.md` | Rules Claude Code follows in this repo |
| `assets/ascii-portrait.txt` | Source ASCII portrait (400 × 237 characters) |

## Getting started with Claude Code

1. Open a terminal in this folder.
2. (Recommended) Put it under git first: `git init`
3. Run `claude` and ask:
   > Read SPEC.md and CLAUDE.md, then build milestone M1. Stop when its acceptance criteria pass.
4. Review the result, then continue with M2, M3 and so on.

## Run locally

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080.

## Updating content

After the site is built, edit `content/content.json` to change your name, projects, experience, education and links. Put images in `assets/img/` and your resume at `assets/resume.pdf`.

## Deploying to GitHub Pages

1. Create a public repo named `USERNAME.github.io` (use your GitHub username).
2. Push this folder to its `main` branch.
3. In the repo, open **Settings → Pages**, choose **Deploy from a branch**, then select `main` and `/ (root)`.
4. The site goes live at `https://USERNAME.github.io/` within a few minutes.
