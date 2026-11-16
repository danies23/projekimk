import { describe, expect, it } from "vitest";
import { PENGGUNA_UJI, depsUji, stateDenganAdmisi } from "./test-utils";
import { antreanFarmasi, kebutuhanObat, obatStokMenipis } from "./selectors";

/** Jam berbeda tiap dispatch agar urutan antrean dapat diuji dari waktunya. */
function depsBerjam() {
  let jam = 8;
  return depsUji({ sekarang: () => `2026-03-01T${String(jam++).padStart(2, "0")}:00:00.000Z` });
}

function siapkan() {
  const { store, admisiId } = stateDenganAdmisi(depsBerjam());
  const buat = (obatId: string, jumlah: number) => {
    const hasil = store.dispatch({
      type: "resep/dibuat",
      olehId: PENGGUNA_UJI.dokter,
      admisiId,
      items: [{ obatId, jumlah, aturanPakai: "3×1 sesudah makan" }],
    });
    if (!hasil.ok) throw new Error(hasil.alasan);
    return hasil.id;
  };
  return { store, admisiId, buat };
}

describe("selector antrean farmasi", () => {
  it("mengelompokkan resep menurut status dan menautkan pasien serta dokter", () => {
    const { store, buat } = siapkan();
    const menunggu = buat("obat-1", 10);
    const disiapkan = buat("obat-2", 4);
    store.dispatch({ type: "resep/siapkan", olehId: PENGGUNA_UJI.apoteker, resepId: disiapkan });

    const antrean = antreanFarmasi(store.getState());

    expect(antrean.menunggu.map((r) => r.resepId)).toEqual([menunggu]);
    expect(antrean.disiapkan.map((r) => r.resepId)).toEqual([disiapkan]);
    expect(antrean.diserahkan).toEqual([]);
    expect(antrean.menunggu[0]).toMatchObject({
      pasien: { nama: "Siti Rahmawati" },
      dokter: { nama: "dr. Ayu" },
    });
  });

  it("mengurutkan tiap kelompok dari resep terlama agar tidak ada yang terlantar", () => {
    const { store, buat } = siapkan();
    const pertama = buat("obat-1", 1);
    const kedua = buat("obat-2", 1);

    expect(antreanFarmasi(store.getState()).menunggu.map((r) => r.resepId)).toEqual([pertama, kedua]);
  });

  it("memindahkan resep ke kelompok berikutnya saat statusnya berubah", () => {
    const { store, buat } = siapkan();
    const id = buat("obat-1", 1);
    store.dispatch({ type: "resep/siapkan", olehId: PENGGUNA_UJI.apoteker, resepId: id });
    store.dispatch({ type: "resep/serahkan", olehId: PENGGUNA_UJI.apoteker, resepId: id });

    const antrean = antreanFarmasi(store.getState());
    expect(antrean.diserahkan.map((r) => r.resepId)).toEqual([id]);
    expect(antrean.menunggu).toEqual([]);
    expect(antrean.disiapkan).toEqual([]);
  });

  it("menandai resep dari admisi yang sudah checkout agar tidak ditawarkan sebagai pekerjaan", () => {
    const { store, buat } = siapkan();
    buat("obat-1", 1);
    const admisiId = store.getState().resep[0]!.admisiId;
    store.dispatch({ type: "checkout", olehId: PENGGUNA_UJI.admin, admisiId, override: { alasan: "Rujukan mendesak" } });

    const antrean = antreanFarmasi(store.getState());

    // Resep tetap terlihat untuk penelusuran, tetapi ditandai tidak dapat diproses.
    expect(antrean.menunggu).toHaveLength(1);
    expect(antrean.menunggu[0]!.admisiSelesai).toBe(true);
  });

  it("melewati resep yang admisi atau pasiennya sudah tidak ada, alih-alih melempar", () => {
    const { store, buat } = siapkan();
    const id = buat("obat-1", 1);
    const state = store.getState();

    expect(antreanFarmasi({ ...state, admisi: [] }).menunggu).toEqual([]);
    expect(
      antreanFarmasi({ ...state, pasien: state.pasien.filter((p) => p.nama !== "Siti Rahmawati") }).menunggu.map((r) => r.resepId),
    ).toEqual([]);
    expect(antreanFarmasi(state).menunggu.map((r) => r.resepId)).toEqual([id]);
  });
});

describe("selector kebutuhan obat", () => {
  it("menjumlahkan baris berisi obat yang sama, sama seperti pemeriksaan stok saat penyerahan", () => {
    const { store, admisiId } = siapkan();
    const dibuat = store.dispatch({
      type: "resep/dibuat",
      olehId: PENGGUNA_UJI.dokter,
      admisiId,
      items: [
        { obatId: "obat-1", jumlah: 30, aturanPakai: "1×1" },
        { obatId: "obat-1", jumlah: 20, aturanPakai: "1×1" },
        { obatId: "obat-2", jumlah: 4, aturanPakai: "1×1" },
      ],
    });
    if (!dibuat.ok) throw new Error(dibuat.alasan);
    const resep = store.getState().resep.find((r) => r.id === dibuat.id)!;

    expect([...kebutuhanObat(resep)]).toEqual([
      ["obat-1", 50],
      ["obat-2", 4],
    ]);
  });
});

describe("selector obat stok menipis", () => {
  it("menandai obat yang stoknya di bawah minimum, bukan yang pas minimum", () => {
    const { store } = siapkan();
    // obat-2: stok 10, minimum 15 → menipis. obat-1: stok 100, minimum 20 → aman.
    expect(obatStokMenipis(store.getState()).map((o) => o.id)).toEqual(["obat-2"]);

    store.dispatch({ type: "obat/stok-masuk", olehId: PENGGUNA_UJI.apoteker, obatId: "obat-2", jumlah: 5, keterangan: "Restock" });

    // Stok tepat di minimum belum dianggap menipis.
    expect(obatStokMenipis(store.getState())).toEqual([]);
  });
});
