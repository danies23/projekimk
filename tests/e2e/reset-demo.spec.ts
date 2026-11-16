import { expect, test, type Page } from "@playwright/test";
import { masukSebagai } from "./bantuan";

/**
 * Tombol "Reset data demo" di header mengembalikan seluruh data ke kondisi seed
 * dengan konfirmasi, tanpa mengeluarkan pengguna dari perannya. Moderator
 * usability testing memakainya untuk memulai responden berikutnya dari kondisi
 * yang sama persis (spec, user story 112).
 */

test("reset data demo meminta konfirmasi dan mengembalikan data ke kondisi awal", async ({ page }) => {
  await masukSebagai(page, "Ns. Dwi Lestari");
  await page
    .getByRole("navigation", { name: "Navigasi utama" })
    .getByRole("link", { name: "Kamar & Bed" })
    .click();

  // Perubahan sebelum reset: bed yang menunggu dibersihkan ditandai siap pakai.
  const bed = page
    .getByRole("region", { name: "Denah bed" })
    .getByRole("listitem")
    .filter({ hasText: "Mawar II-1-C" });
  await bed.getByRole("button", { name: /Tandai siap dipakai/ }).click();
  await expect(bed).toContainText("kosong");

  const tombol = page.getByRole("banner").getByRole("button", { name: "Reset data demo" });

  // Batal berarti tidak ada yang berubah.
  await tombol.click();
  await page.getByRole("dialog").getByRole("button", { name: "Batal" }).click();
  await expect(bed).toContainText("kosong");

  // Konfirmasi: data kembali ke kondisi seed dan peran tetap aktif.
  await tombol.click();
  await page.getByRole("dialog").getByRole("button", { name: "Ya, reset data demo" }).click();
  await expect(bed).toContainText("dibersihkan");
  await expect(page.getByRole("banner")).toContainText("Ns. Dwi Lestari");
});
