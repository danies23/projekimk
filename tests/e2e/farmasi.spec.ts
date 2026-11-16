import { expect, test, type Page } from "@playwright/test";
import { masukSebagai } from "./bantuan";

/**
 * Modul Farmasi. Setiap test memakai konteks peramban baru sehingga data demo
 * ditanam ulang; nama pasien, obat, dan stok berasal dari seed deterministik.
 */

async function bukaFarmasi(page: Page, nama = "Nadia Rahmania") {
  await masukSebagai(page, nama);
  await page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link", { name: "Farmasi" }).click();
  await expect(page).toHaveURL(/\/farmasi$/);
}

async function pilihResep(page: Page, namaPasien: string) {
  await page
    .getByRole("region", { name: "Antrean resep" })
    .getByRole("button", { name: new RegExp(namaPasien) })
    .first()
    .click();
  await expect(page.getByRole("heading", { level: 2, name: `Resep ${namaPasien}` })).toBeVisible();
}

test("antrean resep dikelompokkan per status dan rinciannya memuat pasien, dokter, dan obat", async ({ page }) => {
  await bukaFarmasi(page);

  const antrean = page.getByRole("region", { name: "Antrean resep" });
  const menunggu = antrean.getByRole("region", { name: "Menunggu disiapkan" });
  const disiapkan = antrean.getByRole("region", { name: "Siap diserahkan" });
  const diserahkan = antrean.getByRole("region", { name: "Sudah diserahkan" });

  // Seed: dua resep menunggu, dua disiapkan, dua diserahkan.
  await expect(menunggu.getByRole("button")).toHaveCount(2);
  await expect(disiapkan.getByRole("button")).toHaveCount(2);
  await expect(diserahkan.getByRole("button")).toHaveCount(2);
  await expect(menunggu).toContainText("Ahmad Fauzi");

  await pilihResep(page, "Ahmad Fauzi");
  const detail = page.getByRole("region", { name: "Detail resep" });
  await expect(detail).toContainText("RM-");
  await expect(detail).toContainText("dr. Bagas Nugroho");
  await expect(detail.getByRole("row", { name: /Amlodipine 10 mg/ })).toContainText("1×1 pagi");
  await expect(detail).toContainText("Rp75.000");
  // Resep belum diserahkan, jadi biaya obat belum masuk tagihan.
  await expect(detail).toContainText("Rp0");
});

test("apoteker menyiapkan lalu menyerahkan obat; stok turun dan tagihan bertambah", async ({ page }) => {
  await bukaFarmasi(page);
  await pilihResep(page, "Ahmad Fauzi");

  const detail = page.getByRole("region", { name: "Detail resep" });
  await detail.getByRole("button", { name: "Mulai siapkan" }).click();
  await expect(detail).toContainText("Disiapkan");
  await expect(page.getByRole("status").filter({ hasText: "sedang disiapkan" })).toBeAttached();

  await detail.getByRole("button", { name: "Serahkan obat" }).click();
  // Penyerahan tidak dapat dibatalkan, jadi dikonfirmasi lebih dulu.
  await page.getByRole("dialog").getByRole("button", { name: "Ya, serahkan obat" }).click();
  await expect(detail).toContainText("Diserahkan");
  await expect(page.getByRole("status").filter({ hasText: "Obat diserahkan" })).toBeAttached();
  // 30 tablet Amlodipine Rp2.500 = Rp75.000 masuk tagihan admisi ini.
  await expect(detail).toContainText("Biaya obat pada tagihan admisi ini");
  await expect(detail.getByText("Rp75.000").last()).toBeVisible();
  // Tidak ada tombol penyerahan lagi setelah obat diserahkan.
  await expect(detail.getByRole("button", { name: "Serahkan obat" })).toHaveCount(0);

  const daftarObat = page.getByRole("region", { name: "Daftar obat" });
  await expect(daftarObat.getByRole("row", { name: /Amlodipine 10 mg/ })).toContainText("210");
});

test("master obat menandai stok menipis dengan teks, bukan warna saja", async ({ page }) => {
  await bukaFarmasi(page);

  const daftarObat = page.getByRole("region", { name: "Daftar obat" });
  await expect(daftarObat.getByRole("row", { name: /Amoxicillin 500 mg/ })).toContainText("Stok menipis");
  await expect(daftarObat.getByRole("row", { name: /Furosemide 40 mg/ })).toContainText("Stok menipis");
  await expect(daftarObat.getByRole("row", { name: /Paracetamol 500 mg/ })).not.toContainText("Stok menipis");
  // Satuan, harga, dan stok minimum ikut terbaca.
  await expect(daftarObat.getByRole("row", { name: /Amoxicillin 500 mg/ })).toContainText("kapsul");
});

test("apoteker menambah stok dan pergerakannya tercatat di riwayat obat", async ({ page }) => {
  await bukaFarmasi(page);

  const daftarObat = page.getByRole("region", { name: "Daftar obat" });
  const baris = daftarObat.getByRole("row", { name: /Amoxicillin 500 mg/ });
  await baris.getByRole("button", { name: /Tambah stok/ }).click();
  await page.getByLabel("Jumlah masuk (kapsul)").fill("100");
  await page.getByRole("button", { name: "Simpan barang masuk" }).click();

  await expect(page.getByRole("status").filter({ hasText: "Stok Amoxicillin 500 mg bertambah" })).toBeAttached();
  // 60 + 100 = 160, sehingga penanda stok menipis hilang.
  await expect(daftarObat.getByRole("row", { name: /Amoxicillin 500 mg/ })).toContainText("160");
  await expect(daftarObat.getByRole("row", { name: /Amoxicillin 500 mg/ })).not.toContainText("Stok menipis");

  await baris.getByRole("button", { name: /Riwayat/ }).click();
  const riwayat = page.getByRole("region", { name: "Riwayat pergerakan stok Amoxicillin 500 mg" });
  await expect(riwayat).toContainText("Masuk 100 kapsul");
});

test("apoteker menambah obat baru ke master dan nama ganda ditolak", async ({ page }) => {
  await bukaFarmasi(page);

  await page.getByLabel("Nama obat").fill("Cotrimoxazole 480 mg");
  await page.getByLabel("Satuan").fill("tablet");
  await page.getByLabel("Harga (Rp)").fill("1200");
  await page.getByLabel("Stok awal").fill("40");
  await page.getByLabel("Stok minimum").fill("30");
  await page.getByRole("button", { name: "Simpan obat" }).click();

  await expect(page.getByRole("status").filter({ hasText: "Cotrimoxazole" })).toBeAttached();
  const daftarObat = page.getByRole("region", { name: "Daftar obat" });
  await expect(daftarObat.getByRole("row", { name: /Cotrimoxazole 480 mg/ })).toContainText("Rp1.200");

  // Nama ganda ditolak store dengan pesan yang menyebut sebabnya.
  await page.getByLabel("Nama obat").fill("cotrimoxazole 480 MG");
  await page.getByLabel("Satuan").fill("tablet");
  await page.getByLabel("Harga (Rp)").fill("1200");
  await page.getByRole("button", { name: "Simpan obat" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "sudah terdaftar" })).toBeVisible();
});

test("pesan galat tampil di dekat kolom yang salah, bukan hanya di atas halaman", async ({ page }) => {
  await bukaFarmasi(page);

  // Harga nol ditolak store; pesannya harus menempel pada kolom harga.
  await page.getByLabel("Nama obat").fill("Cotrimoxazole 480 mg");
  await page.getByLabel("Satuan").fill("tablet");
  await page.getByLabel("Harga (Rp)").fill("0");
  await page.getByRole("button", { name: "Simpan obat" }).click();

  const kolomHarga = page.getByLabel("Harga (Rp)");
  await expect(kolomHarga).toHaveAttribute("aria-invalid", "true");
  const pesan = page.locator("#obat-harga-galat");
  await expect(pesan).toContainText("Harga obat");
  await expect(kolomHarga).toHaveAttribute("aria-describedby", "obat-harga-galat");
});

test("jalur lintas peran: dokter membuat resep, apoteker menyerahkan, tagihan memuat biaya obat", async ({ page }) => {
  await masukSebagai(page, "dr. Ayu Prameswari");
  await page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link", { name: "Klinis" }).click();
  await page
    .getByRole("region", { name: "Pasien saya" })
    .getByRole("button", { name: /Siti Rahmawati/ })
    .click();

  await page.getByLabel("Obat").selectOption({ label: "Paracetamol 500 mg (tablet)" });
  await page.getByLabel("Jumlah").fill("10");
  await page.getByLabel("Aturan pakai").fill("3×1 sesudah makan");
  await page.getByRole("button", { name: "Tambahkan ke resep" }).click();
  await page.getByRole("button", { name: "Buat resep" }).click();
  await expect(page.getByRole("region", { name: "Resep" })).toContainText(
    "Paracetamol 500 mg — 10 · 3×1 sesudah makan",
  );

  // Pengalih peran demo: apoteker memproses resep yang baru dibuat dokter.
  await page.getByRole("button", { name: /Ganti peran/ }).click();
  await page.getByRole("menuitem", { name: /Nadia Rahmania/ }).click();
  await page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link", { name: "Farmasi" }).click();

  const menunggu = page.getByRole("region", { name: "Antrean resep" }).getByRole("region", { name: "Menunggu disiapkan" });
  await menunggu.getByRole("button", { name: /Siti Rahmawati/ }).click();

  const detail = page.getByRole("region", { name: "Detail resep" });
  await expect(detail).toContainText("Paracetamol 500 mg");
  await expect(detail).toContainText("3×1 sesudah makan");
  await expect(detail).toContainText("Biaya obat pada tagihan admisi ini");
  await expect(detail.getByText("Rp0")).toBeVisible();

  await detail.getByRole("button", { name: "Mulai siapkan" }).click();
  await detail.getByRole("button", { name: "Serahkan obat" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Ya, serahkan obat" }).click();

  // 10 tablet × Rp2.000 langsung masuk tagihan admisi yang sama.
  await expect(detail.getByText("Rp20.000").first()).toBeVisible();
  await expect(page.getByRole("region", { name: "Daftar obat" }).getByRole("row", { name: /Paracetamol 500 mg/ })).toContainText(
    "410",
  );
});

test("aksi resep mengikuti status: menunggu hanya bisa disiapkan, disiapkan bisa diserahkan", async ({ page }) => {
  await bukaFarmasi(page);
  const diserahkan = page.getByRole("region", { name: "Antrean resep" }).getByRole("region", { name: "Sudah diserahkan" });
  await expect(diserahkan.getByRole("button").first()).toBeVisible();

  await pilihResep(page, "Ahmad Fauzi");
  const detail = page.getByRole("region", { name: "Detail resep" });
  // Resep baru pada status menunggu hanya menawarkan "Mulai siapkan".
  await expect(detail.getByRole("button", { name: "Serahkan obat" })).toHaveCount(0);

  await detail.getByRole("button", { name: "Mulai siapkan" }).click();
  await expect(detail.getByRole("button", { name: "Mulai siapkan" })).toHaveCount(0);
  await detail.getByRole("button", { name: "Serahkan obat" }).click();

  // Batal menutup dialog tanpa mengubah status resep.
  await page.getByRole("dialog").getByRole("button", { name: "Batal" }).click();
  await expect(detail).toContainText("Disiapkan");
  await expect(detail.getByRole("button", { name: "Serahkan obat" })).toBeVisible();
});
