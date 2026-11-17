import { expect, test, type Page } from "@playwright/test";
import { AKUN_DEMO } from "../../lib/domain/demo-accounts";
import { KUNCI_SNAPSHOT } from "../../lib/domain/penyimpanan";
import { buatStateKosong } from "../../lib/domain/state";
import { masukSebagai } from "./bantuan";

/**
 * Setiap daftar dan laporan harus punya kondisi kosong yang menjelaskan apa
 * yang harus dilakukan (spec, user story 92 dan 106). Kondisi kosong dibuat
 * dengan mengosongkan snapshot sebelum halaman dimuat — bukan dengan menunggu
 * data demo habis.
 *
 * State dirangkai dari `buatStateKosong()` + `AKUN_DEMO`, bukan ditulis ulang
 * dengan tangan: koleksi baru pada `State` tidak boleh diam-diam lolos dari
 * test ini.
 */

const STATE_KOSONG = {
  versi: 1,
  disimpanPada: "2026-01-01T00:00:00.000Z",
  state: { ...buatStateKosong(), pengguna: AKUN_DEMO.map(({ id, nama, peran }) => ({ id, nama, peran, aktif: true })) },
};

async function tanamStateKosong(page: Page) {
  await page.goto("/login");
  await page.evaluate(
    ([kunci, snapshot]) => localStorage.setItem(kunci!, JSON.stringify(snapshot)),
    [KUNCI_SNAPSHOT, STATE_KOSONG] as const,
  );
}

/**
 * Kalimat penjelas yang harus muncul, bukan sekadar tabel kosong. `teks` adalah
 * kalimat lengkapnya — bukan pola longgar — sehingga test gagal bila penjelasan
 * menyusut menjadi "tidak ada data" tanpa langkah berikutnya.
 */
const HARAPAN: Array<{ peran: string; rute: string; teks: RegExp }> = [
  { peran: "Rina Kartika", rute: "/kamar", teks: /Belum ada kamar aktif\. Admin dapat menambahkan kamar/i },
  { peran: "Rina Kartika", rute: "/pendaftaran", teks: /Belum ada pasien yang sedang dirawat\. Selesaikan pendaftaran/i },
  { peran: "Ns. Dwi Lestari", rute: "/klinis", teks: /Pasien muncul di sini setelah petugas pendaftaran membuat admisi/i },
  { peran: "Nadia Rahmania", rute: "/farmasi", teks: /Tidak ada resep pada kelompok ini\. Resep muncul setelah dokter/i },
  { peran: "Joko Susilo", rute: "/kasir", teks: /Belum ada tagihan\. Tagihan dibuat otomatis saat pasien didaftarkan/i },
  {
    peran: "Sari Dewanti",
    rute: "/administrasi/audit",
    teks: /Belum ada aktivitas tercatat\. Entri muncul setelah data demo diubah/i,
  },
  { peran: "Hendra Wijaya", rute: "/laporan", teks: /Coba lebarkan rentang tanggal atau pilih bulan lain/i },
];

for (const { peran, rute, teks } of HARAPAN) {
  test(`${peran} — ${rute}: kondisi kosong menjelaskan apa yang harus dilakukan`, async ({ page }) => {
    await tanamStateKosong(page);
    await masukSebagai(page, peran);
    await page.goto(rute);

    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("main")).toContainText(teks);
  });
}
