import { describe, expect, it } from "vitest";
import { masuk, penggunaSesi } from "./masuk";
import { AKUN_DEMO, SANDI_DEMO } from "./domain/demo-accounts";
import { buatDataDemo } from "./domain/data-demo";

const HARI_INI = "2026-03-15";
const state = buatDataDemo(HARI_INI);

describe("masuk dengan akun demo", () => {
  it("menerima email dan sandi akun demo yang dikenal", () => {
    const akun = AKUN_DEMO.find((a) => a.peran === "kasir")!;

    expect(masuk(state, akun.email, SANDI_DEMO)).toEqual({ ok: true, penggunaId: akun.id });
  });

  it("menolak sandi yang salah tanpa menyebut email terdaftar atau tidak", () => {
    const akun = AKUN_DEMO[0]!;

    expect(masuk(state, akun.email, "salah")).toEqual({ ok: false, alasan: expect.stringContaining("tidak cocok") });
  });

  it("menolak email yang tidak dikenal", () => {
    expect(masuk(state, "orang@asing.id", SANDI_DEMO)).toEqual({
      ok: false,
      alasan: expect.stringContaining("tidak cocok"),
    });
  });

  it("menolak pengguna yang sudah dinonaktifkan", () => {
    const nonaktif = {
      ...state,
      pengguna: state.pengguna.map((p) => (p.id === "u-kasir" ? { ...p, aktif: false } : p)),
    };

    expect(masuk(nonaktif, "joko@danimc.id", SANDI_DEMO)).toEqual({
      ok: false,
      alasan: expect.stringContaining("tidak aktif"),
    });
  });
});

describe("memulihkan sesi demo", () => {
  it("mengembalikan pengguna untuk sesi yang masih sah", () => {
    expect(penggunaSesi(state.pengguna, { penggunaId: "u-perawat" })?.peran).toBe("perawat");
  });

  it("mengembalikan null bila sesi kosong, pengguna hilang, atau sudah nonaktif", () => {
    const nonaktif = state.pengguna.map((p) => (p.id === "u-admin" ? { ...p, aktif: false } : p));

    expect(penggunaSesi(state.pengguna, null)).toBeNull();
    expect(penggunaSesi(state.pengguna, { penggunaId: "u-hantu" })).toBeNull();
    expect(penggunaSesi(nonaktif, { penggunaId: "u-admin" })).toBeNull();
  });
});
