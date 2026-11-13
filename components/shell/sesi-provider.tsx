"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { penggunaSesi } from "@/lib/masuk";
import { buatPenyimpananAman, type Penyimpanan } from "@/lib/domain/penyimpanan";
import { hapusSesi, muatSesi, simpanSesi, type Sesi } from "@/lib/sesi";
import type { Pengguna } from "@/lib/domain/types";
import { useSelector } from "./store-provider";

type StatusSesi = "memuat" | "masuk" | "keluar";

interface NilaiSesi {
  status: StatusSesi;
  pengguna: Pengguna | null;
  masukSebagai(penggunaId: string): void;
}

const KonteksSesi = createContext<NilaiSesi | null>(null);

/**
 * Sesi demo diperlakukan sebagai penyimpanan eksternal, bukan state React.
 * `undefined` berarti "belum dibaca di klien" (dipakai saat render server),
 * `null` berarti "sudah dibaca dan kosong" — perbedaan ini mencegah shell
 * mengalihkan ke login sebelum sesi sempat dibaca.
 */
let penyimpananSesi: Penyimpanan | null = null;
let cache: Sesi | null | undefined = undefined;
const pendengar = new Set<() => void>();

function sesiPenyimpanan(): Penyimpanan {
  penyimpananSesi ??= buatPenyimpananAman(() => globalThis.localStorage ?? null);
  return penyimpananSesi;
}

/** Snapshot harus stabil secara identitas; `muatSesi` membuat objek baru tiap panggilan. */
function bacaSesi(): Sesi | null {
  if (cache === undefined) cache = muatSesi(sesiPenyimpanan());
  return cache;
}

function tulisSesi(sesi: Sesi | null): void {
  cache = sesi;
  if (sesi) simpanSesi(sesiPenyimpanan(), sesi);
  else hapusSesi(sesiPenyimpanan());
  for (const dengar of pendengar) dengar();
}

function langganSesi(dengar: () => void): () => void {
  pendengar.add(dengar);
  return () => void pendengar.delete(dengar);
}

export function SesiProvider({ children }: { children: React.ReactNode }) {
  const daftarPengguna = useSelector((s) => s.pengguna);

  const sesi = useSyncExternalStore(langganSesi, bacaSesi, () => undefined);

  const pengguna = useMemo(() => {
    if (sesi === undefined) return null;
    return penggunaSesi(daftarPengguna, sesi);
  }, [daftarPengguna, sesi]);

  const status: StatusSesi = sesi === undefined ? "memuat" : pengguna ? "masuk" : "keluar";

  const masukSebagai = useCallback((penggunaId: string) => tulisSesi({ penggunaId }), []);

  const nilai = useMemo<NilaiSesi>(() => ({ status, pengguna, masukSebagai }), [status, pengguna, masukSebagai]);

  // Sesi yang menunjuk pengguna nonaktif atau terhapus dibersihkan sekalian.
  useEffect(() => {
    if (sesi && !pengguna) tulisSesi(null);
  }, [sesi, pengguna]);

  return <KonteksSesi.Provider value={nilai}>{children}</KonteksSesi.Provider>;
}

export function useSesi(): NilaiSesi {
  const nilai = useContext(KonteksSesi);
  if (!nilai) throw new Error("useSesi harus dipakai di dalam SesiProvider");
  return nilai;
}
