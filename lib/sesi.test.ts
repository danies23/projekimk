import { describe, expect, it } from "vitest";
import { KUNCI_SESI, hapusSesi, muatSesi, simpanSesi } from "./sesi";
import { createMemoriPenyimpanan } from "./domain/penyimpanan";

describe("sesi demo", () => {
  it("menyimpan dan memuat kembali sesi yang aktif", () => {
    const penyimpanan = createMemoriPenyimpanan();

    simpanSesi(penyimpanan, { penggunaId: "u-kasir" });

    expect(muatSesi(penyimpanan)).toEqual({ penggunaId: "u-kasir" });
  });

  it("mengembalikan null bila belum ada sesi", () => {
    expect(muatSesi(createMemoriPenyimpanan())).toBeNull();
  });

  it("mengabaikan isi rusak dan versi yang tidak dikenal", () => {
    const penyimpanan = createMemoriPenyimpanan();

    penyimpanan.setItem(KUNCI_SESI, "{bukan json");
    expect(muatSesi(penyimpanan)).toBeNull();

    penyimpanan.setItem(KUNCI_SESI, JSON.stringify({ versi: 2, penggunaId: "u-kasir" }));
    expect(muatSesi(penyimpanan)).toBeNull();

    penyimpanan.setItem(KUNCI_SESI, JSON.stringify({ versi: 1 }));
    expect(muatSesi(penyimpanan)).toBeNull();
  });

  it("menghapus sesi sehingga pengguna kembali ke halaman login", () => {
    const penyimpanan = createMemoriPenyimpanan();
    simpanSesi(penyimpanan, { penggunaId: "u-admin" });

    hapusSesi(penyimpanan);

    expect(muatSesi(penyimpanan)).toBeNull();
  });
});
