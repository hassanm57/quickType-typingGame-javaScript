import { test, expect, Page } from "@playwright/test";

async function gotoTest(page: Page) {
  await page.goto("/");
  await page.waitForSelector(".config-bar", { timeout: 10000 });
  await page.evaluate(() => {
    document.getElementById("test")?.scrollIntoView();
  });
}

async function selectMode(page: Page, label: string) {
  await page.click(`.config-btn:has-text("${label}")`);
  // Wait for React to restart and re-focus the input
  await page.waitForTimeout(150);
}

async function selectAmount(page: Page, n: number) {
  await page.click(`.config-group:last-of-type .config-btn:has-text("${n}")`);
  await page.waitForTimeout(150);
}

// Click the test area to trigger focusInput, then type
async function typeChars(page: Page, chars: string) {
  await page.click(".test-area");
  for (const ch of chars) {
    await page.keyboard.type(ch, { delay: 20 });
  }
}

// Read word list from DOM, then type each word + space
async function typeWords(page: Page, count: number) {
  const words = await page.locator(".word").allTextContents();
  await page.click(".test-area");
  for (let i = 0; i < Math.min(count, words.length); i++) {
    const w = words[i].trim();
    for (const ch of w) {
      await page.keyboard.type(ch, { delay: 15 });
    }
    await page.keyboard.type(" ", { delay: 15 });
  }
}

// ── Tests ──────────────────────────────────────────────────────────────────────

test.describe("Timer display", () => {
  test("live stats are hidden when idle", async ({ page }) => {
    await gotoTest(page);
    await expect(page.locator(".live-stats")).not.toBeVisible();
  });

  test("live stats appear after first keystroke", async ({ page }) => {
    await gotoTest(page);
    await typeChars(page, "a");
    await expect(page.locator(".live-stats")).toBeVisible();
    await expect(page.locator(".live-stat-value").first()).toBeVisible();
  });
});

test.describe("Time mode", () => {
  test("timer counts down from selected amount", async ({ page }) => {
    await gotoTest(page);
    await selectMode(page, "time");
    await selectAmount(page, 15);
    await typeChars(page, "a");
    const timer = page.locator(".live-stat-timer");
    await expect(timer).toBeVisible({ timeout: 3000 });
    const first = Number(await timer.textContent());
    expect(first).toBeGreaterThan(0);
    expect(first).toBeLessThanOrEqual(15);
  });

  test("shows wpm stat while typing", async ({ page }) => {
    await gotoTest(page);
    await selectMode(page, "time");
    await typeChars(page, "hello ");
    await expect(page.locator(".live-stat-value").first()).toBeVisible({ timeout: 3000 });
  });

  test("sub-options 15/30/60/120 are selectable", async ({ page }) => {
    await gotoTest(page);
    await selectMode(page, "time");
    for (const n of [15, 30, 60, 120]) {
      await page.click(`.config-group:last-of-type .config-btn:has-text("${n}")`);
      await expect(
        page.locator(`.config-group:last-of-type .config-btn.config-btn-active:has-text("${n}")`)
      ).toBeVisible();
    }
  });
});

test.describe("Words mode", () => {
  test("shows words remaining counter", async ({ page }) => {
    await gotoTest(page);
    await selectMode(page, "words");
    await selectAmount(page, 10);
    await typeChars(page, "a");
    const timer = page.locator(".live-stat-timer");
    await expect(timer).toBeVisible({ timeout: 3000 });
    const raw = (await timer.textContent()) ?? "";
    const val = parseInt(raw, 10);
    expect(val).toBeGreaterThanOrEqual(0);
    expect(val).toBeLessThanOrEqual(10);
  });

  test("completes and shows results after typing all words", async ({ page }) => {
    await gotoTest(page);
    await selectMode(page, "words");
    await selectAmount(page, 10);
    await typeWords(page, 10);
    await expect(page.locator(".results")).toBeVisible({ timeout: 8000 });
  });

  test("sub-options 10/25/50/100 are selectable", async ({ page }) => {
    await gotoTest(page);
    await selectMode(page, "words");
    for (const n of [10, 25, 50, 100]) {
      await page.click(`.config-group:last-of-type .config-btn:has-text("${n}")`);
      await expect(
        page.locator(`.config-group:last-of-type .config-btn.config-btn-active:has-text("${n}")`)
      ).toBeVisible();
    }
  });
});

test.describe("Practice mode", () => {
  test("is selectable", async ({ page }) => {
    await gotoTest(page);
    await selectMode(page, "practice");
    await expect(
      page.locator(".config-btn.config-btn-active:has-text('practice')")
    ).toBeVisible();
  });

  test("sub-options 10/25/50/100 are selectable", async ({ page }) => {
    await gotoTest(page);
    await selectMode(page, "practice");
    for (const n of [10, 25, 50, 100]) {
      await page.click(`.config-group:last-of-type .config-btn:has-text("${n}")`);
      await expect(
        page.locator(`.config-group:last-of-type .config-btn.config-btn-active:has-text("${n}")`)
      ).toBeVisible();
    }
  });

  test("completes and shows results after typing all words (cold start, no prior data)", async ({ page }) => {
    await gotoTest(page);
    await selectMode(page, "practice");
    await selectAmount(page, 10);
    await typeWords(page, 10);
    await expect(page.locator(".results")).toBeVisible({ timeout: 8000 });
  });
});

test.describe("Zen mode", () => {
  test("shows elapsed time counter while running", async ({ page }) => {
    await gotoTest(page);
    await selectMode(page, "zen");
    await typeChars(page, "hello ");
    const timer = page.locator(".live-stat-timer");
    await expect(timer).toBeVisible({ timeout: 3000 });
  });

  test("has no sub-options", async ({ page }) => {
    await gotoTest(page);
    await selectMode(page, "zen");
    const groups = page.locator(".config-group");
    await expect(groups).toHaveCount(1);
  });

  test("words never end — test area stays running", async ({ page }) => {
    await gotoTest(page);
    await selectMode(page, "zen");
    await typeWords(page, 12);
    await expect(page.locator(".words-wrapper")).toBeVisible();
  });
});

test.describe("Survival mode", () => {
  test("shows countdown timer", async ({ page }) => {
    await gotoTest(page);
    await selectMode(page, "survival");
    await typeChars(page, "a");
    const timer = page.locator(".live-stat-timer");
    await expect(timer).toBeVisible({ timeout: 3000 });
    const val = Number(await timer.textContent());
    expect(val).toBeGreaterThan(0);
  });

  test("is selectable", async ({ page }) => {
    await gotoTest(page);
    await selectMode(page, "survival");
    await expect(
      page.locator(".config-btn.config-btn-active:has-text('survival')")
    ).toBeVisible();
  });
});

test.describe("Sudden death mode", () => {
  test("ends test on first wrong character", async ({ page }) => {
    await gotoTest(page);
    await selectMode(page, "sudden death");
    const firstWord = await page.locator(".word").first().textContent();
    if (!firstWord) return;
    const wrong = firstWord[0] === "a" ? "z" : "a";
    await typeChars(page, wrong);
    await expect(page.locator(".results")).toBeVisible({ timeout: 4000 });
  });

  test("is selectable", async ({ page }) => {
    await gotoTest(page);
    await selectMode(page, "sudden death");
    await expect(
      page.locator(".config-btn.config-btn-active:has-text('sudden death')")
    ).toBeVisible();
  });
});

test.describe("Tab restart", () => {
  test("pressing Tab resets test back to idle", async ({ page }) => {
    await gotoTest(page);
    await typeChars(page, "hello");
    await expect(page.locator(".live-stats")).toBeVisible({ timeout: 3000 });
    await page.keyboard.press("Tab");
    await expect(page.locator(".live-stats")).not.toBeVisible({ timeout: 2000 });
  });
});

test.describe("UI elements", () => {
  test("config bar is visible on load", async ({ page }) => {
    await gotoTest(page);
    await expect(page.locator(".config-bar")).toBeVisible();
  });

  test("caret is visible in words area", async ({ page }) => {
    await gotoTest(page);
    await expect(page.locator(".caret")).toBeVisible();
  });

  test("words wrapper renders words", async ({ page }) => {
    await gotoTest(page);
    const words = page.locator(".word");
    await expect(words.first()).toBeVisible();
    expect(await words.count()).toBeGreaterThan(5);
  });
});
