import { test, expect, type Page } from "@playwright/test";
import {
  generateMaze,
  radialOutwardNeighbors,
  solution,
  movementTarget,
} from "../src/games/maze/engine";
import { mazeControls } from "../src/games/maze/controls";
import type { Direction, MazeDefinition } from "../src/games/maze/types";
const uuid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
async function fixSeed(page: Page, seed: string) {
  await page.addInitScript(
    (seed) =>
      Object.defineProperty(crypto, "randomUUID", { value: () => seed }),
    seed,
  );
}
async function walk(page: Page, maze: MazeDefinition, path: string[]) {
  for (let i = 1; i < path.length; i++) {
    const control = mazeControls(maze, path[i - 1]).find(
      (c) => c.visible && c.target === path[i],
    );
    expect(control).toBeDefined();
    await page
      .locator(`.dpad button[data-direction="${control!.direction}"]`)
      .click();
    await expect(page.locator(".maze-svg")).toHaveAttribute(
      "data-player-cell",
      path[i],
    );
  }
}
async function positions(page: Page) {
  return page.locator(".dpad-circle").evaluate((panel) => {
    const p = panel.getBoundingClientRect();
    return [...panel.querySelectorAll("button")].map((b) => {
      const r = b.getBoundingClientRect();
      return {
        direction: b.getAttribute("data-direction"),
        x: r.x - p.x,
        y: r.y - p.y,
        width: r.width,
        height: r.height,
      };
    });
  });
}
test("circle controls keep their positions and held outward movement stops at a two-branch fork", async ({
  page,
}) => {
  let fixture:
    { maze: MazeDefinition; fork: string; parent: string } | undefined;
  for (let n = 0; n < 200 && !fixture; n++) {
    const maze = generateMaze("circle", "medium", uuid(n));
    const fork = maze.cells.find((c) => {
      const out = radialOutwardNeighbors(maze, c.id);
      const parent = movementTarget(maze, c.id, "up");
      return (
        out.length === 2 &&
        out.every((n) => c.passages.includes(n.id)) &&
        parent !== null &&
        movementTarget(maze, parent, "down") === c.id &&
        !solution(maze, maze.startCellId, parent).includes(maze.exitCellId)
      );
    });
    if (fork)
      fixture = {
        maze,
        fork: fork.id,
        parent: movementTarget(maze, fork.id, "up")!,
      };
  }
  expect(fixture).toBeDefined();
  const { maze, fork, parent } = fixture!;
  await fixSeed(page, maze.seed);
  await page.clock.install({ time: new Date("2026-11-02T12:00:00Z") });
  await page.goto("/games/maze");
  await page.getByRole("button", { name: "Circle", exact: true }).click();
  await page.getByLabel("Difficulty").selectOption("medium");
  await page.clock.pauseAt(new Date("2026-11-02T12:00:10Z"));
  const original = await positions(page);
  await walk(page, maze, solution(maze, maze.startCellId, parent));
  const count = Number(await page.getByTestId("moves").textContent()),
    out = page.getByRole("button", { name: "Move outward", exact: true });
  await out.scrollIntoViewIfNeeded();
  const bounds = (await out.boundingBox())!;
  await page.mouse.move(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2,
  );
  await page.mouse.down();
  await page.clock.runFor(600);
  await page.mouse.up();
  await expect(page.locator(".maze-svg")).toHaveAttribute(
    "data-player-cell",
    fork,
  );
  await expect(page.getByTestId("moves")).toHaveText(
    String(count + 1).padStart(2, "0"),
  );
  expect(await positions(page)).toEqual(original);
  await expect(out).toHaveAttribute("aria-disabled", "true");
  const ccw = page.getByRole("button", {
      name: "Move outward counterclockwise branch",
      exact: true,
    }),
    cw = page.getByRole("button", {
      name: "Move outward clockwise branch",
      exact: true,
    });
  await expect(ccw).toHaveAttribute("aria-disabled", "false");
  await expect(cw).toHaveAttribute("aria-disabled", "false");
  const arena = page.getByRole("group", { name: /Maze gameplay/ });
  await arena.press("ArrowDown");
  await expect(page.locator(".maze-svg")).toHaveAttribute(
    "data-player-cell",
    fork,
  );
  const children = radialOutwardNeighbors(maze, fork);
  await arena.press("q");
  await expect(page.locator(".maze-svg")).toHaveAttribute(
    "data-player-cell",
    children[0].id,
  );
  await arena.press("ArrowUp");
  await expect(page.locator(".maze-svg")).toHaveAttribute(
    "data-player-cell",
    fork,
  );
  await cw.click();
  await expect(page.locator(".maze-svg")).toHaveAttribute(
    "data-player-cell",
    children[1].id,
  );
  await arena.press("w");
  await expect(page.locator(".maze-svg")).toHaveAttribute(
    "data-player-cell",
    fork,
  );
});
test("circle branch buttons reject the blocked half instead of switching sides", async ({
  page,
}) => {
  let fixture:
    | { maze: MazeDefinition; cell: string; blocked: Direction; open: string }
    | undefined;
  for (let n = 0; n < 100 && !fixture; n++) {
    const maze = generateMaze("circle", "medium", uuid(n));
    const cell = maze.cells.find((c) => {
      const out = radialOutwardNeighbors(maze, c.id);
      return (
        out.length === 2 &&
        out.filter((n) => c.passages.includes(n.id)).length === 1 &&
        !solution(maze, maze.startCellId, c.id).includes(maze.exitCellId)
      );
    });
    if (cell) {
      const out = radialOutwardNeighbors(maze, cell.id);
      fixture = {
        maze,
        cell: cell.id,
        blocked: cell.passages.includes(out[0].id) ? "se" : "sw",
        open: out.find((c) => cell.passages.includes(c.id))!.id,
      };
    }
  }
  expect(fixture).toBeDefined();
  const { maze, cell, blocked, open } = fixture!;
  await fixSeed(page, maze.seed);
  await page.goto("/games/maze");
  await page.getByRole("button", { name: "Circle", exact: true }).click();
  await page.getByLabel("Difficulty").selectOption("medium");
  await walk(page, maze, solution(maze, maze.startCellId, cell));
  const button = page.locator(`.dpad [data-direction="${blocked}"]`);
  await expect(button).toHaveAttribute("aria-disabled", "true");
  const before = await page.getByTestId("moves").textContent();
  await button.click({ force: true });
  await expect(page.locator(".maze-svg")).toHaveAttribute(
    "data-player-cell",
    cell,
  );
  await expect(page.getByTestId("moves")).toHaveText(before!);
  await page
    .getByRole("group", { name: /Maze gameplay/ })
    .press(blocked === "sw" ? "q" : "e");
  await expect(page.locator(".maze-svg")).toHaveAttribute(
    "data-player-cell",
    cell,
  );
  await page.getByRole("button", { name: "Move outward", exact: true }).click();
  await expect(page.locator(".maze-svg")).toHaveAttribute(
    "data-player-cell",
    open,
  );
});
test("hexagon touch controls have true six-direction placement and matching primary keys", async ({
  browser,
}) => {
  let fixture: MazeDefinition | undefined;
  for (let n = 0; n < 100 && !fixture; n++) {
    const m = generateMaze("hexagon", "medium", uuid(n));
    const directions = new Set(
      solution(m)
        .slice(0, -1)
        .flatMap((id) =>
          mazeControls(m, id)
            .filter((c) => c.target && c.target !== m.exitCellId)
            .map((c) => c.direction),
        ),
    );
    if (directions.size === 6) fixture = m;
  }
  expect(fixture).toBeDefined();
  const maze = fixture!,
    context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    }),
    page = await context.newPage();
  await fixSeed(page, maze.seed);
  await page.goto("/games/maze");
  await page.getByRole("button", { name: "Hexagon", exact: true }).tap();
  await page.getByLabel("Difficulty").selectOption("medium");
  const layout = await page.locator(".dpad-hexagon").evaluate((panel) => {
    const r = panel.getBoundingClientRect();
    return [...panel.querySelectorAll("button")].map((el) => {
      const b = el.getBoundingClientRect();
      return {
        direction: el.getAttribute("data-direction"),
        angle:
          (Math.atan2(
            b.y + b.height / 2 - (r.y + r.height / 2),
            b.x + b.width / 2 - (r.x + r.width / 2),
          ) *
            180) /
          Math.PI,
        width: b.width,
        height: b.height,
      };
    });
  });
  const angles: Partial<Record<Direction, number>> = {
    right: 0,
    left: 180,
    nw: -120,
    ne: -60,
    sw: 120,
    se: 60,
  };
  for (const c of layout) {
    expect(
      Math.abs(((c.angle - angles[c.direction as Direction]! + 540) % 360) - 180),
    ).toBeLessThan(0.2);
    expect(c.width).toBeGreaterThanOrEqual(44);
    expect(c.height).toBeGreaterThanOrEqual(44);
  }
  const opposite: Partial<Record<Direction, Direction>> = {
      nw: "se",
      ne: "sw",
      left: "right",
      right: "left",
      sw: "ne",
      se: "nw",
    },
    tested = new Set<Direction>(),
    path = solution(maze),
    arena = page.getByRole("group", { name: /Maze gameplay/ });
  for (let i = 0; i < path.length - 1; i++) {
    const current = path[i];
    for (const c of mazeControls(maze, current)) {
      if (!c.target || c.target === maze.exitCellId || tested.has(c.direction))
        continue;
      await arena.press(c.keys[0]);
      await expect(page.locator(".maze-svg")).toHaveAttribute(
        "data-player-cell",
        c.target,
      );
      const back = mazeControls(maze, c.target).find(
        (b) => b.direction === opposite[c.direction],
      )!;
      await arena.press(back.keys[0]);
      await expect(page.locator(".maze-svg")).toHaveAttribute(
        "data-player-cell",
        current,
      );
      tested.add(c.direction);
    }
    const next = mazeControls(maze, current).find(
      (c) => c.target === path[i + 1],
    )!;
    await page.locator(`.dpad [data-direction="${next.direction}"]`).tap();
    await expect(page.locator(".maze-svg")).toHaveAttribute(
      "data-player-cell",
      path[i + 1],
    );
  }
  expect(tested.size).toBe(6);
  await expect(
    page.getByRole("heading", { name: "Maze completed", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).tap();
  await page.getByRole("button", { name: "Restart current maze" }).tap();
  await expect(page.getByTestId("moves")).toHaveText("00");
  await arena.focus();
  const scroll = await page.evaluate(() => scrollY);
  await arena.press("ArrowUp");
  await arena.press("ArrowDown");
  await expect(page.getByTestId("moves")).toHaveText("00");
  expect(await page.evaluate(() => scrollY)).toBe(scroll);
  await page.screenshot({
    path: "test-results/hexagon-controls-phone.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Circle", exact: true }).tap();
  await page.screenshot({
    path: "test-results/circle-controls-phone.png",
    fullPage: true,
  });
  await context.close();
});
