import { buatDataDemo } from "./data-demo";
import { buatPenyimpananAman, type Penyimpanan } from "./penyimpanan";
import { muatSnapshot, simpanSnapshot } from "./persistensi";
import { createStore } from "./store";
import type { Store } from "./actions";
import type { State } from "./types";

export interface OpsiStoreDemo {
  penyimpanan?: Penyimpanan;
  hariIni?: string;
}

function hariIniSekarang(): string {
  const d = new Date();
  const bulan = String(d.getMonth() + 1).padStart(2, "0");
  const tanggal = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${bulan}-${tanggal}`;
}

/**
 * Titik masuk state untuk aplikasi: memuat snapshot bila ada, selain itu
 * menanam data demo, lalu menyimpan setiap perubahan penting.
 */
export function buatStoreDemo(opsi: OpsiStoreDemo = {}): Store {
  const hari = opsi.hariIni ?? hariIniSekarang();
  const penyimpanan = opsi.penyimpanan ?? buatPenyimpananAman(() => globalThis.localStorage ?? null);

  const awal = buatDataDemo(hari);
  const tersimpan = muatSnapshot(penyimpanan);
  const store = createStore(tersimpan ?? awal, {
    hariIni: () => hari,
    sekarang: () => new Date().toISOString(),
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
