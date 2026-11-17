import { test } from "@playwright/test";
import { masukSebagai } from "./bantuan";

test("ukuran label radio pembayaran", async ({ page }) => {
  await masukSebagai(page, "Joko Susilo");
  await page.goto("/kasir");
  await page.getByRole("region", { name: "Daftar tagihan" }).getByRole("button").first().click();
  const label = await page.locator('label:has(input[name="metode-pembayaran"])').evaluateAll((els) =>
    els.map((el) => { const k = el.getBoundingClientRect(); return { w: Math.round(k.width), h: Math.round(k.height) }; }));
  console.log("LABEL METODE:", JSON.stringify(label));
});

test("langkah 2 pendaftaran: label bed", async ({ page }) => {
  await masukSebagai(page, "Rina Kartika");
  await page.goto("/pendaftaran");
  // pilih pasien lama lalu lanjut
  await page.getByLabel("Kata kunci pencarian").fill("Siti");
  await page.getByRole("button", { name: /Siti Rahmawati/ }).first().click();
  const tombol = page.getByRole("button", { name: /Lanjut ke langkah 2/ });
  console.log("TOMBOL LANJUT:", await tombol.count());
  const semua = await page.getByRole("button").allInnerTexts();
  console.log("TOMBOL:", JSON.stringify(semua.map((s) => s.replace(/\s+/g, " ").trim())));
});
