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
  nodes: Array<{ target: string[]; any?: Array<{ message: string }> }>;
}

const axeSource = readFileSync(path.resolve(__dirname, "../../node_modules/axe-core/axe.min.js"), "utf8");

/**
 * Audit axe pada DOM saat ini. Mengembalikan rangkuman kosong bila bersih, dan
 * menyebut aturan serta elemen yang bermasalah bila tidak — pesan itulah yang
 * muncul pada kegagalan test.
 *
 * Node yang axe lewati tidak ikut dilaporkan di sini: sebagian besar hanya
 * "latar tertutup elemen lain" pada daftar bertumpuk, bukan kegagalan. Yang
 * benar-benar tidak terbaca axe — teks SVG — diukur oleh `kontrasTakTerukur`.
 */
export async function auditAxe(page: Page): Promise<string[]> {
  await page.addScriptTag({ content: axeSource });
  const pelanggaran = await page.evaluate(async () => {
    const axe = (globalThis as unknown as { axe: { run(c: Document): Promise<{ violations: PelanggaranAxe[] }> } }).axe;
    return (await axe.run(document)).violations;
  });
  return pelanggaran.map(
    (p) => `${p.id} (${p.impact}): ${p.help} — ${p.nodes.map((n) => n.target.join(" ")).join("; ")}`,
  );
}

/**
 * Ukur sendiri kontras teks yang axe lewati: isi SVG dan teks yang latarnya
 * tertutup elemen lain. Rumusnya WCAG yang sama; ambang 4.5:1 karena semua
 * teks ini berukuran normal.
 */
export async function kontrasTakTerukur(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const kanal = (v: number) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    const parse = (warna: string): [number, number, number] | null => {
      const hex = warna.match(/^#([0-9a-f]{6})$/i);
      if (hex) return [0, 2, 4].map((i) => parseInt(hex[1]!.slice(i, i + 2), 16)) as [number, number, number];
      const rgb = warna.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
      return null;
    };
    /** Latar efektif: leluhur terdekat yang benar-benar berwarna (SVG tak punya latar sendiri). */
    const latar = (el: Element): string => {
      for (let n: Element | null = el; n; n = n.parentElement) {
        const w = getComputedStyle(n).backgroundColor;
        if (w && w !== "rgba(0, 0, 0, 0)" && w !== "transparent") return w;
      }
      return "#ffffff";
    };
    const periksa = (el: Element): string | null => {
      const teks = (el.textContent ?? "").trim();
      if (!teks || el.getAttribute("aria-hidden") === "true") return null;
      const fg = parse(el instanceof SVGElement ? getComputedStyle(el).fill : getComputedStyle(el).color);
      const bg = parse(latar(el));
      if (!fg || !bg) return `${teks}: warna tidak terbaca`;
      const [a, b] = [fg, bg].map(([r, g, b]) => 0.2126 * kanal(r) + 0.7152 * kanal(g) + 0.0722 * kanal(b));
      const rasio = (Math.max(a!, b!) + 0.05) / (Math.min(a!, b!) + 0.05);
      return rasio < 4.5 ? `${teks}: ${rasio.toFixed(2)}:1` : null;
    };
    // Teks SVG seluruhnya; axe tidak membaca latar SVG sama sekali.
    const kandidat = [...document.querySelectorAll("main svg text")];
    return kandidat.map(periksa).filter((x): x is string => x !== null);
  });
}

/**
 * Target interaktif yang lebih kecil dari 44×44 px, sudah dirangkai sebagai
 * teks siap tampil pada kegagalan. Overlay Dev Tools milik `next dev` hidup di
 * shadow root sehingga tidak terlihat oleh `closest()`; `getRootNode().host`
 * yang menyaringnya. Overlay itu bukan UI prototipe dan tidak ada di produksi.
 *
 * Kotak radio dan checkbox memang kecil; yang diukur adalah label pembungkusnya,
 * karena di sanalah pengguna mouse dan sentuh menekan.
 */
export async function targetTerlaluKecil(page: Page, dalamDialog = false): Promise<string[]> {
  const selektor = dalamDialog
    ? "[role=dialog] button, [role=dialog] input, [role=dialog] select, [role=dialog] textarea, [role=dialog] a[href]"
    : "button, a[href], input:not([type=hidden]), select, textarea, [role=menuitem]";
  return page.$$eval(selektor, (elemen) =>
    elemen
      .filter((el) => {
        const akar = el.getRootNode();
        return !(akar instanceof ShadowRoot && akar.host.tagName.toLowerCase() === "nextjs-portal");
      })
      .map((el) => {
        const label = el.closest("label");
        const kotak = (label instanceof HTMLElement ? label : el).getBoundingClientRect();
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
