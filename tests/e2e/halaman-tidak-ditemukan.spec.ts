import { expect, test } from "@playwright/test";

/**
 * Alamat yang tidak ada harus menjelaskan dirinya dan memberi jalan kembali,
 * bukan menampilkan halaman error bawaan Next.js.
 */
test("alamat yang tidak ada menampilkan halaman tidak ditemukan yang menjelaskan", async ({ page }) => {
  await page.goto("/alamat-yang-tidak-ada");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("Halaman tidak ditemukan");
  await expect(page.getByRole("main")).toContainText(/mungkin salah|berganti nama/i);
  await expect(page.getByRole("link", { name: "Kembali ke Dashboard" })).toBeVisible();
});
