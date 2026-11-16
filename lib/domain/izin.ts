import type { Action } from "./actions";
import type { Peran } from "./types";

type ActionType = Action["type"];

/**
 * Satu-satunya deklarasi pusat pemetaan peran ke izin. Sidebar, penjagaan
 * tombol, dan penjagaan rute membaca dari sumber yang sama supaya tidak ada
 * tiga daftar yang harus dijaga serempak.
 */

export type Resource =
  | "dashboard"
  | "pendaftaran"
  | "kamar"
  | "klinis"
  | "farmasi"
  | "kasir"
  | "laporan"
  | "administrasi"
  | "audit";

export type Tindakan =
  | "pasien.buat"
  | "admisi.buat"
  | "bed.pindah"
  | "bed.siap"
  | "catatan.tulis"
  | "catatan.koreksi"
  | "instruksi.jalankan"
  | "tindakan.tambah"
  | "resep.buat"
  | "resep.siapkan"
  | "obat.serahkan"
  | "obat.stokMasuk"
  | "obat.buat"
  | "pembayaran.catat"
  | "checkout.lakukan"
  | "checkout.override"
  | "laporan.lihat"
  | "laporan.keuangan"
  | "laporan.obat"
  | "master.kamar"
  | "master.tindakan"
  | "pengguna.kelola"
  | "audit.lihat";

type IzinPeran = { resource: Resource[]; tindakan: Tindakan[] };

const SEMUA_LAPORAN: Tindakan[] = ["laporan.lihat", "laporan.keuangan", "laporan.obat"];

export const IZIN: Record<Peran, IzinPeran> = {
  pendaftaran: {
    resource: ["dashboard", "pendaftaran", "kamar"],
    tindakan: ["pasien.buat", "admisi.buat"],
  },
  dokter: {
    resource: ["dashboard", "klinis"],
    tindakan: ["catatan.tulis", "catatan.koreksi", "tindakan.tambah", "resep.buat"],
  },
  perawat: {
    resource: ["dashboard", "klinis", "kamar"],
    tindakan: ["catatan.tulis", "catatan.koreksi", "instruksi.jalankan", "bed.pindah", "bed.siap"],
  },
  apoteker: {
    resource: ["dashboard", "farmasi", "laporan"],
    tindakan: ["resep.siapkan", "obat.serahkan", "obat.stokMasuk", "obat.buat", "laporan.obat"],
  },
  kasir: {
    resource: ["dashboard", "kasir", "laporan"],
    tindakan: ["pembayaran.catat", "checkout.lakukan", "laporan.keuangan"],
  },
  pimpinan: {
    resource: ["dashboard", "laporan"],
    tindakan: SEMUA_LAPORAN,
  },
  admin: {
    // Admin ikut memelihara master obat bersama apoteker (spec, user story 96),
    // jadi ia perlu akses modul Farmasi.
    resource: ["dashboard", "kamar", "farmasi", "kasir", "laporan", "administrasi", "audit"],
    tindakan: [
      "checkout.lakukan",
      "checkout.override",
      "master.kamar",
      "master.tindakan",
      "obat.buat",
      "obat.stokMasuk",
      "pengguna.kelola",
      "audit.lihat",
      ...SEMUA_LAPORAN,
    ],
  },
};

export function boleh(peran: Peran | null | undefined, tindakan: Tindakan): boolean {
  if (!peran) return false;
  return IZIN[peran].tindakan.includes(tindakan);
}

export function bolehAkses(peran: Peran | null | undefined, resource: Resource): boolean {
  if (!peran) return false;
  return IZIN[peran].resource.includes(resource);
}

/** Label modul untuk sidebar; urutannya mengikuti alur kerja rumah sakit. */
export const MODUL: Array<{ resource: Resource; label: string; href: string }> = [
  { resource: "dashboard", label: "Dashboard", href: "/dashboard" },
  { resource: "pendaftaran", label: "Pendaftaran", href: "/pendaftaran" },
  { resource: "kamar", label: "Kamar & Bed", href: "/kamar" },
  { resource: "klinis", label: "Klinis", href: "/klinis" },
  { resource: "farmasi", label: "Farmasi", href: "/farmasi" },
  { resource: "kasir", label: "Kasir", href: "/kasir" },
  { resource: "laporan", label: "Laporan", href: "/laporan" },
  { resource: "administrasi", label: "Administrasi", href: "/administrasi" },
  { resource: "audit", label: "Audit Log", href: "/administrasi/audit" },
];

export function menuUntuk(peran: Peran | null | undefined): typeof MODUL {
  if (!peran) return [];
  return MODUL.filter((m) => IZIN[peran].resource.includes(m.resource));
}

/**
 * Pemetaan aksi store ke izin yang diperlukan, satu tempat dan bukan di
 * komponen. Tipe `Record<Action["type"], …>` membuat aksi baru tanpa izin
 * gagal dikompilasi, alih-alih lolos tanpa penjagaan.
 */
export const IZIN_AKSI: Record<ActionType, Tindakan> = {
  "pasien/dibuat": "pasien.buat",
  "admisi/dibuat": "admisi.buat",
  "kamar/dibuat": "master.kamar",
  "kamar/diubah": "master.kamar",
  "admisi/pindah-bed": "bed.pindah",
  "bed/siap": "bed.siap",
  "catatan/ditulis": "catatan.tulis",
  "catatan/dikoreksi": "catatan.koreksi",
  "instruksi/dijalankan": "instruksi.jalankan",
  "tindakan/ditambahkan": "tindakan.tambah",
  "resep/dibuat": "resep.buat",
  "resep/siapkan": "resep.siapkan",
  "resep/serahkan": "obat.serahkan",
  "obat/stok-masuk": "obat.stokMasuk",
  "obat/dibuat": "obat.buat",
  "pembayaran/dicatat": "pembayaran.catat",
  checkout: "checkout.lakukan",
  "tindakan-master/diubah": "master.tindakan",
  "pengguna/dibuat": "pengguna.kelola",
};
