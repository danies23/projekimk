import { expect, test, type Page } from "@playwright/test";
import { masukSebagai } from "./bantuan";

/**
 * Kriteria ticket yang tidak tertangkap audit axe: tidak ada rute atau tombol
 * yang membawa ke layar kosong atau halaman error, setiap status terbaca tanpa
 * warna, dan seluruh teks antarmuka berbahasa Indonesia.
 */

const RUTE: Array<{ peran: string; rute: string[] }> = [
  { peran: "Rina Kartika", rute: ["/dashboard", "/pendaftaran", "/kamar"] },
  { peran: "dr. Ayu Prameswari", rute: ["/dashboard", "/klinis"] },
  { peran: "Ns. Dwi Lestari", rute: ["/dashboard", "/klinis", "/kamar"] },
  { peran: "Nadia Rahmania", rute: ["/dashboard", "/farmasi", "/laporan"] },
  { peran: "Joko Susilo", rute: ["/dashboard", "/kasir", "/laporan"] },
  { peran: "Hendra Wijaya", rute: ["/dashboard", "/laporan"] },
  {
    peran: "Sari Dewanti",
    rute: ["/dashboard", "/kamar", "/farmasi", "/kasir", "/laporan", "/administrasi", "/administrasi/audit"],
  },
];

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

for (const { peran, rute } of RUTE) {
  for (const r of rute) {
    test(`${peran} — ${r}: tidak kosong dan tanpa halaman error`, async ({ page }) => {
      await masukSebagai(page, peran);
      await page.goto(r);

      await expect(page.getByRole("main")).toBeVisible();
      // Halaman error Next.js memasang tombol "Try again" / teks "Application error".
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
    // Rute yang ditolak tetap menjelaskan sebabnya, bukan halaman kosong.
    await expect(page.getByRole("main")).not.toContainText(/404|This page could not be found/i);
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

test("teks antarmuka berbahasa Indonesia tanpa istilah Inggris yang terlarang", async ({ page }) => {
  await masukSebagai(page, "Sari Dewanti");
  // Istilah Inggris yang lazim bocor pada prototipe, plus istilah yang
  // dilarang GLOSSARY.md.
  const terlarang = /\b(submit|cancel|save|delete|edit|loading|search here|no data|not found|dashboard only|patient|invoice|discharge|assign|booking|reservation|seed|fixture|dummy)\b/i;

  for (const r of ["/dashboard", "/kamar", "/farmasi", "/kasir", "/laporan", "/administrasi", "/administrasi/audit"]) {
    await page.goto(r);
    await expect(page.getByRole("main")).toBeVisible();
    const teks = await teksTerlihat(page);
    const cocok = teks.match(terlarang);
    expect(cocok?.[0] ?? null, `istilah asing/terlarang pada ${r}`).toBeNull();
  }

  await page.goto("/login");
  const login = await teksTerlihat(page);
  expect(login.match(terlarang)?.[0] ?? null, "istilah asing/terlarang pada /login").toBeNull();
});
