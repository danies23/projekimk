import type { Admisi, Bed, Id, Kamar, KelasKamar, Pasien, Pengguna, State } from "./types";

export function pilihPasienById(state: State, id: Id): Pasien | undefined {
  return state.pasien.find((p) => p.id === id);
}

export function pilihPasienByNomorRM(state: State, nomorRM: string): Pasien | undefined {
  return state.pasien.find((p) => p.nomorRM === nomorRM);
}

/** Dipakai formulir pendaftaran untuk memperingatkan NIK ganda sebelum disimpan. */
export function pasienDenganNik(state: State, nik: string): Pasien | undefined {
  return state.pasien.find((p) => p.nik === nik);
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
  // Kamar nonaktif tidak ditawarkan ke petugas, jadi bed-nya tidak dihitung BOR.
  const kamarAktif = new Set(state.kamar.filter((k) => k.aktif).map((k) => k.id));
  const bed = state.bed.filter((b) => kamarAktif.has(b.kamarId));
  const total = bed.length;
  const hitung = (status: string) => bed.filter((b) => b.status === status).length;
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

/** Dokter yang bisa dipilih sebagai penanggung jawab admisi baru. */
export function dokterAktif(state: State): Pengguna[] {
  return state.pengguna.filter((p) => p.peran === "dokter" && p.aktif);
}

export interface BedKamar {
  id: Id;
  nama: string;
  kelas: KelasKamar;
  tarifHarian: number;
  bed: Bed[];
}

/** Denah bed: kamar aktif beserta bed-nya, urut sesuai urutan kamar di master. */
export function denahBed(state: State): BedKamar[] {
  return state.kamar
    .filter((k) => k.aktif)
    .map((k: Kamar) => ({
      id: k.id,
      nama: k.nama,
      kelas: k.kelas,
      tarifHarian: k.tarifHarian,
      bed: state.bed.filter((b) => b.kamarId === k.id),
    }));
}

/**
 * Pesan penolakan bed kosong; `null` berarti bed dapat dipilih. Dipakai
 * pemilih bed dan store supaya pesan "baru saja terisi" tidak ditulis dua kali.
 */
export function alasanBedTidakTersedia(state: State, bedId: Id): string | null {
  const target = state.bed.find((b) => b.id === bedId);
  if (!target) return "Bed tidak ditemukan.";
  if (target.status === "terisi") return `Bed ${target.kode} baru saja terisi, pilih bed lain.`;
  if (target.status === "dibersihkan") {
    return `Bed ${target.kode} belum siap dipakai. Tunggu sampai perawat menandainya siap.`;
  }
  return null;
}

export function tagihanUntukAdmisi(state: State, admisiId: Id) {
  return state.tagihan.find((t) => t.admisiId === admisiId);
}
