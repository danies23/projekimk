import { expect, test } from "@playwright/test";

test("the design system showcase loads and carries the Dani Medical Center identity", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.status()).toBe(200);

  await expect(page.getByRole("banner")).toContainText("Dani Medical Center");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Sistem Desain");

  await expect(page.getByRole("region", { name: "Palet warna" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Tipografi" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Komponen dasar" })).toBeVisible();
});

test("the type scale actually renders different sizes, not one fallback size", async ({ page }) => {
  await page.goto("/");

  const sizes = await page.evaluate(() => {
    const px = (selector: string) => {
      const el = document.querySelector(selector);
      return el ? parseFloat(getComputedStyle(el).fontSize) : NaN;
    };
    return {
      caption: px(".text-caption"),
      small: px(".text-small"),
      heading: px("h2"),
      display: px("h1"),
    };
  });

  // Each step must resolve to its token value; identical sizes mean the
  // utilities are missing and everything fell back to the browser default.
  expect(sizes.caption).toBeCloseTo(12, 0);
  expect(sizes.small).toBeCloseTo(14, 0);
  expect(sizes.heading).toBeCloseTo(28, 0);
  expect(sizes.display).toBeCloseTo(36, 0);
});

test("interactive targets meet the 44px minimum for touch", async ({ page }) => {
  await page.goto("/");

  const buttons = page.getByRole("button");
  const count = await buttons.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i += 1) {
    const box = await buttons.nth(i).boundingBox();
    expect(box, `button ${i} has no box`).not.toBeNull();
    expect(box!.height, `button ${i} is shorter than 44px`).toBeGreaterThanOrEqual(44);
  }
});
