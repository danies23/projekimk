import { expect, test } from "@playwright/test";
import { RUTE_PER_PERAN, targetTerlaluKecil, masukSebagai } from "./bantuan";

/**
 * Dua kriteria ticket yang tidak tertangkap aturan bawaan axe: target sentuh
 * minimal 44×44 px dan tata letak terbaca pada tablet lanskap.
 */

for (const { nama, rute } of RUTE_PER_PERAN) {
  for (const r of rute) {
    test(`${nama} — ${r}: target interaktif minimal 44×44 px`, async ({ page }) => {
      await masukSebagai(page, nama);
      await page.goto(r);
      await expect(page.getByRole("main")).toBeVisible();
      expect(await targetTerlaluKecil(page), `target di bawah 44×44 px pada ${r}`).toEqual([]);
    });

    test(`${nama} — ${r}: tablet lanskap tanpa scroll horizontal`, async ({ page }) => {
      // iPad lanskap: 1024×768, lebar tablet yang dipakai perawat keliling.
      await page.setViewportSize({ width: 1024, height: 768 });
      await masukSebagai(page, nama);
      await page.goto(r);
      await expect(page.getByRole("main")).toBeVisible();
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth, `halaman ${r} melebar melewati viewport tablet`).toBeLessThanOrEqual(clientWidth);
    });
  }
}
