import { describe, expect, it } from "vitest";
import { daftarAudit } from "./selectors";
import { PENGGUNA_UJI, depsUji, stateDenganAdmisi } from "./test-utils";

/** Jam berbeda tiap langkah agar urutan audit dapat diuji dari waktunya. */
function depsBerjam() {
  let jam = 8;
  return depsUji({
    hariIni: () => "2026-03-03",
    sekarang: () => `2026-03-03T${String(jam++).padStart(2, "0")}:00:00.000Z`,
  });
}

/** Satu admisi menghasilkan audit pasien, admisi, dan alokasi bed. */
function storeDenganAudit() {
  return stateDenganAdmisi(depsBerjam()).store;
}

describe("selector audit log", () => {
  it("menampilkan entri terbaru dulu beserta pengguna, aksi, entitas, dan ringkasan", () => {
    const store = storeDenganAudit();

    const daftar = daftarAudit(store.getState());

    expect(daftar.map((d) => d.audit.aksi)).toEqual(["bed.dialokasikan", "admisi.dibuat", "pasien.dibuat"]);
    expect(daftar[0]).toMatchObject({
      audit: { entitas: "bed", entitasId: "bed-1", ringkasan: expect.stringContaining("dialokasikan") },
      pengguna: { nama: "Rina" },
    });
    const waktu = daftar.map((d) => d.audit.waktu);
    expect(waktu).toEqual([...waktu].sort().reverse());
  });

  it("menyaring berdasarkan pengguna", () => {
    const store = storeDenganAudit();
    store.dispatch({ type: "admisi/pindah-bed", olehId: PENGGUNA_UJI.perawat, admisiId: store.getState().admisi[0]!.id, bedId: "bed-2" });

    const daftar = daftarAudit(store.getState(), { penggunaId: PENGGUNA_UJI.perawat });

    expect(daftar.map((d) => d.audit.aksi)).toEqual(["bed.dipindah"]);
  });

  it("menyaring berdasarkan jenis aksi", () => {
    const store = storeDenganAudit();

    const daftar = daftarAudit(store.getState(), { aksi: "admisi.dibuat" });

    expect(daftar.map((d) => d.audit.aksi)).toEqual(["admisi.dibuat"]);
  });

  it("menggabungkan kedua penyaring", () => {
    const store = storeDenganAudit();
    store.dispatch({ type: "admisi/pindah-bed", olehId: PENGGUNA_UJI.perawat, admisiId: store.getState().admisi[0]!.id, bedId: "bed-2" });

    expect(daftarAudit(store.getState(), { penggunaId: PENGGUNA_UJI.perawat, aksi: "pasien.dibuat" })).toEqual([]);
  });

  it("pengguna yang tidak dikenal tetap tampil dengan penanda kosong, bukan entri hilang", () => {
    const state = storeDenganAudit().getState();
    const entri = { ...state.audit[0]!, id: "audit-hilang", penggunaId: "u-hilang" };

    const daftar = daftarAudit({ ...state, audit: [...state.audit, entri] }, { penggunaId: "u-hilang" });

    expect(daftar).toHaveLength(1);
    expect(daftar[0]!.pengguna).toBeNull();
  });
});
