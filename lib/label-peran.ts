import type { Peran } from "./domain/types";

/**
 * Satu-satunya daftar label peran berbahasa Indonesia. Sidebar, header,
 * pengalih peran, dan layar penolakan membacanya dari sini supaya istilahnya
 * tidak menyimpang dari GLOSSARY.md.
 */
export const LABEL_PERAN: Record<Peran, string> = {
  pendaftaran: "Petugas Pendaftaran",
  dokter: "Dokter",
  perawat: "Perawat",
  apoteker: "Apoteker",
  kasir: "Kasir",
  pimpinan: "Pimpinan",
  admin: "Admin",
};

/** Urutan peran mengikuti alur kerja rumah sakit, dipakai menu pengalih peran. */
export const URUTAN_PERAN: Peran[] = ["pendaftaran", "dokter", "perawat", "apoteker", "kasir", "pimpinan", "admin"];

export function labelPeran(peran: Peran | null | undefined): string {
  return peran ? LABEL_PERAN[peran] : "—";
}
