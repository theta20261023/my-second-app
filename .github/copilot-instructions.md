# Repository guide

## Build, run, and test

This is a static browser game; there is no package manager, build step, configured test runner, or lint command. Serve the repository root with `python3 -m http.server 8000` and open `http://localhost:8000/`. There is no single-test command; verify gameplay changes in the browser.

## Architecture

- `index.html` is the Japanese-language page shell. It defines the canvas, HUD, intro/result overlays, keyboard help, and touch controls; its IDs and `data-key` attributes are used by `game.js`.
- `game.js` owns the game state and rendering. It draws the fixed 960×540 canvas, while the level lives in a 2700px world and `camera` scrolls the view. The animation loop updates physics and collisions before drawing the background, platforms, coins, goal, and player.
- Game state and HUD/overlay state are coordinated in `game.js`: `reset()` starts a run, `finish()` presents the result, and `update()` advances only while playing. Keyboard and pointer controls feed the same `keys` set.
- `style.css` styles the page and scales the canvas responsively; it also switches to on-screen touch controls at the mobile breakpoint. Keep visual layout and game rendering changes in their respective files.

## Codebase conventions

- Keep player, platform, coin, camera, and collision positions in canvas/world coordinates; convert world x-coordinates to screen coordinates by subtracting `camera` when drawing.
- The physics update uses `dt` normalized to roughly 60 FPS. Preserve that time-step convention when changing movement or gravity.
- The DOM is a deliberate bridge between the canvas game and accessible/page UI: update existing HUD and overlay elements through their IDs, and keep the HTML's keyboard/touch affordances consistent with input handling.
- User-facing page and game copy is Japanese, while game identifiers and internal state names are English.
- 説明やユーザー向けの案内は日本語で表示してください。
