import { expect, test, type Page } from "@playwright/test";
import { masukSebagai } from "./bantuan";

/**
 * Ticket 14: Admin mengelola pengguna beserta perannya dan master tindakan.
 * Setiap test memakai konteks peramban baru sehingga data demo ditanam ulang.
 */

async function bukaAdministrasi(page: Page) {
  await masukSebagai(page, "Sari Dewanti");
  await page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link", { name: "Administrasi" }).click();
  await expect(page).toHaveURL(/\/administrasi$/);
}

function bagianPengguna(page: Page) {
  return page.getByRole("region", { name: "Pengguna" });
}

function bagianTindakan(page: Page) {
  return page.getByRole("region", { name: "Master tindakan" });
}

test("admin menambah pengguna baru dan daftar menampilkan nama, peran, serta statusnya", async ({ page }) => {
  await bukaAdministrasi(page);

  await bagianPengguna(page).getByLabel("Nama lengkap").fill("Rudi Hartono");
  await bagianPengguna(page).getByLabel("Peran").selectOption("perawat");
  await bagianPengguna(page).getByRole("button", { name: "Simpan pengguna" }).click();

  const baris = bagianPengguna(page).getByRole("row", { name: /Rudi Hartono/ });
  await expect(baris).toContainText("Perawat");
  await expect(baris).toContainText("Aktif");

  // Perubahan bertahan setelah muat ulang: benar-benar tersimpan di store.
  await page.reload();
  await expect(bagianPengguna(page).getByRole("row", { name: /Rudi Hartono/ })).toBeVisible();
});

test("admin menonaktifkan dokter dan dokter itu hilang dari pilihan dokter penanggung jawab", async ({ page }) => {
  await bukaAdministrasi(page);

  const baris = bagianPengguna(page).getByRole("row", { name: /dr\. Ayu Prameswari/ });
  await baris.getByRole("button", { name: /Ubah/ }).click();
  await bagianPengguna(page).getByRole("button", { name: "Nonaktifkan pengguna" }).click();
  await expect(baris).toContainText("Nonaktif");

  // Akun nonaktif juga tidak ditawarkan oleh pengalih peran demo.
  await page.getByRole("button", { name: /Ganti peran/ }).click();
  await expect(page.getByRole("menuitem", { name: /Ayu Prameswari/ })).toHaveCount(0);
  await page.getByRole("menuitem", { name: /Rina Kartika/ }).click();
  await page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link", { name: "Pendaftaran" }).click();
  await page.getByLabel("Kata kunci pencarian").fill("Siti");
  await page.getByRole("region", { name: "Cari pasien lama" }).getByRole("button", { name: /Siti Rahmawati/ }).click();

  const dokter = page.getByLabel("Dokter penanggung jawab");
  await expect(dokter.getByRole("option", { name: /Ayu Prameswari/ })).toHaveCount(0);
  await expect(dokter.getByRole("option", { name: /Bagas Nugroho/ })).toHaveCount(1);
});

test("admin menambah tindakan, dokter dapat memilihnya, dan tindakan nonaktif hilang dari pilihan", async ({ page }) => {
  await bukaAdministrasi(page);

  await bagianTindakan(page).getByLabel("Nama tindakan").fill("Pemeriksaan mata");
  await bagianTindakan(page).getByLabel("Tarif (Rp)").fill("80000");
  await bagianTindakan(page).getByRole("button", { name: "Simpan tindakan" }).click();
  await expect(bagianTindakan(page).getByRole("row", { name: /Pemeriksaan mata/ })).toContainText("Rp80.000");

  // Dokter melihat tindakan baru pada pilihan tindakan di modul Klinis.
  await page.getByRole("button", { name: /Ganti peran/ }).click();
  await page.getByRole("menuitem", { name: /Ayu Prameswari/ }).click();
  await page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link", { name: "Klinis" }).click();
  await page.getByRole("button", { name: /Bambang Sutrisno/ }).click();
  await expect(page.getByLabel("Tindakan dari master").getByRole("option", { name: /Pemeriksaan mata/ })).toHaveCount(1);

  // Admin menonaktifkannya; pilihan dokter menyusut lagi.
  await page.getByRole("button", { name: /Ganti peran/ }).click();
  await page.getByRole("menuitem", { name: /Sari Dewanti/ }).click();
  await page.goto("/administrasi");
  const baris = bagianTindakan(page).getByRole("row", { name: /Pemeriksaan mata/ });
  await baris.getByRole("button", { name: /Ubah/ }).click();
  await bagianTindakan(page).getByRole("button", { name: "Nonaktifkan tindakan" }).click();
  await expect(baris).toContainText("Nonaktif");

  await page.getByRole("button", { name: /Ganti peran/ }).click();
  await page.getByRole("menuitem", { name: /Ayu Prameswari/ }).click();
  await page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link", { name: "Klinis" }).click();
  await page.getByRole("button", { name: /Bambang Sutrisno/ }).click();
  await expect(page.getByLabel("Tindakan dari master").getByRole("option", { name: /Pemeriksaan mata/ })).toHaveCount(0);
});

test("pesan penolakan tampil di dalam form yang memicunya, bukan di puncak halaman", async ({ page }) => {
  await bukaAdministrasi(page);

  // Nama pengguna kosong ditolak store; pesannya tampil di form tambah pengguna.
  const formPengguna = bagianPengguna(page)
    .locator("form")
    .filter({ has: page.getByRole("button", { name: "Simpan pengguna" }) });
  await bagianPengguna(page).getByRole("button", { name: "Simpan pengguna" }).click();
  await expect(formPengguna.getByRole("alert")).toContainText("Nama pengguna wajib diisi");

  // Tarif nol juga ditolak dengan pesan di dalam form tindakan yang sama.
  await bagianTindakan(page).getByLabel("Nama tindakan").fill("Pemeriksaan mata");
  await bagianTindakan(page).getByLabel("Tarif (Rp)").fill("0");
  await bagianTindakan(page).getByRole("button", { name: "Simpan tindakan" }).click();
  const formTindakan = bagianTindakan(page)
    .locator("form")
    .filter({ has: page.getByRole("button", { name: "Simpan tindakan" }) });
  await expect(formTindakan.getByRole("alert")).toContainText("Tarif tindakan harus bilangan bulat");
});

test("perubahan pengguna dan tindakan tercatat di audit log", async ({ page }) => {
  await bukaAdministrasi(page);

  await bagianPengguna(page).getByRole("row", { name: /Joko Susilo/ }).getByRole("button", { name: /Ubah/ }).click();
  await bagianPengguna(page).getByRole("button", { name: "Nonaktifkan pengguna" }).click();

  await bagianTindakan(page).getByLabel("Nama tindakan").fill("Pemeriksaan mata");
  await bagianTindakan(page).getByLabel("Tarif (Rp)").fill("80000");
  await bagianTindakan(page).getByRole("button", { name: "Simpan tindakan" }).click();

  // Ubah tindakan yang sama agar tipe aksi "diubah" juga teruji.
  await bagianTindakan(page).getByRole("row", { name: /Pemeriksaan mata/ }).getByRole("button", { name: /Ubah/ }).click();
  const formUbah = page.getByRole("form", { name: /Ubah tindakan Pemeriksaan mata/ });
  await formUbah.getByLabel("Tarif (Rp)").fill("95000");
  await formUbah.getByRole("button", { name: "Simpan perubahan" }).click();

  await page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link", { name: "Audit Log" }).click();
  await expect(page).toHaveURL(/\/administrasi\/audit$/);
  const tabel = page.getByRole("table");
  await expect(tabel).toContainText("Pengguna diubah");
  await expect(tabel).toContainText("Master tindakan dibuat");
  await expect(tabel).toContainText("Master tindakan diubah");
  // Ringkasan menunjuk entitas yang berubah, bukan sekadar jenis aksinya.
  await expect(tabel).toContainText("Pengguna Joko Susilo diperbarui");
  await expect(tabel).toContainText("Tindakan Pemeriksaan mata ditambahkan");
  await expect(tabel).toContainText("Master tindakan Pemeriksaan mata diperbarui");
  await expect(tabel).toContainText("Sari Dewanti");
});
