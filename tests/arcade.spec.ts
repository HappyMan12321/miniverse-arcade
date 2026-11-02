import { expect, test } from "@playwright/test";
import {
  generateMaze,
  movementTarget,
  solution,
} from "../src/games/maze/engine";
import type { Direction, MazeShape } from "../src/games/maze/types";
const keys: Record<Direction, string> = {
  up: "ArrowUp",
  down: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
  nw: "q",
  ne: "e",
  sw: "z",
  se: "x",
};
test("lobby links, theme persistence, help, restart, new maze and all difficulty settings", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Arcade", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".game-card")).toHaveCount(4);
  await page.getByRole("button", { name: /Theme:/ }).click();
  const theme = await page.locator("html").getAttribute("data-theme");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme!);
  await page.getByRole("link", { name: "Play Maze Explorer" }).click();
  await expect(page).toHaveURL(/games\/maze/);
  await page.getByRole("button", { name: "How to play" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Done" }).click();
  const svg = page.locator('[data-testid="maze-canvas"] svg');
  const first = await svg.getAttribute("data-seed");
  await page.getByRole("button", { name: "Restart current maze" }).click();
  await expect(svg).toHaveAttribute("data-seed", first!);
  await page.getByRole("button", { name: "New maze", exact: true }).click();
  await expect(svg).not.toHaveAttribute("data-seed", first!);
  for (const level of ["medium", "hard", "expert", "easy"]) {
    await page.getByLabel("Difficulty").selectOption(level);
    await expect(page.getByLabel("Difficulty")).toHaveValue(level);
    await expect(page.getByTestId("moves")).toHaveText("00");
  }
  await page.getByRole("button", { name: "Hint", exact: true }).click();
  await expect(page.locator(".maze-hint")).toHaveCount(1);
  await page.getByRole("button", { name: "Pause game", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Paused", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(page.getByTestId("timer")).toHaveText("00:00");
});
for (const shape of ["square", "triangle", "hexagon", "circle"] as MazeShape[])
  test(`${shape}: walls reject movement; solve with visible controls; restart preserves layout`, async ({
    page,
  }) => {
    await page.goto("/games/maze");
    await page
      .getByRole("button", {
        name:
          shape === "circle"
            ? "Circle"
            : shape[0].toUpperCase() + shape.slice(1),
        exact: true,
      })
      .click();
    const svg = page.locator('[data-testid="maze-canvas"] svg');
    const seed = (await svg.getAttribute("data-seed"))!;
    const maze = generateMaze(shape, "easy", seed);
    const path = solution(maze);
    const arena = page.getByRole("group", { name: /Maze gameplay/ });
    await arena.focus();
    const wall = page.locator('.direction[aria-disabled="true"]').first();
    if (await wall.count()) {
      await wall.click({ force: true });
      await expect(page.getByTestId("moves")).toHaveText("00");
    }
    for (let i = 1; i < path.length; i++) {
      const current = path[i - 1],
        next = path[i];
      const dirs: Direction[] = [
        "up",
        "down",
        "left",
        "right",
        "nw",
        "ne",
        "sw",
        "se",
      ];
      const direction = dirs.find(
        (d) => movementTarget(maze, current, d) === next,
      )!;
      if (shape === "circle") {
        const label =
          direction === "up"
            ? "inward"
            : direction === "left"
              ? "counterclockwise"
              : direction === "right"
                ? "clockwise"
                : "outward";
        // At a split, choose the explicitly labeled branch rather than the default outward action.
        const exact = page.getByRole("button", {
          name: `Move ${label}`,
          exact: true,
        });
        if (await exact.count()) await exact.click();
        else
          await page
            .getByRole("button", {
              name: `Move outward ${movementTarget(maze, current, "sw") === next ? "left" : "right"}`,
              exact: true,
            })
            .click();
      } else {
        let key = keys[direction];
        if (shape === "triangle") {
          if (direction === "sw") key = "a";
          if (direction === "se") key = "d";
        }
        if (shape === "hexagon") {
          if (direction === "ne") key = "w";
          if (direction === "left") key = "a";
          if (direction === "right") key = "d";
        }
        await arena.press(key);
      }
      await expect(page.getByTestId("moves")).toHaveText(
        String(i).padStart(2, "0"),
      );
    }
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Maze completed" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Close dialog" }).click();
    await page.getByRole("button", { name: "Restart current maze" }).click();
    await expect(svg).toHaveAttribute("data-seed", seed);
    await expect(page.getByTestId("moves")).toHaveText("00");
    await expect(page.getByTestId("timer")).toHaveText("00:00");
  });
test("responsive layouts at phone, tablet and desktop widths", async ({
  page,
}) => {
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Arcade", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(() =>
        [...document.querySelectorAll("body *")]
          .filter(
            (e) => e.getBoundingClientRect().right > window.innerWidth + 1,
          )
          .map((e) => ({
            tag: e.tagName,
            class: e.className,
            right: e.getBoundingClientRect().right,
          })),
      ),
    ).toEqual([]);
    await page.screenshot({
      path: `test-results/layout-home-${width}.png`,
      fullPage: true,
    });
    await page.goto("/games/maze");
    await expect(page.locator(".maze-svg")).toBeVisible();
    expect(
      await page.evaluate(() =>
        [...document.querySelectorAll("body *")]
          .filter(
            (e) => e.getBoundingClientRect().right > window.innerWidth + 1,
          )
          .map((e) => ({
            tag: e.tagName,
            class: e.className,
            right: e.getBoundingClientRect().right,
          })),
      ),
    ).toEqual([]);
    await page.screenshot({
      path: `test-results/layout-maze-${width}.png`,
      fullPage: true,
    });
  }
});
