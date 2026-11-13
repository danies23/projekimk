import { expect, test, type Page } from "@playwright/test";
import { masukSebagai } from "./bantuan";

/**
 * Modul Klinis untuk dokter. Setiap test memakai konteks peramban baru
 * sehingga data demo ditanam ulang; nama pasien dan tindakan berasal dari seed
 * yang deterministik.
 */

async function bukaKlinis(page: Page) {
  await masukSebagai(page, "dr. Ayu Prameswari");
  await page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link", { name: "Klinis" }).click();
  await expect(page).toHaveURL(/\/klinis$/);
}

async function pilihPasien(page: Page, nama: string) {
  await page.getByRole("region", { name: "Pasien saya" }).getByRole("button", { name: new RegExp(nama) }).click();
  await expect(page.getByRole("heading", { level: 2, name: nama })).toBeVisible();
}

test("dokter melihat pasien tanggung jawabnya dan konteks admisi sebelum menulis", async ({ page }) => {
  await bukaKlinis(page);

  const daftar = page.getByRole("region", { name: "Pasien saya" });
  // dr. Ayu menangani lima admisi aktif; pasien dr. Bagas tidak boleh muncul.
  await expect(daftar.getByRole("button")).toHaveCount(5);
  await expect(daftar).toContainText("Siti Rahmawati");
  await expect(daftar).not.toContainText("Ahmad Fauzi");

  await pilihPasien(page, "Siti Rahmawati");

  const konteks = page.getByRole("region", { name: "Konteks admisi" });
  await expect(konteks).toContainText(/RM-\d{4}-\d+/);
  await expect(konteks).toContainText("Anggrek VIP-1-B");
  await expect(konteks).toContainText("Tanggal masuk");
  await expect(konteks).toContainText("Diagnosa awal");
});

test("visite menolak catatan tanpa diagnosa atau rencana", async ({ page }) => {
  await bukaKlinis(page);
  await pilihPasien(page, "Siti Rahmawati");

  await page.getByLabel("Isi visite").fill("Pasien membaik.");
  await page.getByRole("button", { name: "Simpan catatan visite" }).click();

  await expect(page.getByText("Diagnosa wajib diisi.")).toBeVisible();
  await expect(page.getByText("Rencana wajib diisi.")).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Riwayat klinis pasien" }).getByText("Pasien membaik."),
  ).toHaveCount(0);
});

test("visite, tindakan, dan resep langsung tercatat pada riwayat", async ({ page }) => {
  await bukaKlinis(page);
  await pilihPasien(page, "Siti Rahmawati");

  await page.getByLabel("Isi visite").fill("Demam mereda, pasien dapat makan sendiri.");
  await page.getByLabel("Diagnosa", { exact: true }).fill("Demam tifoid");
  await page.getByLabel("Rencana").fill("Lanjut antibiotik, cek darah besok.");
  await page.getByRole("button", { name: "Simpan catatan visite" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Catatan visite tersimpan" })).toBeAttached();
  await expect(page.getByRole("region", { name: "Riwayat klinis pasien" })).toContainText(
    "Demam mereda, pasien dapat makan sendiri.",
  );

  await page.getByLabel("Tindakan dari master").selectOption({ label: "Pemasangan infus — Rp150.000" });
  await page.getByRole("button", { name: "Tambahkan tindakan" }).click();
  const tindakan = page.getByRole("region", { name: "Tindakan" });
  // Seed sudah memuat Nebulisasi Rp90.000 oleh dokter ini pada admisi yang sama.
  await expect(tindakan).toContainText("Total tindakan yang Anda tambahkan pada admisi ini: Rp240.000");
  await expect(tindakan.getByRole("row", { name: /Pemasangan infus/ })).toBeVisible();

  await page.getByLabel("Obat").selectOption({ label: "Paracetamol 500 mg (tablet)" });
  await page.getByLabel("Jumlah").fill("10");
  await page.getByLabel("Aturan pakai").fill("3×1 sesudah makan");
  await page.getByRole("button", { name: "Tambahkan ke resep" }).click();
  await page.getByRole("button", { name: "Buat resep" }).click();

  const resep = page.getByRole("region", { name: "Resep" });
  await expect(resep).toContainText("Paracetamol 500 mg — 10 · 3×1 sesudah makan");
  await expect(resep).toContainText("Menunggu");
  // Resep yang sudah ada sebelumnya tetap menampilkan statusnya.
  await expect(resep).toContainText("Disiapkan");
  await expect(page.getByRole("region", { name: "Riwayat klinis pasien" })).toContainText(
    "Paracetamol 500 mg — 10 · 3×1 sesudah makan",
  );
});

test("riwayat klinis menampilkan catatan perawat dan penanda koreksi", async ({ page }) => {
  await bukaKlinis(page);
  await pilihPasien(page, "Siti Rahmawati");

  const riwayat = page.getByRole("region", { name: "Riwayat klinis pasien" });
  // Catatan perawat ikut terbaca dokter.
  await expect(riwayat).toContainText("Catatan perkembangan");
  await expect(riwayat).toContainText("Ditulis oleh Ns. Dwi Lestari");
  // Catatan yang dikoreksi pada seed ditandai dan menunjuk koreksinya.
  await expect(riwayat).toContainText("Telah dikoreksi");
  await expect(riwayat).toContainText("Dikoreksi oleh catatan:");
  await expect(riwayat).toContainText("Koreksi: demam turun sejak kemarin");

  // Catatan perawat yang belum dikoreksi pada seed.
  const catatanBiasa = riwayat
    .locator("li")
    .filter({ hasText: "Pasien tidur nyenyak, intake cairan cukup, mobilisasi dibantu." });
  await catatanBiasa.getByRole("button", { name: /Koreksi catatan/ }).click();
  await page.getByLabel("Isi koreksi").fill("Koreksi: tekanan darah 120/80, nadi 80.");
  await page.getByRole("button", { name: "Simpan koreksi" }).click();

  await expect(riwayat).toContainText("Koreksi: tekanan darah 120/80, nadi 80.");
  // Dua pasangan asli–koreksi: satu dari seed, satu baru.
  await expect(riwayat.getByText("Telah dikoreksi")).toHaveCount(2);
  await expect(riwayat.getByText(/Mengoreksi catatan:/)).toHaveCount(2);
});
