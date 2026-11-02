import { test, expect, type Page } from "@playwright/test";
import { generateMaze, solution } from "../src/games/maze/engine";
import { STEP_DURATION } from "../src/games/maze/motion";
import type { MazeDefinition, MazeShape, Point } from "../src/games/maze/types";
const uuid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
async function setupClock(page: Page, seed: string) {
  await page.addInitScript(
    (seed) =>
      Object.defineProperty(crypto, "randomUUID", { value: () => seed }),
    seed,
  );
  await page.clock.install({ time: new Date("2026-11-02T12:00:00Z") });
  await page.goto("/games/maze");
  await page.clock.pauseAt(new Date("2026-11-02T12:00:10Z"));
}
async function visual(page: Page) {
  return page.locator(".maze-svg .player").evaluate((el) => {
    const m = new DOMMatrixReadOnly((el as SVGElement).style.transform);
    return {
      x: m.e,
      y: m.f,
      progress: Number((el as HTMLElement).dataset.motionProgress),
      phase: (el as HTMLElement).dataset.motionPhase,
    };
  });
}
function expectOnSegment(
  value: { x: number; y: number; progress: number },
  from: Point,
  to: Point,
) {
  expect(value.x).toBeCloseTo(from.x + (to.x - from.x) * value.progress, 5);
  expect(value.y).toBeCloseTo(from.y + (to.y - from.y) * value.progress, 5);
}
function squareKey(a: Point, b: Point) {
  return b.x > a.x
    ? "ArrowRight"
    : b.x < a.x
      ? "ArrowLeft"
      : b.y > a.y
        ? "ArrowDown"
        : "ArrowUp";
}
test("joystick interpolates linearly, stops on release, respects walls, and resets on cancel", async ({
  page,
}) => {
  let maze: MazeDefinition | undefined;
  for (let n = 0; n < 100 && !maze; n++) {
    const m = generateMaze("square", "easy", uuid(n));
    if (
      m.cells.find((c) => c.id === "0,0")!.passages.includes("1,0") &&
      m.cells.find((c) => c.id === "1,0")!.passages.includes("2,0") &&
      !m.cells.find((c) => c.id === "2,0")!.passages.includes("3,0")
    )
      maze = m;
  }
  expect(maze).toBeDefined();
  await page.setViewportSize({ width: 390, height: 844 });
  await setupClock(page, maze!.seed);
  await page.getByRole("button", { name: "Joystick", exact: true }).click();
  const base = page.getByRole("button", { name: "Maze joystick", exact: true }),
    rect = (await base.boundingBox())!,
    center = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  await page.mouse.move(center.x, center.y);
  await page.mouse.down();
  await page.mouse.move(center.x + 5, center.y);
  await page.clock.runFor(300);
  await expect(page.getByTestId("moves")).toHaveText("00");
  await expect(page.getByTestId("timer")).toHaveText("00:00");
  await page.mouse.move(center.x + 90, center.y);
  await expect(page.locator(".maze-svg")).toHaveAttribute(
    "data-player-cell",
    "1,0",
  );
  await page.clock.runFor(48);
  const sample = await visual(page);
  expect(sample.progress).toBeGreaterThan(0);
  expect(sample.progress).toBeLessThan(1);
  expectOnSegment(sample, { x: 0.5, y: 0.5 }, { x: 1.5, y: 0.5 });
  await page.mouse.up();
  await expect(page.locator(".joystick-thumb")).toHaveCSS(
    "transform",
    "matrix(1, 0, 0, 1, 0, 0)",
  );
  await page.clock.runFor(600);
  await expect(page.getByTestId("moves")).toHaveText("01");
  expect((await visual(page)).x).toBeCloseTo(1.5);
  await page.mouse.move(center.x, center.y);
  await page.mouse.down();
  await page.mouse.move(center.x + 90, center.y);
  await page.clock.runFor(900);
  await expect(page.locator(".maze-svg")).toHaveAttribute(
    "data-player-cell",
    "2,0",
  );
  await expect(page.getByTestId("moves")).toHaveText("02");
  await base.dispatchEvent("pointercancel");
  await page.mouse.up();
  await expect(page.locator(".joystick-thumb")).toHaveCSS(
    "transform",
    "matrix(1, 0, 0, 1, 0, 0)",
  );
  await page.clock.runFor(500);
  await expect(page.getByTestId("moves")).toHaveText("02");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Joystick", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(base).toBeVisible();
  await expect(page.getByTestId("moves")).toHaveText("00");
});
test("rapid direction changes finish each corridor segment before turning", async ({
  page,
}) => {
  let maze: MazeDefinition | undefined,
    path: string[] = [];
  for (let n = 0; n < 100 && !maze; n++) {
    const m = generateMaze("square", "easy", uuid(n)),
      p = solution(m);
    if (p.length < 5) continue;
    const points = p
      .slice(0, 4)
      .map((id) => m.cells.find((c) => c.id === id)!.geometry.center);
    if (squareKey(points[0], points[1]) !== squareKey(points[1], points[2])) {
      maze = m;
      path = p.slice(0, 4);
    }
  }
  expect(maze).toBeDefined();
  await setupClock(page, maze!.seed);
  const points = path.map(
      (id) => maze!.cells.find((c) => c.id === id)!.geometry.center,
    ),
    arena = page.getByRole("group", { name: /Maze gameplay/ });
  for (let i = 1; i < points.length; i++)
    await arena.press(squareKey(points[i - 1], points[i]));
  await expect(page.locator(".maze-svg")).toHaveAttribute(
    "data-player-cell",
    path[1],
  );
  await page.clock.runFor(48);
  expectOnSegment(await visual(page), points[0], points[1]);
  await page.clock.runFor(STEP_DURATION - 28);
  await expect(page.locator(".maze-svg")).toHaveAttribute(
    "data-player-cell",
    path[2],
  );
  expectOnSegment(await visual(page), points[1], points[2]);
  await page.clock.runFor(STEP_DURATION);
  await expect(page.locator(".maze-svg")).toHaveAttribute(
    "data-player-cell",
    path[3],
  );
  expectOnSegment(await visual(page), points[2], points[3]);
  await page.clock.runFor(500);
  await expect(page.getByTestId("moves")).toHaveText("03");
  expect((await visual(page)).x).toBeCloseTo(points[3].x);
  expect((await visual(page)).y).toBeCloseTo(points[3].y);
});
test("trusted touch dragging steers every geometry, releases outside the base, and cancels on reset", async ({
  browser,
}) => {
  for (const shape of [
    "square",
    "triangle",
    "hexagon",
    "circle",
  ] as MazeShape[]) {
    const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      }),
      page = await context.newPage();
    await page.clock.install({ time: new Date("2026-11-02T12:00:00Z") });
    await page.goto("/games/maze");
    await page
      .getByRole("button", {
        name: shape[0].toUpperCase() + shape.slice(1),
        exact: true,
      })
      .tap();
    await page.getByRole("button", { name: "Joystick", exact: true }).tap();
    await page.clock.pauseAt(new Date("2026-11-02T12:00:10Z"));
    const seed = (await page.locator(".maze-svg").getAttribute("data-seed"))!,
      m = generateMaze(shape, "easy", seed),
      start = m.cells.find((c) => c.id === m.startCellId)!,
      next = m.cells.find((c) => c.id === start.passages[0])!,
      dx = next.geometry.center.x - start.geometry.center.x,
      dy = next.geometry.center.y - start.geometry.center.y,
      length = Math.hypot(dx, dy),
      base = page.getByRole("button", { name: "Maze joystick", exact: true }),
      rect = (await base.boundingBox())!,
      center = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 },
      cdp = await context.newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: center.x, y: center.y, id: 1 }],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        {
          x: center.x + (80 * dx) / length,
          y: center.y + (80 * dy) / length,
          id: 1,
        },
      ],
    });
    await expect(page.locator(".maze-svg")).toHaveAttribute(
      "data-player-cell",
      next.id,
    );
    await page.clock.runFor(48);
    const value = await visual(page);
    expect(value.progress).toBeGreaterThan(0);
    expect(value.progress).toBeLessThan(1);
    expectOnSegment(value, start.geometry.center, next.geometry.center);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await page.clock.runFor(400);
    await expect(page.getByTestId("moves")).toHaveText("01");
    await expect(page.locator(".joystick-thumb")).toHaveCSS(
      "transform",
      "matrix(1, 0, 0, 1, 0, 0)",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(rect.y + rect.height).toBeLessThanOrEqual(844);
    await page.screenshot({
      path: `test-results/joystick-${shape}-phone.png`,
      fullPage: true,
    });
    // Reset while a second gesture is in flight; the old frame must not resume it.
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: center.x, y: center.y, id: 2 }],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        {
          x: center.x - (80 * dx) / length,
          y: center.y - (80 * dy) / length,
          id: 2,
        },
      ],
    });
    await page.clock.runFor(32);
    await page.getByRole("button", { name: "New maze", exact: true }).focus();
    await page.keyboard.press("Enter");
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await page.clock.runFor(1000);
    await expect(page.getByTestId("moves")).toHaveText("00");
    await expect(page.getByTestId("timer")).toHaveText("00:00");
    expect((await visual(page)).phase).toBe("idle");
    await cdp.detach();
    await context.close();
  }
});
test("reduced motion skips interpolation while retaining wall-safe stepping", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const seed = uuid(0);
  await setupClock(page, seed);
  const maze = generateMaze("square", "easy", seed),
    from = maze.cells.find((c) => c.id === maze.startCellId)!,
    to = maze.cells.find((c) => c.id === from.passages[0])!;
  await page
    .getByRole("group", { name: /Maze gameplay/ })
    .press(squareKey(from.geometry.center, to.geometry.center));
  const value = await visual(page);
  expect(value.x).toBeCloseTo(to.geometry.center.x);
  expect(value.y).toBeCloseTo(to.geometry.center.y);
  await page.clock.runFor(500);
  await expect(page.getByTestId("moves")).toHaveText("01");
});

test("joystick pauses cleanly and loses held input on blur on a short phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 740 });
  const seed = uuid(0);
  await setupClock(page, seed);
  const m = generateMaze("square", "easy", seed),
    from = m.cells.find((c) => c.id === m.startCellId)!,
    to = m.cells.find((c) => c.id === from.passages[0])!,
    dx = to.geometry.center.x - from.geometry.center.x,
    dy = to.geometry.center.y - from.geometry.center.y;
  await page.getByRole("button", { name: "Joystick", exact: true }).click();
  const base = page.getByRole("button", { name: "Maze joystick", exact: true });
  const bounds = (await base.boundingBox())!,
    center = {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
    };
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(740);
  await page.mouse.move(center.x, center.y);
  await page.mouse.down();
  await page.mouse.move(center.x + 90 * dx, center.y + 90 * dy);
  await page.clock.runFor(48);
  await page.getByRole("button", { name: "Pause game", exact: true }).focus();
  await page.keyboard.press("Enter");
  await page.mouse.up();
  await expect(
    page.getByRole("heading", { name: "Paused", exact: true }),
  ).toBeVisible();
  await expect(base).toHaveAttribute("aria-disabled", "true");
  const timer = await page.getByTestId("timer").textContent();
  await page.clock.runFor(2000);
  await expect(page.getByTestId("timer")).toHaveText(timer!);
  await expect(page.getByTestId("moves")).toHaveText("01");
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.clock.runFor(500);
  await expect(page.getByTestId("moves")).toHaveText("01");
  const current = (await base.boundingBox())!,
    c = { x: current.x + current.width / 2, y: current.y + current.height / 2 };
  await page.mouse.move(c.x, c.y);
  await page.mouse.down();
  await page.mouse.move(c.x - 90 * dx, c.y - 90 * dy);
  await page.clock.runFor(32);
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await page.mouse.up();
  await page.clock.runFor(600);
  await expect(page.getByTestId("moves")).toHaveText("02");
  await expect(page.locator(".maze-svg")).toHaveAttribute(
    "data-player-cell",
    from.id,
  );
  await expect(page.locator(".joystick-thumb")).toHaveCSS(
    "transform",
    "matrix(1, 0, 0, 1, 0, 0)",
  );
  await page.screenshot({
    path: "test-results/joystick-short-phone.png",
    fullPage: true,
  });
});

test("a joystick-only run completes when the dot arrives at the exit", async ({
  page,
}) => {
  const seed = uuid(0),
    m = generateMaze("square", "easy", seed),
    path = solution(m);
  await page.setViewportSize({ width: 390, height: 844 });
  await setupClock(page, seed);
  await page.getByRole("button", { name: "Joystick", exact: true }).click();
  for (let i = 1; i < path.length; i++) {
    const from = m.cells.find((c) => c.id === path[i - 1])!.geometry.center,
      to = m.cells.find((c) => c.id === path[i])!.geometry.center,
      base = page.getByRole("button", { name: "Maze joystick", exact: true }),
      r = (await base.boundingBox())!,
      center = { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    await page.mouse.move(center.x, center.y);
    await page.mouse.down();
    await page.mouse.move(
      center.x + 90 * (to.x - from.x),
      center.y + 90 * (to.y - from.y),
    );
    await page.clock.runFor(32);
    await expect(page.locator(".maze-svg")).toHaveAttribute(
      "data-player-cell",
      path[i],
    );
    if (i === path.length - 1) {
      await expect(page.getByRole("dialog")).not.toBeVisible();
      expect((await visual(page)).phase).toBe("moving");
    }
    await page.mouse.up();
    await page.clock.runFor(STEP_DURATION + 20);
  }
  await expect(
    page.getByRole("heading", { name: "Maze completed", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("moves")).toHaveText(
    String(path.length - 1).padStart(2, "0"),
  );
  const time = await page.getByTestId("timer").textContent();
  await page.clock.runFor(2000);
  await expect(page.getByTestId("timer")).toHaveText(time!);
});
