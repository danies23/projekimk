import { expect, test, type Page } from "@playwright/test";
import { masukSebagai } from "./bantuan";

/**
 * Ticket 13: dashboard Pimpinan (empat KPI, tren pendapatan, okupansi per
 * kelas, pasien terbaru) dan empat laporan per periode beserta penjagaan
 * akses per peran. Setiap test memakai konteks peramban baru, sehingga data
 * demo ditanam ulang dan angka relatif terhadap hari ini.
 */

async function bukaLaporan(page: Page, namaAkun = "Hendra Wijaya") {
  await masukSebagai(page, namaAkun);
  await page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link", { name: "Laporan" }).click();
  await expect(page).toHaveURL(/\/laporan$/);
}

/** Rentang bulan berjalan, dihitung dari hari ini seperti seed demo. */
async function isiPeriodeBulanIni(page: Page) {
  const hariIni = new Date();
  const dari = `${hariIni.getFullYear()}-${String(hariIni.getMonth() + 1).padStart(2, "0")}-01`;
  const sampai = hariIni.toLocaleDateString("sv-SE");
  await page.getByLabel("Dari tanggal").fill(dari);
  await page.getByLabel("Sampai tanggal").fill(sampai);
  return { dari, sampai };
}

test("dashboard Pimpinan menampilkan empat KPI, dua grafik berlabel, dan tabel pasien terbaru", async ({ page }) => {
  await masukSebagai(page, "Hendra Wijaya");

  const ringkasan = page.getByRole("region", { name: "Ringkasan peran" });
  for (const label of ["Pasien dirawat", "BOR (%)", "Pendapatan hari ini", "Pendapatan bulan ini"]) {
    await expect(ringkasan).toContainText(label);
  }

  const tren = page.getByRole("region", { name: "Tren pendapatan 30 hari terakhir" });
  await expect(tren).toBeVisible();
  // Grafik harus punya label sumbu dan nilai yang dapat dibaca, bukan bentuk saja.
  await expect(tren).toContainText("Tanggal");
  await expect(tren).toContainText("Pendapatan (Rp)");
  await expect(tren.locator("svg")).toHaveCount(1);
  await expect(tren.getByRole("table").first()).toBeVisible();

  const okupansi = page.getByRole("region", { name: "Okupansi per kelas kamar" });
  await expect(okupansi).toContainText(/Kelas (VIP|I|II|III)/);
  await expect(okupansi).toContainText(/%/);

  const terbaru = page.getByRole("region", { name: "Pasien terbaru" });
  await expect(terbaru.getByRole("row").nth(1)).toContainText(/RM-\d{4}-\d+/);
});

test("grafik dashboard tidak membuat halaman melebar di tablet", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await masukSebagai(page, "Hendra Wijaya");
  await expect(page.getByRole("region", { name: "Tren pendapatan 30 hari terakhir" })).toBeVisible();

  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
});

test("Pimpinan membuka empat laporan dan memfilternya dengan rentang tanggal", async ({ page }) => {
  await bukaLaporan(page);

  for (const nama of ["Pasien", "Keuangan", "Okupansi kamar", "Pemakaian obat"]) {
    await expect(page.getByRole("button", { name: nama, exact: true })).toBeVisible();
  }

  await isiPeriodeBulanIni(page);

  // Laporan pasien: masuk, keluar, sedang dirawat, dan tanggal transaksi terakhir.
  await expect(page.getByRole("region", { name: "Laporan pasien" })).toContainText("Pasien masuk");
  await expect(page.getByRole("region", { name: "Laporan pasien" })).toContainText("Pasien keluar");
  await expect(page.getByRole("region", { name: "Laporan pasien" })).toContainText("Sedang dirawat");
  await expect(page.getByText(/Transaksi terakhir/)).toBeVisible();

  await page.getByRole("button", { name: "Keuangan", exact: true }).click();
  const keuangan = page.getByRole("region", { name: "Laporan keuangan" });
  await expect(keuangan).toContainText("Total tagihan");
  await expect(keuangan).toContainText("Total terbayar");
  await expect(keuangan).toContainText("Sisa piutang");

  await page.getByRole("button", { name: "Okupansi kamar", exact: true }).click();
  await expect(page.getByRole("region", { name: "Laporan okupansi kamar" })).toContainText("Pemanfaatan");

  await page.getByRole("button", { name: "Pemakaian obat", exact: true }).click();
  const obat = page.getByRole("region", { name: "Laporan pemakaian obat" });
  await expect(obat).toContainText("Stok akhir");
  await expect(obat.getByRole("row").nth(1)).toContainText(/Paracetamol|Amoxicillin/);
});

test("laporan keuangan konsisten dengan angka kasir", async ({ page }) => {
  await bukaLaporan(page);
  await isiPeriodeBulanIni(page);
  await page.getByRole("button", { name: "Keuangan", exact: true }).click();

  // Total terbayar bulan ini sama dengan angka pendapatan bulan ini di dashboard.
  const terbayar = page
    .getByRole("region", { name: "Laporan keuangan" })
    .locator("dl")
    .locator("div", { hasText: /^Total terbayar/ })
    .locator("dd");
  const angkaTerbayar = await terbayar.innerText();

  await page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link", { name: "Dashboard" }).click();
  const pendapatanBulanIni = page
    .getByRole("region", { name: "Ringkasan peran" })
    .locator("a", { hasText: "Pendapatan bulan ini" })
    .locator("span")
    .last();

  expect(await pendapatanBulanIni.innerText()).toBe(angkaTerbayar);
});

test("periode tanpa data menjelaskan penyebabnya, bukan tabel kosong", async ({ page }) => {
  await bukaLaporan(page);
  await page.getByLabel("Dari tanggal").fill("2020-01-01");
  await page.getByLabel("Sampai tanggal").fill("2020-01-31");

  for (const [nama, region] of [
    ["Pasien", "Laporan pasien"],
    ["Keuangan", "Laporan keuangan"],
    ["Okupansi kamar", "Laporan okupansi kamar"],
    ["Pemakaian obat", "Laporan pemakaian obat"],
  ] as const) {
    await page.getByRole("button", { name: nama, exact: true }).click();
    const panel = page.getByRole("region", { name: region });
    // Kondisi kosong yang menjelaskan sebabnya, bukan tabel berisi nol semua.
    await expect(panel).toContainText("Tidak ada data pada periode ini.");
    await expect(panel).toContainText("Coba lebarkan rentang tanggal");
    await expect(panel.getByRole("row")).toHaveCount(0);
  }

  // Rentang terbalik diberi tahu, bukan menampilkan laporan yang menyesatkan.
  // `role="alert"` juga dipakai pengumum rute bawaan Next.js; batasi ke area konten.
  await page.getByLabel("Dari tanggal").fill("2026-01-31");
  await page.getByLabel("Sampai tanggal").fill("2026-01-01");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Rentang tidak valid");
});

test("kasir hanya dapat membuka laporan keuangan", async ({ page }) => {
  await bukaLaporan(page, "Joko Susilo");

  await expect(page.getByRole("button", { name: "Keuangan", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Pasien", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Okupansi kamar", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Pemakaian obat", exact: true })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Laporan keuangan" })).toContainText("Total tagihan");
});

test("apoteker hanya dapat membuka laporan pemakaian obat", async ({ page }) => {
  await bukaLaporan(page, "Nadia Rahmania");

  await expect(page.getByRole("button", { name: "Pemakaian obat", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Pasien", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Keuangan", exact: true })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Laporan pemakaian obat" })).toBeVisible();
});

test("dokter tidak memiliki akses ke modul laporan", async ({ page }) => {
  await masukSebagai(page, "dr. Ayu Prameswari");
  await page.goto("/laporan");

  await expect(page.getByRole("region", { name: "Akses ditolak" })).toContainText("Dokter");
});

test("dashboard peran lain tidak menampilkan grafik Pimpinan", async ({ page }) => {
  await masukSebagai(page, "Rina Kartika");
  await expect(page.getByRole("region", { name: "Tren pendapatan 30 hari terakhir" })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Okupansi per kelas kamar" })).toHaveCount(0);
});
