import { expect, test } from "@playwright/test";
test("compact game layouts keep scores and touch controls accessible on phones", async ({
  browser,
}) => {
  const context = await browser.newContext({
      isMobile: true,
      hasTouch: true,
      viewport: { width: 390, height: 844 },
    }),
    page = await context.newPage();
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 360, height: 740 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    for (const slug of ["maze", "memory-match", "snake", "2048"]) {
      await page.goto(`/games/${slug}`);
      await expect(page.locator(".game-hud")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await expect(
        page.locator(
          ".hero,.explorer-note,.timer-policy,.mini-board-caption,.below-game,.game-sidebar",
        ),
      ).toHaveCount(0);
      const board = page.locator(
        slug === "maze"
          ? ".maze-canvas"
          : slug === "memory-match"
            ? ".memory-board"
            : slug === "snake"
              ? ".snake-playfield"
              : ".board-2048",
      );
      const bounds = (await board.boundingBox())!;
      expect(bounds.width).toBeGreaterThanOrEqual(260);
      const hud = (await page.locator(".game-hud").boundingBox())!;
      expect(hud.y + hud.height).toBeLessThanOrEqual(bounds.y);
      const smallTargets = await page
        .locator(
          ".game-heading button,.back-button,.mini-toolbar button,.direction,.memory-card,.theme-toggle",
        )
        .evaluateAll((nodes) =>
          nodes
            .filter((el) => {
              const r = el.getBoundingClientRect();
              return r.width < 43.5 || r.height < 43.5;
            })
            .map((el) => ({
              label: el.getAttribute("aria-label") ?? el.textContent,
              width: el.getBoundingClientRect().width,
              height: el.getBoundingClientRect().height,
            })),
        );
      expect(smallTargets).toEqual([]);
      if (viewport.height >= 740 && slug !== "memory-match") {
        const pad = (await page.locator(".dpad").boundingBox())!;
        expect(pad.y + pad.height).toBeLessThanOrEqual(viewport.height);
      }
      if (viewport.width === 390)
        await page.screenshot({
          path: `test-results/compact-${slug}-phone.png`,
          fullPage: true,
        });
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/games/maze");
  for (const shape of ["Triangle", "Hexagon", "Circle"]) {
    await page.getByRole("button", { name: shape, exact: true }).tap();
    await expect(page.locator(".maze-svg")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.getByRole("button", { name: "How to play", exact: true }).tap();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Done", exact: true }).tap();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await context.close();
});
