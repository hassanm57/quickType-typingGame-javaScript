import { test, expect, Page } from "@playwright/test";

const SEED_BLOB = {
  version: 1,
  words: {
    the: {
      attempts: 5,
      errors: 4,
      correctChars: 5,
      incorrectChars: 15,
      totalTimeMs: 5000,
      lastSeen: Date.now(),
    },
    cat: {
      attempts: 5,
      errors: 0,
      correctChars: 15,
      incorrectChars: 0,
      totalTimeMs: 2000,
      lastSeen: Date.now(),
    },
  },
  chars: {
    t: { correct: 2, incorrect: 8 },
    h: { correct: 5, incorrect: 5 },
  },
  totalCommits: 10,
};

async function seedWordStats(page: Page, blob: unknown = SEED_BLOB) {
  await page.addInitScript((data) => {
    localStorage.setItem("qt:wordstats", JSON.stringify(data));
  }, blob);
}

test.describe("Rankings page", () => {
  test("shows empty state on a fresh profile", async ({ page }) => {
    await page.goto("/rankings");
    await page.waitForSelector(".rankings-title");
    await expect(page.locator(".rankings-empty-card")).toBeVisible();
    await expect(page.locator(".rankings-grid")).toHaveCount(0);
  });

  test("renders weak and mastered word rows after seeding stats", async ({ page }) => {
    await seedWordStats(page);
    await page.goto("/rankings");
    await page.waitForSelector(".rankings-grid");

    await expect(page.locator(".rank-word-weak", { hasText: "the" })).toBeVisible();
    await expect(page.locator(".rank-word-mastered", { hasText: "cat" })).toBeVisible();
  });

  test("reset stats clears the lists back to the empty state", async ({ page }) => {
    await seedWordStats(page);
    await page.goto("/rankings");
    await page.waitForSelector(".rankings-grid");

    page.once("dialog", (dialog) => dialog.accept());
    await page.click(".rankings-reset");

    await expect(page.locator(".rankings-empty-card")).toBeVisible({ timeout: 3000 });
  });

  test("header rankings link navigates from / to /rankings and back", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".config-bar");
    await page.click('a.icon-btn[aria-label="Rankings"]');
    await expect(page).toHaveURL(/\/rankings$/);
    await page.click('a.icon-btn[aria-label="Rankings"]');
    await expect(page).toHaveURL(/\/$/);
  });
});
