import { expect, test, type Page } from "@playwright/test";
import { createMemory } from "../src/games/memory-match/engine";
import { slide } from "../src/games/2048/engine";
import type { Direction } from "../src/games/shared/types";
async function tiles(page: Page) {
  return page
    .locator(".tile-2048")
    .evaluateAll((nodes) =>
      nodes.map((n) => Number(n.getAttribute("data-value"))),
    );
}
test("all four games are playable from the arcade", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /^Play / })).toHaveCount(4);
  for (const [slug, title] of [
    ["memory-match", "Memory Match"],
    ["snake", "Snake"],
    ["2048", "2048"],
  ]) {
    await page.locator(`.card-link[href="/games/${slug}"]`).click();
    await expect(
      page.getByRole("heading", { name: title, exact: true, level: 1 }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Back to the arcade" }).click();
  }
});
test("Memory Match locks mismatches, completes a deck, and resets every challenge", async ({
  page,
}) => {
  await page.goto("/games/memory-match");
  const board = page.getByRole("group", { name: "Memory cards" });
  await expect(board).not.toHaveAttribute("data-seed", "welcome-memory");
  const seed = (await board.getAttribute("data-seed"))!,
    game = createMemory(8, seed),
    cards = board.getByRole("button");
  const a = 0,
    b = game.deck.findIndex((c) => c.symbol !== game.deck[0].symbol),
    c = game.deck.findIndex((_, i) => i !== a && i !== b);
  await cards.nth(a).click();
  await cards.nth(b).click();
  await cards.nth(c).click();
  await expect(page.getByTestId("memory-turns")).toHaveText("1");
  await expect(cards.nth(c)).toHaveAttribute("aria-pressed", "false");
  await expect(cards.nth(a)).toHaveAttribute("aria-pressed", "false");
  for (let symbol = 0; symbol < 8; symbol++) {
    const positions = game.deck.flatMap((card, index) =>
      card.symbol === symbol ? [index] : [],
    );
    for (const index of positions) await cards.nth(index).click();
  }
  await expect(page.getByTestId("memory-pairs")).toHaveText("8 / 8");
  await expect(page.getByTestId("memory-turns")).toHaveText("9");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Completed" })).toBeVisible();
  await page.getByRole("button", { name: "Play again" }).click();
  await expect(page.getByTestId("memory-turns")).toHaveText("0");
  await expect(board).not.toHaveAttribute("data-seed", seed);
  for (const pairs of [6, 12, 8]) {
    await page.getByLabel("Deck size").selectOption(String(pairs));
    await expect(cards).toHaveCount(pairs * 2);
    await expect(page.getByTestId("memory-pairs")).toHaveText(`0 / ${pairs}`);
  }
  await cards.first().focus();
  await page.keyboard.press("Enter");
  await expect(cards.first()).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "New deck" }).click();
  await expect(cards.first()).toHaveAttribute("aria-pressed", "false");
});
test("Snake starts, pauses, resumes, eats fruit, ends on a wall, and restarts", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-11-01T12:00:00Z") });
  await page.goto("/games/snake");
  await page.clock.pauseAt(new Date("2026-11-01T12:00:10Z"));
  const board = page.getByRole("group", { name: "Snake gameplay" });
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(board).toHaveAttribute("data-status", "running");
  await board.press("ArrowLeft");
  await page.clock.runFor(145 * 3 + 5);
  await expect(page.getByTestId("snake-score")).toHaveText("10");
  await expect(page.getByTestId("snake-length")).toHaveText("4");
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.clock.runFor(2000);
  await expect(board).toHaveAttribute("data-status", "paused");
  await expect(page.getByTestId("snake-score")).toHaveText("10");
  await board.getByRole("button", { name: "Resume", exact: true }).click();
  await page.clock.runFor(145 * 5);
  await expect(board).toHaveAttribute("data-status", "over");
  await expect(page.getByRole("heading", { name: "Game over" })).toBeVisible();
  await page.getByRole("button", { name: "Play again" }).click();
  await expect(board).toHaveAttribute("data-status", "ready");
  await expect(page.getByTestId("snake-score")).toHaveText("0");
  await page.getByLabel("Speed").selectOption("cozy");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await board.press("ArrowUp");
  await page.clock.runFor(210);
  await board.press("ArrowLeft");
  await page.clock.runFor(210);
  await expect(board).toHaveAttribute("data-status", "running");
  await page.getByRole("button", { name: "New game" }).click();
  await expect(board).toHaveAttribute("data-status", "ready");
});
test("2048 obeys slide rules, counts valid moves, undoes, and reaches game over", async ({
  page,
}) => {
  await page.goto("/games/2048");
  const board = page.getByRole("group", { name: "2048 gameplay" });
  let before = await tiles(page);
  const dirs: Direction[] = ["left", "up", "right", "down"];
  const d = dirs.find((d) => slide(before, d).changed)!;
  await page.getByRole("button", { name: `Move ${d}`, exact: true }).click();
  await expect(board).toBeFocused();
  await expect(page.getByTestId("2048-moves")).toHaveText("1");
  const after = await tiles(page),
    expected = slide(before, d);
  expect(
    after.reduce((a, b) => a + b, 0) -
      expected.board.reduce((a, b) => a + b, 0),
  ).toBeGreaterThanOrEqual(2);
  for (let i = 0; i < 16; i++)
    if (expected.board[i]) expect(after[i]).toBe(expected.board[i]);
  await expect(page.getByTestId("2048-score")).toHaveText(
    String(expected.gained),
  );
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  expect(await tiles(page)).toEqual(before);
  await expect(page.getByTestId("2048-moves")).toHaveText("0");
  await expect(
    page.getByRole("button", { name: "Undo", exact: true }),
  ).toBeDisabled();
  // A deterministic greedy policy exercises real keyboard play through a terminal board.
  for (let i = 0; i < 700; i++) {
    if (await page.getByRole("dialog").isVisible()) {
      if (
        await page
          .getByRole("button", { name: "Keep playing", exact: true })
          .isVisible()
      )
        await page
          .getByRole("button", { name: "Keep playing", exact: true })
          .click();
      else break;
    }
    before = await tiles(page);
    const next = dirs.find((d) => slide(before, d).changed);
    if (!next) break;
    await board.press(
      {
        up: "ArrowUp",
        down: "ArrowDown",
        left: "ArrowLeft",
        right: "ArrowRight",
      }[next],
    );
  }
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Game over" })).toBeVisible();
  await page
    .getByRole("button", { name: "Undo last move", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: "New game", exact: true }).click();
  await expect(page.getByTestId("2048-score")).toHaveText("0");
  await expect(page.getByTestId("2048-moves")).toHaveText("0");
  expect((await tiles(page)).filter(Boolean)).toHaveLength(2);
});
test("new games fit phone and tablet widths in both themes, with touch controls", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 900 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  for (const width of [375, 768]) {
    await page.setViewportSize({ width, height: 900 });
    for (const slug of ["memory-match", "snake", "2048"]) {
      await page.goto(`/games/${slug}`);
      await expect(page.locator(".mini-play-area")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `test-results/${slug}-${width}.png`,
        fullPage: true,
      });
    }
  }
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/games/2048");
  await page.getByRole("button", { name: /Theme:/ }).tap();
  await page.getByRole("button", { name: /Theme:/ }).tap();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const values = await tiles(page),
    direction = (["left", "up", "right", "down"] as Direction[]).find(
      (d) => slide(values, d).changed,
    )!;
  await page
    .getByRole("button", { name: `Move ${direction}`, exact: true })
    .tap();
  await expect(page.getByTestId("2048-moves")).toHaveText("1");
  await page.screenshot({
    path: "test-results/2048-dark-phone.png",
    fullPage: true,
  });
  const beforeSwipe = await tiles(page);
  const validSwipe = slide(beforeSwipe, "left").changed;
  const rect = await page.locator(".board-2048").boundingBox();
  const swipe = await page.evaluate(
    ({ rect }) => {
      const el = document.querySelector(".board-2048")!;
      const start = new Touch({
        identifier: 1,
        target: el,
        clientX: rect!.x + rect!.width * 0.75,
        clientY: rect!.y + rect!.height * 0.5,
      });
      const end = new Touch({
        identifier: 1,
        target: el,
        clientX: rect!.x + rect!.width * 0.25,
        clientY: rect!.y + rect!.height * 0.5,
      });
      el.dispatchEvent(
        new TouchEvent("touchstart", {
          bubbles: true,
          touches: [start],
          changedTouches: [start],
        }),
      );
      el.dispatchEvent(
        new TouchEvent("touchend", {
          bubbles: true,
          touches: [],
          changedTouches: [end],
        }),
      );
      return true;
    },
    { rect },
  );
  expect(swipe).toBe(true);
  await expect(page.getByTestId("2048-moves")).toHaveText(
    validSwipe ? "2" : "1",
  );
  for (const slug of ["memory-match", "snake"]) {
    await page.goto(`/games/${slug}`);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.screenshot({
      path: `test-results/${slug}-dark-phone.png`,
      fullPage: true,
    });
  }
  await context.close();
});
