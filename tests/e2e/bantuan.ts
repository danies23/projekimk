import { expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { AKUN_DEMO } from "../../lib/domain/demo-accounts";
import { menuUntuk } from "../../lib/domain/izin";

/** Masuk lewat halaman login dengan akun demo yang namanya cocok. */
export async function masukSebagai(page: Page, nama: string) {
  await page.goto("/login");
  await page.getByRole("button", { name: new RegExp(nama) }).click();
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

/**
 * Rute per peran diturunkan dari matriks izin yang sama dengan sidebar, bukan
 * dari daftar ketiga yang harus dijaga serempak (lihat `lib/domain/izin.ts`).
 * Akun kedua untuk peran yang punya dua orang dilewati: rutenya sama.
 */
export const RUTE_PER_PERAN = AKUN_DEMO.filter((a, i, semua) => semua.findIndex((b) => b.peran === a.peran) === i).map(
  (a) => ({ nama: a.nama, rute: menuUntuk(a.peran).map((m) => m.href) }),
);

interface PelanggaranAxe {
  id: string;
  impact: string | null;
  help: string;
  nodes: Array<{ target: string[] }>;
}

const axeSource = readFileSync(path.resolve(__dirname, "../../node_modules/axe-core/axe.min.js"), "utf8");

/**
 * Audit axe pada DOM saat ini. Mengembalikan rangkuman kosong bila bersih, dan
 * menyebut aturan serta elemen yang bermasalah bila tidak — pesan itulah yang
 * muncul pada kegagalan test.
 */
export async function auditAxe(page: Page): Promise<string> {
  await page.addScriptTag({ content: axeSource });
  const pelanggaran = await page.evaluate(async () => {
    const axe = (globalThis as unknown as { axe: { run(c: Document): Promise<{ violations: PelanggaranAxe[] }> } }).axe;
    return (await axe.run(document)).violations;
  });
  return pelanggaran
    .map((p) => `${p.id} (${p.impact}): ${p.help}\n  ${p.nodes.map((n) => n.target.join(" ")).join("\n  ")}`)
    .join("\n");
}

/**
 * Target interaktif yang lebih kecil dari 44×44 px, sudah dirangkai sebagai
 * teks siap tampil pada kegagalan. Overlay Dev Tools milik `next dev` hidup di
 * shadow root sehingga tidak terlihat oleh `closest()`; `getRootNode().host`
 * yang menyaringnya. Overlay itu bukan UI prototipe dan tidak ada di produksi.
 */
export async function targetTerlaluKecil(page: Page, dalamDialog = false): Promise<string[]> {
  const selektor = dalamDialog
    ? "[role=dialog] button, [role=dialog] input, [role=dialog] select, [role=dialog] textarea"
    : "button, a[href], input:not([type=hidden]), select, textarea, [role=menuitem]";
  return page.$$eval(selektor, (elemen) =>
    elemen
      .filter((el) => {
        const akar = el.getRootNode();
        return !(akar instanceof ShadowRoot && akar.host.tagName.toLowerCase() === "nextjs-portal");
      })
      .map((el) => {
        const kotak = el.getBoundingClientRect();
        if (kotak.width === 0 || kotak.height === 0) return null; // tersembunyi, bukan target
        const teks = ((el.textContent ?? "").trim() || el.getAttribute("aria-label") || el.tagName).slice(0, 60);
        return { teks, lebar: Math.round(kotak.width), tinggi: Math.round(kotak.height) };
      })
      .filter((x): x is { teks: string; lebar: number; tinggi: number } => x !== null)
      .filter((x) => x.lebar < 44 || x.tinggi < 44)
      .map((t) => `${t.teks} (${t.lebar}×${t.tinggi})`),
  );
}

/** Kolom formulir yang tidak punya label terhubung maupun `aria-label`. */
export async function kolomTanpaLabel(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll("main input, main select, main textarea, [role=dialog] input, [role=dialog] select, [role=dialog] textarea")]
      .filter((el) => !el.getAttribute("aria-label") && (!el.id || !document.querySelector(`label[for="${el.id}"]`)))
      .map((el) => el.outerHTML.slice(0, 120)),
  );
}
