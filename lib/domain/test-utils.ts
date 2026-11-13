import { buatStateKosong } from "./state";
import { createStore } from "./store";
import type { StoreDeps } from "./actions";
import type { Bed, Kamar, Pengguna, State } from "./types";

export const PENGGUNA_UJI = {
  pendaftaran: "u-pendaftaran",
  dokter: "u-dokter",
  perawat: "u-perawat",
  apoteker: "u-apoteker",
  kasir: "u-kasir",
  pimpinan: "u-pimpinan",
  admin: "u-admin",
} as const;

/** Dependensi deterministik: waktu, hari, dan id yang dapat diprediksi. */
export function depsUji(overrides: Partial<StoreDeps> = {}): StoreDeps {
  let n = 0;
  return {
    hariIni: () => "2026-03-01",
    sekarang: () => "2026-03-01T09:00:00.000Z",
    id: (prefix) => `${prefix}-${++n}`,
    ...overrides,
  };
}

export function storeUji(deps: StoreDeps = depsUji(), state: State = buatStateKosong()) {
  return createStore(state, deps);
}

export const IDENTITAS_PASIEN = {
  nama: "Siti Rahmawati",
  nik: "3201015501900001",
  tanggalLahir: "1990-01-15",
  jenisKelamin: "P" as const,
  alamat: "Jl. Merdeka 12, Bandung",
  telepon: "081234567890",
  penanggungJawab: { nama: "Budi Rahmawati", hubungan: "Suami", telepon: "081298765432" },
};

export function stateDasar(): State {
  const kamar: Kamar = { id: "kamar-1", nama: "Melati 1", kelas: "I", tarifHarian: 500_000, aktif: true };
  const bed: Bed = { id: "bed-1", kamarId: kamar.id, kode: "A", status: "kosong" };
  const bed2: Bed = { id: "bed-2", kamarId: kamar.id, kode: "B", status: "kosong" };
  const pengguna: Pengguna[] = [
    { id: PENGGUNA_UJI.pendaftaran, nama: "Rina", peran: "pendaftaran", aktif: true },
    { id: PENGGUNA_UJI.dokter, nama: "dr. Ayu", peran: "dokter", aktif: true },
    { id: PENGGUNA_UJI.perawat, nama: "Ns. Dwi", peran: "perawat", aktif: true },
    { id: PENGGUNA_UJI.apoteker, nama: "Nadia", peran: "apoteker", aktif: true },
    { id: PENGGUNA_UJI.kasir, nama: "Joko", peran: "kasir", aktif: true },
    { id: PENGGUNA_UJI.pimpinan, nama: "Hendra", peran: "pimpinan", aktif: true },
    { id: PENGGUNA_UJI.admin, nama: "Sari", peran: "admin", aktif: true },
  ];
  return {
    ...buatStateKosong(),
    kamar: [kamar],
    bed: [bed, bed2],
    pengguna,
    obat: [
      { id: "obat-1", nama: "Paracetamol 500 mg", satuan: "tablet", harga: 2_000, stok: 100, stokMinimum: 20 },
      { id: "obat-2", nama: "Amoxicillin 500 mg", satuan: "kapsul", harga: 5_000, stok: 10, stokMinimum: 15 },
    ],
    tindakanMaster: [
      { id: "tindakan-1", nama: "Pemasangan infus", tarif: 150_000, aktif: true },
      { id: "tindakan-2", nama: "EKG", tarif: 200_000, aktif: false },
    ],
  };
}

/** Store berisi satu pasien dan satu admisi aktif pada bed-1, tanggal masuk 1 Maret. */
export function stateDenganAdmisi(deps: StoreDeps = depsUji(), state: State = stateDasar()) {
  const store = createStore(state, deps);
  const pasien = store.dispatch({ type: "pasien/dibuat", olehId: PENGGUNA_UJI.pendaftaran, input: IDENTITAS_PASIEN });
  if (!pasien.ok) throw new Error(`setup pasien gagal: ${pasien.alasan}`);
  const admisi = store.dispatch({
    type: "admisi/dibuat",
    olehId: PENGGUNA_UJI.pendaftaran,
    pasienId: pasien.id,
    dokterId: PENGGUNA_UJI.dokter,
    bedId: "bed-1",
    tanggalMasuk: "2026-03-01",
    diagnosaAwal: "Observasi",
  });
  if (!admisi.ok) throw new Error(`setup admisi gagal: ${admisi.alasan}`);
  return { store, pasienId: pasien.id, admisiId: admisi.id };
}
