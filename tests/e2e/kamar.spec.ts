import { expect, test, type Page } from "@playwright/test";
import { masukSebagai } from "./bantuan";

/**
 * Modul Kamar & Bed. Setiap test memakai konteks peramban baru sehingga data
 * demo ditanam ulang; angka yang diuji berasal dari seed yang deterministik.
 */

function denah(page: Page) {
  return page.getByRole("region", { name: "Denah bed" });
}

function ringkasan(page: Page) {
  return page.getByRole("region", { name: "Ringkasan ketersediaan bed" });
}

async function bukaKamar(page: Page, nama: string) {
  await masukSebagai(page, nama);
  await page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link", { name: "Kamar & Bed" }).click();
  await expect(page).toHaveURL(/\/kamar$/);
}

test("denah menampilkan bed per kamar dengan kelas, tarif, dan status teks", async ({ page }) => {
  await bukaKamar(page, "Rina Kartika");

  const anggrek = denah(page).getByRole("region", { name: "Anggrek VIP-1" });
  await expect(anggrek).toContainText("Kelas VIP");
  await expect(anggrek).toContainText("Rp900.000");
  await expect(anggrek.getByRole("listitem").filter({ hasText: "Anggrek VIP-1-A" })).toContainText("terisi");
  await expect(denah(page).getByRole("listitem").filter({ hasText: "Melati I-2-A" })).toContainText("kosong");
  await expect(denah(page).getByRole("listitem").filter({ hasText: "Mawar II-1-C" })).toContainText("dibersihkan");
});

test("ringkasan jumlah bed per status dan BOR tampil di samping denah", async ({ page }) => {
  await bukaKamar(page, "Rina Kartika");

  await expect(ringkasan(page).getByRole("row", { name: /Terisi/ })).toContainText("10");
  await expect(ringkasan(page).getByRole("row", { name: /Kosong/ })).toContainText("4");
  await expect(ringkasan(page).getByRole("row", { name: /Dibersihkan/ })).toContainText("2");
  await expect(ringkasan(page)).toContainText("62,5%");
});

test("perawat menandai bed dibersihkan menjadi kosong dan ringkasan ikut berubah", async ({ page }) => {
  await bukaKamar(page, "Ns. Dwi Lestari");

  const bedBersih = denah(page).getByRole("listitem").filter({ hasText: "Mawar II-1-C" });
  await expect(bedBersih).toContainText("dibersihkan");
  await bedBersih.getByRole("button", { name: /Tandai siap dipakai/ }).click();

  await expect(bedBersih).toContainText("kosong");
  await expect(ringkasan(page).getByRole("row", { name: /Kosong/ })).toContainText("5");
  await expect(ringkasan(page).getByRole("row", { name: /Dibersihkan/ })).toContainText("1");

  // Bertahan setelah muat ulang: perubahan benar-benar tersimpan di store.
  await page.reload();
  await expect(denah(page).getByRole("listitem").filter({ hasText: "Mawar II-1-C" })).toContainText("kosong");
});

test("perawat memindahkan pasien antar kamar dan riwayat mencatat asal, tujuan, dan waktu", async ({ page }) => {
  await bukaKamar(page, "Ns. Dwi Lestari");

  const bedAsal = denah(page).getByRole("listitem").filter({ hasText: "Anggrek VIP-1-A" });
  await bedAsal.getByRole("button", { name: /Pindahkan pasien/ }).click();

  const dialog = page.getByRole("dialog", { name: /Pindahkan pasien dari bed Anggrek VIP-1-A/ });
  await expect(dialog).toBeVisible();
  // Dialog terikat pada penghuni bed yang tombolnya ditekan, bukan pemilih pasien bebas.
  await expect(dialog).toContainText("Ahmad Fauzi");
  await dialog.getByLabel("Bed tujuan").selectOption({ label: "Dahlia III-1-C — Dahlia III-1 (kelas III, Rp250.000/hari)" });
  await dialog.getByRole("button", { name: "Pindahkan pasien" }).click();

  await expect(denah(page).getByRole("listitem").filter({ hasText: "Anggrek VIP-1-A" })).toContainText("dibersihkan");
  await expect(denah(page).getByRole("listitem").filter({ hasText: "Dahlia III-1-C" })).toContainText("terisi");

  const riwayat = page.getByRole("region", { name: "Riwayat perpindahan bed" });
  await expect(riwayat).toContainText("Anggrek VIP-1-A (Anggrek VIP-1)");
  await expect(riwayat).toContainText("Dahlia III-1-C (Dahlia III-1)");
});

test("bed yang sudah ditempati tidak ditawarkan sebagai tujuan pemindahan", async ({ page }) => {
  await bukaKamar(page, "Ns. Dwi Lestari");

  await denah(page)
    .getByRole("listitem")
    .filter({ hasText: "Anggrek VIP-1-A" })
    .getByRole("button", { name: /Pindahkan pasien/ })
    .click();

  const dialog = page.getByRole("dialog", { name: /Pindahkan pasien/ });
  await expect(dialog.getByLabel("Bed tujuan")).toBeVisible();
  // Bed yang sedang terisi tidak pernah muncul sebagai pilihan tujuan.
  await expect(dialog.getByLabel("Bed tujuan").getByRole("option", { name: /Melati I-1-A/ })).toHaveCount(0);
});

test("peran tanpa hak memindahkan pasien tidak melihat aksi bed", async ({ page }) => {
  await bukaKamar(page, "Rina Kartika");

  await expect(denah(page).getByRole("button", { name: /Tandai siap dipakai/ })).toHaveCount(0);
  await expect(denah(page).getByRole("button", { name: /Pindahkan pasien/ })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Master kamar" })).toHaveCount(0);
});

test("admin menambah kamar dan bed-nya langsung muncul sebagai pilihan di pendaftaran", async ({ page }) => {
  await bukaKamar(page, "Sari Dewanti");

  const master = page.getByRole("region", { name: "Master kamar" });
  await master.getByLabel("Nama kamar").fill("Anggrek VIP-2");
  await master.getByLabel("Kelas").selectOption("VIP");
  await master.getByLabel("Tarif harian (Rp)").fill("850000");
  await master.getByLabel("Kapasitas bed").fill("2");
  await master.getByRole("button", { name: "Simpan kamar" }).click();

  await expect(denah(page).getByRole("region", { name: "Anggrek VIP-2" })).toContainText("Kelas VIP");
  await expect(denah(page).getByRole("listitem").filter({ hasText: "Anggrek VIP-2-B" })).toContainText("kosong");
  await expect(ringkasan(page)).toContainText("18 bed");

  await page.getByRole("button", { name: /Ganti peran/ }).click();
  await page.getByRole("menuitem", { name: /Petugas Pendaftaran/ }).click();
  await page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link", { name: "Pendaftaran" }).click();
  await page.getByLabel("Kata kunci pencarian").fill("Bambang");
  await page.getByRole("region", { name: "Cari pasien lama" }).getByRole("button", { name: /Bambang Sutrisno/ }).click();

  const denahPendaftaran = page.getByRole("region", { name: "Denah bed" });
  await expect(denahPendaftaran.getByRole("radio", { name: /Anggrek VIP-2-B/ })).toBeEnabled();
});

test("admin tidak dapat menghapus bed yang masih ditempati saat mengurangi kapasitas", async ({ page }) => {
  await bukaKamar(page, "Sari Dewanti");

  await page.getByRole("button", { name: /Ubah kamar Melati I-1/ }).click();
  const form = page.getByRole("form", { name: /Ubah kamar Melati I-1/ });
  await form.getByLabel("Kapasitas bed").fill("1");
  await form.getByRole("button", { name: "Simpan perubahan" }).click();

  // `role="alert"` juga dipakai pengumum rute bawaan Next.js; batasi ke isi halaman.
  await expect(page.getByRole("main").getByRole("alert")).toContainText("ditempati");
  await expect(denah(page).getByRole("listitem").filter({ hasText: "Melati I-1-B" })).toBeVisible();
});

test("kamar nonaktif hilang dari denah dan tidak dapat dipilih di pendaftaran", async ({ page }) => {
  await bukaKamar(page, "Sari Dewanti");

  await page.getByRole("button", { name: /Ubah kamar Melati I-2/ }).click();
  await page.getByRole("button", { name: "Nonaktifkan kamar" }).click();

  await expect(denah(page).getByRole("region", { name: "Melati I-2" })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Master kamar" }).getByRole("row", { name: /Melati I-2/ })).toContainText("Nonaktif");

  await page.getByRole("button", { name: /Ganti peran/ }).click();
  await page.getByRole("menuitem", { name: /Petugas Pendaftaran/ }).click();
  await page.goto("/pendaftaran");
  await page.getByLabel("Kata kunci pencarian").fill("Bambang");
  await page.getByRole("region", { name: "Cari pasien lama" }).getByRole("button", { name: /Bambang Sutrisno/ }).click();

  await expect(page.getByRole("region", { name: "Denah bed" }).getByRole("radio", { name: /Melati I-2-A/ })).toHaveCount(0);
});
