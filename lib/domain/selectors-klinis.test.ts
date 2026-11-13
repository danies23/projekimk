import { describe, expect, it } from "vitest";
import { PENGGUNA_UJI, depsUji, stateDasar, stateDenganAdmisi } from "./test-utils";
import { admisiUntukDokter, riwayatKlinis, totalTindakan } from "./selectors";
import type { Store } from "./actions";

/** Setiap dispatch memakai jam yang berbeda agar urutan waktu dapat diuji. */
function depsBerjam() {
  let jam = 8;
  return depsUji({ sekarang: () => `2026-03-01T${String(jam++).padStart(2, "0")}:00:00.000Z` });
}

function catat(
  store: Store,
  admisiId: string,
  olehId: string,
  isi: string,
  jenis: "visite" | "perkembangan" | "tanda_vital" = "visite",
) {
  const hasil = store.dispatch({ type: "catatan/ditulis", olehId, admisiId, jenis, isi, diagnosa: null, rencana: null, tandaVital: null });
  if (!hasil.ok) throw new Error(hasil.alasan);
  return hasil.id;
}

describe("selector riwayat klinis", () => {
  it("memuat catatan, tindakan, dan resep dalam urutan waktu terbaru dulu", () => {
    const { store, pasienId, admisiId } = stateDenganAdmisi(depsBerjam());
    catat(store, admisiId, PENGGUNA_UJI.dokter, "Pasien membaik.");
    store.dispatch({ type: "tindakan/ditambahkan", olehId: PENGGUNA_UJI.dokter, admisiId, tindakanId: "tindakan-1" });
    store.dispatch({
      type: "resep/dibuat",
      olehId: PENGGUNA_UJI.dokter,
      admisiId,
      items: [{ obatId: "obat-1", jumlah: 10, aturanPakai: "3×1 sesudah makan" }],
    });

    const riwayat = riwayatKlinis(store.getState(), pasienId);

    expect(riwayat.map((i) => i.jenis)).toEqual(["resep", "tindakan", "catatan"]);
    const tindakan = riwayat.find((i) => i.jenis === "tindakan");
    expect(tindakan).toMatchObject({ jenis: "tindakan", tindakan: { nama: "Pemasangan infus", tarif: 150_000 } });
  });

  it("memuat catatan perawat beserta penulisnya", () => {
    const { store, pasienId, admisiId } = stateDenganAdmisi(depsBerjam());
    catat(store, admisiId, PENGGUNA_UJI.dokter, "Visite pagi.");
    catat(store, admisiId, PENGGUNA_UJI.perawat, "Intake cairan cukup.", "perkembangan");

    const riwayat = riwayatKlinis(store.getState(), pasienId);
    const catatanPerawat = riwayat.find((i) => i.jenis === "catatan" && i.catatan.penulisId === PENGGUNA_UJI.perawat);

    expect(catatanPerawat).toMatchObject({ penulis: { nama: "Ns. Dwi" }, catatan: { jenis: "perkembangan" } });
  });

  it("mencakup catatan dari admisi sebelumnya pada pasien yang sama", () => {
    const { store, pasienId, admisiId } = stateDenganAdmisi(depsBerjam());
    catat(store, admisiId, PENGGUNA_UJI.dokter, "Catatan admisi pertama.");
    const keluar = store.dispatch({ type: "checkout", olehId: PENGGUNA_UJI.admin, admisiId, override: { alasan: "Rujukan" } });
    if (!keluar.ok) throw new Error(keluar.alasan);
    const kedua = store.dispatch({
      type: "admisi/dibuat",
      olehId: PENGGUNA_UJI.pendaftaran,
      pasienId,
      dokterId: PENGGUNA_UJI.dokter,
      bedId: "bed-2",
      tanggalMasuk: "2026-03-01",
      diagnosaAwal: "Kontrol",
    });
    if (!kedua.ok) throw new Error(kedua.alasan);
    catat(store, kedua.id, PENGGUNA_UJI.dokter, "Catatan admisi kedua.");

    const riwayat = riwayatKlinis(store.getState(), pasienId);

    expect(riwayat.map((i) => (i.jenis === "catatan" ? i.catatan.isi : i.jenis))).toEqual([
      "Catatan admisi kedua.",
      "Catatan admisi pertama.",
    ]);
    expect(riwayat.map((i) => i.admisiId)).toEqual([kedua.id, admisiId]);
  });

  it("tidak memuat catatan pasien lain", () => {
    const state = stateDasar();
    state.bed.push({ id: "bed-3", kamarId: "kamar-1", kode: "C", status: "kosong" });
    const deps = depsBerjam();
    const { store, pasienId, admisiId } = stateDenganAdmisi(deps, state);
    const pasienLain = store.dispatch({
      type: "pasien/dibuat",
      olehId: PENGGUNA_UJI.pendaftaran,
      input: {
        nama: "Orang Lain",
        nik: "3201015501900009",
        tanggalLahir: "1980-02-02",
        jenisKelamin: "L",
        alamat: "Jl. Lain 1",
        telepon: "081200000000",
        penanggungJawab: { nama: "Keluarga", hubungan: "Istri", telepon: "081300000000" },
      },
    });
    if (!pasienLain.ok) throw new Error(pasienLain.alasan);
    const admisiLain = store.dispatch({
      type: "admisi/dibuat",
      olehId: PENGGUNA_UJI.pendaftaran,
      pasienId: pasienLain.id,
      dokterId: PENGGUNA_UJI.dokter,
      bedId: "bed-3",
      tanggalMasuk: "2026-03-01",
      diagnosaAwal: "Observasi",
    });
    if (!admisiLain.ok) throw new Error(admisiLain.alasan);
    catat(store, admisiId, PENGGUNA_UJI.dokter, "Catatan pasien pertama.");
    catat(store, admisiLain.id, PENGGUNA_UJI.dokter, "Catatan pasien lain.");

    const riwayat = riwayatKlinis(store.getState(), pasienId);

    expect(riwayat).toHaveLength(1);
    expect(riwayat[0]).toMatchObject({ jenis: "catatan", catatan: { isi: "Catatan pasien pertama." } });
  });
});

describe("selector pasien dokter", () => {
  it("hanya memuat admisi aktif yang ditangani dokter tersebut", () => {
    const state = stateDasar();
    state.pengguna.push({ id: "u-dokter-lain", nama: "dr. Lain", peran: "dokter", aktif: true });
    const { store, admisiId } = stateDenganAdmisi(depsBerjam(), state);
    const pasienLain = store.dispatch({
      type: "pasien/dibuat",
      olehId: PENGGUNA_UJI.pendaftaran,
      input: {
        nama: "Orang Lain",
        nik: "3201015501900009",
        tanggalLahir: "1980-02-02",
        jenisKelamin: "L",
        alamat: "Jl. Lain 1",
        telepon: "081200000000",
        penanggungJawab: { nama: "Keluarga", hubungan: "Istri", telepon: "081300000000" },
      },
    });
    if (!pasienLain.ok) throw new Error(pasienLain.alasan);
    const admisiLain = store.dispatch({
      type: "admisi/dibuat",
      olehId: PENGGUNA_UJI.pendaftaran,
      pasienId: pasienLain.id,
      dokterId: "u-dokter-lain",
      bedId: "bed-2",
      tanggalMasuk: "2026-03-01",
      diagnosaAwal: "Observasi",
    });
    if (!admisiLain.ok) throw new Error(admisiLain.alasan);

    expect(admisiUntukDokter(store.getState(), PENGGUNA_UJI.dokter).map((a) => a.admisiId)).toEqual([admisiId]);

    const keluar = store.dispatch({ type: "checkout", olehId: PENGGUNA_UJI.admin, admisiId, override: { alasan: "Rujukan" } });
    if (!keluar.ok) throw new Error(keluar.alasan);
    expect(admisiUntukDokter(store.getState(), PENGGUNA_UJI.dokter)).toEqual([]);
  });
});

describe("selector total biaya tindakan", () => {
  it("membatasi total pada tindakan yang dicatat dokter tertentu bila diminta", () => {
    const state = stateDasar();
    state.pengguna.push({ id: "u-dokter-lain", nama: "dr. Lain", peran: "dokter", aktif: true });
    const { store, admisiId } = stateDenganAdmisi(depsBerjam(), state);
    store.dispatch({ type: "tindakan/ditambahkan", olehId: PENGGUNA_UJI.dokter, admisiId, tindakanId: "tindakan-1" });
    store.dispatch({ type: "tindakan/ditambahkan", olehId: "u-dokter-lain", admisiId, tindakanId: "tindakan-1" });

    expect(totalTindakan(store.getState(), admisiId)).toBe(300_000);
    expect(totalTindakan(store.getState(), admisiId, PENGGUNA_UJI.dokter)).toBe(150_000);
    expect(totalTindakan(store.getState(), admisiId, "u-dokter-lain")).toBe(150_000);
  });

  it("menjumlahkan tarif tindakan satu admisi dan tidak menghitung admisi lain", () => {
    const state = stateDasar();
    state.tindakanMaster.push({ id: "tindakan-3", nama: "Nebulisasi", tarif: 90_000, aktif: true });
    state.bed.push({ id: "bed-3", kamarId: "kamar-1", kode: "C", status: "kosong" });
    const { store, pasienId, admisiId } = stateDenganAdmisi(depsBerjam(), state);
    store.dispatch({ type: "tindakan/ditambahkan", olehId: PENGGUNA_UJI.dokter, admisiId, tindakanId: "tindakan-1" });
    store.dispatch({ type: "tindakan/ditambahkan", olehId: PENGGUNA_UJI.dokter, admisiId, tindakanId: "tindakan-3" });

    expect(totalTindakan(store.getState(), admisiId)).toBe(240_000);

    const pasienLain = store.dispatch({
      type: "pasien/dibuat",
      olehId: PENGGUNA_UJI.pendaftaran,
      input: {
        nama: "Orang Lain",
        nik: "3201015501900009",
        tanggalLahir: "1980-02-02",
        jenisKelamin: "L",
        alamat: "Jl. Lain 1",
        telepon: "081200000000",
        penanggungJawab: { nama: "Keluarga", hubungan: "Istri", telepon: "081300000000" },
      },
    });
    if (!pasienLain.ok) throw new Error(pasienLain.alasan);
    const admisiLain = store.dispatch({
      type: "admisi/dibuat",
      olehId: PENGGUNA_UJI.pendaftaran,
      pasienId: pasienLain.id,
      dokterId: PENGGUNA_UJI.dokter,
      bedId: "bed-3",
      tanggalMasuk: "2026-03-01",
      diagnosaAwal: "Observasi",
    });
    if (!admisiLain.ok) throw new Error(admisiLain.alasan);
    store.dispatch({ type: "tindakan/ditambahkan", olehId: PENGGUNA_UJI.dokter, admisiId: admisiLain.id, tindakanId: "tindakan-1" });

    expect(totalTindakan(store.getState(), admisiId)).toBe(240_000);
    expect(totalTindakan(store.getState(), admisiLain.id)).toBe(150_000);
    expect(pasienId).not.toBe(pasienLain.id);
  });
});
