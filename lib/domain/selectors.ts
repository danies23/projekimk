import type { Admisi, Id, Pasien, State } from "./types";

export function pilihPasienById(state: State, id: Id): Pasien | undefined {
  return state.pasien.find((p) => p.id === id);
}

export function pilihPasienByNomorRM(state: State, nomorRM: string): Pasien | undefined {
  return state.pasien.find((p) => p.nomorRM === nomorRM);
}

/**
 * Pencarian pasien menerima nama, NIK, atau Nomor Rekam Medis. Kata kunci
 * kosong sengaja tidak mengembalikan apa pun agar layar tidak menampilkan
 * seluruh pasien sebelum petugas mengetik.
 */
export function cariPasien(state: State, kataKunci: string): Pasien[] {
  const kunci = kataKunci.trim().toLowerCase();
  if (!kunci) return [];
  return state.pasien.filter(
    (p) =>
      p.nama.toLowerCase().includes(kunci) ||
      p.nik.includes(kunci) ||
      p.nomorRM.toLowerCase().includes(kunci),
  );
}

export function admisiAktif(state: State): Admisi[] {
  return state.admisi.filter((a) => a.status === "aktif");
}

export function admisiUntukPasien(state: State, pasienId: Id): Admisi[] {
  return state.admisi.filter((a) => a.pasienId === pasienId);
}

export interface RingkasanBed {
  total: number;
  terisi: number;
  kosong: number;
  dibersihkan: number;
  /** Tingkat hunian dalam persen, satu desimal. */
  bor: number;
}

export function ringkasanBed(state: State): RingkasanBed {
  const total = state.bed.length;
  const hitung = (status: string) => state.bed.filter((b) => b.status === status).length;
  const terisi = hitung("terisi");
  return {
    total,
    terisi,
    kosong: hitung("kosong"),
    dibersihkan: hitung("dibersihkan"),
    bor: total === 0 ? 0 : Math.round((terisi / total) * 1000) / 10,
  };
}

export function penggunaById(state: State, id: Id) {
  return state.pengguna.find((p) => p.id === id);
}

export function tagihanUntukAdmisi(state: State, admisiId: Id) {
  return state.tagihan.find((t) => t.admisiId === admisiId);
}
