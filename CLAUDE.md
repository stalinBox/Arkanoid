# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

Arkanoid/breakout game in browser JavaScript + canvas 2D (decided in spec 01). No build, lint, or tests. Open `index.html` directly (`file://`). Plain global scripts, no ES modules: `index.html` + `game.js` + `style.css` at repo root, plus `assets/spritesheet.js`.

Specs implemented (`specs/`, all in Spanish):

- 01 MVP — 640x640 canvas, rAF loop with `dt`, paddle (`←` `→`), ball, multi-hit blocks (gray=3, hotpink=2, rest=1), score, lives, explosions.
- 02 Explosión gris — gray blocks use gray explosion frames.
- 03 Sonidos y niveles — bounce/break sounds, 3 maps, 3 difficulties.
- Pause (commit "Pause implemented", no spec file) — `Espacio` toggles pause while `playing`.

## game.js architecture

- `LEVELS` — 3 maps as string arrays (7 rows x 10 cols; `g h r y c m v` letters via `BLOCK_TYPES`, `.` = empty). `createBlocks(levelIndex)`.
- `DIFFICULTIES` (`easy`/`normal`/`hard`: ballSpeed, paddleW, lives) + `LEVEL_SPEED_STEP` (+10 % ball speed per map).
- `state` — single global: `phase` (`ready|playing|won|lost`), `paused` (only from `playing`), `difficulty`, `started`, `level`, `paddle`, `ball`, `blocks`, `explosions`, `score`, `lives`.
- Controls: `←` `→` move; `Espacio` launch / pause / restart (from won/lost); `1` `2` `3` pick difficulty (only in `ready` before first launch, `state.started` false).
- Sounds: `SOUNDS` + `playSound(name)` — single shared channel, new sound cuts the current one; paused game pauses it. Break sound only when hp hits 0.
- Flow: `update(dt)` → `stepBall` (substeps) → `collideBallBlocks` / `loseLife` / `clearLevel`; `resetGame` keeps difficulty.

## Assets

- `assets/spritesheet-breakout.png` (559x337) — single sprite sheet for paddle, ball, blocks, explosions.
- `assets/spritesheet.js` — global (non-module) helpers over that sheet:
  - `SPRITES` — source rects for `paddle`, `ball`, `blocks.<color>` (gray, red, yellow, cyan, magenta, hotpink, green).
  - `EXPLOSION_FRAMES.<color>` — 4-frame block-break animation per color; `EXPLOSION_DURATION` = 150 ms.
  - `loadSpritesheet(cb)` — async load; callbacks queue until ready. Image path `assets/spritesheet-breakout.png` is relative to the HTML page, so the page must sit at repo root.
  - `drawSprite(ctx, name, x, y, w, h)` — block names use `block_<color>` prefix; no-op until loaded.
  - `drawFrame(ctx, frame, x, y, w, h)` — draws one explosion frame.
- `assets/sounds/` — `ball-bounce.mp3`, `break-sound.mp3` (used via `playSound` in `game.js`).

## Workflow: spec-driven development

Skills in `.agents/skills/` (linked into `.claude/skills/`, pinned in `skills-lock.json`), user-invoked only:

- `/spec <feature>` — guided Q&A that writes a spec into `specs/` (format in `.agents/skills/spec/template.md`). No code written. Replies in the language of the initial prompt; new specs must match existing specs' language, numbering, and wording.
- `/spec-impl <NN-spec-name>` — implements an approved spec: checks state is "Approved", creates a git branch named after the spec (unless `specs/.spec-config.yml` sets `AutoCreateBranch: false`), then implements step by step, pausing for diff review.

Git repo is initialized (main branch); `specs/.spec-config.yml` has `AutoCreateBranch: true`.
