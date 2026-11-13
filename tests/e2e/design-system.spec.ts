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
