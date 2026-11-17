import { expect, test, type Page } from "@playwright/test";
import { RUTE_PER_PERAN, masukSebagai } from "./bantuan";

/**
 * Kriteria ticket yang tidak tertangkap audit axe: tidak ada rute atau tombol
 * yang membawa ke layar kosong atau halaman error, setiap status terbaca tanpa
 * warna, dan seluruh teks antarmuka memakai istilah sesuai GLOSSARY.md.
 */

/** Teks yang terlihat di layar, tanpa isi elemen tersembunyi. */
async function teksTerlihat(page: Page): Promise<string> {
  return page.evaluate(() => {
    const main = document.querySelector("main");
    if (!main) return "";
    const jalan: string[] = [];
    for (const el of main.querySelectorAll("*")) {
      if (el.closest('[aria-hidden="true"], .sr-only, script, style')) continue;
      for (const node of el.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) jalan.push(node.textContent ?? "");
      }
    }
    return jalan.join(" ").replace(/\s+/g, " ").trim();
  });
}

for (const { nama, rute } of RUTE_PER_PERAN) {
  for (const r of rute) {
    test(`${nama} — ${r}: tidak kosong dan tanpa halaman error`, async ({ page }) => {
      await masukSebagai(page, nama);
      await page.goto(r);

      await expect(page.getByRole("main")).toBeVisible();
      // Halaman error Next.js memasang teks dan tombol percobaan ulang.
      await expect(page.locator("body")).not.toContainText(/Application error|Internal Server Error/i);
      expect((await teksTerlihat(page)).length, `isi ${r} kosong`).toBeGreaterThan(40);
    });
  }
}

test("setiap tautan sidebar membuka halaman berisi, bukan layar kosong", async ({ page }) => {
  await masukSebagai(page, "Sari Dewanti");
  const navigasi = page.getByRole("navigation", { name: "Navigasi utama" });
  const tautan = await navigasi.getByRole("link").evaluateAll((as) => as.map((a) => a.getAttribute("href")!));

  for (const href of tautan) {
    await page.goto(href!);
    await expect(page.getByRole("main")).toBeVisible();
    expect((await teksTerlihat(page)).length, `isi ${href} kosong`).toBeGreaterThan(40);
    await expect(page.getByRole("main")).not.toContainText(/Halaman tidak ditemukan|This page could not be found/i);
  }
});

test("status bed dan tagihan selalu disertai teks, bukan hanya warna", async ({ page }) => {
  await masukSebagai(page, "Rina Kartika");

  // Setiap bed yang tampil membawa label status tertulis di sebelah kodenya.
  // Dibaca dari teks, bukan dari kelas CSS: struktur markup boleh berubah
  // tanpa membuat pemeriksaan ini lulus atau gagal secara keliru.
  await page.goto("/kamar");
  const bed = page.getByRole("region", { name: "Denah bed" });
  const statusBed = await bed.getByText(/^(terisi|kosong|dibersihkan)$/).allInnerTexts();
  expect(statusBed.length, "tidak ada label status bed terbaca").toBeGreaterThan(0);
  for (const teks of statusBed) {
    expect(["terisi", "kosong", "dibersihkan"]).toContain(teks.trim());
  }

  // Status tagihan tertulis utuh ("belum bayar"/"sebagian"/"lunas"), bukan warna saja.
  await masukSebagai(page, "Joko Susilo");
  await page.goto("/kasir");
  const daftar = page.getByRole("region", { name: "Daftar tagihan" });
  await expect(daftar.getByRole("button").first()).toBeVisible();
  const baris = await daftar.getByRole("button").allInnerTexts();
  expect(baris.length).toBeGreaterThan(0);
  for (const teks of baris) {
    expect(teks).toMatch(/belum bayar|sebagian|lunas/i);
  }
});

test("status resep, admisi, pengguna, dan stok terbaca sebagai teks", async ({ page }) => {
  // Setiap keluarga status yang muncul di antarmuka; yang diuji bukan warnanya,
  // melainkan bahwa statusnya dapat dibaca sebagai kata.
  const keluarga: Array<{ peran: string; rute: string; status: RegExp }> = [
    { peran: "Nadia Rahmania", rute: "/farmasi", status: /menunggu|disiapkan|diserahkan/i },
    { peran: "Sari Dewanti", rute: "/administrasi", status: /\baktif\b|\bnonaktif\b/i },
    { peran: "Nadia Rahmania", rute: "/farmasi", status: /stok menipis/i },
    { peran: "Joko Susilo", rute: "/kasir", status: /aktif \(masih dirawat\)|selesai/i },
  ];

  for (const { peran, rute, status } of keluarga) {
    await masukSebagai(page, peran);
    await page.goto(rute);
    await expect(page.getByRole("main")).toContainText(status);
  }
});

/**
 * Istilah "Avoid" pada GLOSSARY.md, ditambah istilah Inggris umum yang lazim
 * bocor ke antarmuka. Daftar ini mengikuti glossary apa adanya supaya kosakata
 * yang dilarang tidak dirawat di dua tempat.
 */
const TERLARANG = new RegExp(
  [
    // Istilah Inggris umum pada antarmuka.
    "submit", "cancel", "save", "delete", "edit", "loading", "search here", "no data", "not found", "logout",
    // Organisasi & pengguna.
    "front desk", "resepsionis", "admin pendaftaran", "manajer", "direktur", "owner",
    // Pasien & admisi.
    "\\bklien\\b", "\\bcustomer\\b", "\\buser\\b", "\\bMRN\\b", "patient id", "nomor pasien",
    // "keluar" sengaja tidak masuk: glossary hanya melarangnya sebagai NAMA AKSI;
    // sebagai keadaan ("pasien keluar") ia kata Indonesia yang wajar.
    "\\bencounter\\b", "\\bregistration\\b", "\\bdischarge\\b", "\\bpasien pulang\\b",
    // Kamar & bed.
    "\\bward\\b", "\\bbangsal\\b", "\\bruang\\b", "\\brunoang\\b", "\\btempat tidur\\b", "\\branjang\\b",
    "bed number", "\\bassign\\b", "\\bbooking\\b", "\\breservasi\\b", "race condition", "\\bkonflik\\b",
    "status kamar", "\\bdirty\\b", "\\bcleaning\\b",
    // Klinis.
    "medical record", "\\bEMR\\b", "riwayat pasien", "\\bronda\\b", "\\bround\\b", "\\bprosedur\\b",
    "\\baction\\b", "\\blayanan\\b", "\\bperintah\\b", "\\border\\b", "\\btask\\b", "to-do",
    "prescription", "order obat",
    // Farmasi.
    "dispense", "dispensing", "pengeluaran obat", "\\bdrug\\b", "\\bmedicine\\b", "\\bbarang\\b",
    // Keuangan.
    "\\binvoice\\b", "\\bbill\\b", "\\bnota\\b", "\\bpayment\\b", "cicilan", "angsuran",
    "status pembayaran", "\\bpaid\\b", "\\bunpaid\\b", "\\bbypass\\b", "force discharge", "pengecualian",
    // Dokumen & antarmuka.
    "\\bPDF\\b", "unduhan", "\\bexport\\b", "activity log", "\\bhistory\\b", "log sistem",
    // Data demo.
    "\\bseed\\b", "\\bfixture\\b", "\\bdummy\\b",
  ].join("|"),
  "i",
);

/** Pemeriksaan istilah untuk satu rute; kosong berarti bersih. */
async function periksaIstilah(page: Page, rute: string): Promise<string | null> {
  await page.goto(rute);
  await expect(page.getByRole("main")).toBeVisible();
  const teks = await teksTerlihat(page);
  // Tanpa ini, pengambil teks yang rusak membuat pemeriksaan lulus hampa:
  // string kosong tidak pernah cocok dengan pola terlarang. Ambangnya rendah
  // karena dashboard perawat memang hanya ~190 karakter; yang dicegah adalah
  // halaman benar-benar kosong, bukan halaman ringkas.
  expect(teks.length, `teks ${rute} tidak terbaca, pemeriksaan istilah tidak sah`).toBeGreaterThan(120);
  return teks.match(TERLARANG)?.[0] ?? null;
}

// Satu test per peran, bukan satu test untuk semuanya: versi gabungan menghabiskan
// anggaran 30 detik saat suite berjalan paralel, dan gagal sebagai timeout —
// pesan yang menyesatkan untuk pemeriksaan kosakata.
for (const { nama, rute } of RUTE_PER_PERAN) {
  test(`${nama}: istilah antarmuka sesuai glossary`, async ({ page }) => {
    await masukSebagai(page, nama);
    for (const r of rute) {
      expect(await periksaIstilah(page, r), `istilah asing/terlarang pada ${r}`).toBeNull();
    }
  });
}

test("halaman login memakai istilah yang sama", async ({ page }) => {
  expect(await periksaIstilah(page, "/login"), "istilah asing/terlarang pada /login").toBeNull();
});
