/** Satuan tampilan angka; satu nama untuk konsep yang dipakai dashboard dan formatter. */
export type SatuanAngka = "jumlah" | "rupiah" | "persen";

/** Format angka untuk antarmuka; satu tempat agar semua layar menulis angka dengan cara sama. */
export function formatRupiah(nilai: number): string {
  return `Rp${nilai.toLocaleString("id-ID")}`;
}

export function formatJumlah(nilai: number): string {
  return nilai.toLocaleString("id-ID");
}

/** Tanggal kalender `YYYY-MM-DD` untuk dibaca petugas, mis. "15 Januari 1990". */
export function formatTanggal(tanggal: string): string {
  return new Date(`${tanggal}T00:00:00Z`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    // Tanggal adalah hari kalender, bukan instan; tanpa UTC, zona barat menggesernya sehari.
    timeZone: "UTC",
  });
}

export function formatAngka(nilai: number, satuan: SatuanAngka): string {
  if (satuan === "rupiah") return formatRupiah(nilai);
  if (satuan === "persen") return `${formatJumlah(nilai)}%`;
  return formatJumlah(nilai);
}
