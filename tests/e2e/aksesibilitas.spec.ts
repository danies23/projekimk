import { expect, test } from "@playwright/test";
import { RUTE_PER_PERAN, auditAxe, masukSebagai } from "./bantuan";

/**
 * Audit axe pada DOM yang benar-benar dirender, bukan pada token desain.
 * `lib/design-tokens.test.ts` sudah menjaga kontras pasangan warna yang
 * dideklarasikan; berkas ini memeriksa hasil akhirnya pada setiap rute per peran.
 */

for (const { nama, rute } of RUTE_PER_PERAN) {
  for (const r of rute) {
    test(`${nama} — ${r} lolos audit axe`, async ({ page }) => {
      await masukSebagai(page, nama);
      await page.goto(r);
      await expect(page.getByRole("main")).toBeVisible();
      expect(await auditAxe(page)).toBe("");
    });
  }
}
