import { expect, test, type Page } from "@playwright/test";
import { RUTE_PER_PERAN, targetTerlaluKecil, masukSebagai } from "./bantuan";

/**
 * Dua kriteria ticket yang tidak tertangkap aturan bawaan axe: target sentuh
 * minimal 44×44 px dan tata letak terbaca pada tablet lanskap.
 *
 * Rute diam saja tidak cukup: tombol yang hanya muncul setelah interaksi —
 * langkah 2 wizard dan daftar tagihan yang dibuka — juga harus diukur.
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

/** Keadaan yang hanya muncul setelah interaksi, beserta cara mencapainya. */
const KEADAAN: Array<{ nama: string; peran: string; siapkan: (page: Page) => Promise<void> }> = [
  {
    nama: "langkah 2 pendaftaran (dokter dan pilihan bed)",
    peran: "Rina Kartika",
    siapkan: async (page) => {
      await page.goto("/pendaftaran");
      await page.getByLabel("Kata kunci pencarian").fill("Siti");
      await page.getByRole("region", { name: "Cari pasien lama" }).getByRole("button", { name: /Siti Rahmawati/ }).click();
    },
  },
  {
    nama: "tagihan yang dibuka (rincian dan formulir pembayaran)",
    peran: "Joko Susilo",
    siapkan: async (page) => {
      await page.goto("/kasir");
      await page.getByRole("region", { name: "Daftar tagihan" }).getByRole("button").first().click();
    },
  },
];

for (const { nama, peran, siapkan } of KEADAAN) {
  test(`${nama}: target interaktif minimal 44×44 px`, async ({ page }) => {
    await masukSebagai(page, peran);
    await siapkan(page);
    await expect(page.getByRole("main")).toBeVisible();
    expect(await targetTerlaluKecil(page), `target di bawah 44×44 px pada ${nama}`).toEqual([]);
  });

  test(`${nama}: tablet lanskap tanpa scroll horizontal`, async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await masukSebagai(page, peran);
    await siapkan(page);
    await expect(page.getByRole("main")).toBeVisible();
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth, `${nama} melebar melewati viewport tablet`).toBeLessThanOrEqual(clientWidth);
  });
}
