import type { Peran } from "./types";

export interface AkunDemo {
  id: string;
  nama: string;
  peran: Peran;
  email: string;
  label: string;
}

/**
 * Akun demo untuk ketujuh peran; dokter dan perawat masing-masing punya dua
 * orang agar pembagian beban terlihat. Kredensial sengaja sederhana karena
 * prototipe tidak memiliki autentikasi sungguhan (ADR-0001).
 */
export const AKUN_DEMO: AkunDemo[] = [
  { id: "u-pendaftaran", nama: "Rina Kartika", peran: "pendaftaran", email: "rina@danimc.id", label: "Petugas Pendaftaran" },
  { id: "u-dokter", nama: "dr. Ayu Prameswari, Sp.PD", peran: "dokter", email: "ayu@danimc.id", label: "Dokter" },
  { id: "u-dokter-2", nama: "dr. Bagas Nugroho, Sp.JP", peran: "dokter", email: "bagas@danimc.id", label: "Dokter" },
  { id: "u-perawat", nama: "Ns. Dwi Lestari", peran: "perawat", email: "dwi@danimc.id", label: "Perawat" },
  { id: "u-perawat-2", nama: "Ns. Andi Saputra", peran: "perawat", email: "andi@danimc.id", label: "Perawat" },
  { id: "u-apoteker", nama: "Nadia Rahmania, S.Farm", peran: "apoteker", email: "nadia@danimc.id", label: "Apoteker" },
  { id: "u-kasir", nama: "Joko Susilo", peran: "kasir", email: "joko@danimc.id", label: "Kasir" },
  { id: "u-pimpinan", nama: "Hendra Wijaya", peran: "pimpinan", email: "hendra@danimc.id", label: "Pimpinan" },
  { id: "u-admin", nama: "Sari Dewanti", peran: "admin", email: "sari@danimc.id", label: "Admin" },
];

/** Kredensial demo yang ditampilkan di halaman login. */
export const SANDI_DEMO = "demo123";

export const ID = {
  pendaftaran: "u-pendaftaran",
  dokter: "u-dokter",
  dokter2: "u-dokter-2",
  perawat: "u-perawat",
  perawat2: "u-perawat-2",
  apoteker: "u-apoteker",
  kasir: "u-kasir",
  pimpinan: "u-pimpinan",
  admin: "u-admin",
} as const;
