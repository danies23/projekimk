import { describe, expect, it } from "vitest";
import { formatTanggal, formatTanggalWaktu } from "./format";

describe("formatTanggal", () => {
  it("menampilkan tanggal kalender dalam bahasa Indonesia", () => {
    expect(formatTanggal("1990-01-15")).toBe("15 Januari 1990");
  });

  it("tidak bergeser sehari pada tanggal awal bulan", () => {
    expect(formatTanggal("2026-03-01")).toBe("1 Maret 2026");
  });

  it("tetap benar untuk tanggal akhir tahun", () => {
    expect(formatTanggal("2026-12-31")).toBe("31 Desember 2026");
  });
});

describe("formatTanggalWaktu", () => {
  it("menampilkan tanggal dan jam lokal kejadian", () => {
    // 09:00 UTC = 16:00 WIB; vitest dipatok ke Asia/Jakarta.
    expect(formatTanggalWaktu("2026-03-01T09:00:00.000Z")).toBe("1 Maret 2026 pukul 16.00");
  });
});
