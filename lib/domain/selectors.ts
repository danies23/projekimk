import type {
  Admisi,
  Bed,
  CatatanKlinis,
  Id,
  Kamar,
  KelasKamar,
  Obat,
  Pasien,
  Pengguna,
  Resep,
  State,
  TindakanAdmisi,
  Waktu,
} from "./types";

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

/** Admisi aktif yang menjadi tanggung jawab satu dokter, terbaru dulu. */
export function admisiUntukDokter(state: State, dokterId: Id): InfoAdmisi[] {
  return daftarAdmisiAktif(state).filter((info) => info.dokter.id === dokterId);
}

/** Catatan tanda vital terbaru satu admisi; `null` bila belum pernah dicatat. */
export function tandaVitalTerakhir(state: State, admisiId: Id): CatatanKlinis | null {
  return (
    state.catatanKlinis
      .filter((c) => c.admisiId === admisiId && c.jenis === "tanda_vital" && !c.koreksiUntukId)
      .sort((a, b) => b.waktu.localeCompare(a.waktu))[0] ?? null
  );
}

export interface InstruksiDokter {
  catatan: CatatanKlinis;
  dokter: Pengguna | null;
}

/**
 * Rencana visita dokter pada satu admisi yang belum ditandai perawat sebagai
 * dijalankan, terbaru dulu. Instruksi adalah `rencana` catatan visite; tidak
 * ada entitas terpisah.
 */
export function instruksiBelumDijalankan(state: State, admisiId: Id): InstruksiDokter[] {
  const dijalankan = new Set(state.instruksiDijalankan.map((i) => i.catatanId));
  const penulisDokter = (c: CatatanKlinis) =>
    !c.koreksiUntukId &&
    c.rencana &&
    state.pengguna.find((p) => p.id === c.penulisId)?.peran === "dokter";
  return state.catatanKlinis
    .filter((c) => c.admisiId === admisiId && penulisDokter(c))
    .filter((c) => !dijalankan.has(c.id))
    .sort((a, b) => b.waktu.localeCompare(a.waktu))
    .map((catatan) => ({ catatan, dokter: penggunaById(state, catatan.penulisId) ?? null }));
}

export interface BarisAntreanResep {
  resepId: Id;
  waktu: Waktu;
  admisiId: Id;
  pasien: Pasien;
  dokter: Pengguna | null;
  resep: Resep;
  /** Admisi sudah checkout: tagihannya ditutup, resep tidak dapat diproses lagi. */
  admisiSelesai: boolean;
}

export interface AntreanFarmasi {
  menunggu: BarisAntreanResep[];
  disiapkan: BarisAntreanResep[];
  diserahkan: BarisAntreanResep[];
}

/**
 * Antrean resep per status. Tiap kelompok diurutkan dari yang terlama supaya
 * resep yang datang lebih dulu tidak terlantar; obat yang sudah diserahkan
 * tetap terlihat agar apoteker dapat menelusuri pekerjaan yang selesai.
 */
export function antreanFarmasi(state: State): AntreanFarmasi {
  const baris = state.resep.map((resep): BarisAntreanResep | null => {
    const admisi = state.admisi.find((a) => a.id === resep.admisiId);
    if (!admisi) return null;
    const pasien = pilihPasienById(state, admisi.pasienId);
    if (!pasien) return null;
    return {
      resepId: resep.id,
      waktu: resep.waktu,
      admisiId: admisi.id,
      pasien,
      dokter: penggunaById(state, resep.dokterId) ?? null,
      resep,
      admisiSelesai: admisi.status !== "aktif",
    };
  });
  const urut = (status: Resep["status"]) =>
    baris
      .filter((b): b is BarisAntreanResep => !!b && b.resep.status === status)
      .sort((a, b) => a.waktu.localeCompare(b.waktu));
  return { menunggu: urut("menunggu"), disiapkan: urut("disiapkan"), diserahkan: urut("diserahkan") };
}

/** Obat yang stoknya sudah di bawah stok minimum; stok pas di minimum belum menipis. */
export function obatStokMenipis(state: State): Obat[] {
  return state.obat.filter((o) => o.stok < o.stokMinimum);
}

/**
 * Jumlah yang dibutuhkan per obat untuk satu resep. Baris berisi obat yang sama
 * dijumlahkan lebih dulu; tanpa itu dua baris 80 tablet masing-masing lolos
 * pemeriksaan terhadap stok 100. Store memakai fungsi ini untuk menolak
 * penyerahan, jadi label "stok kurang" di layar tidak pernah berbeda dari
 * keputusan store.
 */
export function kebutuhanObat(resep: Resep): Map<Id, number> {
  const kebutuhan = new Map<Id, number>();
  for (const item of resep.items) {
    kebutuhan.set(item.obatId, (kebutuhan.get(item.obatId) ?? 0) + item.jumlah);
  }
  return kebutuhan;
}

/** Total tarif tindakan pada satu admisi; `olehId` membatasi pada pencatatnya. */
export function totalTindakan(state: State, admisiId: Id, olehId?: Id): number {
  return state.tindakanAdmisi
    .filter((t) => t.admisiId === admisiId && (olehId === undefined || t.olehId === olehId))
    .reduce((n, t) => n + t.tarif, 0);
}

export type ItemRiwayat =
  | { jenis: "catatan"; waktu: Waktu; admisiId: Id; penulis: Pengguna | null; catatan: CatatanKlinis }
  | { jenis: "tindakan"; waktu: Waktu; admisiId: Id; oleh: Pengguna | null; tindakan: TindakanAdmisi }
  | { jenis: "resep"; waktu: Waktu; admisiId: Id; dokter: Pengguna | null; resep: Resep };

/**
 * Riwayat klinis satu pasien lintas admisi, terbaru dulu. Catatan, tindakan,
 * dan resep disatukan agar dokter membaca satu garis waktu, bukan tiga daftar.
 */
export function riwayatKlinis(state: State, pasienId: Id): ItemRiwayat[] {
  const admisiIds = new Set(admisiUntukPasien(state, pasienId).map((a) => a.id));
  const penulis = (id: Id) => state.pengguna.find((p) => p.id === id) ?? null;

  const item: ItemRiwayat[] = [
    ...state.catatanKlinis
      .filter((c) => admisiIds.has(c.admisiId))
      .map((c): ItemRiwayat => ({ jenis: "catatan", waktu: c.waktu, admisiId: c.admisiId, penulis: penulis(c.penulisId), catatan: c })),
    ...state.tindakanAdmisi
      .filter((t) => admisiIds.has(t.admisiId))
      .map((t): ItemRiwayat => ({ jenis: "tindakan", waktu: t.waktu, admisiId: t.admisiId, oleh: penulis(t.olehId), tindakan: t })),
    ...state.resep
      .filter((r) => admisiIds.has(r.admisiId))
      .map((r): ItemRiwayat => ({ jenis: "resep", waktu: r.waktu, admisiId: r.admisiId, dokter: penulis(r.dokterId), resep: r })),
  ];
  return item.sort((a, b) => b.waktu.localeCompare(a.waktu));
}

/** Admisi aktif untuk daftar "pasien ini dirawat di mana", terbaru dulu. */
export function daftarAdmisiAktif(state: State): InfoAdmisi[] {
  return admisiAktif(state)
    .map((a) => infoAdmisi(state, a.id))
    .filter((info): info is InfoAdmisi => !!info)
    .sort((a, b) => b.tanggalMasuk.localeCompare(a.tanggalMasuk));
}
