import type { Penyimpanan } from "./domain/penyimpanan";
import type { Id } from "./domain/types";

/**
 * Sesi demo: hanya id pengguna, karena prototipe tidak memiliki autentikasi
 * sungguhan (ADR-0001). Disimpan terpisah dari snapshot domain supaya
 * "Reset data demo" tidak mengeluarkan pengguna dari perannya.
 */
export const KUNCI_SESI = "dmc.sesi.v1";

export interface Sesi {
  penggunaId: Id;
}

interface SesiTersimpan extends Sesi {
  versi: 1;
}

export function simpanSesi(penyimpanan: Penyimpanan, sesi: Sesi): void {
  try {
    penyimpanan.setItem(KUNCI_SESI, JSON.stringify({ versi: 1, penggunaId: sesi.penggunaId }));
  } catch {
    // Penyimpanan diblokir: sesi tetap hidup di memori pemanggil.
  }
}

/** Sesi rusak atau versi asing dianggap tidak ada, sehingga login diminta lagi. */
export function muatSesi(penyimpanan: Penyimpanan): Sesi | null {
  try {
    const mentah = penyimpanan.getItem(KUNCI_SESI);
    if (!mentah) return null;
    const sesi = JSON.parse(mentah) as Partial<SesiTersimpan>;
    if (sesi?.versi !== 1 || typeof sesi.penggunaId !== "string" || !sesi.penggunaId) return null;
    return { penggunaId: sesi.penggunaId };
  } catch {
    return null;
  }
}

export function hapusSesi(penyimpanan: Penyimpanan): void {
  try {
    penyimpanan.removeItem(KUNCI_SESI);
  } catch {
    // Mengosongkan tidak wajib berhasil untuk aplikasi tetap berjalan.
  }
}
