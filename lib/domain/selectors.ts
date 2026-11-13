import type { Admisi, Bed, Id, Kamar, KelasKamar, Pasien, Pengguna, State, Waktu } from "./types";

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

/** Seluruh kamar termasuk yang nonaktif, untuk layar pengelolaan admin. */
export function semuaKamar(state: State): Array<{ kamar: Kamar; bed: Bed[] }> {
  return state.kamar.map((kamar) => ({
    kamar,
    bed: state.bed.filter((b) => b.kamarId === kamar.id),
  }));
}

export interface RiwayatPindahBed {
  admisiId: Id;
  pasien: Pasien;
  dariKamar: Kamar;
  dariBed: Bed;
  keKamar: Kamar;
  keBed: Bed;
  waktu: Waktu;
}

/** Riwayat perpindahan bed seluruh admisi, terbaru dulu, diturunkan dari segmen bed. */
export function riwayatPindahBed(state: State): RiwayatPindahBed[] {
  const baris: RiwayatPindahBed[] = [];
  for (const admisi of state.admisi) {
    const pasien = state.pasien.find((p) => p.id === admisi.pasienId);
    if (!pasien) continue;
    for (let i = 0; i < admisi.segmenBed.length - 1; i++) {
      const dari = admisi.segmenBed[i]!;
      const ke = admisi.segmenBed[i + 1]!;
      const dariBed = state.bed.find((b) => b.id === dari.bedId);
      const keBed = state.bed.find((b) => b.id === ke.bedId);
      const dariKamar = state.kamar.find((k) => k.id === dari.kamarId);
      const keKamar = state.kamar.find((k) => k.id === ke.kamarId);
      // Bed yang sudah dihapus dari master tidak dapat ditampilkan namanya.
      if (!dariBed || !keBed || !dariKamar || !keKamar) continue;
      baris.push({
        admisiId: admisi.id,
        pasien,
        dariKamar,
        dariBed,
        keKamar,
        keBed,
        waktu: ke.dari,
      });
    }
  }
  return baris.sort((a, b) => b.waktu.localeCompare(a.waktu));
}

/**
 * Pesan penolakan bed kosong; `null` berarti bed dapat dipilih. Dipakai
 * pemilih bed dan store supaya pesan "baru saja terisi" tidak ditulis dua kali.
 */
export function alasanBedTidakTersedia(state: State, bedId: Id): string | null {
  const target = state.bed.find((b) => b.id === bedId);
  if (!target) return "Bed tidak ditemukan.";
  const kamar = state.kamar.find((k) => k.id === target.kamarId);
  if (!kamar || !kamar.aktif) return `Bed ${target.kode} berada di kamar nonaktif. Pilih bed lain.`;
  if (target.status === "terisi") return `Bed ${target.kode} baru saja terisi, pilih bed lain.`;
  if (target.status === "dibersihkan") {
    return `Bed ${target.kode} belum siap dipakai. Tunggu sampai perawat menandainya siap.`;
  }
  return null;
}

export function tagihanUntukAdmisi(state: State, admisiId: Id) {
  return state.tagihan.find((t) => t.admisiId === admisiId);
}

export interface InfoAdmisi {
  admisiId: Id;
  pasien: Pasien;
  dokter: Pengguna;
  kamar: Kamar;
  bed: Bed;
  tanggalMasuk: string;
  diagnosaAwal: string;
}

/** Satu admisi dengan relasi yang selalu dibutuhkan layar bukti dan konfirmasi. */
export function infoAdmisi(state: State, admisiId: Id): InfoAdmisi | null {
  const admisi = state.admisi.find((a) => a.id === admisiId);
  if (!admisi) return null;
  const pasien = state.pasien.find((p) => p.id === admisi.pasienId);
  const dokter = state.pengguna.find((p) => p.id === admisi.dokterId);
  const bed = state.bed.find((b) => b.id === admisi.bedId);
  const kamar = bed ? state.kamar.find((k) => k.id === bed.kamarId) : undefined;
  if (!pasien || !dokter || !bed || !kamar) return null;
  return {
    admisiId: admisi.id,
    pasien,
    dokter,
    kamar,
    bed,
    tanggalMasuk: admisi.tanggalMasuk,
    diagnosaAwal: admisi.diagnosaAwal,
  };
}

export interface BarisAdmisiAktif {
  admisiId: Id;
  namaPasien: string;
  nomorRM: string;
  kodeBed: string;
  namaKamar: string;
  namaDokter: string;
  tanggalMasuk: string;
}

/** Admisi aktif untuk daftar "pasien ini dirawat di mana", terbaru dulu. */
export function daftarAdmisiAktif(state: State): InfoAdmisi[] {
  return admisiAktif(state)
    .map((a) => infoAdmisi(state, a.id))
    .filter((info): info is InfoAdmisi => !!info)
    .sort((a, b) => b.tanggalMasuk.localeCompare(a.tanggalMasuk));
}
