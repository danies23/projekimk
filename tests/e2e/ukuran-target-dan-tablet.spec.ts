import { expect, test, type Page } from "@playwright/test";
import { masukSebagai } from "./bantuan";

/**
 * Dua kriteria ticket yang tidak tertangkap aturan bawaan axe:
 * target sentuh minimal 44×44 px dan tata letak terbaca pada tablet lanskap.
 */

/** Setiap rute yang dikunjungi; cukup satu peran berhak per rute. */
const RUTE: Array<{ peran: string; rute: string[] }> = [
  { peran: "Rina Kartika", rute: ["/dashboard", "/pendaftaran", "/kamar"] },
  { peran: "Ns. Dwi Lestari", rute: ["/klinis", "/kamar"] },
  { peran: "Nadia Rahmania", rute: ["/farmasi", "/laporan"] },
  { peran: "Joko Susilo", rute: ["/kasir", "/laporan"] },
  { peran: "Hendra Wijaya", rute: ["/laporan"] },
  { peran: "Sari Dewanti", rute: ["/administrasi", "/administrasi/audit"] },
];

/** Target sentuh sekecil apa pun yang bisa ditekan keyboard atau mouse. */
const SELEKTOR_TARGET = "button, a[href], input:not([type=hidden]), select, textarea, [role=menuitem]";

/**
 * `next dev` menyisipkan overlay Dev Tools-nya sendiri ke setiap halaman.
 * Itu UI Next.js, bukan UI prototipe ini, dan tidak ada pada build produksi.
 */
const SELEKTOR_DEV_TOOLS = "nextjs-portal";

async function ukurTarget(page: Page) {
  return page.$$eval(SELEKTOR_TARGET, (elemen, tagDevTools) =>
    elemen
      .filter((el) => {
        // Overlay Dev Tools hidup di shadow root, yang tidak dilewati `closest()`.
        const akar = el.getRootNode();
        return !(akar instanceof ShadowRoot && akar.host.tagName.toLowerCase() === tagDevTools);
      })
      .map((el) => {
        const kotak = el.getBoundingClientRect();
        if (kotak.width === 0 || kotak.height === 0) return null; // tersembunyi, bukan target
        const teks = (el.textContent ?? "").trim().slice(0, 60) || el.getAttribute("aria-label") || el.tagName;
        return { teks, lebar: Math.round(kotak.width), tinggi: Math.round(kotak.height) };
      })
      .filter((x): x is { teks: string; lebar: number; tinggi: number } => x !== null)
      .filter((x) => x.lebar < 44 || x.tinggi < 44),
    SELEKTOR_DEV_TOOLS,
  );
}

for (const { peran, rute } of RUTE) {
  for (const r of rute) {
    test(`${peran} — ${r}: target interaktif minimal 44×44 px`, async ({ page }) => {
      await masukSebagai(page, peran);
      await page.goto(r);
      await expect(page.getByRole("main")).toBeVisible();
      const terlaluKecil = await ukurTarget(page);
      expect(
        terlaluKecil.map((t) => `${t.teks} (${t.lebar}×${t.tinggi})`),
        `target di bawah 44×44 px pada ${r}`,
      ).toEqual([]);
    });

    test(`${peran} — ${r}: tablet lanskap tanpa scroll horizontal`, async ({ page }) => {
      // iPad lanskap: 1024×768, lebar tablet yang dipakai perawat keliling.
      await page.setViewportSize({ width: 1024, height: 768 });
      await masukSebagai(page, peran);
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
