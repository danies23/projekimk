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
  await page.goto("/kamar");
  const bed = page.getByRole("region", { name: "Denah bed" });
  const statusBed = await bed.locator("li span.text-caption").allInnerTexts();
  expect(statusBed.length).toBeGreaterThan(0);
  for (const teks of statusBed) {
    expect(["terisi", "kosong", "dibersihkan"]).toContain(teks.trim());
  }

  // Status tagihan tertulis utuh ("belum bayar"/"sebagian"/"lunas"), bukan warna saja.
  await masukSebagai(page, "Joko Susilo");
  await page.goto("/kasir");
  const daftar = page.getByRole("region", { name: "Daftar tagihan" });
  const baris = await daftar.getByRole("button").allInnerTexts();
  expect(baris.length).toBeGreaterThan(0);
  for (const teks of baris) {
    expect(teks).toMatch(/belum bayar|sebagian|lunas/i);
  }
});

/**
 * Istilah Inggris yang lazim bocor pada prototipe, ditambah setiap istilah
 * "Avoid" pada GLOSSARY.md. Daftar ini sengaja mengambil istilah dari glossary
 * apa adanya, supaya kosakata yang dilarang tidak dirawat di dua tempat.
 */
const TERLARANG = new RegExp(
  [
    // Istilah Inggris umum pada antarmuka.
    "submit", "cancel", "save", "delete", "edit", "loading", "search here", "no data", "not found", "logout",
    // Organisasi & pengguna.
    "front desk", "resepsionis", "manajer", "owner",
    // Pasien & admisi.
    "\\bklien\\b", "\\bcustomer\\b", "\\buser\\b", "\\bMRN\\b", "patient id", "\\bencounter\\b",
    "\\bregistration\\b", "\\bdischarge\\b",
    // Kamar & bed.
    "\\bward\\b", "\\bbangsal\\b", "\\brunoang\\b", "\\branjang\\b", "\\bbooking\\b", "\\breservasi\\b",
    "race condition",
    // Klinis.
    "\\bEMR\\b", "\\bronda\\b", "\\bround\\b", "\\bprosedur\\b", "\\bperintah\\b", "prescription",
    // Farmasi.
    "dispense", "\\bdrug\\b", "\\bmedicine\\b", "pengeluaran obat",
    // Keuangan.
    "\\binvoice\\b", "\\bbill\\b", "\\bnota\\b", "cicilan", "angsuran", "\\bbypass\\b", "force discharge",
    // Dokumen & antarmuka.
    "\\bPDF\\b", "unduhan", "activity log",
    // Data demo.
    "\\bseed\\b", "\\bfixture\\b", "\\bdummy\\b",
  ].join("|"),
  "i",
);

test("teks antarmuka berbahasa Indonesia tanpa istilah terlarang glossary", async ({ page }) => {
  await masukSebagai(page, "Sari Dewanti");

  for (const { rute } of RUTE_PER_PERAN.filter((p) => p.nama === "Sari Dewanti")) {
    for (const r of rute) {
      await page.goto(r);
      await expect(page.getByRole("main")).toBeVisible();
      const teks = await teksTerlihat(page);
      // Tanpa ini, pengambil teks yang rusak membuat pemeriksaan lulus hampa:
      // string kosong tidak pernah cocok dengan pola terlarang.
      expect(teks.length, `teks ${r} tidak terbaca, pemeriksaan istilah tidak sah`).toBeGreaterThan(200);
      expect(teks.match(TERLARANG)?.[0] ?? null, `istilah asing/terlarang pada ${r}`).toBeNull();
    }
  }

  await page.goto("/login");
  const login = await teksTerlihat(page);
  expect(login.length, "teks /login tidak terbaca").toBeGreaterThan(200);
  expect(login.match(TERLARANG)?.[0] ?? null, "istilah asing/terlarang pada /login").toBeNull();
});
