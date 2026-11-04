# Repository guide

## Build, run, and test

This is a static browser game with no package manager, build step, configured test runner, or lint command.

- Run it with `python3 -m http.server 8000` from the repository root, then open `http://localhost:8000/`.
- Check JavaScript syntax with `node --check game.js`.
- There is no automated test runner or single-test command. For a focused gameplay check, start a run, test the changed keyboard or touch input, collect a coin and confirm the HUD updates, then exercise the relevant fall/restart or goal/result flow.

## Architecture

- `index.html` is the Japanese-language page shell. It defines the canvas, centered coin score, lives/restart controls, intro/result overlays, keyboard help, and touch controls; its IDs and `data-key` attributes are used by `game.js`.
- `game.js` owns game state, input, physics, collisions, HUD/overlay updates, and canvas rendering. The logical canvas is 960×540 and the level is a 2700px world; `camera` scrolls the view. Each animation frame updates gameplay before drawing the background, platforms, enemies, coins, goal, and player.
- Game state and HUD/overlay state are coordinated in `game.js`: `reset()` starts or restarts a run, `finish()` presents the win/loss result, and `update()` advances only while playing. Falling or enemy contact removes a life; the goal ends the run when reached. Keyboard and pointer controls feed the same `keys` set.
- `style.css` styles the page shell and scales the canvas responsively; it also switches to on-screen touch controls at the mobile breakpoint. Keep DOM/layout styling in CSS/HTML and in-game scenery and sprites in the canvas renderer.

## Codebase conventions

- Keep player, platform, coin, camera, and collision positions in canvas/world coordinates; convert world x-coordinates to screen coordinates by subtracting `camera` when drawing.
- Enemies patrol between world-coordinate bounds, are recreated by `reset()`, and use the existing life system; keep their movement/collision in `update()` and their appearance in the canvas renderer.
- The physics update uses `dt` normalized to roughly 60 FPS. Preserve that time-step convention when changing movement or gravity.
- `requestAnimationFrame` passes elapsed time to rendering for visual animation; keep animation in drawing code and gameplay state changes in `update()`.
- Preserve the frame update order in `loop()`: update gameplay, render the resulting state, then request the next frame. Keep collision and movement changes in `update()` rather than drawing functions.
- The DOM is a deliberate bridge between the canvas game and accessible/page UI: update existing HUD and overlay elements through their IDs, and keep the HTML's keyboard help and `data-key` touch controls consistent with the input handling in `game.js`.
- Touch buttons add their `data-key` value to `keys` while pressed and remove it on pointer release/cancel/leave; new controls should follow this shared input path and clear held keys on window blur.
- User-facing page and game copy is Japanese, while game identifiers and internal state names are English.
- 説明やユーザー向けの案内は日本語で表示してください。
