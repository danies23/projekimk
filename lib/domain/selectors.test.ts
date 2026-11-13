import { describe, expect, it } from "vitest";
import { buatDataDemo } from "./data-demo";
import { admisiAktif, cariPasien, ringkasanBed } from "./selectors";
import { IDENTITAS_PASIEN, PENGGUNA_UJI, stateDenganAdmisi } from "./test-utils";

describe("selector pasien", () => {
  it("mencari pasien berdasarkan nama tanpa membedakan huruf besar-kecil", () => {
    const { store } = stateDenganAdmisi();
    expect(cariPasien(store.getState(), "siti")).toHaveLength(1);
    expect(cariPasien(store.getState(), "SITI RAHMAWATI")[0]!.nama).toBe(IDENTITAS_PASIEN.nama);
  });

  it("mencari pasien berdasarkan NIK dan Nomor Rekam Medis", () => {
    const { store } = stateDenganAdmisi();
    expect(cariPasien(store.getState(), IDENTITAS_PASIEN.nik)).toHaveLength(1);
    expect(cariPasien(store.getState(), "RM-2026-1")).toHaveLength(1);
  });

  it("mengembalikan daftar kosong untuk kata kunci tanpa hasil", () => {
    const { store } = stateDenganAdmisi();
    expect(cariPasien(store.getState(), "tidak-ada-siapa")).toEqual([]);
  });

  it("mengembalikan daftar kosong untuk kata kunci kosong, bukan seluruh pasien", () => {
    const { store } = stateDenganAdmisi();
    expect(cariPasien(store.getState(), "   ")).toEqual([]);
  });
});

describe("selector bed", () => {
  it("menghitung jumlah bed per status dan BOR", () => {
    const { store } = stateDenganAdmisi();
    const ringkasan = ringkasanBed(store.getState());

    expect(ringkasan).toMatchObject({ total: 2, terisi: 1, kosong: 1, dibersihkan: 0 });
    expect(ringkasan.bor).toBe(50);
  });

  it("BOR pada data demo berada di kisaran 60–70 persen", () => {
    const ringkasan = ringkasanBed(buatDataDemo("2026-03-15"));

    expect(ringkasan.total).toBe(16);
    expect(ringkasan.bor).toBeGreaterThanOrEqual(60);
    expect(ringkasan.bor).toBeLessThanOrEqual(70);
  });

  it("BOR bernilai nol ketika belum ada bed, bukan NaN", () => {
    const kosong = { ...buatDataDemo("2026-03-15"), bed: [], admisi: [] };
    expect(ringkasanBed(kosong)).toMatchObject({ total: 0, terisi: 0, bor: 0 });
  });
});

describe("selector admisi", () => {
  it("hanya mengembalikan admisi aktif", () => {
    const { store, admisiId } = stateDenganAdmisi();
    expect(admisiAktif(store.getState()).map((a) => a.id)).toEqual([admisiId]);
  });
});
