import type { Hasil, Id, JenisCatatan, JenisKelamin, KelasKamar, MetodePembayaran, Peran, State, Tanggal, TandaVital, Waktu } from "./types";

export interface InputPasien {
  nama: string;
  nik: string;
  tanggalLahir: Tanggal;
  jenisKelamin: JenisKelamin;
  alamat: string;
  telepon: string;
  penanggungJawab: { nama: string; hubungan: string; telepon: string };
}

export interface ActionPasienDibuat {
  type: "pasien/dibuat";
  olehId: Id;
  input: InputPasien;
}

export interface ActionAdmisiDibuat {
  type: "admisi/dibuat";
  olehId: Id;
  pasienId: Id;
  dokterId: Id;
  bedId: Id;
  tanggalMasuk: Tanggal;
  diagnosaAwal: string;
}

export interface ActionKamarDibuat {
  type: "kamar/dibuat";
  olehId: Id;
  input: { nama: string; kelas: KelasKamar; tarifHarian: number; kapasitas: number };
}

export interface ActionKamarDiubah {
  type: "kamar/diubah";
  olehId: Id;
  kamarId: Id;
  perubahan: Partial<{ nama: string; kelas: KelasKamar; tarifHarian: number; kapasitas: number; aktif: boolean }>;
}

export interface ActionPindahBed {
  type: "admisi/pindah-bed";
  olehId: Id;
  admisiId: Id;
  bedId: Id;
}

export interface ActionBedSiap {
  type: "bed/siap";
  olehId: Id;
  bedId: Id;
}

export interface ActionCheckout {
  type: "checkout";
  olehId: Id;
  admisiId: Id;
  override: { alasan: string } | null;
}

export interface ActionPembayaranDicatat {
  type: "pembayaran/dicatat";
  olehId: Id;
  tagihanId: Id;
  jumlah: number;
  metode: MetodePembayaran;
}

export interface ActionPenggunaDibuat {
  type: "pengguna/dibuat";
  olehId: Id;
  input: { id?: Id; nama: string; peran: Peran; aktif?: boolean };
}

export interface ActionCatatanDitulis {
  type: "catatan/ditulis";
  olehId: Id;
  admisiId: Id;
  jenis: JenisCatatan;
  isi: string;
  diagnosa: string | null;
  rencana: string | null;
  tandaVital: TandaVital | null;
}

export interface ActionCatatanDikoreksi {
  type: "catatan/dikoreksi";
  olehId: Id;
  catatanId: Id;
  isi: string;
}

export interface ActionInstruksiDijalankan {
  type: "instruksi/dijalankan";
  olehId: Id;
  catatanId: Id;
}

export interface ActionResepDibuat {
  type: "resep/dibuat";
  olehId: Id;
  admisiId: Id;
  items: Array<{ obatId: Id; jumlah: number; aturanPakai: string }>;
}

export interface ActionResepSiapkan {
  type: "resep/siapkan";
  olehId: Id;
  resepId: Id;
}

export interface ActionResepSerahkan {
  type: "resep/serahkan";
  olehId: Id;
  resepId: Id;
}

export interface ActionStokMasuk {
  type: "obat/stok-masuk";
  olehId: Id;
  obatId: Id;
  jumlah: number;
  keterangan: string;
}

export interface ActionTindakanDitambahkan {
  type: "tindakan/ditambahkan";
  olehId: Id;
  admisiId: Id;
  tindakanId: Id;
}

export interface ActionTindakanMasterDiubah {
  type: "tindakan-master/diubah";
  olehId: Id;
  tindakanId: Id;
  perubahan: Partial<{ nama: string; tarif: number; aktif: boolean }>;
}

export type Action =
  | ActionPasienDibuat
  | ActionAdmisiDibuat
  | ActionKamarDibuat
  | ActionKamarDiubah
  | ActionPindahBed
  | ActionBedSiap
  | ActionCheckout
  | ActionPembayaranDicatat
  | ActionPenggunaDibuat
  | ActionCatatanDitulis
  | ActionCatatanDikoreksi
  | ActionInstruksiDijalankan
  | ActionResepDibuat
  | ActionResepSiapkan
  | ActionResepSerahkan
  | ActionStokMasuk
  | ActionTindakanDitambahkan
  | ActionTindakanMasterDiubah;

/** Dependensi dari dunia luar (waktu, id). Disuntikkan agar test deterministik. */
export interface StoreDeps {
  hariIni(): Tanggal;
  sekarang(): Waktu;
  id(prefix: string): Id;
}

export interface Store {
  getState(): Readonly<State>;
  dispatch(action: Action): Hasil;
  /** Reset data demo: kembali ke kondisi awal, atau ke snapshot yang diberikan. */
  reset(state?: State): void;
  subscribe(listener: () => void): () => void;
}
