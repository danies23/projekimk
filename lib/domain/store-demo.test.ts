import { describe, expect, it } from "vitest";
import { buatStoreDemo } from "./store-demo";
import { createMemoriPenyimpanan } from "./penyimpanan";
import { muatSnapshot } from "./persistensi";
import { IDENTITAS_PASIEN, PENGGUNA_UJI } from "./test-utils";
import { nilaiTagihan } from "./tagihan";

describe("store demo aplikasi", () => {
  it("menanam data demo pada muatan pertama", () => {
    const penyimpanan = createMemoriPenyimpanan();
    const store = buatStoreDemo({ penyimpanan, hariIni: "2026-03-15" });

    expect(store.getState().pasien.length).toBeGreaterThanOrEqual(36);
    expect(muatSnapshot(penyimpanan)).not.toBeNull();
  });

  it("memuat kembali snapshot yang sudah ada alih-alih menanam ulang", () => {
    const penyimpanan = createMemoriPenyimpanan();
    const pertama = buatStoreDemo({ penyimpanan, hariIni: "2026-03-15" });
    const sebelum = pertama.getState().pasien.length;

    const kedua = buatStoreDemo({ penyimpanan, hariIni: "2026-03-15" });

    expect(kedua.getState().pasien.length).toBe(sebelum);
  });

  it("menyimpan perubahan sehingga bertahan setelah dimuat ulang", () => {
    const penyimpanan = createMemoriPenyimpanan();
    const store = buatStoreDemo({ penyimpanan, hariIni: "2026-03-15" });
    const jumlahAwal = store.getState().pasien.length;

    const hasil = store.dispatch({
      type: "pasien/dibuat",
      olehId: PENGGUNA_UJI.pendaftaran,
      input: { ...IDENTITAS_PASIEN, nik: "3271010101010001", nama: "Pasien Demo Baru" },
    });
    expect(hasil.ok).toBe(true);

    const dimuatUlang = buatStoreDemo({ penyimpanan, hariIni: "2026-03-15" });
    expect(dimuatUlang.getState().pasien.length).toBe(jumlahAwal + 1);
    expect(dimuatUlang.getState().pasien.some((p) => p.nama === "Pasien Demo Baru")).toBe(true);
  });

  it("reset mengembalikan ke kondisi awal dan menyimpannya", () => {
    const penyimpanan = createMemoriPenyimpanan();
    const store = buatStoreDemo({ penyimpanan, hariIni: "2026-03-15" });
    const jumlahAwal = store.getState().pasien.length;
    store.dispatch({
      type: "pasien/dibuat",
      olehId: PENGGUNA_UJI.pendaftaran,
      input: { ...IDENTITAS_PASIEN, nik: "3271010101010002", nama: "Sementara" },
    });

    store.reset();

    expect(store.getState().pasien.length).toBe(jumlahAwal);
    expect(muatSnapshot(penyimpanan)!.pasien.length).toBe(jumlahAwal);
    const dimuatUlang = buatStoreDemo({ penyimpanan, hariIni: "2026-03-15" });
    expect(dimuatUlang.getState().pasien.length).toBe(jumlahAwal);
  });

  it("tetap berjalan ketika penyimpanan tidak tersedia", () => {
    const penyimpanan = {
      getItem: () => {
        throw new Error("diblokir");
      },
      setItem: () => {
        throw new Error("diblokir");
      },
      removeItem: () => {
        throw new Error("diblokir");
      },
    };

    const store = buatStoreDemo({ penyimpanan, hariIni: "2026-03-15" });

    expect(store.getState().pasien.length).toBeGreaterThan(0);
    const hasil = store.dispatch({
      type: "pasien/dibuat",
      olehId: PENGGUNA_UJI.pendaftaran,
      input: { ...IDENTITAS_PASIEN, nik: "3271010101010003" },
    });
    expect(hasil.ok).toBe(true);
  });

  it("data demo tidak memuat tagihan yang dibayar melebihi totalnya", () => {
    const store = buatStoreDemo({ penyimpanan: createMemoriPenyimpanan(), hariIni: "2026-03-15" });
    const state = store.getState();
    for (const tagihan of state.tagihan) {
      const nilai = nilaiTagihan(state, tagihan.id, "2026-03-15");
      expect(nilai.dibayar, `tagihan ${tagihan.id} dibayar ${nilai.dibayar} dari ${nilai.total}`).toBeLessThanOrEqual(
        nilai.total,
      );
    }
  });
});
