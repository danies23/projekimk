import { describe, expect, it } from "vitest";
import { boleh, bolehAkses, menuUntuk } from "./izin";
import { IDENTITAS_PASIEN, PENGGUNA_UJI, depsUji, stateDasar, stateDenganAdmisi, storeUji } from "./test-utils";

describe("izin peran", () => {
  it("hanya mengizinkan aksi yang ada di matriks peran", () => {
    expect(boleh("pendaftaran", "pasien.buat")).toBe(true);
    expect(boleh("pendaftaran", "pembayaran.catat")).toBe(false);
    expect(boleh("dokter", "catatan.tulis")).toBe(true);
    expect(boleh("apoteker", "obat.serahkan")).toBe(true);
    expect(boleh("kasir", "checkout.override")).toBe(false);
    expect(boleh("admin", "checkout.override")).toBe(true);
    expect(boleh(null, "pasien.buat")).toBe(false);
  });

  it("membatasi menu ke modul yang diizinkan peran", () => {
    expect(menuUntuk("dokter").map((m) => m.resource)).toEqual(["dashboard", "klinis"]);
    expect(menuUntuk("pimpinan").map((m) => m.resource)).toEqual(["dashboard", "laporan"]);
    expect(menuUntuk(null)).toEqual([]);
  });

  it("menolak akses rute di luar izin peran", () => {
    expect(bolehAkses("kasir", "farmasi")).toBe(false);
    expect(bolehAkses("kasir", "kasir")).toBe(true);
    expect(bolehAkses("pimpinan", "administrasi")).toBe(false);
  });
});

describe("penjagaan peran di store", () => {
  it("menolak aksi yang tidak diizinkan tanpa mengubah state", () => {
    const store = storeUji(depsUji(), stateDasar());
    const sebelum = structuredClone(store.getState());

    const hasil = store.dispatch({
      type: "pasien/dibuat",
      olehId: PENGGUNA_UJI.kasir,
      input: IDENTITAS_PASIEN,
    });

    expect(hasil).toEqual({ ok: false, alasan: expect.stringContaining("tidak berhak") });
    expect(store.getState()).toEqual(sebelum);
  });

  it("menolak checkout dari peran yang tidak berhak melakukan checkout", () => {
    const { store, admisiId } = stateDenganAdmisi();
    const hasil = store.dispatch({ type: "checkout", olehId: PENGGUNA_UJI.dokter, admisiId, override: null });

    expect(hasil).toEqual({ ok: false, alasan: expect.stringContaining("tidak berhak") });
    expect(store.getState().admisi[0]!.status).toBe("aktif");
  });

  it("menolak penyerahan obat oleh dokter", () => {
    const { store, admisiId } = stateDenganAdmisi();
    const resep = store.dispatch({
      type: "resep/dibuat",
      olehId: PENGGUNA_UJI.dokter,
      admisiId,
      items: [{ obatId: "obat-1", jumlah: 2, aturanPakai: "2×1" }],
    });
    if (!resep.ok) throw new Error("setup gagal");

    const hasil = store.dispatch({ type: "resep/serahkan", olehId: PENGGUNA_UJI.dokter, resepId: resep.id });

    expect(hasil).toEqual({ ok: false, alasan: expect.stringContaining("tidak berhak") });
  });

  it("menolak aksi bagi pengguna yang tidak dikenal", () => {
    const store = storeUji(depsUji());
    const hasil = store.dispatch({ type: "pasien/dibuat", olehId: "u-hantu", input: IDENTITAS_PASIEN });

    expect(hasil.ok).toBe(false);
    expect(store.getState().pasien).toHaveLength(0);
  });
});
