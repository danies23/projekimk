/**
 * Tipe domain untuk seluruh data prototipe. Nama konsep mengikuti GLOSSARY.md.
 * Tanggal kalender memakai `YYYY-MM-DD`; waktu kejadian memakai ISO 8601.
 */

export type Tanggal = string;
export type Waktu = string;

export type Peran =
  | "pendaftaran"
  | "dokter"
  | "perawat"
  | "apoteker"
  | "kasir"
  | "pimpinan"
  | "admin";

export type Id = string;

export interface Pengguna {
  id: Id;
  nama: string;
  peran: Peran;
  aktif: boolean;
}

export type JenisKelamin = "L" | "P";

export interface PenanggungJawab {
  nama: string;
  hubungan: string;
  telepon: string;
}

export interface Pasien {
  id: Id;
  nomorRM: string;
  nama: string;
  nik: string;
  tanggalLahir: Tanggal;
  jenisKelamin: JenisKelamin;
  alamat: string;
  telepon: string;
  penanggungJawab: PenanggungJawab;
}

export type KelasKamar = "VIP" | "I" | "II" | "III";

export interface Kamar {
  id: Id;
  nama: string;
  kelas: KelasKamar;
  tarifHarian: number;
  aktif: boolean;
}

export type StatusBed = "terisi" | "kosong" | "dibersihkan";

export interface Bed {
  id: Id;
  kamarId: Id;
  kode: string;
  status: StatusBed;
}

export type StatusAdmisi = "aktif" | "selesai";

export interface SegmenBed {
  bedId: Id;
  kamarId: Id;
  dari: Waktu;
  sampai: Waktu | null;
}

export interface OverrideCheckout {
  alasan: string;
  olehId: Id;
  pada: Waktu;
}

export interface Admisi {
  id: Id;
  pasienId: Id;
  dokterId: Id;
  bedId: Id;
  tanggalMasuk: Tanggal;
  tanggalPulang: Tanggal | null;
  diagnosaAwal: string;
  status: StatusAdmisi;
  segmenBed: SegmenBed[];
  overrideCheckout: OverrideCheckout | null;
}

export type JenisCatatan = "visite" | "perkembangan" | "tanda_vital";

export interface TandaVital {
  tekananDarah: string;
  suhu: number;
  nadi: number;
  pernapasan: number;
  saturasi: number;
}

export interface CatatanKlinis {
  id: Id;
  admisiId: Id;
  penulisId: Id;
  jenis: JenisCatatan;
  waktu: Waktu;
  isi: string;
  diagnosa: string | null;
  rencana: string | null;
  tandaVital: TandaVital | null;
  /** Id catatan yang dikoreksi entri ini; entri koreksi selalu bertipe sama dengan aslinya. */
  koreksiUntukId: Id | null;
  /** Id entri koreksi yang menunjuk catatan ini, bila ada. */
  dikoreksiOlehId: Id | null;
}

export interface TindakanMaster {
  id: Id;
  nama: string;
  tarif: number;
  aktif: boolean;
}

/** Tindakan yang sudah dikerjakan pada satu admisi; tarif disalin saat dicatat. */
export interface TindakanAdmisi {
  id: Id;
  admisiId: Id;
  tindakanId: Id;
  nama: string;
  tarif: number;
  waktu: Waktu;
  olehId: Id;
}

export interface Obat {
  id: Id;
  nama: string;
  satuan: string;
  harga: number;
  stok: number;
  stokMinimum: number;
}

export type StatusResep = "menunggu" | "disiapkan" | "diserahkan";

export interface ItemResep {
  obatId: Id;
  nama: string;
  jumlah: number;
  aturanPakai: string;
  /** Harga obat disalin saat resep dibuat agar riwayat tidak berubah. */
  harga: number;
}

export interface Resep {
  id: Id;
  admisiId: Id;
  dokterId: Id;
  waktu: Waktu;
  status: StatusResep;
  items: ItemResep[];
}

export type MetodePembayaran = "tunai" | "transfer" | "debit";

export interface Pembayaran {
  id: Id;
  tagihanId: Id;
  jumlah: number;
  metode: MetodePembayaran;
  waktu: Waktu;
  kasirId: Id;
}

export interface Tagihan {
  id: Id;
  admisiId: Id;
}

export type StatusTagihan = "belum bayar" | "sebagian" | "lunas";

export type AksiAudit =
  | "pasien.dibuat"
  | "admisi.dibuat"
  | "bed.dialokasikan"
  | "bed.dipindah"
  | "bed.dibersihkan"
  | "bed.siap"
  | "checkout"
  | "checkout.override"
  | "rekam_medis.ditulis"
  | "rekam_medis.dikoreksi"
  | "resep.dibuat"
  | "resep.status"
  | "obat.diserahkan"
  | "obat.stok_masuk"
  | "obat.dibuat"
  | "obat.diubah"
  | "tindakan.ditambahkan"
  | "pembayaran.dicatat"
  | "kamar.dibuat"
  | "kamar.diubah"
  | "tindakan_master.dibuat"
  | "tindakan_master.diubah"
  | "pengguna.dibuat"
  | "pengguna.diubah";

export interface AuditEntry {
  id: Id;
  waktu: Waktu;
  penggunaId: Id;
  aksi: AksiAudit;
  entitas: string;
  entitasId: Id;
  ringkasan: string;
}

export type JenisMutasiStok = "masuk" | "keluar";

export interface MutasiStok {
  id: Id;
  obatId: Id;
  jenis: JenisMutasiStok;
  jumlah: number;
  waktu: Waktu;
  keterangan: string;
  olehId: Id;
}

export interface State {
  pengguna: Pengguna[];
  pasien: Pasien[];
  kamar: Kamar[];
  bed: Bed[];
  admisi: Admisi[];
  catatanKlinis: CatatanKlinis[];
  tindakanMaster: TindakanMaster[];
  tindakanAdmisi: TindakanAdmisi[];
  obat: Obat[];
  resep: Resep[];
  tagihan: Tagihan[];
  pembayaran: Pembayaran[];
  mutasiStok: MutasiStok[];
  audit: AuditEntry[];
  /** Urutan Nomor Rekam Medis terakhir per tahun. */
  urutanRM: Record<string, number>;
}

/** Hasil dispatch: sukses membawa id entitas yang terpengaruh, gagal membawa alasan berbahasa Indonesia. */
export type Hasil =
  | { ok: true; id: Id }
  | { ok: false; alasan: string };
