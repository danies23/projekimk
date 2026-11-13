import { describe, expect, it } from "vitest";
import { buatDataDemo } from "./data-demo";
import { cariPasien, pasienDenganNik } from "./selectors";

/** Peringatan NIK ganda di formulir pendaftaran membaca selector ini, bukan memindai state sendiri. */
describe("pencarian NIK untuk peringatan duplikat", () => {
  it("menemukan pemilik NIK yang sudah terdaftar", () => {
    const state = buatDataDemo("2026-03-15");
    const pemilik = state.pasien[0]!;

    expect(pasienDenganNik(state, pemilik.nik)?.nomorRM).toBe(pemilik.nomorRM);
  });

  it("mengembalikan undefined untuk NIK yang belum dipakai", () => {
    const state = buatDataDemo("2026-03-15");
    expect(pasienDenganNik(state, "3271999999999999")).toBeUndefined();
  });

  it("hasil pencarian tetap memuat pasien ber-NIK tersebut", () => {
    const state = buatDataDemo("2026-03-15");
    const pemilik = state.pasien[5]!;
    expect(cariPasien(state, pemilik.nik)).toEqual([pemilik]);
  });
});
