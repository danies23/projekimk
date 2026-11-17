import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { masukSebagai } from "./bantuan";

/**
 * Audit aksesibilitas pada DOM yang benar-benar dirender, bukan pada token
 * desain. `lib/design-tokens.test.ts` sudah menjaga kontras pasangan warna yang
 * dideklarasikan; berkas ini memeriksa hasil akhirnya — termasuk label, ukuran
 * target sentuh, dan arah fokus — pada setiap rute untuk setiap peran.
 */

const axeSource = readFileSync(path.resolve(__dirname, "../../node_modules/axe-core/axe.min.js"), "utf8");

/** Rute yang dapat dibuka tiap peran, dibaca dari matriks izin (spec user story 108). */
const RUTE_PER_PERAN: Array<{ nama: string; rute: string[] }> = [
  { nama: "Rina Kartika", rute: ["/dashboard", "/pendaftaran", "/kamar"] },
  { nama: "dr. Ayu Prameswari", rute: ["/dashboard", "/klinis"] },
  { nama: "Ns. Dwi Lestari", rute: ["/dashboard", "/klinis", "/kamar"] },
  { nama: "Nadia Rahmania", rute: ["/dashboard", "/farmasi", "/laporan"] },
  { nama: "Joko Susilo", rute: ["/dashboard", "/kasir", "/laporan"] },
  { nama: "Hendra Wijaya", rute: ["/dashboard", "/laporan"] },
  {
    nama: "Sari Dewanti",
    rute: ["/dashboard", "/kamar", "/farmasi", "/kasir", "/laporan", "/administrasi", "/administrasi/audit"],
  },
];

interface PelanggaranAxe {
  id: string;
  impact: string | null;
  help: string;
  nodes: Array<{ target: string[]; failureSummary?: string }>;
}

/** Audit penuh pada DOM saat ini; hasilnya dirangkai agar kegagalan terbaca. */
async function auditAxe(page: Page): Promise<string> {
  await page.addScriptTag({ content: axeSource });
  const pelanggaran = await page.evaluate(async () => {
    const axe = (globalThis as unknown as { axe: { run(context: Document): Promise<{ violations: PelanggaranAxe[] }> } }).axe;
    return (await axe.run(document)).violations;
  });
  return pelanggaran
    .map((p) => `${p.id} (${p.impact}): ${p.help}\n  ${p.nodes.map((n) => n.target.join(" ")).join("\n  ")}`)
    .join("\n");
}

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
