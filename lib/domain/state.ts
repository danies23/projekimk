import type { State } from "./types";

/** State awal sebelum data demo dimuat. Tidak dipakai aplikasi, hanya titik nol yang jujur. */
export function buatStateKosong(): State {
  return {
    pengguna: [],
    pasien: [],
    kamar: [],
    bed: [],
    admisi: [],
    catatanKlinis: [],
    instruksiDijalankan: [],
    tindakanMaster: [],
    tindakanAdmisi: [],
    obat: [],
    resep: [],
    tagihan: [],
    pembayaran: [],
    mutasiStok: [],
    audit: [],
    urutanRM: {},
  };
}

/**
 * Salinan dalam agar mutasi yang ditolak tidak meninggalkan jejak. Scale demo
 * (≈40 pasien) membuat biaya salinan tidak berarti.
 */
export function cloneState(state: State): State {
  return structuredClone(state);
}
