import { describe, expect, it } from "vitest";
import { IDENTITAS_PASIEN, PENGGUNA_UJI, depsUji, stateDasar as stateUjiDasar, stateDenganAdmisi } from "./test-utils";
import type { State } from "./types";

function denganAdmisi(stokParacetamol = 100) {
  const state: State = {
    ...stateUjiDasar(),
    obat: [
      { id: "obat-1", nama: "Paracetamol 500 mg", satuan: "tablet", harga: 2_000, stok: stokParacetamol, stokMinimum: 20 },
      { id: "obat-2", nama: "Amoxicillin 500 mg", satuan: "kapsul", harga: 5_000, stok: 10, stokMinimum: 15 },
    ],
  };
  return stateDenganAdmisi(depsUji(), state);
}

function resep(store: ReturnType<typeof denganAdmisi>["store"], admisiId: string, jumlah = 10) {
  return store.dispatch({
    type: "resep/dibuat",
    olehId: PENGGUNA_UJI.dokter,
    admisiId,
    items: [{ obatId: "obat-1", jumlah, aturanPakai: "3×1 sesudah makan" }],
  });
}

describe("dispatch: resep dan farmasi", () => {
  it("membuat resep berstatus menunggu dengan harga obat tersalin", () => {
    const { store, admisiId } = denganAdmisi();
    const hasil = resep(store, admisiId);

    expect(hasil.ok).toBe(true);
    expect(store.getState().resep[0]).toMatchObject({
      admisiId,
      dokterId: PENGGUNA_UJI.dokter,
      status: "menunggu",
      items: [{ obatId: "obat-1", nama: "Paracetamol 500 mg", jumlah: 10, aturanPakai: "3×1 sesudah makan", harga: 2_000 }],
    });
  });

  it("menolak resep yang memuat obat tidak dikenal", () => {
    const { store, admisiId } = denganAdmisi();
    const hasil = store.dispatch({
      type: "resep/dibuat",
      olehId: PENGGUNA_UJI.dokter,
      admisiId,
      items: [{ obatId: "tidak-ada", jumlah: 1, aturanPakai: "1×1" }],
    });

    expect(hasil).toEqual({ ok: false, alasan: expect.stringContaining("tidak ditemukan") });
  });

  it("menggerakkan resep maju menunggu → disiapkan → diserahkan", () => {
    const { store, admisiId } = denganAdmisi();
    const dibuat = resep(store, admisiId);
    if (!dibuat.ok) throw new Error("setup gagal");

    expect(store.dispatch({ type: "resep/siapkan", olehId: PENGGUNA_UJI.apoteker, resepId: dibuat.id }).ok).toBe(true);
    expect(store.getState().resep[0]!.status).toBe("disiapkan");
    expect(store.dispatch({ type: "resep/serahkan", olehId: PENGGUNA_UJI.apoteker, resepId: dibuat.id }).ok).toBe(true);
    expect(store.getState().resep[0]!.status).toBe("diserahkan");
  });

  it("menolak resep mundur dari diserahkan ke disiapkan", () => {
    const { store, admisiId } = denganAdmisi();
    const dibuat = resep(store, admisiId);
    if (!dibuat.ok) throw new Error("setup gagal");
    store.dispatch({ type: "resep/siapkan", olehId: PENGGUNA_UJI.apoteker, resepId: dibuat.id });
    store.dispatch({ type: "resep/serahkan", olehId: PENGGUNA_UJI.apoteker, resepId: dibuat.id });

    const hasil = store.dispatch({ type: "resep/siapkan", olehId: PENGGUNA_UJI.apoteker, resepId: dibuat.id });

    expect(hasil.ok).toBe(false);
    expect(store.getState().resep[0]!.status).toBe("diserahkan");
  });

  it("menolak menyerahkan obat sebelum resep disiapkan", () => {
    const { store, admisiId } = denganAdmisi();
    const dibuat = resep(store, admisiId);
    if (!dibuat.ok) throw new Error("setup gagal");

    const hasil = store.dispatch({ type: "resep/serahkan", olehId: PENGGUNA_UJI.apoteker, resepId: dibuat.id });

    expect(hasil.ok).toBe(false);
    expect(store.getState().resep[0]!.status).toBe("menunggu");
  });

  it("mengurangi stok pada saat penyerahan", () => {
    const { store, admisiId } = denganAdmisi();
    const dibuat = resep(store, admisiId, 10);
    if (!dibuat.ok) throw new Error("setup gagal");
    store.dispatch({ type: "resep/siapkan", olehId: PENGGUNA_UJI.apoteker, resepId: dibuat.id });
    store.dispatch({ type: "resep/serahkan", olehId: PENGGUNA_UJI.apoteker, resepId: dibuat.id });

    expect(store.getState().obat.find((o) => o.id === "obat-1")!.stok).toBe(90);
    expect(store.getState().mutasiStok.at(-1)).toMatchObject({ obatId: "obat-1", jenis: "keluar", jumlah: 10 });
  });

  it("menolak penyerahan melebihi stok tanpa mengubah stok maupun status resep", () => {
    const { store, admisiId } = denganAdmisi(5);
    const dibuat = resep(store, admisiId, 10);
    if (!dibuat.ok) throw new Error("setup gagal");
    store.dispatch({ type: "resep/siapkan", olehId: PENGGUNA_UJI.apoteker, resepId: dibuat.id });

    const hasil = store.dispatch({ type: "resep/serahkan", olehId: PENGGUNA_UJI.apoteker, resepId: dibuat.id });

    expect(hasil).toEqual({ ok: false, alasan: expect.stringContaining("Stok") });
    expect(store.getState().obat.find((o) => o.id === "obat-1")!.stok).toBe(5);
    expect(store.getState().resep[0]!.status).toBe("disiapkan");
  });

  it("masuk akal untuk obat dengan stok di bawah minimum: stok tidak pernah negatif", () => {
    const { store, admisiId } = denganAdmisi(0);
    const dibuat = resep(store, admisiId, 1);
    if (!dibuat.ok) throw new Error("setup gagal");
    store.dispatch({ type: "resep/siapkan", olehId: PENGGUNA_UJI.apoteker, resepId: dibuat.id });

    expect(store.dispatch({ type: "resep/serahkan", olehId: PENGGUNA_UJI.apoteker, resepId: dibuat.id }).ok).toBe(false);
    expect(store.getState().obat.find((o) => o.id === "obat-1")!.stok).toBe(0);
  });

  it("mencatat penambahan stok dan menaikkan stok", () => {
    const { store } = denganAdmisi(100);
    const hasil = store.dispatch({
      type: "obat/stok-masuk",
      olehId: PENGGUNA_UJI.apoteker,
      obatId: "obat-1",
      jumlah: 50,
      keterangan: "Penerimaan barang dari distributor",
    });

    expect(hasil.ok).toBe(true);
    expect(store.getState().obat.find((o) => o.id === "obat-1")!.stok).toBe(150);
    expect(store.getState().audit.some((a) => a.aksi === "obat.stok_masuk")).toBe(true);
  });

  it("menolak penambahan stok dengan jumlah tidak wajar", () => {
    const { store } = denganAdmisi();
    const hasil = store.dispatch({ type: "obat/stok-masuk", olehId: PENGGUNA_UJI.apoteker, obatId: "obat-1", jumlah: 0, keterangan: "x" });

    expect(hasil.ok).toBe(false);
    expect(store.getState().obat.find((o) => o.id === "obat-1")!.stok).toBe(100);
  });
});

describe("dispatch: tindakan", () => {
  it("menambahkan tindakan aktif ke admisi dan menyalin tarifnya", () => {
    const { store, admisiId } = denganAdmisi();
    const hasil = store.dispatch({
      type: "tindakan/ditambahkan",
      olehId: PENGGUNA_UJI.dokter,
      admisiId,
      tindakanId: "tindakan-1",
    });

    expect(hasil.ok).toBe(true);
    expect(store.getState().tindakanAdmisi[0]).toMatchObject({ admisiId, nama: "Pemasangan infus", tarif: 150_000 });
  });

  it("menolak tindakan yang sudah dinonaktifkan", () => {
    const { store, admisiId } = denganAdmisi();
    const hasil = store.dispatch({
      type: "tindakan/ditambahkan",
      olehId: PENGGUNA_UJI.dokter,
      admisiId,
      tindakanId: "tindakan-2",
    });

    expect(hasil).toEqual({ ok: false, alasan: expect.stringContaining("tidak tersedia") });
  });

  it("mempertahankan tarif tindakan lama setelah master diubah", () => {
    const { store, admisiId } = denganAdmisi();
    store.dispatch({ type: "tindakan/ditambahkan", olehId: PENGGUNA_UJI.dokter, admisiId, tindakanId: "tindakan-1" });
    store.dispatch({
      type: "tindakan-master/diubah",
      olehId: "u-admin",
      tindakanId: "tindakan-1",
      perubahan: { tarif: 999_000 },
    });

    expect(store.getState().tindakanAdmisi[0]!.tarif).toBe(150_000);
  });
});

describe("dispatch: penyerahan obat dengan baris ganda", () => {
  it("menjumlahkan baris obat yang sama sebelum memeriksa stok", () => {
    const { store, admisiId } = denganAdmisi(100);
    const dibuat = store.dispatch({
      type: "resep/dibuat",
      olehId: PENGGUNA_UJI.dokter,
      admisiId,
      items: [
        { obatId: "obat-1", jumlah: 80, aturanPakai: "1×1" },
        { obatId: "obat-1", jumlah: 80, aturanPakai: "1×1" },
      ],
    });
    if (!dibuat.ok) throw new Error(dibuat.alasan);
    store.dispatch({ type: "resep/siapkan", olehId: PENGGUNA_UJI.apoteker, resepId: dibuat.id });

    const hasil = store.dispatch({ type: "resep/serahkan", olehId: PENGGUNA_UJI.apoteker, resepId: dibuat.id });

    expect(hasil).toEqual({ ok: false, alasan: expect.stringContaining("Stok") });
    expect(store.getState().obat.find((o) => o.id === "obat-1")!.stok).toBe(100);
    expect(store.getState().resep[0]!.status).toBe("disiapkan");
  });

  it("menyerahkan baris ganda yang masih tercakup stok", () => {
    const { store, admisiId } = denganAdmisi(100);
    const dibuat = store.dispatch({
      type: "resep/dibuat",
      olehId: PENGGUNA_UJI.dokter,
      admisiId,
      items: [
        { obatId: "obat-1", jumlah: 30, aturanPakai: "1×1" },
        { obatId: "obat-1", jumlah: 20, aturanPakai: "1×1" },
      ],
    });
    if (!dibuat.ok) throw new Error(dibuat.alasan);
    store.dispatch({ type: "resep/siapkan", olehId: PENGGUNA_UJI.apoteker, resepId: dibuat.id });

    expect(store.dispatch({ type: "resep/serahkan", olehId: PENGGUNA_UJI.apoteker, resepId: dibuat.id }).ok).toBe(true);
    expect(store.getState().obat.find((o) => o.id === "obat-1")!.stok).toBe(50);
  });
});
