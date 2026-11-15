import { describe, expect, it } from "vitest";
import { createMemoriPenyimpanan, buatPenyimpananAman, type Penyimpanan } from "./penyimpanan";
import { buatStateKosong } from "./state";
import { IDENTITAS_PASIEN, PENGGUNA_UJI, depsUji, stateDasar, storeUji } from "./test-utils";
import { muatSnapshot, simpanSnapshot } from "./persistensi";
import type { State } from "./types";

function stateBerisiPasien() {
  const store = storeUji(depsUji(), stateDasar());
  const hasil = store.dispatch({ type: "pasien/dibuat", olehId: PENGGUNA_UJI.pendaftaran, input: IDENTITAS_PASIEN });
  if (!hasil.ok) throw new Error(hasil.alasan);
  return store.getState();
}

describe("penyimpanan", () => {
  it("menyimpan dan memuat snapshot dari memori", () => {
    const penyimpanan = createMemoriPenyimpanan();
    const state = stateBerisiPasien();

    simpanSnapshot(penyimpanan, state);

    expect(muatSnapshot(penyimpanan)).toEqual(state);
  });

  it("mengembalikan null saat tidak ada snapshot", () => {
    expect(muatSnapshot(createMemoriPenyimpanan())).toBeNull();
  });

  it("mengembalikan null saat isi penyimpanan rusak", () => {
    const penyimpanan: Penyimpanan = {
      getItem: () => "{ bukan json",
      setItem: () => {},
      removeItem: () => {},
    };

    expect(muatSnapshot(penyimpanan)).toBeNull();
  });

  it("mengisi koleksi yang belum ada pada snapshot lama agar layar tidak melempar", () => {
    const penyimpanan = createMemoriPenyimpanan();
    // Snapshot versi 1 dari sebelum `instruksiDijalankan` ada.
    const lama = stateBerisiPasien() as Partial<State> & Record<string, unknown>;
    delete lama.instruksiDijalankan;
    penyimpanan.setItem(
      "dmc.admisi.snapshot.v1",
      JSON.stringify({ versi: 1, disimpanPada: "2026-01-01T00:00:00.000Z", state: lama }),
    );

    const hasil = muatSnapshot(penyimpanan);

    expect(hasil?.instruksiDijalankan).toEqual([]);
    expect(hasil?.pasien).toHaveLength(1);
  });

  it("kegagalan menulis penyimpanan tidak melempar error", () => {
    const penyimpanan: Penyimpanan = {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
      removeItem: () => {},
    };

    expect(() => simpanSnapshot(penyimpanan, buatStateKosong())).not.toThrow();
  });

  it("kegagalan membaca penyimpanan jatuh ke null", () => {
    const penyimpanan: Penyimpanan = {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {},
      removeItem: () => {},
    };

    expect(muatSnapshot(penyimpanan)).toBeNull();
  });

  it("memilih memori ketika localStorage tidak tersedia", () => {
    const penyimpanan = buatPenyimpananAman(() => {
      throw new Error("localStorage diblokir");
    });

    expect(() => penyimpanan.setItem("x", "y")).not.toThrow();
    expect(penyimpanan.getItem("x")).toBe("y");
  });

  it("memakai localStorage ketika tersedia", () => {
    const data = new Map<string, string>();
    const penyimpanan = buatPenyimpananAman(() => ({
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
      removeItem: (k: string) => void data.delete(k),
    }));

    penyimpanan.setItem("kunci", "nilai");

    expect(data.get("kunci")).toBe("nilai");
  });

  it("reset data demo mengembalikan state ke kondisi awal", () => {
    const awal = stateBerisiPasien();
    const store = storeUji(depsUji(), structuredClone(awal));
    store.dispatch({
      type: "pasien/dibuat",
      olehId: PENGGUNA_UJI.pendaftaran,
      input: { ...IDENTITAS_PASIEN, nik: "3201015501900002" },
    });
    expect(store.getState().pasien).toHaveLength(2);

    store.reset(structuredClone(awal));

    expect(store.getState()).toEqual(awal);
  });
});
