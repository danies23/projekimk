import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { masukSebagai } from "./bantuan";

/**
 * Audit yang sama seperti `aksesibilitas.spec.ts`, tetapi pada keadaan yang
 * hanya muncul setelah interaksi: dialog terbuka dan formulir master yang
 * sedang diperluas. Rute diam tidak pernah merender keadaan ini, sehingga
 * label, ukuran target, dan kontrasnya belum pernah diukur.
 */

const axeSource = readFileSync(path.resolve(__dirname, "../../node_modules/axe-core/axe.min.js"), "utf8");

async function auditAxe(page: Page): Promise<string> {
  await page.addScriptTag({ content: axeSource });
  const pelanggaran = await page.evaluate(async () => {
    const axe = (globalThis as unknown as { axe: { run(c: Document): Promise<{ violations: Array<Record<string, unknown>> }> } }).axe;
    return (await axe.run(document)).violations as Array<{
      id: string;
      impact: string | null;
      help: string;
      nodes: Array<{ target: string[] }>;
    }>;
  });
  return pelanggaran
    .map((p) => `${p.id} (${p.impact}): ${p.help}\n  ${p.nodes.map((n) => n.target.join(" ")).join("\n  ")}`)
    .join("\n");
}

async function ukurTarget(page: Page) {
  return page.$$eval("dialog button, [role=dialog] button, dialog input, [role=dialog] input, [role=dialog] select, [role=dialog] textarea", (elemen) =>
    elemen
      .map((el) => {
        const k = el.getBoundingClientRect();
        if (k.width === 0 || k.height === 0) return null;
        const teks = ((el.textContent ?? "").trim() || el.getAttribute("aria-label") || el.tagName).slice(0, 60);
        return { teks, lebar: Math.round(k.width), tinggi: Math.round(k.height) };
      })
      .filter((x): x is { teks: string; lebar: number; tinggi: number } => x !== null)
      .filter((x) => x.lebar < 44 || x.tinggi < 44)
      .map((t) => `${t.teks} (${t.lebar}×${t.tinggi})`),
  );
}

test("dialog reset data demo lolos audit dan targetnya 44×44", async ({ page }) => {
  await masukSebagai(page, "Sari Dewanti");
  await page.getByRole("button", { name: "Reset data demo" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  expect(await auditAxe(page)).toBe("");
  expect(await ukurTarget(page)).toEqual([]);
});

test("dialog pindah bed lolos audit, target 44×44, dan setiap kolom berlabel", async ({ page }) => {
  await masukSebagai(page, "Ns. Dwi Lestari");
  await page.goto("/kamar");
  await page.getByRole("button", { name: /Pindahkan pasien/ }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  expect(await auditAxe(page)).toBe("");
  expect(await ukurTarget(page)).toEqual([]);
  // Setiap kolom formulir di dalam dialog punya label yang terhubung.
  const tanpaLabel = await dialog.evaluate((d) =>
    [...d.querySelectorAll("input, select, textarea")]
      .filter((el) => el.id && !d.querySelector(`label[for="${el.id}"]`) && !el.getAttribute("aria-label"))
      .map((el) => el.id),
  );
  expect(tanpaLabel).toEqual([]);
});

test("dialog serahkan obat lolos audit dan targetnya 44×44", async ({ page }) => {
  await masukSebagai(page, "Nadia Rahmania");
  await page.goto("/farmasi");
  await page.getByRole("region", { name: /Sudah diserahkan|Siap diserahkan|Menunggu/ }).getByRole("button").first().click();
  // Hanya resep berstatus disiapkan yang bisa diserahkan; kalau yang terpilih
  // bukan, tes memilih ulang kelompok yang benar.
  const tombolSerah = page.getByRole("button", { name: /Serahkan obat/ });
  if (await tombolSerah.count() === 0) {
    await page.getByRole("region", { name: "Siap diserahkan" }).getByRole("button").first().click();
  }
  await tombolSerah.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  expect(await auditAxe(page)).toBe("");
  expect(await ukurTarget(page)).toEqual([]);
});

test("formulir ubah pengguna dan tambah tindakan lolos audit saat terbuka", async ({ page }) => {
  await masukSebagai(page, "Sari Dewanti");
  await page.goto("/administrasi");

  await page.getByRole("button", { name: /^Ubah pengguna/ }).first().click();
  expect(await auditAxe(page)).toBe("");

  await page.getByRole("button", { name: /^Ubah tindakan/ }).first().click();
  expect(await auditAxe(page)).toBe("");

  const tanpaLabel = await page.evaluate(() =>
    [...document.querySelectorAll("main input, main select, main textarea")]
      .filter((el) => !el.getAttribute("aria-label") && (!el.id || !document.querySelector(`label[for="${el.id}"]`)))
      .map((el) => el.outerHTML.slice(0, 120)),
  );
  expect(tanpaLabel, "kolom formulir tanpa label terhubung").toEqual([]);
});

test("formulir master kamar dan obat lolos audit saat terbuka", async ({ page }) => {
  await masukSebagai(page, "Sari Dewanti");

  await page.goto("/kamar");
  await page.getByRole("button", { name: /^Ubah kamar/ }).first().click();
  expect(await auditAxe(page)).toBe("");

  await page.goto("/farmasi");
  await page.getByRole("button", { name: /^Tambah stok/ }).first().click();
  expect(await auditAxe(page)).toBe("");

  const tanpaLabel = await page.evaluate(() =>
    [...document.querySelectorAll("main input, main select, main textarea")]
      .filter((el) => !el.getAttribute("aria-label") && (!el.id || !document.querySelector(`label[for="${el.id}"]`)))
      .map((el) => el.outerHTML.slice(0, 120)),
  );
  expect(tanpaLabel, "kolom formulir tanpa label terhubung").toEqual([]);
});
