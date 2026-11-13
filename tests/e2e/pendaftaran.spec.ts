import { expect, test, type Page } from "@playwright/test";
import { masukSebagai } from "./bantuan";

/**
 * Langkah 1 wizard pendaftaran: mencari pasien lama atau membuat pasien baru.
 * Setiap test memakai konteks peramban baru, sehingga data demo ditanam ulang
 * dan Nomor Rekam Medis yang dibuat test tidak bergantung pada urutan.
 */

async function masukSebagaiPendaftaran(page: Page) {
  await masukSebagai(page, "Rina Kartika");

  await page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link", { name: "Pendaftaran" }).click();
  await expect(page).toHaveURL(/\/pendaftaran$/);
}

function pencarian(page: Page) {
  return page.getByRole("region", { name: "Cari pasien lama" });
}

async function isiPasienBaru(page: Page, isian: { nama: string; nik: string }) {
  await page.getByLabel("Nama pasien").fill(isian.nama);
  await page.getByLabel("NIK", { exact: true }).fill(isian.nik);
  await page.getByLabel("Tanggal lahir").fill("1995-04-12");
  await page.getByLabel("Jenis kelamin").selectOption("P");
  await page.getByLabel("Alamat").fill("Jl. Asia Afrika 5, Bandung");
  await page.getByLabel("Telepon pasien").fill("081200001111");
  await page.getByLabel("Nama penanggung jawab").fill("Sari Hidayat");
  await page.getByLabel("Hubungan dengan pasien").fill("Istri");
  await page.getByLabel("Telepon penanggung jawab").fill("081300002222");
}

test("pencarian pasien menampilkan nama, Nomor Rekam Medis, tanggal lahir, dan NIK", async ({ page }) => {
  await masukSebagaiPendaftaran(page);

  await page.getByLabel("Kata kunci pencarian").fill("Siti");

  const hasil = pencarian(page).getByRole("button", { name: /Siti Rahmawati/ });
  await expect(hasil).toContainText(/RM-\d{4}-\d+/);
  await expect(hasil).toContainText(/\d{16}/);
  await expect(hasil).toContainText(/Lahir/);
});

test("hasil pencarian kosong mengarahkan petugas membuat pasien baru", async ({ page }) => {
  await masukSebagaiPendaftaran(page);

  await page.getByLabel("Kata kunci pencarian").fill("tidak-ada-pasien-ini");

  await expect(pencarian(page)).toContainText("Tidak ada pasien");
  await expect(pencarian(page).getByRole("button", { name: "Buat pasien baru" })).toBeVisible();
});

test("pasien baru menerima Nomor Rekam Medis dan tetap ada setelah halaman dimuat ulang", async ({ page }) => {
  await masukSebagaiPendaftaran(page);

  await isiPasienBaru(page, { nama: "Rahmat Hidayat", nik: "3271012345670001" });
  await page.getByRole("button", { name: "Simpan pasien" }).click();

  const simpan = page.getByRole("status").filter({ hasText: "Nomor Rekam Medis" });
  await expect(simpan).toBeVisible();
  const nomorRM = (await simpan.textContent())!.match(/RM-\d{4}-\d+/)![0];

  await page.reload();
  await page.getByLabel("Kata kunci pencarian").fill("3271012345670001");

  const hasil = pencarian(page).getByRole("button", { name: /Rahmat Hidayat/ });
  await expect(hasil).toContainText(nomorRM);
});

test("NIK yang sudah terdaftar diperingatkan dan simpan ditolak", async ({ page }) => {
  await masukSebagaiPendaftaran(page);

  await page.getByLabel("Kata kunci pencarian").fill("Siti");
  const hasil = pencarian(page).getByRole("button", { name: /Siti Rahmawati/ });
  const nikTerdaftar = (await hasil.textContent())!.match(/\d{16}/)![0];

  await isiPasienBaru(page, { nama: "Pasien Kembar", nik: nikTerdaftar });

  const pasienBaru = page.getByRole("region", { name: "Pasien baru" });
  await expect(pasienBaru).toContainText("sudah terdaftar");

  // Peringatan harus benar-benar mencegah penyimpanan, bukan sekadar tampil.
  await page.getByRole("button", { name: "Simpan pasien" }).click();
  await expect(pasienBaru).not.toContainText("Pasien tersimpan");

  await page.getByLabel("Kata kunci pencarian").fill(nikTerdaftar);
  await expect(
    pencarian(page).getByRole("button", { name: /Pasien Kembar/ }),
  ).toHaveCount(0);
});

test("pasien yang baru disimpan tidak diperingatkan sebagai duplikat dirinya sendiri", async ({ page }) => {
  await masukSebagaiPendaftaran(page);

  await isiPasienBaru(page, { nama: "Rahmat Hidayat", nik: "3271012345670001" });
  await page.getByRole("button", { name: "Simpan pasien" }).click();

  const pasienBaru = page.getByRole("region", { name: "Pasien baru" });
  await expect(pasienBaru).toContainText("Pasien tersimpan");
  await expect(pasienBaru).not.toContainText("sudah terdaftar");
});

test("memilih pasien membawa konteks ke langkah berikutnya dan kembali tanpa kehilangan isian", async ({ page }) => {
  await masukSebagaiPendaftaran(page);

  await isiPasienBaru(page, { nama: "Calon Pasien Tertunda", nik: "3271012345670099" });
  await page.getByLabel("Kata kunci pencarian").fill("Bambang");
  await pencarian(page).getByRole("button", { name: /Bambang Sutrisno/ }).click();

  const langkahDua = page.getByRole("region", { name: "Dokter dan bed" });
  await expect(langkahDua).toContainText("Bambang Sutrisno");
  await expect(langkahDua).toContainText(/RM-\d{4}-\d+/);

  await page.getByRole("button", { name: "Kembali ke langkah 1" }).click();

  await expect(page.getByLabel("Kata kunci pencarian")).toHaveValue("Bambang");
  await expect(page.getByLabel("Nama pasien")).toHaveValue("Calon Pasien Tertunda");
  await expect(page.getByLabel("NIK", { exact: true })).toHaveValue("3271012345670099");
  await expect(page.getByLabel("Alamat")).toHaveValue("Jl. Asia Afrika 5, Bandung");
  await expect(page.getByLabel("Nama penanggung jawab")).toHaveValue("Sari Hidayat");
  await expect(page.getByLabel("Tanggal lahir")).toHaveValue("1995-04-12");
});

test("form pasien baru menampilkan pesan di dekat kolom yang salah", async ({ page }) => {
  await masukSebagaiPendaftaran(page);

  await page.getByRole("button", { name: "Simpan pasien" }).click();

  const nama = page.getByLabel("Nama pasien");
  await expect(nama).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("region", { name: "Pasien baru" })).toContainText("Nama pasien wajib diisi");
});
