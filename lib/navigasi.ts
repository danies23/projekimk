import { MODUL } from "./domain/izin";

/**
 * Navigasi diturunkan dari `MODUL`, bukan dari daftar kedua. Bila beberapa
 * modul cocok, yang paling spesifik menang — `/administrasi/audit` adalah milik
 * Audit Log, bukan Administrasi, sehingga penjagaan aksesnya tidak terlalu
 * ketat untuk peran yang hanya berhak melihat audit.
 */
export type Modul = (typeof MODUL)[number];

/** True bila rute berada di modul ini atau turunannya; dipakai sidebar untuk menandai menu aktif. */
export function ruteDiModul(rute: string, href: string): boolean {
  return rute === href || rute.startsWith(`${href}/`);
}

export function modulUntuk(rute: string): Modul | null {
  const kandidat = MODUL.filter((m) => ruteDiModul(rute, m.href)).sort((a, b) => b.href.length - a.href.length);
  return kandidat[0] ?? null;
}

/** Jejak navigasi (breadcrumb) dari modul teratas sampai modul aktif. */
export function jejakNavigasi(rute: string): Modul[] {
  const aktif = modulUntuk(rute);
  if (!aktif) return [];
  return MODUL.filter((m) => aktif.href === m.href || aktif.href.startsWith(`${m.href}/`));
}
