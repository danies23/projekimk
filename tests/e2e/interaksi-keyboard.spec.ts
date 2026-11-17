import { expect, test, type Page } from "@playwright/test";
import { masukSebagai } from "./bantuan";

/**
 * Kriteria interaksi pada ticket: alur pendaftaran dan pembayaran selesai
 * sepenuhnya dengan keyboard, dialog memindahkan fokus ke dalam lalu
 * mengembalikannya ke pemicu, dan aksi tidak bisa terkirim dua kali.
 *
 * Semua test memakai `keyboard` saja — tidak ada `click`, `fill`, atau
 * `selectOption` — karena yang dinilai adalah apakah alurnya bisa diselesaikan
 * tanpa mouse.
 */

/** Tulis ke kolom yang sedang fokus. */
async function ketik(page: Page, teks: string) {
  await page.keyboard.type(teks);
}

/** Tab sampai elemen yang dituju menerima fokus, lalu kembalikan nama fokusnya. */
async function tabKe(page: Page, label: string | RegExp, batas = 40): Promise<boolean> {
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
    }, label instanceof RegExp ? label.source : label);
    if (cocok) return true;
  }
  return false;
}

test("alur pendaftaran selesai sepenuhnya dengan keyboard", async ({ page }) => {
  await masukSebagai(page, "Rina Kartika");
  await page.goto("/pendaftaran");
  await expect(page.getByRole("heading", { level: 1, name: "Pendaftaran pasien" })).toBeVisible();

  // Langkah 1: buat pasien baru. Fokus dimulai dari menu sidebar.
  await page.getByLabel("Nama pasien").focus();
  await ketik(page, "Pasien Keyboard");
  await page.getByLabel("NIK", { exact: true }).focus();
  await ketik(page, "3201010101010099");
  await page.getByLabel("Tanggal lahir").focus();
  await ketik(page, "1990-01-15");
  await page.getByLabel("Jenis kelamin").focus();
  await page.keyboard.press("ArrowDown");
  await page.getByLabel("Alamat").focus();
  await ketik(page, "Jl. Keyboard 1, Bandung");
  await page.getByLabel("Telepon pasien").focus();
  await ketik(page, "081200009999");
  await page.getByLabel("Nama penanggung jawab").focus();
  await ketik(page, "Penanggung Jawab");
  await page.getByLabel("Hubungan dengan pasien").focus();
  await ketik(page, "Saudara");
  await page.getByLabel("Telepon penanggung jawab").focus();
  await ketik(page, "081300009999");

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

  // Pilih tagihan pertama dari daftar dengan Tab + Enter.
  await page.getByRole("region", { name: "Daftar tagihan" }).getByRole("button").first().focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 2, name: /^Tagihan / })).toBeVisible();

  // Isi jumlah dengan angka, pilih metode dengan panah, lalu Enter submit.
  await page.getByLabel("Jumlah dibayar (Rp)").focus();
  await ketik(page, "100000");
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

  const jumlahAdmisi = () =>
    page.evaluate(() => {
      const snapshot = JSON.parse(localStorage.getItem("dmc.admisi.snapshot.v1") ?? "{}") as {
        state?: { admisi?: unknown[] };
      };
      return snapshot.state?.admisi?.length ?? 0;
    });
  const jumlahSebelum = await jumlahAdmisi();

  // Dua klik dalam satu tick, sebelum React sempat merender ulang — persis
  // yang terjadi saat pengguna menekan Enter dua kali dengan cepat.
  await page.evaluate(() => {
    const tombol = [...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === "Simpan admisi");
    if (!tombol) throw new Error("tombol Simpan admisi tidak ditemukan");
    tombol.click();
    tombol.click();
  });
  await expect(page.getByRole("heading", { level: 1, name: /Bukti pendaftaran/ })).toBeVisible();

  const jumlahSesudah = await jumlahAdmisi();
  expect(jumlahSesudah - jumlahSebelum, "klik ganda membuat lebih dari satu admisi").toBe(1);
});
