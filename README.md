# MiniVerse

Small games. Big little escapes.

Live site: https://miniverse-arcade.vercel.app

Private source repository: https://github.com/HappyMan12321/miniverse-arcade.

A responsive, local-first minigame arcade built with Next.js App Router, React, TypeScript, Tailwind CSS, shadcn-style components using Radix primitives, and Lucide icons. Four complete games are available: Maze Explorer, Memory Match, Snake, and 2048. No account, database, external graphics, or runtime API is required.

## Run locally

Requires Node.js 24 and npm.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000. The arcade is at `/`. Play Maze Explorer at `/games/maze`, Memory Match at `/games/memory-match`, Snake at `/games/snake`, and 2048 at `/games/2048`.

## Interface

The arcade opens directly to four game cards. Each game uses a compact title bar, score HUD, settings/actions, a centered board, and touch controls. Rules are available through the help button. Promotional sections, message sidebars, captions, and footer clutter have been removed. Phone layouts keep stats above the board and use touch targets of at least 44 pixels, responsive boards, and safe-area padding. Short and landscape screens can scroll vertically.

## What works

- Four genuine topologies: square grid, triangular tessellation with a triangular boundary, axial hexagons with a hexagonal boundary, and polar rings with varying sector counts.
- Four difficulties per shape, seeded iterative depth-first maze generation, reciprocal passages, and a unique route between any two cells.
- Geometry-aware keyboard and pointer/touch controls, including explicit outward branch choices in circular mazes.
- Wall-safe player movement, explored trails, optional hints, restart, new maze, pause/resume, successful-move counting, and completion results.
- Monotonic active-play timer: starts on the first valid movement; pauses when hidden or manually paused; stops at completion. Hidden time never counts. A visible but unfocused tab continues counting.
- System/light/dark theme selection, saved shape/difficulty preferences, and local personal bests. Storage failures do not prevent gameplay.
- Responsive phone/tablet/desktop layouts, reduced-motion support, focus-scoped keyboard input, semantic controls, and accessible modal focus management.
- Memory Match: shuffled 6/8/12-pair decks, protected mismatch reveal, turn/time tracking, completion results, and fewest-turn records per deck size.
- Snake: Cozy/Classic/Quick speeds, food and growth, body/wall collisions, predictable single-turn queue, pause/resume, and best scores per speed. Pauses when hidden, blurred, or opening the guide; resumes explicitly.
- 2048: correct directional merges with one merge per tile per move, new tiles only after valid moves, score/best score, one-step undo, game-over results, and continued play after reaching 2048.
- Every game is registered centrally and links to its own explicit route. Shared help dialogs, statistics, theme tokens, directions, storage helpers, and page layout keep the experience consistent.

## Controls

Memory Match uses mouse, touch, or Tab/Enter/Space to flip cards. Snake and 2048 support arrow keys, WASD, swipe gestures on the board, and on-screen direction buttons. Start/resume focuses Snake automatically; click or tab to a board to focus keyboard input. Space pauses or resumes Snake. One queued turn is accepted between Snake movement ticks; opposite directions are rejected.

Maze controls remain geometry-specific. Focus the maze by clicking it or tabbing to the gameplay region. Keyboard input only applies inside that region.

| Shape | Keyboard |
| --- | --- |
| Square | Arrow keys or W/A/S/D |
| Triangle | W/A/D in downward-facing cells; Q/E/S in upward-facing cells. Left/right arrows follow the current diagonal directions. |
| Hexagon | Q/E upper diagonals, A/D horizontal, Z/C lower diagonals (W/X remain aliases; left/right arrows also work) |
| Circle | Up/inward, down/outward, left/counterclockwise, right/clockwise. W/A/S/D also work. When two outward passages exist, choose Out CCW with Q/Z or Out CW with E/X; the general Out action stops at ambiguous forks. |

On-screen controls show their current mapping. Holding a pointer control repeats movement until release, cancellation, pointer leave, or window blur. Blocked moves do not count.

## Architecture

- `src/games/registry.ts`: centralized metadata drives discovery cards.
- `src/games/maze/topology.ts`: shape-specific cells and adjacency; no React dependencies.
- `src/games/maze/engine.ts`: deterministic generation, graph validation, pathfinding, and passage-checked movement.
- `src/games/maze/rendering.ts`: SVG wall paths from the graph, separate from generation.
- `src/games/maze/maze-renderer.tsx`: memoized SVG walls, player, trail, start, and exit.
- `src/games/maze/maze-game.tsx`: run state, input, preferences, results, and configuration.
- `src/games/shared/clock.ts`: independently tested monotonic active-play clock, re-exported from the existing maze clock module.
- `src/games/memory-match`, `src/games/snake`, `src/games/2048`: pure, independently tested engines and separate React gameplay components.
- `src/games/shared`: shared directional input, optional local best-score storage, timer, and related hooks.
- `src/lib/random.ts`: deterministic random generator shared by the maze and memory engines.
- `src/components/mini-game-frame.tsx` and `direction-pad.tsx`: reusable gameplay shell, statistics, help, and touch controls.
- `src/services/game-stats.ts`: persistence interface with a local adapter; a future cloud adapter can replace it.
- `src/components`: shared shell, theme controls, game cards, button, and Radix dialog.
- `src/app/globals.css`: semantic theme tokens and responsive styles.

Adding a game means implementing its isolated module, adding a registry entry, and creating an explicit route that imports that module. Each route explicitly imports its typed game component; there are no unrestricted slug-based imports. All game logic runs in the browser.

Square mazes use 25/81/169/324 cells. Triangular mazes use 25/81/169/324, hexagonal mazes use 19/61/127/331, and circular mazes use 25/73/137/297. Difficulty primarily scales cell count. The exit is selected from boundary cells by maximum start distance; circular exits lie on the outer ring.

Player animations restart from the preceding logical cell on rapid input, ensuring transitions stay on open cell-to-cell passages rather than cutting across corners.

## Verification

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

To run the same browser checks against a deployed site, set `PLAYWRIGHT_BASE_URL=https://your-site.vercel.app` before `npm run test:e2e`; this skips the local server.

Local browser tests use installed Google Chrome. CI uses bundled Chromium installed with `npx playwright install --with-deps chromium`. To use bundled Chromium locally, set `CI=1` for the browser tests after installing it.

The unit suite validates 320 seeded mazes across all shape/difficulty pairs, unique identifiers, reciprocal valid neighbors and passages, spanning-tree edge count, reachability, shared polygon boundaries, available movement commands, and timer accounting. Browser tests complete every geometry, check blocked movements, restart/new-maze independence, results, settings, theme persistence, and layout overflow at 375/768/1440 pixels. Additional unit tests verify Memory Match deck composition/matching/locking, Snake collision/growth/reversal/tail behavior/full-board wins, and 2048 directional merging/spawning/score/win/loss logic. Browser tests complete Memory Match, exercise Snake with a controlled clock through eating and collision, play 2048 to a terminal board and undo, and verify the three new games on phone/tablet layouts, touch input, and dark mode. GitHub Actions runs all checks on pushes and pull requests.

Webpack is used for builds and local development to work reliably in environments that restrict Turbopack's internal process ports.

## Vercel

The included `vercel.json` selects Next.js and runs `npm ci` / `npm run build`. No environment variables are needed. Connect the repository in Vercel to enable automatic production deployments from `main` and previews for pull requests, or deploy directly:

```sh
npx vercel --prod
```

## Scope

Authentication, Supabase, global leaderboards, multiplayer, audio, and cloud synchronization are outside this MVP. Local records are personal browser data and are not competitive, verified scores.

### Geometry-aware maze controllers

Hexagonal controls are positioned at the six actual neighbor angles, and button labels and keyboard mappings share one definition. Circular controls use inward/outward and clockwise/counterclockwise icons rather than screen-space arrows. The circular pad keeps a fixed layout; outward branch controls refer to fixed geometric halves before checking walls, so a blocked branch never falls back to the other side. Holding Out stops at a fork with two open outward branches. All generated passages are checked for reachability through a visible control and its keyboard mapping.
