# MiniVerse

Small games. Big little escapes.

Live site: https://miniverse-arcade.vercel.app

Private source repository: https://github.com/HappyMan12321/miniverse-arcade (source upload requires approval).

A responsive, local-first minigame arcade built with Next.js App Router, React, TypeScript, Tailwind CSS, shadcn-style components using Radix primitives, and Lucide icons. Maze Explorer is the first playable game. No account, database, external graphics, or runtime API is required.

## Run locally

Requires Node.js 22 or 24 and npm.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000. The arcade is at `/`; Maze Explorer is at `/games/maze`.

## What works

- Four genuine topologies: square grid, triangular tessellation with a triangular boundary, axial hexagons with a hexagonal boundary, and polar rings with varying sector counts.
- Four difficulties per shape, seeded iterative depth-first maze generation, reciprocal passages, and a unique route between any two cells.
- Geometry-aware keyboard and pointer/touch controls, including explicit outward branch choices in circular mazes.
- Wall-safe player movement, explored trails, optional hints, restart, new maze, pause/resume, successful-move counting, and completion results.
- Monotonic active-play timer: starts on the first valid movement; pauses when hidden or manually paused; stops at completion. Hidden time never counts. A visible but unfocused tab continues counting.
- System/light/dark theme selection, saved shape/difficulty preferences, and local personal bests. Storage failures do not prevent gameplay.
- Responsive phone/tablet/desktop layouts, reduced-motion support, focus-scoped keyboard input, semantic controls, and accessible modal focus management.
- Central game registry with honestly labeled upcoming games. Those games have no nonfunctional Play buttons.

## Controls

Focus the maze by clicking it or tabbing to the gameplay region. Keyboard input only applies inside that region.

| Shape | Keyboard |
| --- | --- |
| Square | Arrow keys or W/A/S/D |
| Triangle | W/A/D in downward-facing cells; Q/E/S in upward-facing cells. Left/right arrows follow the current diagonal directions. |
| Hexagon | Q/W upper diagonals, A/D horizontal, Z/X lower diagonals |
| Circle | Up/inward, down/outward, left/counterclockwise, right/clockwise. W/A/S/D also work. When two outward passages exist, Z/X select outward left/right. |

On-screen controls show their current mapping. Holding a pointer control repeats movement until release, cancellation, pointer leave, or window blur. Blocked moves do not count.

## Architecture

- `src/games/registry.ts`: centralized metadata drives discovery cards.
- `src/games/maze/topology.ts`: shape-specific cells and adjacency; no React dependencies.
- `src/games/maze/engine.ts`: deterministic generation, graph validation, pathfinding, and passage-checked movement.
- `src/games/maze/rendering.ts`: SVG wall paths from the graph, separate from generation.
- `src/games/maze/maze-renderer.tsx`: memoized SVG walls, player, trail, start, and exit.
- `src/games/maze/maze-game.tsx`: run state, input, preferences, results, and configuration.
- `src/games/maze/clock.ts`: independently tested monotonic active-play clock.
- `src/services/game-stats.ts`: persistence interface with a local adapter; a future cloud adapter can replace it.
- `src/components`: shared shell, theme controls, game cards, button, and Radix dialog.
- `src/app/globals.css`: semantic theme tokens and responsive styles.

Adding a game means implementing its isolated module, adding a registry entry, and creating an explicit route that imports that module. The explicit `/games/maze` route is the typed mapping for this release; there are no unrestricted slug-based imports. All game logic runs in the browser.

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

The unit suite validates 320 seeded mazes across all shape/difficulty pairs, unique identifiers, reciprocal valid neighbors and passages, spanning-tree edge count, reachability, shared polygon boundaries, available movement commands, and timer accounting. Browser tests complete every geometry, check blocked movements, restart/new-maze independence, results, settings, theme persistence, and layout overflow at 375/768/1440 pixels. GitHub Actions runs the checks on pushes and pull requests.

Webpack is used for builds and local development to work reliably in environments that restrict Turbopack's internal process ports.

## Vercel

The included `vercel.json` selects Next.js and runs `npm ci` / `npm run build`. No environment variables are needed. Connect the repository in Vercel to enable automatic production deployments from `main` and previews for pull requests, or deploy directly:

```sh
npx vercel --prod
```

## Scope

Memory Match, Snake, and 2048 are upcoming registry entries, not playable releases. Authentication, Supabase, global leaderboards, multiplayer, audio, and cloud synchronization are outside this MVP. Local records are personal browser data and are not competitive, verified scores.
