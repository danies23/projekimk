import { expect, type Page } from "@playwright/test";

/** Masuk lewat halaman login dengan akun demo yang namanya cocok. */
export async function masukSebagai(page: Page, nama: string) {
  await page.goto("/login");
  await page.getByRole("button", { name: new RegExp(nama) }).click();
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}
