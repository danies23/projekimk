import { KUNCI_SNAPSHOT, type Penyimpanan } from "./penyimpanan";
import { buatStateKosong } from "./state";
import type { State } from "./types";

interface Snapshot {
  versi: 1;
  disimpanPada: string;
  state: State;
}

/** Menyimpan snapshot; kegagalan penyimpanan diabaikan dengan sengaja. */
export function simpanSnapshot(penyimpanan: Penyimpanan, state: State, sekarang = new Date()): void {
  const snapshot: Snapshot = { versi: 1, disimpanPada: sekarang.toISOString(), state };
  try {
    penyimpanan.setItem(KUNCI_SNAPSHOT, JSON.stringify(snapshot));
  } catch {
    // Kuota penuh atau penyimpanan diblokir: prototipe tetap berjalan di memori.
  }
}

/**
 * Memuat snapshot; isi rusak atau versi asing dianggap tidak ada. Snapshot
 * lama bisa dibuat sebelum sebuah koleksi ada, jadi koleksi yang hilang diisi
 * kosong di sini alih-alih membuat layar melempar saat membaca `.map`/`.filter`.
 */
export function muatSnapshot(penyimpanan: Penyimpanan): State | null {
  try {
    const mentah = penyimpanan.getItem(KUNCI_SNAPSHOT);
    if (!mentah) return null;
    const snapshot = JSON.parse(mentah) as Snapshot;
    if (snapshot?.versi !== 1 || !snapshot.state) return null;
    return { ...buatStateKosong(), ...snapshot.state };
  } catch {
    return null;
  }
}
