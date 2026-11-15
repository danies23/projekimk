import { expect, test } from "@playwright/test";
import { masukSebagai } from "./bantuan";

/**
 * Modul Klinis untuk perawat: pemantauan tanda vital, instruksi dokter yang
 * belum dijalankan, dan catatan perkembangan. Data demo deterministik.
 */
async function bukaKlinisPerawat(page: import("@playwright/test").Page) {
  await masukSebagai(page, "Ns. Dwi Lestari");
  await page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link", { name: "Klinis" }).click();
  await expect(page).toHaveURL(/\/klinis$/);
  await expect(page.getByRole("heading", { level: 1, name: "Klinis — perawat" })).toBeVisible();
}

async function pilihPasien(page: import("@playwright/test").Page, nama: string) {
  await page
    .getByRole("region", { name: "Pasien yang perlu dipantau" })
    .getByRole("button", { name: new RegExp(nama) })
    .click();
  await expect(page.getByRole("heading", { level: 2, name: nama })).toBeVisible();
}

test("perawat melihat semua pasien dirawat dengan bed, dokter, dan tanda vital terakhir", async ({ page }) => {
  await bukaKlinisPerawat(page);

  const daftar = page.getByRole("region", { name: "Pasien yang perlu dipantau" });
  // Sepuluh admisi aktif dari seed, lintas dokter.
  await expect(daftar.getByRole("button")).toHaveCount(10);
  await expect(daftar).toContainText("dr. Ayu Prameswari");
  await expect(daftar).toContainText("dr. Bagas Nugroho");
  // Tanda vital terakhir tampil ringkas di daftar, bukan hanya di detail.
  await expect(daftar).toContainText(/TD \d{2,3}\/\d{2,3} · [\d.]+°C · N \d+/);

  // Pasien pertama sudah terpilih sehingga kondisi terakhirnya langsung terbaca.
  await expect(page.getByRole("region", { name: "Tanda vital terakhir" })).toContainText("mmHg");
});

test("perawat mencatat tanda vital dan nilainya menggantikan yang terakhir", async ({ page }) => {
  await bukaKlinisPerawat(page);

  await page.getByLabel("Tekanan darah (mmHg)").fill("150/95");
  await page.getByLabel("Suhu (°C)").fill("38.4");
  await page.getByLabel("Nadi (x/menit)").fill("102");
  await page.getByLabel("Pernapasan (x/menit)").fill("22");
  await page.getByLabel("Saturasi (%)").fill("95");
  await page.getByRole("button", { name: "Simpan tanda vital" }).click();

  const terakhir = page.getByRole("region", { name: "Tanda vital terakhir" });
  await expect(terakhir).toContainText("150/95");
  await expect(terakhir).toContainText("38.4");
  await expect(page.getByRole("status").filter({ hasText: "Tanda vital tersimpan" })).toBeAttached();

  // Kolom kosong ditolak dengan pesan pada kolomnya, bukan sebagai angka 0.
  await page.getByLabel("Suhu (°C)").fill("47");
  await page.getByRole("button", { name: "Simpan tanda vital" }).click();
  await expect(page.getByText("Nadi (x/menit)").locator("..").getByText("Wajib diisi.")).toBeVisible();

  // Nilai yang mustahil ditolak store dan tidak masuk ke daftar.
  await page.getByLabel("Tekanan darah (mmHg)").fill("120/80");
  await page.getByLabel("Nadi (x/menit)").fill("88");
  await page.getByLabel("Pernapasan (x/menit)").fill("18");
  await page.getByLabel("Saturasi (%)").fill("97");
  await page.getByRole("button", { name: "Simpan tanda vital" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "rentang wajar" })).toBeVisible();
  await expect(terakhir).toContainText("38.4");
});

test("perawat menandai instruksi dokter sudah dijalankan", async ({ page }) => {
  await bukaKlinisPerawat(page);
  // Dewi Anggraini punya visite dokter dengan rencana yang belum ditandai pada seed.
  await pilihPasien(page, "Dewi Anggraini");

  const instruksi = page.getByRole("region", { name: "Instruksi dokter" });
  const sebelum = await instruksi.locator("li").count();
  expect(sebelum).toBeGreaterThan(0);

  const pertama = instruksi.locator("li").first();
  const rencana = (await pertama.locator("p").first().textContent())!.trim();
  await pertama.getByRole("button", { name: "Tandai sudah dijalankan" }).click();

  await expect(instruksi.locator("li")).toHaveCount(sebelum - 1);
  await expect(instruksi).not.toContainText(rencana);
  // Catatan tetap memuat instruksinya; penandanya bukan penghapusan.
  await expect(page.getByRole("region", { name: "Riwayat klinis pasien" })).toContainText(rencana);
});

test("catatan perkembangan perawat terbaca dokter beserta status instruksi", async ({ page }) => {
  await bukaKlinisPerawat(page);
  await pilihPasien(page, "Dewi Anggraini");

  const konteks = page.getByRole("region", { name: "Konteks admisi" });
  const namaPasien = (await konteks.getByRole("heading", { level: 2 }).textContent())!;
  const dokter = (await konteks
    .locator("div")
    .filter({ hasText: "Dokter penanggung jawab" })
    .locator("dd")
    .textContent())!.trim();

  await page.getByRole("region", { name: "Instruksi dokter" }).locator("li").first()
    .getByRole("button", { name: "Tandai sudah dijalankan" }).click();
  await page.getByLabel("Isi catatan").fill("Mobilisasi bertahap, intake cairan 1.500 ml.");
  await page.getByRole("button", { name: "Simpan catatan perkembangan" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Catatan perkembangan tersimpan" })).toBeAttached();

  // Dokter penanggung jawab pasien ini melihat catatan dan penanda instruksi.
  await page.getByRole("button", { name: /Ganti peran/ }).click();
  await page.getByRole("menuitem", { name: new RegExp(dokter) }).click();
  await page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link", { name: "Klinis" }).click();
  await page.getByRole("region", { name: "Pasien saya" }).getByRole("button", { name: new RegExp(namaPasien) }).click();

  const riwayat = page.getByRole("region", { name: "Riwayat klinis pasien" });
  await expect(riwayat).toContainText("Mobilisasi bertahap, intake cairan 1.500 ml.");
  await expect(riwayat).toContainText("Sudah dijalankan");
});
