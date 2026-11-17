import { expect, test, type Page } from "@playwright/test";
import { KUNCI_SNAPSHOT } from "../../lib/domain/penyimpanan";
import { masukSebagai } from "./bantuan";

/**
 * Kriteria interaksi pada ticket: alur pendaftaran dan pembayaran selesai
 * sepenuhnya dengan keyboard, dialog memindahkan fokus ke dalam lalu
 * mengembalikannya ke pemicu, dan klik ganda tidak tercatat dua kali.
 *
 * Alur di bawah hanya memakai `keyboard` dan `focus()` — tanpa `click`,
 * `fill`, atau `selectOption` — karena yang dinilai adalah apakah alurnya bisa
 * diselesaikan tanpa mouse. Test klik ganda di bagian akhir sengaja memakai
 * klik: yang diuji justru perilaku saat tombol ditekan dua kali.
 */

/** Tab sampai elemen yang cocok menerima fokus; gagal bila tidak ketemu. */
async function tabKe(page: Page, label: RegExp, batas = 40) {
  for (let i = 0; i < batas; i++) {
    await page.keyboard.press("Tab");
    const cocok = await page.evaluate((pola) => {
      const aktif = document.activeElement;
      if (!aktif) return false;
      const teks = [
        aktif.textContent ?? "",
        aktif.getAttribute("aria-label") ?? "",
        aktif.id ? (document.querySelector(`label[for="${aktif.id}"]`)?.textContent ?? "") : "",
      ].join(" ");
      return new RegExp(pola, "i").test(teks);
    }, label.source);
    if (cocok) return;
  }
  throw new Error(`tidak ada elemen berfokus yang cocok ${label} setelah ${batas} Tab`);
}

test("urutan Tab menyusuri menu sidebar sebelum masuk ke isi halaman", async ({ page }) => {
  await masukSebagai(page, "Rina Kartika");
  await page.goto("/pendaftaran");

  // Fokus mulai di awal dokumen; Tab harus melewati setiap tautan menu yang
  // memang terlihat, dalam urutan yang sama dengan tampilannya.
  await page.evaluate(() => document.body.focus());
  for (const nama of ["Dashboard", "Pendaftaran", "Kamar & Bed"]) {
    await tabKe(page, new RegExp(nama));
  }
});

test("alur pendaftaran selesai sepenuhnya dengan keyboard", async ({ page }) => {
  await masukSebagai(page, "Rina Kartika");
  await page.goto("/pendaftaran");
  await expect(page.getByRole("heading", { level: 1, name: "Pendaftaran pasien" })).toBeVisible();

  // Langkah 1: buat pasien baru. Setiap kolom difokuskan lalu diketik, tanpa klik.
  const isi = async (label: string, teks: string) => {
    await page.getByLabel(label).focus();
    await page.keyboard.type(teks);
  };
  await isi("Nama pasien", "Pasien Keyboard");
  await isi("NIK", "3201010101010099");
  await page.getByLabel("Tanggal lahir").focus();
  await page.keyboard.type("1990-01-15");
  await page.getByLabel("Jenis kelamin").focus();
  await page.keyboard.press("ArrowDown");
  await isi("Alamat", "Jl. Keyboard 1, Bandung");
  await isi("Telepon pasien", "081200009999");
  await isi("Nama penanggung jawab", "Penanggung Jawab");
  await isi("Hubungan dengan pasien", "Saudara");
  await isi("Telepon penanggung jawab", "081300009999");

  await page.getByRole("button", { name: "Simpan pasien" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Pasien tersimpan.")).toBeVisible();

  await page.getByRole("button", { name: "Lanjut ke langkah 2" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 2, name: /Dokter, tanggal masuk, dan bed/ })).toBeFocused();

  // Langkah 2: dokter dan bed dipilih dengan panah, bukan klik.
  await page.getByLabel("Dokter penanggung jawab").focus();
  await page.keyboard.press("ArrowDown");
  await page.locator('input[name="bed"]:not([disabled])').first().focus();
  await page.keyboard.press("Space");
  await expect(page.locator('input[name="bed"]:not([disabled])').first()).toBeChecked();

  await page.getByRole("button", { name: "Lanjut ke langkah 3" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 2, name: "Konfirmasi pendaftaran" })).toBeFocused();

  // Langkah 3: simpan admisi dan bukti pendaftaran tampil.
  await page.getByRole("button", { name: "Simpan admisi" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1, name: /Bukti pendaftaran/ })).toBeVisible();
});

test("alur pembayaran selesai sepenuhnya dengan keyboard", async ({ page }) => {
  await masukSebagai(page, "Joko Susilo");
  await page.goto("/kasir");

  // Pilih tagihan pertama dari daftar dengan fokus + Enter.
  await page.getByRole("region", { name: "Daftar tagihan" }).getByRole("button").first().focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 2, name: /^Tagihan / })).toBeVisible();

  // Isi jumlah dengan angka, pilih metode dengan Space, lalu Enter submit.
  await page.getByLabel("Jumlah dibayar (Rp)").focus();
  await page.keyboard.type("100000");
  await page.getByRole("radio", { name: "Transfer" }).focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("radio", { name: "Transfer" })).toBeChecked();

  await page.getByRole("button", { name: "Catat pembayaran" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("region", { name: "Riwayat pembayaran" })).toContainText("Transfer");
});

test("dialog reset data demo memindahkan fokus ke dalam lalu mengembalikannya ke pemicu", async ({
  page,
}) => {
  await masukSebagai(page, "Sari Dewanti");
  const pemicu = page.getByRole("button", { name: "Reset data demo" });
  await pemicu.focus();
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  // Fokus berada di dalam dialog, bukan tertinggal di halaman di belakangnya.
  expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
  await expect(dialog).toContainText("Reset data demo?");

  // Escape menutup dan mengembalikan fokus ke tombol pemicu.
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(pemicu).toBeFocused();
});

test("dialog pindah bed memindahkan fokus ke dalam lalu mengembalikannya ke pemicu", async ({ page }) => {
  await masukSebagai(page, "Ns. Dwi Lestari");
  await page.goto("/kamar");

  const pemicu = page.getByRole("button", { name: /Pindahkan pasien/ }).first();
  await pemicu.focus();
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(pemicu).toBeFocused();
});

const jumlahAdmisi = (page: Page) =>
  page.evaluate((kunci) => {
    const snapshot = JSON.parse(localStorage.getItem(kunci) ?? "{}") as { state?: { admisi?: unknown[] } };
    return snapshot.state?.admisi?.length ?? 0;
  }, KUNCI_SNAPSHOT);

test("klik ganda pada tombol simpan admisi tidak membuat admisi ganda", async ({ page }) => {
  await masukSebagai(page, "Rina Kartika");
  await page.goto("/pendaftaran");

  // Pasien yang sudah ada di data demo, supaya tidak perlu mengisi formulir.
  const pencarian = page.getByRole("region", { name: "Cari pasien lama" });
  await page.getByLabel("Kata kunci pencarian").fill("Siti");
  await pencarian.getByRole("button", { name: /Siti Rahmawati/ }).click();
  await page.getByLabel("Dokter penanggung jawab").selectOption({ index: 1 });
  await page.locator('input[name="bed"]:not([disabled])').first().check();
  await page.getByRole("button", { name: "Lanjut ke langkah 3" }).click();

  const jumlahSebelum = await jumlahAdmisi(page);

  // Dua klik dalam satu tick, sebelum React sempat merender ulang — persis
  // yang terjadi saat pengguna menekan Enter dua kali dengan cepat.
  await page.evaluate(() => {
    const tombol = [...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === "Simpan admisi");
    if (!tombol) throw new Error("tombol Simpan admisi tidak ditemukan");
    tombol.click();
    tombol.click();
  });
  await expect(page.getByRole("heading", { level: 1, name: /Bukti pendaftaran/ })).toBeVisible();

  const jumlahSesudah = await jumlahAdmisi(page);
  expect(jumlahSesudah - jumlahSebelum, "klik ganda membuat lebih dari satu admisi").toBe(1);
});
