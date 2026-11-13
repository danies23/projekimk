import { describe, expect, it } from "vitest";
import { alasanBedTidakTersedia, denahBed, riwayatPindahBed, semuaKamar } from "./selectors";
import { nilaiTagihan } from "./tagihan";
import { IDENTITAS_PASIEN, PENGGUNA_UJI, depsUji, stateDasar, stateDenganAdmisi, storeUji } from "./test-utils";

/**
 * Admisi aktif di bed-1 (kamar-1) dengan satu bed tambahan di kamar yang sama.
 * Bed tambahan lahir dari kenaikan kapasitas lewat dispatch, bukan mutasi state.
 */
function denganBedTambahan() {
  const store = storeUji(depsBaru(), stateDasar());
  const tambah = store.dispatch({
    type: "kamar/diubah",
    olehId: PENGGUNA_UJI.admin,
    kamarId: "kamar-1",
    perubahan: { kapasitas: 3 },
  });
  if (!tambah.ok) throw new Error(tambah.alasan);
  const pasien = store.dispatch({ type: "pasien/dibuat", olehId: PENGGUNA_UJI.pendaftaran, input: IDENTITAS_PASIEN });
  if (!pasien.ok) throw new Error(pasien.alasan);
  const bedBaru = store.getState().bed.filter((b) => b.kamarId === "kamar-1").at(-1)!;
  const admisi = store.dispatch({
    type: "admisi/dibuat",
    olehId: PENGGUNA_UJI.pendaftaran,
    pasienId: pasien.id,
    dokterId: PENGGUNA_UJI.dokter,
    bedId: bedBaru.id,
    tanggalMasuk: "2026-03-01",
    diagnosaAwal: "Observasi",
  });
  if (!admisi.ok) throw new Error(admisi.alasan);
  return { store, admisiId: admisi.id, bedBaruId: bedBaru.id };
}

const KAMAR_BARU = { nama: "Anggrek VIP-1", kelas: "VIP" as const, tarifHarian: 900_000, kapasitas: 2 };

/** Id berawalan "baru-" agar tidak bertabrakan dengan id tetap di `stateDasar`. */
function depsBaru() {
  let n = 0;
  const dasar = depsUji();
  return { ...dasar, id: (prefix: string) => `${prefix}-baru-${++n}` };
}

function denganKamarBaru() {
  const store = storeUji(depsBaru(), stateDasar());
  const hasil = store.dispatch({ type: "kamar/dibuat", olehId: PENGGUNA_UJI.admin, input: KAMAR_BARU });
  if (!hasil.ok) throw new Error(hasil.alasan);
  return { store, kamarId: hasil.id };
}

/** Dua admisi aktif pada bed-1 dan bed-2 milik kamar-1. */
function denganDuaAdmisi() {
  const { store, admisiId } = stateDenganAdmisi();
  const pasien = store.dispatch({
    type: "pasien/dibuat",
    olehId: PENGGUNA_UJI.pendaftaran,
    input: { ...IDENTITAS_PASIEN, nik: "3201015501900002", nama: "Pasien Kedua" },
  });
  if (!pasien.ok) throw new Error(pasien.alasan);
  const admisi = store.dispatch({
    type: "admisi/dibuat",
    olehId: PENGGUNA_UJI.pendaftaran,
    pasienId: pasien.id,
    dokterId: PENGGUNA_UJI.dokter,
    bedId: "bed-2",
    tanggalMasuk: "2026-03-01",
    diagnosaAwal: "Observasi",
  });
  if (!admisi.ok) throw new Error(admisi.alasan);
  return { store, admisiPertama: admisiId, admisiKedua: admisi.id };
}

describe("dispatch: master kamar", () => {
  it("admin dapat menambah kamar beserta bed sesuai kapasitasnya", () => {
    const { store, kamarId } = denganKamarBaru();

    const kamar = store.getState().kamar.find((k) => k.id === kamarId)!;
    expect(kamar).toMatchObject({ nama: "Anggrek VIP-1", kelas: "VIP", tarifHarian: 900_000, aktif: true });
    const bed = store.getState().bed.filter((b) => b.kamarId === kamarId);
    expect(bed.map((b) => b.kode)).toEqual(["Anggrek VIP-1-A", "Anggrek VIP-1-B"]);
    expect(bed.every((b) => b.status === "kosong")).toBe(true);
  });

  it("menolak pembuatan kamar oleh peran selain admin", () => {
    const store = storeUji(depsBaru(), stateDasar());

    const hasil = store.dispatch({ type: "kamar/dibuat", olehId: PENGGUNA_UJI.perawat, input: KAMAR_BARU });

    expect(hasil).toEqual({ ok: false, alasan: expect.stringContaining("tidak berhak") });
    expect(store.getState().kamar).toHaveLength(1);
  });

  it("menolak nama kamar kosong atau sudah dipakai", () => {
    const store = storeUji(depsBaru(), stateDasar());

    for (const nama of ["   ", "Melati 1"]) {
      const hasil = store.dispatch({ type: "kamar/dibuat", olehId: PENGGUNA_UJI.admin, input: { ...KAMAR_BARU, nama } });
      expect(hasil.ok, `nama "${nama}" seharusnya ditolak`).toBe(false);
    }
    expect(store.getState().kamar).toHaveLength(1);
  });

  it("menolak tarif dan kapasitas yang tidak masuk akal", () => {
    const store = storeUji(depsBaru(), stateDasar());

    for (const input of [
      { ...KAMAR_BARU, tarifHarian: 0 },
      { ...KAMAR_BARU, tarifHarian: 1_500.5 },
      { ...KAMAR_BARU, kapasitas: 0 },
      { ...KAMAR_BARU, kapasitas: 2.5 },
      { ...KAMAR_BARU, kapasitas: 27 },
    ]) {
      const hasil = store.dispatch({ type: "kamar/dibuat", olehId: PENGGUNA_UJI.admin, input });
      expect(hasil.ok, JSON.stringify(input)).toBe(false);
    }
    expect(store.getState().kamar).toHaveLength(1);
    expect(store.getState().bed).toHaveLength(2);
  });

  it("mencatat pembuatan kamar di audit log", () => {
    const { store, kamarId } = denganKamarBaru();

    const entri = store.getState().audit.find((a) => a.aksi === "kamar.dibuat");
    expect(entri).toMatchObject({ entitas: "kamar", entitasId: kamarId, penggunaId: PENGGUNA_UJI.admin });
  });

  it("bed kamar baru langsung dapat dialokasikan pada admisi", () => {
    const { store, kamarId } = denganKamarBaru();
    const pasien = store.dispatch({ type: "pasien/dibuat", olehId: PENGGUNA_UJI.pendaftaran, input: IDENTITAS_PASIEN });
    if (!pasien.ok) throw new Error(pasien.alasan);
    const bed = store.getState().bed.find((b) => b.kamarId === kamarId)!;

    const hasil = store.dispatch({
      type: "admisi/dibuat",
      olehId: PENGGUNA_UJI.pendaftaran,
      pasienId: pasien.id,
      dokterId: PENGGUNA_UJI.dokter,
      bedId: bed.id,
      tanggalMasuk: "2026-03-01",
      diagnosaAwal: "Observasi",
    });

    expect(hasil.ok).toBe(true);
    expect(store.getState().bed.find((b) => b.id === bed.id)!.status).toBe("terisi");
  });

  it("mengubah nama, kelas, dan tarif tercatat di audit log", () => {
    const store = storeUji(depsUji(), stateDasar());

    const hasil = store.dispatch({
      type: "kamar/diubah",
      olehId: PENGGUNA_UJI.admin,
      kamarId: "kamar-1",
      perubahan: { nama: "Melati I-1", kelas: "VIP", tarifHarian: 750_000 },
    });

    expect(hasil.ok).toBe(true);
    expect(store.getState().kamar[0]).toMatchObject({ nama: "Melati I-1", kelas: "VIP", tarifHarian: 750_000 });
    expect(store.getState().audit.some((a) => a.aksi === "kamar.diubah")).toBe(true);
  });

  it("menambah kapasitas membuat bed baru yang dapat dipilih di pendaftaran", () => {
    const store = storeUji(depsUji(), stateDasar());

    const hasil = store.dispatch({
      type: "kamar/diubah",
      olehId: PENGGUNA_UJI.admin,
      kamarId: "kamar-1",
      perubahan: { kapasitas: 4 },
    });

    expect(hasil.ok).toBe(true);
    const bed = store.getState().bed.filter((b) => b.kamarId === "kamar-1");
    expect(bed).toHaveLength(4);
    expect(bed.every((b) => b.status === "kosong")).toBe(true);
    expect(denahBed(store.getState())[0]!.bed).toHaveLength(4);
    expect(alasanBedTidakTersedia(store.getState(), bed.at(-1)!.id)).toBeNull();
  });

  it("mengurangi kapasitas hanya menghapus bed kosong", () => {
    const store = storeUji(depsUji(), stateDasar());
    store.dispatch({ type: "kamar/diubah", olehId: PENGGUNA_UJI.admin, kamarId: "kamar-1", perubahan: { kapasitas: 4 } });

    const hasil = store.dispatch({
      type: "kamar/diubah",
      olehId: PENGGUNA_UJI.admin,
      kamarId: "kamar-1",
      perubahan: { kapasitas: 1 },
    });

    expect(hasil.ok).toBe(true);
    expect(store.getState().bed.filter((b) => b.kamarId === "kamar-1")).toHaveLength(1);
  });

  it("menolak mengurangi kapasitas bila bed yang harus dihapus masih ditempati", () => {
    const { store } = denganDuaAdmisi();

    const hasil = store.dispatch({
      type: "kamar/diubah",
      olehId: PENGGUNA_UJI.admin,
      kamarId: "kamar-1",
      perubahan: { kapasitas: 1 },
    });

    expect(hasil).toEqual({ ok: false, alasan: expect.stringContaining("ditempati") });
    expect(store.getState().bed.filter((b) => b.kamarId === "kamar-1")).toHaveLength(2);
  });

  it("menolak menonaktifkan kamar yang masih berisi pasien", () => {
    const { store } = stateDenganAdmisi();

    const hasil = store.dispatch({
      type: "kamar/diubah",
      olehId: PENGGUNA_UJI.admin,
      kamarId: "kamar-1",
      perubahan: { aktif: false },
    });

    expect(hasil).toEqual({ ok: false, alasan: expect.stringContaining("pasien") });
    expect(store.getState().kamar[0]!.aktif).toBe(true);
  });

  it("kamar nonaktif hilang dari denah dan bed-nya tidak dapat dipilih", () => {
    const store = storeUji(depsUji(), stateDasar());

    const hasil = store.dispatch({
      type: "kamar/diubah",
      olehId: PENGGUNA_UJI.admin,
      kamarId: "kamar-1",
      perubahan: { aktif: false },
    });

    expect(hasil.ok).toBe(true);
    expect(denahBed(store.getState())).toEqual([]);
    expect(alasanBedTidakTersedia(store.getState(), "bed-1")).toContain("nonaktif");
    // Admin tetap melihat kamar nonaktif untuk dapat mengaktifkannya kembali.
    expect(semuaKamar(store.getState()).find((k) => k.kamar.id === "kamar-1")!.kamar.aktif).toBe(false);
  });

  it("menolak mengurangi kapasitas bila bed yang akan dihapus menyimpan riwayat perpindahan", () => {
    // Pasien mulai di bed ketiga lalu pindah ke bed pertama. Bed ketiga kini
    // kosong, tetapi menghapusnya akan menghilangkan asal/tujuan dari riwayat.
    const { store, admisiId, bedBaruId } = denganBedTambahan();
    const pindah = store.dispatch({
      type: "admisi/pindah-bed",
      olehId: PENGGUNA_UJI.perawat,
      admisiId,
      bedId: "bed-1",
    });
    if (!pindah.ok) throw new Error(pindah.alasan);
    store.dispatch({ type: "bed/siap", olehId: PENGGUNA_UJI.perawat, bedId: bedBaruId });

    const hasil = store.dispatch({
      type: "kamar/diubah",
      olehId: PENGGUNA_UJI.admin,
      kamarId: "kamar-1",
      perubahan: { kapasitas: 2 },
    });

    expect(hasil).toEqual({ ok: false, alasan: expect.stringContaining("riwayat") });
    expect(store.getState().bed.filter((b) => b.kamarId === "kamar-1")).toHaveLength(3);
  });

  it("mengubah tarif tidak menagih ulang masa inap yang sudah berjalan", () => {
    const { store } = stateDenganAdmisi(depsUji({ hariIni: () => "2026-03-03" }));
    const tagihanId = store.getState().tagihan[0]!.id;
    // Admisi masuk 1 Maret: 3 hari × Rp500.000.
    expect(nilaiTagihan(store.getState(), tagihanId, "2026-03-03").total).toBe(1_500_000);

    const hasil = store.dispatch({
      type: "kamar/diubah",
      olehId: PENGGUNA_UJI.admin,
      kamarId: "kamar-1",
      perubahan: { tarifHarian: 900_000 },
    });

    expect(hasil.ok).toBe(true);
    expect(nilaiTagihan(store.getState(), tagihanId, "2026-03-03").total).toBe(1_500_000);
  });

  it("kamar dapat diaktifkan kembali beserta bed-baknya", () => {
    const store = storeUji(depsUji(), stateDasar());
    store.dispatch({ type: "kamar/diubah", olehId: PENGGUNA_UJI.admin, kamarId: "kamar-1", perubahan: { aktif: false } });

    const hasil = store.dispatch({
      type: "kamar/diubah",
      olehId: PENGGUNA_UJI.admin,
      kamarId: "kamar-1",
      perubahan: { aktif: true },
    });

    expect(hasil.ok).toBe(true);
    expect(denahBed(store.getState())[0]!.bed).toHaveLength(2);
    expect(alasanBedTidakTersedia(store.getState(), "bed-1")).toBeNull();
  });
});

describe("riwayat perpindahan bed", () => {
  it("kosong sebelum ada perpindahan", () => {
    const { store } = stateDenganAdmisi();

    expect(riwayatPindahBed(store.getState())).toEqual([]);
  });

  it("menampilkan kamar asal, kamar tujuan, dan waktu perpindahan", () => {
    const { store, admisiId } = stateDenganAdmisi();
    store.getState().kamar.push({ id: "kamar-2", nama: "Anggrek", kelas: "VIP", tarifHarian: 900_000, aktif: true });
    store.getState().bed.push({ id: "bed-3", kamarId: "kamar-2", kode: "A", status: "kosong" });
    const pindah = store.dispatch({ type: "admisi/pindah-bed", olehId: PENGGUNA_UJI.perawat, admisiId, bedId: "bed-3" });
    if (!pindah.ok) throw new Error(pindah.alasan);

    const riwayat = riwayatPindahBed(store.getState());

    expect(riwayat).toHaveLength(1);
    expect(riwayat[0]).toMatchObject({
      admisiId,
      pasien: { nama: IDENTITAS_PASIEN.nama },
      dariKamar: { nama: "Melati 1" },
      dariBed: { id: "bed-1" },
      keKamar: { nama: "Anggrek" },
      keBed: { id: "bed-3" },
      waktu: "2026-03-01T09:00:00.000Z",
    });
  });
});
