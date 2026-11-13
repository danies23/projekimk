"use client";

import { StoreProvider } from "@/components/shell/store-provider";
import { SesiProvider } from "@/components/shell/sesi-provider";

/**
 * Provider aplikasi dipasang di root supaya halaman login pun bisa membaca
 * data demo (untuk mencocokkan akun) tanpa ikut memakai shell. Urutannya
 * penting: store dulu, baru sesi yang mencari penggunanya di store.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <SesiProvider>{children}</SesiProvider>
    </StoreProvider>
  );
}
