# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

Arkanoid/breakout game in browser JavaScript + canvas 2D (decided in spec 01). No build, lint, or tests. Open `index.html` directly (`file://`). Plain global scripts, no ES modules: `index.html` + `game.js` + `style.css` at repo root, plus `assets/spritesheet.js`.

## Assets

- `assets/spritesheet-breakout.png` (559x337) — single sprite sheet for paddle, ball, blocks, explosions.
- `assets/spritesheet.js` — global (non-module) helpers over that sheet:
  - `SPRITES` — source rects for `paddle`, `ball`, `blocks.<color>` (gray, red, yellow, cyan, magenta, hotpink, green).
  - `EXPLOSION_FRAMES.<color>` — 4-frame block-break animation per color; `EXPLOSION_DURATION` = 150 ms.
  - `loadSpritesheet(cb)` — async load; callbacks queue until ready. Image path `assets/spritesheet-breakout.png` is relative to the HTML page, so the page must sit at repo root.
  - `drawSprite(ctx, name, x, y, w, h)` — block names use `block_<color>` prefix; no-op until loaded.
  - `drawFrame(ctx, frame, x, y, w, h)` — draws one explosion frame.
- `assets/sounds/` — `ball-bounce.mp3`, `break-sound.mp3`.

## Workflow: spec-driven development

Skills in `.agents/skills/` (linked into `.claude/skills/`, pinned in `skills-lock.json`), user-invoked only:

- `/spec <feature>` — guided Q&A that writes a spec into `specs/` (format in `.agents/skills/spec/template.md`). No code written. Replies in the language of the initial prompt; new specs must match existing specs' language, numbering, and wording.
- `/spec-impl <NN-spec-name>` — implements an approved spec: checks state is "Approved", creates a git branch named after the spec (unless `specs/.spec-config.yml` sets `AutoCreateBranch: false`), then implements step by step, pausing for diff review.

Note: directory is not yet a git repo; `/spec-impl` branching requires `git init` first.
