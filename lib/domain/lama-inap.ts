/** Tanggal disimpan sebagai `YYYY-MM-DD` (tanggal kalender, tanpa jam). */
export type Tanggal = string;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Selisih hari kalender murni, tidak terpengaruh zona waktu maupun DST. */
export function selisihHari(dari: Tanggal, sampai: Tanggal): number {
  const a = Date.UTC(Number(dari.slice(0, 4)), Number(dari.slice(5, 7)) - 1, Number(dari.slice(8, 10)));
  const b = Date.UTC(Number(sampai.slice(0, 4)), Number(sampai.slice(5, 7)) - 1, Number(sampai.slice(8, 10)));
  return Math.round((b - a) / MS_PER_DAY);
}

/**
 * Lama inap = jumlah hari kalender inklusif (ADR-0002). Tanggal pulang `null`
 * berarti admisi masih aktif, sehingga tanggal hari ini dipakai.
 */
export function lamaInap(masuk: Tanggal, pulang: Tanggal | null, hariIni: Tanggal): number {
  return selisihHari(masuk, pulang ?? hariIni) + 1;
}

/** Menggeser tanggal kalender sebanyak `hari` (negatif = ke belakang). */
export function geserTanggal(tanggal: Tanggal, hari: number): Tanggal {
  const ms = Date.UTC(Number(tanggal.slice(0, 4)), Number(tanggal.slice(5, 7)) - 1, Number(tanggal.slice(8, 10)));
  return new Date(ms + hari * MS_PER_DAY).toISOString().slice(0, 10);
}
