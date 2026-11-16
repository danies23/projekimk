import { expect, test, type Page } from "@playwright/test";
import { masukSebagai } from "./bantuan";

/**
 * Ticket 12: checkout ditolak saat tagihan belum lunas, Admin melakukan
 * override dengan alasan, dan entri override muncul di audit log.
 */

async function bukaKasir(page: Page, nama = "Joko Susilo") {
  await masukSebagai(page, nama);
  await page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link", { name: "Kasir" }).click();
  await expect(page).toHaveURL(/\/kasir$/);
}

/** Membuka tagihan pasien dan memastikan tagihan itu memang belum lunas. */
async function bukaTagihanBelumLunas(page: Page, namaPasien: string) {
  await page
    .getByRole("region", { name: "Daftar tagihan" })
    .getByRole("button", { name: new RegExp(namaPasien) })
    .first()
    .click();
  await expect(page.getByRole("heading", { level: 2, name: `Tagihan ${namaPasien}` })).toBeVisible();
  await expect(page.getByRole("region", { name: "Rincian tagihan" })).toContainText(/belum bayar|sebagian/);
}

async function gantiPeranKeAdmin(page: Page) {
  await page.getByRole("button", { name: /Ganti peran/ }).click();
  // Peran tampil lebih dulu, nama akun di bawahnya; item dicari dari namanya.
  await page.getByRole("menuitem", { name: /Sari Dewanti/ }).click();
  await expect(page.getByRole("banner")).toContainText("Sari Dewanti");
}

test("checkout diblokir saat tagihan belum lunas dan Admin melakukan override dengan alasan", async ({ page }) => {
  // Kasir mencoba checkout tanpa pelunasan: tombol nonaktif dan alasannya terlihat.
  await bukaKasir(page);
  await bukaTagihanBelumLunas(page, "Hesti Purwanti");

  const checkout = page.getByRole("region", { name: "Checkout pasien" });
  await expect(checkout).toContainText("Checkout diblokir karena tagihan belum lunas");
  await expect(checkout.getByRole("button", { name: "Checkout pasien" })).toBeDisabled();
  // Peran kasir tidak melihat jalan pintas override.
  await expect(checkout.getByRole("button", { name: /Override checkout/ })).toHaveCount(0);

  // Admin melihat tombol override, dengan alasan wajib.
  await gantiPeranKeAdmin(page);
  await page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link", { name: "Kasir" }).click();
  await bukaTagihanBelumLunas(page, "Hesti Purwanti");

  const checkoutAdmin = page.getByRole("region", { name: "Checkout pasien" });
  await checkoutAdmin.getByRole("button", { name: "Override checkout" }).click();

  const alasan = page.getByLabel("Alasan override (wajib)");
  await expect(alasan).toBeVisible();
  // Alasan kosong ditolak store; pesannya menempel pada kolom alasan.
  await page.getByRole("button", { name: "Checkout dengan override" }).click();
  await expect(alasan).toHaveAttribute("aria-invalid", "true");
  await expect(alasan).toHaveAttribute("aria-describedby", "alasan-override-galat");
  await expect(page.locator("#alasan-override-galat")).toContainText("wajib");
  await expect(page.getByRole("region", { name: "Rincian tagihan" })).toContainText("belum bayar");

  await alasan.fill("Pasien rujukan mendesak");
  await page.getByRole("button", { name: "Checkout dengan override" }).click();

  // Admisi tertutup: baris daftar tagihan menandai admisi selesai, dan bed-nya
  // menunggu dibersihkan.
  await expect(
    page.getByRole("region", { name: "Daftar tagihan" }).getByRole("button", { name: /Hesti Purwanti/ }),
  ).toContainText("admisi selesai");
  await expect(page.getByRole("region", { name: "Checkout pasien" })).toContainText("Selesai");
  await expect(page.getByRole("region", { name: "Checkout pasien" })).toContainText("Lewat override oleh Sari Dewanti");
  await expect(page.getByRole("region", { name: "Checkout pasien" })).toContainText("Pasien rujukan mendesak");
  await expect(page.getByRole("status").filter({ hasText: "ditutup dengan override" })).toBeAttached();

  // Bed bekas pasien (Mawar II-2) berstatus dibersihkan di denah kamar.
  await page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link", { name: "Kamar & Bed" }).click();
  await expect(page.getByRole("region", { name: "Mawar II-2" })).toContainText("dibersihkan");
  await expect(page.getByRole("region", { name: "Ringkasan ketersediaan bed" })).toContainText("Dibersihkan");

  // Audit log memuat entri override beserta alasannya.
  await page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link", { name: "Audit Log" }).click();
  await expect(page).toHaveURL(/\/administrasi\/audit$/);
  await page.getByLabel("Jenis aksi").selectOption("checkout.override");

  const tabel = page.getByRole("table");
  await expect(tabel).toContainText("Override checkout");
  await expect(tabel).toContainText("Sari Dewanti");
  await expect(tabel).toContainText("Pasien rujukan mendesak");
});

test("checkout berjalan normal setelah tagihan lunas", async ({ page }) => {
  await bukaKasir(page);
  await bukaTagihanBelumLunas(page, "Hesti Purwanti");

  const sisa = page
    .getByRole("region", { name: "Rincian tagihan" })
    .locator("dl")
    .locator("div", { hasText: /^Sisa tagihan/ })
    .locator("dd");
  const jumlah = Number((await sisa.innerText()).replace(/[^\d]/g, ""));

  await page.getByLabel("Jumlah dibayar (Rp)").fill(String(jumlah));
  await page.getByRole("button", { name: "Catat pembayaran" }).click();
  await expect(page.getByRole("region", { name: "Rincian tagihan" })).toContainText("lunas");

  const checkout = page.getByRole("region", { name: "Checkout pasien" });
  await expect(checkout).toContainText("Tagihan lunas");
  await checkout.getByRole("button", { name: "Checkout pasien" }).click();

  await expect(checkout).toContainText("Selesai");
  await expect(checkout).toContainText("Checkout normal setelah tagihan lunas");
});
