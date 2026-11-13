import { describe, expect, it } from "vitest";
import { buatStateKosong } from "./state";
import { createStore } from "./store";
import { PENGGUNA_UJI, depsUji, stateDenganAdmisi } from "./test-utils";
import type { State } from "./types";

const IDENTITAS = {
  nama: "Siti Rahmawati",
  nik: "3201015501900001",
  tanggalLahir: "1990-01-15",
  jenisKelamin: "P" as const,
  alamat: "Jl. Merdeka 12, Bandung",
  telepon: "081234567890",
  penanggungJawab: { nama: "Budi Rahmawati", hubungan: "Suami", telepon: "081298765432" },
};

function penggunaDasar(): State["pengguna"] {
  return [
    { id: PENGGUNA_UJI.pendaftaran, nama: "Rina", peran: "pendaftaran", aktif: true },
    { id: PENGGUNA_UJI.dokter, nama: "dr. Ayu", peran: "dokter", aktif: true },
    { id: PENGGUNA_UJI.kasir, nama: "Joko", peran: "kasir", aktif: true },
    { id: PENGGUNA_UJI.apoteker, nama: "Nadia", peran: "apoteker", aktif: true },
  ];
}

/** Store dengan hari yang bisa dimajukan untuk menguji pergantian tahun. */
function storeBerjalan() {
  let hari = "2026-12-30";
  const state: State = { ...buatStateKosong(), pengguna: penggunaDasar() };
  const store = createStore(state, depsUji({ hariIni: () => hari, sekarang: () => `${hari}T09:00:00.000Z` }));
  return { store, majuKe: (tanggal: string) => void (hari = tanggal) };
}

describe("Nomor Rekam Medis", () => {
  it("berformat RM-<tahun>-<urut> bagi pasien pertama", () => {
    const { store } = storeBerjalan();
    const hasil = store.dispatch({ type: "pasien/dibuat", olehId: PENGGUNA_UJI.pendaftaran, input: IDENTITAS });
    expect(hasil.ok).toBe(true);
    expect(store.getState().pasien[0]!.nomorRM).toBe("RM-2026-1");
  });

  it("melanjutkan urutan pada tahun yang sama", () => {
    const { store } = storeBerjalan();
    store.dispatch({ type: "pasien/dibuat", olehId: PENGGUNA_UJI.pendaftaran, input: IDENTITAS });
    store.dispatch({
      type: "pasien/dibuat",
      olehId: PENGGUNA_UJI.pendaftaran,
      input: { ...IDENTITAS, nik: "3201015501900002" },
    });

    expect(store.getState().pasien.map((p) => p.nomorRM)).toEqual(["RM-2026-1", "RM-2026-2"]);
  });

  it("memulai ulang urutan di tahun baru tanpa mengulang nomor tahun lalu", () => {
    const { store, majuKe } = storeBerjalan();
    store.dispatch({ type: "pasien/dibuat", olehId: PENGGUNA_UJI.pendaftaran, input: IDENTITAS });
    store.dispatch({
      type: "pasien/dibuat",
      olehId: PENGGUNA_UJI.pendaftaran,
      input: { ...IDENTITAS, nik: "3201015501900002" },
    });

    majuKe("2027-01-02");
    store.dispatch({
      type: "pasien/dibuat",
      olehId: PENGGUNA_UJI.pendaftaran,
      input: { ...IDENTITAS, nik: "3201015501900003" },
    });

    expect(store.getState().pasien.map((p) => p.nomorRM)).toEqual(["RM-2026-1", "RM-2026-2", "RM-2027-1"]);
  });

  it("menolak NIK yang sudah terdaftar tanpa mengubah state", () => {
    const { store } = storeBerjalan();
    store.dispatch({ type: "pasien/dibuat", olehId: PENGGUNA_UJI.pendaftaran, input: IDENTITAS });
    const sebelum = structuredClone(store.getState());

    const hasil = store.dispatch({
      type: "pasien/dibuat",
      olehId: PENGGUNA_UJI.pendaftaran,
      input: { ...IDENTITAS, nama: "Nama Lain" },
    });

    expect(hasil).toEqual({ ok: false, alasan: expect.stringContaining("NIK") });
    expect(store.getState()).toEqual(sebelum);
  });

  it("menolak pasien tanpa nama", () => {
    const { store } = storeBerjalan();
    const hasil = store.dispatch({
      type: "pasien/dibuat",
      olehId: PENGGUNA_UJI.pendaftaran,
      input: { ...IDENTITAS, nama: "   " },
    });

    expect(hasil).toEqual({ ok: false, alasan: expect.stringContaining("Nama") });
    expect(store.getState().pasien).toHaveLength(0);
  });
});

describe("validasi tanggal dan jumlah", () => {
  it("menolak admisi dengan tanggal masuk di masa depan", () => {
    const { store } = stateDenganAdmisi(depsUji({ hariIni: () => "2026-03-01" }));
    const pasien = store.dispatch({ type: "pasien/dibuat", olehId: PENGGUNA_UJI.pendaftaran, input: { ...IDENTITAS, nik: "3201015501900111" } });
    if (!pasien.ok) throw new Error(pasien.alasan);

    const hasil = store.dispatch({
      type: "admisi/dibuat",
      olehId: PENGGUNA_UJI.pendaftaran,
      pasienId: pasien.id,
      dokterId: PENGGUNA_UJI.dokter,
      bedId: "bed-2",
      tanggalMasuk: "2027-01-01",
      diagnosaAwal: "Observasi",
    });

    expect(hasil).toEqual({ ok: false, alasan: expect.stringContaining("masa depan") });
    expect(store.getState().admisi).toHaveLength(1);
  });

  it("menolak tanggal masuk yang bukan tanggal kalender", () => {
    const { store } = stateDenganAdmisi();
    const pasien = store.dispatch({ type: "pasien/dibuat", olehId: PENGGUNA_UJI.pendaftaran, input: { ...IDENTITAS, nik: "3201015501900222" } });
    if (!pasien.ok) throw new Error(pasien.alasan);

    const hasil = store.dispatch({
      type: "admisi/dibuat",
      olehId: PENGGUNA_UJI.pendaftaran,
      pasienId: pasien.id,
      dokterId: PENGGUNA_UJI.dokter,
      bedId: "bed-2",
      tanggalMasuk: "01/03/2026",
      diagnosaAwal: "Observasi",
    });

    expect(hasil.ok).toBe(false);
  });

  it("menolak pembayaran pecahan dan nol", () => {
    const { store } = stateDenganAdmisi();
    const tagihanId = store.getState().tagihan[0]!.id;

    for (const jumlah of [0, 0.5, -10]) {
      const hasil = store.dispatch({
        type: "pembayaran/dicatat",
        olehId: PENGGUNA_UJI.kasir,
        tagihanId,
        jumlah,
        metode: "tunai",
      });
      expect(hasil.ok, `jumlah ${jumlah} seharusnya ditolak`).toBe(false);
    }
    expect(store.getState().pembayaran).toHaveLength(0);
  });

  it("menerima pembayaran pecahan rupiah yang masih bulat", () => {
    const { store } = stateDenganAdmisi();
    const tagihanId = store.getState().tagihan[0]!.id;
    const hasil = store.dispatch({
      type: "pembayaran/dicatat",
      olehId: PENGGUNA_UJI.kasir,
      tagihanId,
      jumlah: 50_000,
      metode: "tunai",
    });
    expect(hasil.ok).toBe(true);
  });

  it("menolak jumlah obat pecahan pada resep", () => {
    const { store, admisiId } = stateDenganAdmisi();
    const hasil = store.dispatch({
      type: "resep/dibuat",
      olehId: PENGGUNA_UJI.dokter,
      admisiId,
      items: [{ obatId: "obat-1", jumlah: 2.5, aturanPakai: "1×1" }],
    });

    expect(hasil.ok).toBe(false);
    expect(store.getState().resep).toHaveLength(0);
  });
});
