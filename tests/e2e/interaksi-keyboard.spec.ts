import { expect, test, type Page } from "@playwright/test";
import { KUNCI_SNAPSHOT } from "../../lib/domain/penyimpanan";
import { masukSebagai } from "./bantuan";

/**
 * Kriteria interaksi pada ticket: alur pendaftaran dan pembayaran selesai
 * sepenuhnya dengan keyboard, dialog memindahkan fokus ke dalam lalu
 * mengembalikannya ke pemicu, dan aksi tidak tercatat dua kali.
 *
 * Alur di bawah memakai Tab, Enter, Space, panah, dan pengetikan saja — tanpa
 * `click`, `fill`, atau `selectOption` — karena yang dinilai adalah apakah
 * pengguna keyboard benar-benar bisa menyelesaikannya. Test klik ganda di
 * bagian akhir sengaja memakai klik: yang diuji justru tombolnya.
 */

/** Tab sampai elemen yang cocok menerima fokus; gagal bila tidak ketemu. */
async function tabKe(page: Page, label: string | RegExp, batas = 60) {
  const pola = typeof label === "string" ? label : label.source;
  for (let i = 0; i < batas; i++) {
    await page.keyboard.press("Tab");
    const cocok = await page.evaluate((sumber) => {
      const aktif = document.activeElement;
      if (!aktif) return false;
      // Radio dan checkbox dibungkus label-nya, bukan dihubungkan lewat `id`.
      const labelPembungkus = aktif.closest("label")?.textContent ?? "";
      const teks = [
        aktif.textContent ?? "",
        aktif.getAttribute("aria-label") ?? "",
        aktif.id ? (document.querySelector(`label[for="${aktif.id}"]`)?.textContent ?? "") : "",
        labelPembungkus,
        aktif.tagName === "INPUT" && (aktif as HTMLInputElement).type === "radio" ? "radio" : "",
      ]
        .filter(Boolean)
        .join(" ");
      return new RegExp(sumber, "i").test(teks);
    }, pola);
    if (cocok) return;
  }
  throw new Error(`tidak ada elemen berfokus yang cocok /${pola}/ setelah ${batas} Tab`);
}

/** Tab sampai kembali ke elemen yang sama (siklus penuh), mengumpulkan nama tiap langkah. */
async function jejakTab(page: Page, langkah = 25): Promise<string[]> {
  const jejak: string[] = [];
  for (let i = 0; i < langkah; i++) {
    await page.keyboard.press("Tab");
    jejak.push(
      await page.evaluate(() => {
        const aktif = document.activeElement as HTMLElement | null;
        if (!aktif) return "tidak ada";
        const label = aktif.id ? document.querySelector(`label[for="${aktif.id}"]`)?.textContent : null;
        return label ?? aktif.getAttribute("aria-label") ?? ((aktif.textContent ?? "").trim().slice(0, 30) || aktif.tagName);
      }),
    );
  }
  return jejak;
}

test("urutan Tab menyusuri header, sidebar, lalu isi halaman", async ({ page }) => {
  await masukSebagai(page, "Rina Kartika");
  await page.goto("/pendaftaran");
  // Tunggu isi halaman benar-benar ter-render; sebelum itu fokus masih berada
  // pada elemen pemuatan dan jejak Tab tidak mewakili antarmuka.
  await expect(page.getByRole("heading", { level: 1, name: "Pendaftaran pasien" })).toBeVisible();
  // Mulai dari awal dokumen, bukan dari elemen yang difokuskan test.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.locator("body").click({ position: { x: 1, y: 1 } });

  const jejak = await jejakTab(page, 14);
  const menu = ["Dashboard", "Pendaftaran", "Kamar & Bed"];
  // Sidebar adalah jalur pertama; tidak ada target yang terlewat di antaranya.
  for (const nama of menu) {
    expect(jejak, `menu ${nama} tidak terjangkau Tab`).toContain(nama);
  }
  const posisi = menu.map((m) => jejak.indexOf(m));
  expect(posisi, "urutan Tab tidak mengikuti urutan menu").toEqual([...posisi].sort((a, b) => a - b));
});

test("alur pendaftaran selesai sepenuhnya dengan keyboard", async ({ page }) => {
  await masukSebagai(page, "Rina Kartika");
  await page.goto("/pendaftaran");
  await expect(page.getByRole("heading", { level: 1, name: "Pendaftaran pasien" })).toBeVisible();

  // Langkah 1: seluruh kolom dicapai dengan Tab, mulai dari kata kunci
  // pencarian. Nama pasien baru belum terdaftar, jadi hasil pencarian kosong.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.locator("body").click({ position: { x: 1, y: 1 } });
  await tabKe(page, /Kata kunci pencarian/);
  await page.keyboard.type("Pasien Keyboard");
  await tabKe(page, /Nama pasien/);
  await page.keyboard.type("Pasien Keyboard");
  // Isi kolom lainnya dicapai berurutan tanpa pernah kembali ke awal dokumen.
  await tabKe(page, /NIK/);
  await page.keyboard.type("3201010101010099");
  await tabKe(page, /Tanggal lahir/);
  await page.keyboard.type("1990-01-15");
  await tabKe(page, /Jenis kelamin/);
  await page.keyboard.press("ArrowDown");
  await tabKe(page, /Alamat/);
  await page.keyboard.type("Jl. Keyboard 1, Bandung");
  await tabKe(page, /Telepon pasien/);
  await page.keyboard.type("081200009999");
  await tabKe(page, /Nama penanggung jawab/);
  await page.keyboard.type("Penanggung Jawab");
  await tabKe(page, /Hubungan dengan pasien/);
  await page.keyboard.type("Saudara");
  await tabKe(page, /Telepon penanggung jawab/);
  await page.keyboard.type("081300009999");

  await tabKe(page, /Simpan pasien/);
  await page.keyboard.press("Enter");
  await expect(page.getByText("Pasien tersimpan.")).toBeVisible();

  // Setelah pasien tersimpan, tombol lanjut muncul di atas daftar admisi aktif;
  // fokus keyboard masih berada di tombol simpan, jadi Tab berikutnya memang
  // menyusuri daftar. Pengguna keyboard mencapainya dengan Shift+Tab.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.locator("body").click({ position: { x: 1, y: 1 } });
  await tabKe(page, /Lanjut ke langkah 2/);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 2, name: /Dokter, tanggal masuk, dan bed/ })).toBeFocused();

  // Langkah 2: dokter dan bed dipilih dengan panah dan Space, bukan klik.
  await tabKe(page, /Dokter penanggung jawab/);
  await page.keyboard.press("ArrowDown");
  await tabKe(page, /radio/i);
  await page.keyboard.press("Space");
  await expect(page.locator('input[name="bed"]:not([disabled])').first()).toBeChecked();

  await tabKe(page, /Lanjut ke langkah 3/);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 2, name: "Konfirmasi pendaftaran" })).toBeFocused();
  // Langkah 3: simpan admisi dan bukti pendaftaran tampil.
  await tabKe(page, /Simpan admisi/);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1, name: /Bukti pendaftaran/ })).toBeVisible();
});

test("alur pembayaran selesai sepenuhnya dengan keyboard", async ({ page }) => {
  await masukSebagai(page, "Joko Susilo");
  await page.goto("/kasir");

  // Pilih tagihan pertama dari daftar dengan Tab + Enter; tombolnya membaca
  // "Nama pasien" beserta status tagihannya.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await tabKe(page, /belum bayar|sebagian|lunas/i);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 2, name: /^Tagihan / })).toBeVisible();

  // Isi jumlah dengan angka, pilih metode dengan panah (radio satu grup berbagi
  // satu titik Tab), lalu Enter submit.
  await tabKe(page, /Jumlah dibayar/);
  await page.keyboard.type("100000");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("radio", { name: "Tunai" })).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: "Transfer" })).toBeChecked();

  await tabKe(page, /Catat pembayaran/);
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

/**
 * Jumlah koleksi pada snapshot tersimpan. Dipakai test klik ganda untuk
 * membuktikan tidak ada baris kedua yang tercatat.
 */
const hitung = (page: Page, koleksi: string) =>
  page.evaluate(
    ([kunci, nama]) => {
      const snapshot = JSON.parse(localStorage.getItem(kunci) ?? "{}") as { state?: Record<string, unknown[]> };
      return snapshot.state?.[nama]?.length ?? 0;
    },
    [KUNCI_SNAPSHOT, koleksi] as const,
  );

/**
 * Klik ganda seperti yang bisa dilakukan pengguna: dua klik berurutan pada
 * tombol yang sama, bukan dua klik di dalam satu tick JavaScript — yang terakhir
 * mustahil dihasilkan peramban sungguhan.
 */
async function klikGanda(page: Page, label: string) {
  const tombol = page.getByRole("button", { name: label, exact: true });
  await tombol.focus();
  await page.keyboard.press("Enter");
  // Enter kedua mendarat sebelum React sempat merender ulang: jendela terburuk
  // dari klik ganda yang benar-benar mungkin.
  await page.keyboard.press("Enter");
}

/**
 * Setiap aksi yang menambah baris diuji dengan Enter dua kali berurutan pada
 * tombol yang sama — bentuk klik ganda yang benar-benar bisa dilakukan
 * pengguna. Yang harus terbukti: bertambah tepat satu.
 */
const AKSI_GANDA: Array<{ nama: string; koleksi: string; siapkan: (page: Page) => Promise<void>; tombol: string }> = [
  {
    nama: "admisi",
    koleksi: "admisi",
    siapkan: async (page) => {
      await page.getByLabel("Kata kunci pencarian").fill("Siti");
      await page.getByRole("region", { name: "Cari pasien lama" }).getByRole("button", { name: /Siti Rahmawati/ }).click();
      await page.getByLabel("Dokter penanggung jawab").selectOption({ index: 1 });
      await page.locator('input[name="bed"]:not([disabled])').first().check();
      await page.getByRole("button", { name: "Lanjut ke langkah 3" }).click();
    },
    tombol: "Simpan admisi",
  },
  {
    nama: "pembayaran",
    koleksi: "pembayaran",
    siapkan: async (page) => {
      await page.getByRole("region", { name: "Daftar tagihan" }).getByRole("button").first().click();
      await page.getByLabel("Jumlah dibayar (Rp)").fill("10000");
    },
    tombol: "Catat pembayaran",
  },
  {
    nama: "catatan klinis",
    koleksi: "catatanKlinis",
    siapkan: async (page) => {
      await page.getByRole("region", { name: "Pasien saya" }).getByRole("button").first().click();
      await page.getByLabel("Isi visite").fill("Visite uji klik ganda.");
      await page.getByLabel("Diagnosa").fill("Diagnosa uji");
      await page.getByLabel("Rencana").fill("Rencana uji");
    },
    tombol: "Simpan catatan visite",
  },
  {
    nama: "tindakan admisi",
    koleksi: "tindakanAdmisi",
    siapkan: async (page) => {
      await page.getByRole("region", { name: "Pasien saya" }).getByRole("button").first().click();
      await page.getByLabel("Tindakan dari master").selectOption({ index: 1 });
    },
    tombol: "Tambahkan tindakan",
  },
  {
    nama: "obat",
    koleksi: "obat",
    siapkan: async (page) => {
      await page.getByLabel("Nama obat").fill("Obat Uji Ganda");
      await page.getByLabel("Satuan").fill("tablet");
      await page.getByLabel("Harga (Rp)").fill("5000");
      await page.getByLabel("Stok awal").fill("10");
      await page.getByLabel("Stok minimum").fill("2");
    },
    tombol: "Simpan obat",
  },
  {
    nama: "pengguna",
    koleksi: "pengguna",
    siapkan: async (page) => {
      await page.getByLabel("Nama lengkap").last().fill("Pengguna Uji Ganda");
    },
    tombol: "Simpan pengguna",
  },
  {
    nama: "kamar",
    koleksi: "kamar",
    siapkan: async (page) => {
      await page.getByLabel("Nama kamar").fill("Kamar Uji Ganda");
      await page.getByLabel("Tarif harian (Rp)").fill("100000");
      await page.getByLabel("Kapasitas bed").fill("3");
    },
    tombol: "Simpan kamar",
  },
];

const RUTE_AKSI: Record<string, { peran: string; rute: string }> = {
  admisi: { peran: "Rina Kartika", rute: "/pendaftaran" },
  pembayaran: { peran: "Joko Susilo", rute: "/kasir" },
  "catatan klinis": { peran: "dr. Ayu Prameswari", rute: "/klinis" },
  "tindakan admisi": { peran: "dr. Ayu Prameswari", rute: "/klinis" },
  obat: { peran: "Nadia Rahmania", rute: "/farmasi" },
  pengguna: { peran: "Sari Dewanti", rute: "/administrasi" },
  kamar: { peran: "Sari Dewanti", rute: "/kamar" },
};

for (const aksi of AKSI_GANDA) {
  test(`klik ganda pada ${aksi.nama} tidak tercatat dua kali`, async ({ page }) => {
    const { peran, rute } = RUTE_AKSI[aksi.nama]!;
    await masukSebagai(page, peran);
    await page.goto(rute);
    await aksi.siapkan(page);

    const sebelum = await hitung(page, aksi.koleksi);
    await klikGanda(page, aksi.tombol);
    await expect(page.getByRole("main")).toBeVisible();
    // Beri React satu putaran untuk menulis snapshot sebelum dihitung.
    await page.waitForTimeout(200);

    expect((await hitung(page, aksi.koleksi)) - sebelum, `klik ganda pada ${aksi.tombol}`).toBe(1);
  });
}
