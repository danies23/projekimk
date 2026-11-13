import { buatDataDemo } from "./data-demo";
import { tanggalLokal } from "./lama-inap";
import { buatPenyimpananAman, type Penyimpanan } from "./penyimpanan";
import { muatSnapshot, simpanSnapshot } from "./persistensi";
import { createStore } from "./store";
import type { Store } from "./actions";
import type { State, Waktu } from "./types";

export { tanggalLokal };

export interface OpsiStoreDemo {
  penyimpanan?: Penyimpanan;
  hariIni?: string;
  /** Jam yang dipakai untuk stempel waktu; disuntikkan pada test deterministik. */
  sekarang?: () => Waktu;
}

/** Tanggal kalender lokal; dipakai semua pembacaan "hari ini" di aplikasi. */

/**
 * Titik masuk state untuk aplikasi: memuat snapshot bila ada, selain itu
 * memakai data demo, lalu menyimpan setiap perubahan penting.
 *
 * `hariIni` dan `sekarang` sama-sama dibaca dari jam yang sama pada setiap
 * pemanggilan. Kalau `hariIni` dibekukan saat pembuatan store sementara
 * `sekarang` terus berjalan, melewati tengah malam akan membuat tanggal
 * pulang dan tanggal transaksi berbeda satu hari dari dasar perhitungan biaya.
 */
export function buatStoreDemo(opsi: OpsiStoreDemo = {}): Store {
  const jam = opsi.sekarang ?? (() => new Date().toISOString());
  const hariAwal = opsi.hariIni ?? tanggalLokal(new Date(jam()));
  const penyimpanan = opsi.penyimpanan ?? buatPenyimpananAman(() => globalThis.localStorage ?? null);

  const awal = buatDataDemo(hariAwal);
  const tersimpan = muatSnapshot(penyimpanan);
  const store = createStore(tersimpan ?? awal, {
    // Saat `hariIni` dipatok eksplisit (test), jangan biarkan jam menggeser
    // tanggal di tengah skenario.
    hariIni: () => opsi.hariIni ?? tanggalLokal(new Date(jam())),
    sekarang: jam,
    id: (prefix) =>
      `${prefix}-${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10)}`,
  });

  // Simpan setelah setiap mutasi berhasil, bukan dari dalam komponen.
  store.subscribe(() => simpanSnapshot(penyimpanan, store.getState()));

  const reset = store.reset;
  store.reset = (state?: State) => {
    reset(state ?? awal);
    simpanSnapshot(penyimpanan, store.getState());
  };

  if (!tersimpan) simpanSnapshot(penyimpanan, store.getState());
  return store;
}
