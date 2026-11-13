"use client";

import { createContext, useContext, useState, useSyncExternalStore } from "react";
import { tanggalLokal, buatStoreDemo } from "@/lib/domain/store-demo";
import type { Store } from "@/lib/domain/actions";
import type { State } from "@/lib/domain/types";

const KonteksStore = createContext<Store | null>(null);

/**
 * Store dibuat klien-saja di dalam provider, bukan di modul atau server:
 * snapshot dibaca dari `localStorage` dan tanggal demo relatif terhadap hari
 * ini, keduanya tidak ada saat render server.
 */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(() => buatStoreDemo());
  return <KonteksStore.Provider value={store}>{children}</KonteksStore.Provider>;
}

/**
 * "Hari ini" dibaca saat dipakai, bukan dibekukan saat provider dipasang.
 * Membekukannya membuat dashboard dan tanggal yang ditulis store berbeda
 * setelah tengah malam — persis yang diperingatkan `buatStoreDemo`.
 */
export function useHariIni(): string {
  return tanggalLokal(new Date());
}

export function useStoreDemo(): Store {
  const store = useContext(KonteksStore);
  if (!store) throw new Error("useStoreDemo harus dipakai di dalam StoreProvider");
  return store;
}

export function useSelector<T>(pilih: (state: State) => T): T {
  const store = useStoreDemo();
  return useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => pilih(store.getState()),
    () => pilih(store.getState()),
  );
}
