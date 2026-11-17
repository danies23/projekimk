import { expect, test } from "@playwright/test";
import { RUTE_PER_PERAN, auditAxe, kontrasTakTerukur, masukSebagai } from "./bantuan";

/**
 * Audit axe pada DOM yang benar-benar dirender, bukan pada token desain.
 * `lib/design-tokens.test.ts` sudah menjaga kontras pasangan warna yang
 * dideklarasikan; berkas ini memeriksa hasil akhirnya pada setiap rute per peran.
 *
 * Kontras diukur dua kali: oleh axe untuk teks HTML, dan oleh `kontrasTakTerukur`
 * untuk teks SVG yang tidak dibaca axe sama sekali. Rute di luar matriks peran
 * (login, akar, sistem desain) diaudit terpisah karena tidak butuh sesi.
 */

for (const { nama, rute } of RUTE_PER_PERAN) {
  for (const r of rute) {
    test(`${nama} — ${r} lolos audit axe dan kontras terukur`, async ({ page }) => {
      await masukSebagai(page, nama);
      await page.goto(r);
      await expect(page.getByRole("main")).toBeVisible();
      expect(await auditAxe(page)).toEqual([]);
      expect(await kontrasTakTerukur(page), `kontras teks SVG pada ${r}`).toEqual([]);
    });
  }
}

for (const r of ["/login", "/design-system"]) {
  test(`${r} lolos audit axe dan kontras terukur tanpa sesi`, async ({ page }) => {
    await page.goto(r);
    await expect(page.getByRole("main")).toBeVisible();
    expect(await auditAxe(page)).toEqual([]);
    expect(await kontrasTakTerukur(page), `kontras teks SVG pada ${r}`).toEqual([]);
  });
}
