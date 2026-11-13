import { expect, test } from "@playwright/test";
import { masukSebagai } from "./bantuan";

/**
 * Setiap test memakai konteks peramban baru, sehingga localStorage kosong dan
 * data demo ditanam ulang oleh aplikasi. Test tidak bergantung pada urutan.
 */

test("halaman login menampilkan akun demo yang mengisi kredensial saat diklik", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("Masuk");
  const akun = page.getByRole("button", { name: /Rina Kartika/ });
  await expect(akun).toBeVisible();

  await akun.click();
  await expect(page.getByLabel("Email")).toHaveValue("rina@danimc.id");
  await expect(page.getByLabel("Sandi")).toHaveValue("demo123");
});

test("login dengan sandi salah menampilkan pesan dan tetap di halaman login", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Rina Kartika/ }).click();
  await page.getByLabel("Sandi").fill("keliru");
  await page.getByRole("button", { name: "Masuk" }).click();

  // `role="alert"` juga dipakai pengumum rute bawaan Next.js; batasi ke form.
  await expect(page.getByRole("main").getByRole("alert")).toContainText("tidak cocok");
  await expect(page).toHaveURL(/\/login$/);
});

test("login mengarahkan ke dashboard dengan peran aktif terlihat", async ({ page }) => {
  await masukSebagai(page, "Rina Kartika");

  await expect(page.getByRole("banner")).toContainText("Petugas Pendaftaran");
  await expect(page.getByRole("navigation", { name: "Navigasi utama" })).toBeVisible();
});

test("petugas pendaftaran mendapat pintasan Daftarkan Pasien, peran lain tidak", async ({ page }) => {
  await masukSebagai(page, "Rina Kartika");
  await expect(page.getByRole("link", { name: "Daftarkan Pasien" })).toBeVisible();

  await page.getByRole("button", { name: /Ganti peran/ }).click();
  await page.getByRole("menuitem", { name: /Kasir/ }).click();

  await expect(page.getByRole("link", { name: "Daftarkan Pasien" })).toHaveCount(0);
});

test("peralihan peran mengubah menu tanpa keluar dari aplikasi", async ({ page }) => {
  await masukSebagai(page, "Rina Kartika");
  const navigasi = page.getByRole("navigation", { name: "Navigasi utama" });
  await expect(navigasi).toContainText("Pendaftaran");
  await expect(navigasi).not.toContainText("Farmasi");

  await page.getByRole("button", { name: /Ganti peran/ }).click();
  await page.getByRole("menuitem", { name: /Apoteker/ }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("banner")).toContainText("Apoteker");
  await expect(navigasi).toContainText("Farmasi");
  await expect(navigasi).toContainText("Laporan");
  await expect(navigasi).not.toContainText("Pendaftaran");
});

test("rute di luar izin menampilkan layar penolakan yang menjelaskan sebabnya", async ({ page }) => {
  await masukSebagai(page, "Joko Susilo");

  await page.goto("/farmasi");

  const penolakan = page.getByRole("region", { name: "Akses ditolak" });
  await expect(penolakan).toBeVisible();
  await expect(penolakan).toContainText("Kasir");
  await expect(penolakan).toContainText("tidak memiliki akses");
  await expect(penolakan.getByRole("link", { name: /Dashboard/ })).toBeVisible();
});

test("sesi demo kosong mengembalikan pengguna ke halaman login", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Masuk");
});

test("resep antrean hanya terlihat di dashboard peran yang berhak", async ({ page }) => {
  await masukSebagai(page, "dr. Ayu Prameswari");

  await expect(page.getByRole("region", { name: "Ringkasan peran" })).toContainText("Pasien saya");
  await page.getByRole("button", { name: /Ganti peran/ }).click();
  await page.getByRole("menuitem", { name: /Kasir/ }).click();

  await expect(page.getByRole("region", { name: "Ringkasan peran" })).toContainText("Tagihan belum lunas");
  await expect(page.getByRole("region", { name: "Ringkasan peran" })).not.toContainText("Pasien saya");
});

test("berpindah ke peran yang tidak berhak atas halaman aktif tidak menyesatkan", async ({ page }) => {
  await masukSebagai(page, "Nadia Rahmania");
  await page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link", { name: "Farmasi" }).click();
  await expect(page).toHaveURL(/\/farmasi$/);

  // Apoteker boleh membuka farmasi; kasir tidak. Setelah berpindah, pengguna
  // harus diberi tahu, bukan dibiarkan di halaman yang tampak normal.
  await page.getByRole("button", { name: /Ganti peran/ }).click();
  await page.getByRole("menuitem", { name: /Kasir/ }).click();

  await expect(page.getByRole("region", { name: "Akses ditolak" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Akses ditolak" })).toContainText("Kasir");
});

test("sesi bertahan setelah halaman dimuat ulang", async ({ page }) => {
  await masukSebagai(page, "Sari Dewanti");

  await page.reload();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("banner")).toContainText("Admin");
});

test("dashboard pimpinan terbaca pada lebar tablet tanpa scroll horizontal", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await masukSebagai(page, "Hendra Wijaya");

  await expect(page.getByRole("region", { name: "Ringkasan peran" })).toContainText("Pendapatan bulan ini");

  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth, "lebar halaman melebihi viewport tablet").toBeLessThanOrEqual(clientWidth);
});
