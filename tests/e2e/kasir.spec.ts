import { expect, test, type Page } from "@playwright/test";
import { masukSebagai } from "./bantuan";

/**
 * Modul Kasir. Setiap test memakai konteks peramban baru sehingga data demo
 * ditanam ulang; angka tagihan dihitung dari seed yang deterministik.
 */

async function bukaKasir(page: Page, nama = "Joko Susilo") {
  await masukSebagai(page, nama);
  await page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link", { name: "Kasir" }).click();
  await expect(page).toHaveURL(/\/kasir$/);
}

async function bukaTagihan(page: Page, namaPasien: string) {
  await page
    .getByRole("region", { name: "Daftar tagihan" })
    .getByRole("button", { name: new RegExp(namaPasien) })
    .first()
    .click();
  await expect(page.getByRole("heading", { level: 2, name: `Tagihan ${namaPasien}` })).toBeVisible();
}

/** "Rp8.190.000" → 8190000, agar test tidak bergantung pada angka seed. */
function angka(teks: string): number {
  return Number(teks.replace(/[^\d]/g, ""));
}

async function sisaTagihan(page: Page): Promise<number> {
  const dd = page
    .getByRole("region", { name: "Rincian tagihan" })
    .locator("dl")
    .locator("div", { hasText: /^Sisa tagihan/ })
    .locator("dd");
  return angka(await dd.innerText());
}

async function bayar(page: Page, jumlah: number, metode: "Tunai" | "Transfer" | "Debit" = "Tunai") {
  await page.getByLabel("Jumlah dibayar (Rp)").fill(String(jumlah));
  await page.getByRole("radio", { name: metode }).check();
  await page.getByRole("button", { name: /Catat pembayaran/ }).click();
}

test("rincian tagihan memisahkan kamar, tindakan, dan obat beserta lama inap dan tarif", async ({ page }) => {
  await bukaKasir(page);

  const daftar = page.getByRole("region", { name: "Daftar tagihan" });
  await expect(daftar.getByRole("button").first()).toContainText(/belum bayar|sebagian/);

  // Hesti Purwanti punya tindakan dan satu obat yang sudah diserahkan.
  await page
    .getByRole("region", { name: "Daftar tagihan" })
    .getByRole("button", { name: /Hesti Purwanti/ })
    .click();

  const detail = page.getByRole("region", { name: "Rincian tagihan" });
  await expect(detail).toContainText(/Lama inap\s+\d+ hari/);
  await expect(detail.getByRole("region", { name: "Biaya kamar" })).toContainText("Tarif/hari");
  await expect(detail.getByRole("region", { name: "Biaya kamar" })).toContainText(/Rp\d/);
  // Obat yang sudah diserahkan apoteker ikut ditagih, lengkap dengan jumlah dan subtotal.
  const obat = detail.getByRole("region", { name: "Biaya obat" });
  await expect(obat.getByRole("row")).toHaveCount(2); // header + satu obat
  await expect(obat).toContainText("Furosemide 40 mg");
  await expect(obat).toContainText("10 tablet");
  await expect(detail).toContainText("Subtotal kamar");
  await expect(detail).toContainText("Subtotal tindakan");
  await expect(detail).toContainText("Subtotal obat");
  await expect(detail).toContainText("Total tagihan");
});

test("biaya tindakan ditagih per tindakan beserta waktunya", async ({ page }) => {
  await bukaKasir(page);
  await bukaTagihan(page, "Ahmad Fauzi");

  const tindakan = page.getByRole("region", { name: "Rincian tagihan" }).getByRole("region", { name: "Biaya tindakan" });
  await expect(tindakan.getByRole("row")).toHaveCount(2); // header + satu tindakan
  await expect(tindakan).toContainText(/Rp\d/);
  await expect(tindakan.getByRole("columnheader", { name: "Waktu" })).toBeVisible();
});

test("ringkasan pendapatan menampilkan pembayaran yang dicatat kasir", async ({ page }) => {
  await bukaKasir(page);
  const ringkasan = page.getByRole("region", { name: "Ringkasan pendapatan" });
  // Seed mencatat pembayaran oleh kasir demo pada hari-hari sebelumnya, jadi
  // total dan jumlah transaksi terisi sejak awal; "hari ini" mulai dari nol.
  await expect(ringkasan).toContainText("Total diterima kasir ini");
  await expect(ringkasan).toContainText("Transaksi tercatat");
  await expect(ringkasan).toContainText(/Rp[1-9]/);
});

test("jumlah tidak valid ditolak store dan pesannya menempel pada kolom jumlah", async ({ page }) => {
  await bukaKasir(page);
  await bukaTagihan(page, "Hesti Purwanti");

  for (const nilai of ["0", "abc"]) {
    await page.getByLabel("Jumlah dibayar (Rp)").fill(nilai);
    await page.getByRole("button", { name: "Catat pembayaran" }).click();
    const kolom = page.getByLabel("Jumlah dibayar (Rp)");
    await expect(kolom).toHaveAttribute("aria-invalid", "true");
    await expect(kolom).toHaveAttribute("aria-describedby", "pembayaran-jumlah-galat");
    await expect(page.locator("#pembayaran-jumlah-galat")).toContainText("bilangan bulat lebih dari nol");
  }

  // Penolakan tidak mengubah status tagihan maupun jumlah pembayaran.
  await expect(page.getByRole("region", { name: "Rincian tagihan" })).toContainText("belum bayar");
  await expect(page.getByRole("region", { name: "Riwayat pembayaran" })).not.toContainText("Tunai");
});

test("jumlah dengan pemisah ribuan Indonesia dibaca sebagai rupiah, bukan desimal", async ({ page }) => {
  await bukaKasir(page);
  await bukaTagihan(page, "Hesti Purwanti");

  const total = await sisaTagihan(page);
  const separuh = Math.floor(total / 2);
  const ditulis = `Rp${separuh.toLocaleString("id-ID")}`;

  // Kasir menyalin format yang ditampilkan aplikasi, lengkap dengan "Rp" dan titik.
  await page.getByLabel("Jumlah dibayar (Rp)").fill(ditulis);
  await page.getByRole("button", { name: "Catat pembayaran" }).click();

  const detail = page.getByRole("region", { name: "Rincian tagihan" });
  await expect(detail).toContainText("sebagian");
  // Dibaca Rp8.500.000, bukan Rp8,5 atau NaN.
  await expect(page.getByRole("region", { name: "Riwayat pembayaran" })).toContainText(`Rp${separuh.toLocaleString("id-ID")}`);
});

test("kuitansi pembayaran pertama tetap menunjukkan sisa setelah pembayaran itu", async ({ page }) => {
  await bukaKasir(page);
  await bukaTagihan(page, "Hesti Purwanti");

  const total = await sisaTagihan(page);
  const pertama = Math.floor(total / 2);

  await bayar(page, pertama, "Tunai");
  await bayar(page, total - pertama, "Debit");
  await expect(page.getByRole("region", { name: "Rincian tagihan" })).toContainText("lunas");

  // Kuitansi pembayaran pertama: sisa saat itu masih setengah, bukan Rp0 hari ini.
  const riwayat = page.getByRole("region", { name: "Riwayat pembayaran" });
  await riwayat.getByRole("button", { name: /Kuitansi/ }).last().click();

  const kuitansi = page.getByRole("region", { name: "Kuitansi pembayaran" });
  await expect(kuitansi).toContainText(`Diterima pembayaran sebesar Rp${pertama.toLocaleString("id-ID")}`);
  await expect(kuitansi).toContainText("Setelah pembayaran ini status tagihan");
  await expect(kuitansi).toContainText("sebagian");
  await expect(kuitansi).toContainText(`sisa Rp${(total - pertama).toLocaleString("id-ID")}`);
});

// Jalur emas ketiga (spec, E2E #3): sebagian → sebagian → lunas → kuitansi.
test("pembayaran sebagian lalu pelunasan mengubah status dan menampilkan kuitansi", async ({ page }) => {
  await bukaKasir(page);
  await bukaTagihan(page, "Hesti Purwanti");

  const detail = page.getByRole("region", { name: "Rincian tagihan" });
  await expect(detail).toContainText("belum bayar");

  const total = await sisaTagihan(page);
  expect(total).toBeGreaterThan(0);
  const separuh = Math.floor(total / 2);

  await bayar(page, separuh, "Tunai");
  await expect(detail).toContainText("sebagian");
  await expect(detail).toContainText(`Rp${(total - separuh).toLocaleString("id-ID")}`);
  await expect(page.getByRole("status").filter({ hasText: "Sisa tagihan" })).toBeAttached();

  await bayar(page, total - separuh, "Debit");
  await expect(detail).toContainText("lunas");
  await expect(detail).toContainText("Tagihan ini sudah lunas");
  // Form pembayaran hilang setelah lunas.
  await expect(page.getByLabel("Jumlah dibayar (Rp)")).toHaveCount(0);

  const riwayat = detail.getByRole("region", { name: "Riwayat pembayaran" });
  await expect(riwayat.getByRole("row")).toHaveCount(3); // header + 2 pembayaran
  await expect(riwayat).toContainText("Tunai");
  await expect(riwayat).toContainText("Debit");
  await expect(riwayat).toContainText("Joko Susilo");

  await riwayat.getByRole("button", { name: /Kuitansi/ }).first().click();
  const kuitansi = page.getByRole("region", { name: "Kuitansi pembayaran" });
  await expect(kuitansi).toContainText("Kuitansi pembayaran Hesti Purwanti");
  await expect(kuitansi).toContainText(/RM-\d{4}-\d+/);
  await expect(kuitansi.getByText(/Diterima pembayaran sebesar/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Cetak kuitansi" })).toBeVisible();

  await page.getByRole("button", { name: "Kembali ke daftar tagihan" }).click();
  await expect(page.getByRole("region", { name: "Daftar tagihan" })).toBeVisible();
});

test("pembayaran melebihi sisa diperingatkan lebih dulu tetapi tetap dapat dilanjutkan", async ({ page }) => {
  await bukaKasir(page);
  await bukaTagihan(page, "Hesti Purwanti");

  const total = await sisaTagihan(page);
  await page.getByLabel("Jumlah dibayar (Rp)").fill(String(total + 25_000));

  const peringatan = page.getByText(/Jumlah melebihi sisa tagihan/);
  await expect(peringatan).toContainText("Rp25.000");
  await expect(page.getByRole("button", { name: "Catat pembayaran dengan kelebihan" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Rincian tagihan" })).toContainText("belum bayar");

  await page.getByRole("button", { name: "Catat pembayaran dengan kelebihan" }).click();
  await expect(page.getByRole("region", { name: "Rincian tagihan" })).toContainText("lunas");
});

test("tagihan lunas menolak pembayaran tambahan dengan pesan jelas", async ({ page }) => {
  await bukaKasir(page);

  // Seed: sebagian tagihan admisi aktif sudah lunas.
  const daftar = page.getByRole("region", { name: "Daftar tagihan" });
  await daftar.getByRole("button", { name: /lunas/ }).first().click();

  const detail = page.getByRole("region", { name: "Rincian tagihan" });
  await expect(detail).toContainText("Tagihan ini sudah lunas");
  await expect(page.getByLabel("Jumlah dibayar (Rp)")).toHaveCount(0);
});

test("rincian tagihan dapat dibuka sebagai pratinjau cetak", async ({ page }) => {
  await bukaKasir(page);
  await bukaTagihan(page, "Hesti Purwanti");

  await page.getByRole("button", { name: "Pratinjau rincian tagihan" }).click();

  const dokumen = page.getByRole("region", { name: "Rincian tagihan pasien" });
  await expect(dokumen).toContainText("Rincian tagihan Hesti Purwanti");
  await expect(dokumen).toContainText("Total tagihan");
  await expect(dokumen).toContainText("Sisa tagihan");
  await expect(page.getByRole("button", { name: "Cetak rincian tagihan" })).toBeVisible();
});

test("kasir hanya melihat modul yang menjadi haknya dan kasir tidak dapat membuka farmasi", async ({ page }) => {
  await bukaKasir(page);
  const navigasi = page.getByRole("navigation", { name: "Navigasi utama" });
  await expect(navigasi.getByRole("link", { name: "Kasir" })).toBeVisible();
  await expect(navigasi.getByRole("link", { name: "Laporan" })).toBeVisible();
  await expect(navigasi.getByRole("link", { name: "Farmasi" })).toHaveCount(0);
  await expect(navigasi.getByRole("link", { name: "Pendaftaran" })).toHaveCount(0);
});
