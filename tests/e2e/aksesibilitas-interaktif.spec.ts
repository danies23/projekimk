import { expect, test } from "@playwright/test";
import { auditAxe, kolomTanpaLabel, masukSebagai, targetTerlaluKecil } from "./bantuan";

/**
 * Audit yang sama seperti `aksesibilitas.spec.ts`, tetapi pada keadaan yang
 * hanya muncul setelah interaksi: dialog terbuka dan formulir master yang
 * sedang diperluas. Rute diam tidak pernah merender keadaan ini, sehingga
 * label dan ukuran targetnya belum pernah diukur.
 */

test("dialog reset data demo lolos audit dan targetnya 44×44", async ({ page }) => {
  await masukSebagai(page, "Sari Dewanti");
  await page.getByRole("button", { name: "Reset data demo" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(await auditAxe(page)).toBe("");
  expect(await targetTerlaluKecil(page, true)).toEqual([]);
});

test("dialog pindah bed lolos audit, target 44×44, dan setiap kolom berlabel", async ({ page }) => {
  await masukSebagai(page, "Ns. Dwi Lestari");
  await page.goto("/kamar");
  await page.getByRole("button", { name: /Pindahkan pasien/ }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();

  expect(await auditAxe(page)).toBe("");
  expect(await targetTerlaluKecil(page, true)).toEqual([]);
  expect(await kolomTanpaLabel(page)).toEqual([]);
});

test("dialog serahkan obat lolos audit dan targetnya 44×44", async ({ page }) => {
  await masukSebagai(page, "Nadia Rahmania");
  await page.goto("/farmasi");
  await page.getByRole("region", { name: "Siap diserahkan" }).getByRole("button").first().click();
  await page.getByRole("button", { name: /Serahkan obat/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(await auditAxe(page)).toBe("");
  expect(await targetTerlaluKecil(page, true)).toEqual([]);
});

test("formulir ubah pengguna dan tambah tindakan lolos audit saat terbuka", async ({ page }) => {
  await masukSebagai(page, "Sari Dewanti");
  await page.goto("/administrasi");

  await page.getByRole("button", { name: /^Ubah pengguna/ }).first().click();
  expect(await auditAxe(page)).toBe("");

  await page.getByRole("button", { name: /^Ubah tindakan/ }).first().click();
  expect(await auditAxe(page)).toBe("");

  expect(await kolomTanpaLabel(page), "kolom formulir tanpa label terhubung").toEqual([]);
});

test("formulir master kamar dan obat lolos audit saat terbuka", async ({ page }) => {
  await masukSebagai(page, "Sari Dewanti");

  await page.goto("/kamar");
  await page.getByRole("button", { name: /^Ubah kamar/ }).first().click();
  expect(await auditAxe(page)).toBe("");

  await page.goto("/farmasi");
  await page.getByRole("button", { name: /^Tambah stok/ }).first().click();
  expect(await auditAxe(page)).toBe("");

  expect(await kolomTanpaLabel(page), "kolom formulir tanpa label terhubung").toEqual([]);
});
