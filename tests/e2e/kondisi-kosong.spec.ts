import { expect, test } from "@playwright/test";
import { masukSebagai } from "./bantuan";

/**
 * Setiap daftar dan laporan harus punya kondisi kosong yang menjelaskan apa
 * yang harus dilakukan (spec, user story 92 dan 106). Kondisi kosong di sini
 * dibuat dengan mengosongkan snapshot sebelum halaman dimuat — bukan dengan
 * menunggu data demo habis.
 */

/** State kosong yang menyisakan akun demo, supaya pengguna tetap bisa masuk. */
const STATE_HAMPIR_KOSONG = {
  versi: 1,
  disimpanPada: "2026-01-01T00:00:00.000Z",
  state: {
    pengguna: [
      { id: "u-pendaftaran", nama: "Rina Kartika", peran: "pendaftaran", aktif: true },
      { id: "u-dokter", nama: "dr. Ayu Prameswari, Sp.PD", peran: "dokter", aktif: true },
      { id: "u-perawat", nama: "Ns. Dwi Lestari", peran: "perawat", aktif: true },
      { id: "u-apoteker", nama: "Nadia Rahmania, S.Farm", peran: "apoteker", aktif: true },
      { id: "u-kasir", nama: "Joko Susilo", peran: "kasir", aktif: true },
      { id: "u-pimpinan", nama: "Hendra Wijaya", peran: "pimpinan", aktif: true },
      { id: "u-admin", nama: "Sari Dewanti", peran: "admin", aktif: true },
    ],
    pasien: [],
    kamar: [],
    bed: [],
    admisi: [],
    catatanKlinis: [],
    instruksiDijalankan: [],
    tindakanMaster: [],
    tindakanAdmisi: [],
    obat: [],
    resep: [],
    tagihan: [],
    pembayaran: [],
    mutasiStok: [],
    audit: [],
    urutanRM: {},
  },
};

async function tanamStateKosong(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.evaluate((snapshot) => {
    localStorage.setItem("dmc.admisi.snapshot.v1", JSON.stringify(snapshot));
  }, STATE_HAMPIR_KOSONG);
}

/** Kalimat penjelas yang harus muncul, bukan sekadar tabel kosong. */
const HARAPAN: Array<{ peran: string; rute: string; teks: RegExp }> = [
  { peran: "Rina Kartika", rute: "/kamar", teks: /Belum ada kamar aktif/i },
  { peran: "Rina Kartika", rute: "/pendaftaran", teks: /Belum ada pasien yang sedang dirawat/i },
  { peran: "Ns. Dwi Lestari", rute: "/klinis", teks: /Belum ada pasien dirawat/i },
  { peran: "Nadia Rahmania", rute: "/farmasi", teks: /Tidak ada resep pada kelompok ini/i },
  { peran: "Joko Susilo", rute: "/kasir", teks: /Belum ada tagihan/i },
  { peran: "Sari Dewanti", rute: "/administrasi/audit", teks: /Belum ada aktivitas tercatat/i },
  { peran: "Hendra Wijaya", rute: "/laporan", teks: /Tidak ada data pada periode ini/i },
];

for (const { peran, rute, teks } of HARAPAN) {
  test(`${peran} — ${rute}: kondisi kosong menjelaskan apa yang harus dilakukan`, async ({ page }) => {
    await tanamStateKosong(page);
    await masukSebagai(page, peran);
    await page.goto(rute);

    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("main")).toContainText(teks);
    // Layar kosong tanpa penjelasan akan gagal di sini: kalimat penjelas harus
    // memberi tahu penyebab dan langkah berikutnya, bukan hanya "tidak ada data".
    await expect(page.getByRole("main")).toContainText(/(setelah|sebelum|untuk|dapat|pilih|mulai|menunggu|cocok)/i);
  });
}
