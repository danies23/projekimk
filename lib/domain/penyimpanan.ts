/** Antarmuka penyimpanan minimal; `localStorage` memenuhinya secara struktural. */
export interface Penyimpanan {
  getItem(kunci: string): string | null;
  setItem(kunci: string, nilai: string): void;
  removeItem(kunci: string): void;
}

export const KUNCI_SNAPSHOT = "dmc.admisi.snapshot.v1";

export function createMemoriPenyimpanan(): Penyimpanan {
  const data = new Map<string, string>();
  return {
    getItem: (kunci) => data.get(kunci) ?? null,
    setItem: (kunci, nilai) => void data.set(kunci, nilai),
    removeItem: (kunci) => void data.delete(kunci),
  };
}

/** Membungkus penyimpanan yang operasinya bisa melempar (mode privat, kuota penuh). */
export function createAmanPenyimpanan(penyimpanan: Penyimpanan): Penyimpanan {
  return {
    getItem: (kunci) => {
      try {
        return penyimpanan.getItem(kunci);
      } catch {
        return null;
      }
    },
    setItem: (kunci, nilai) => {
      try {
        penyimpanan.setItem(kunci, nilai);
      } catch {
        // Kuota penuh atau mode privat: data tetap hidup di memori pemanggil.
      }
    },
    removeItem: (kunci) => {
      try {
        penyimpanan.removeItem(kunci);
      } catch {
        // Mengosongkan tidak wajib berhasil untuk aplikasi tetap berjalan.
      }
    },
  };
}

/**
 * Memilih penyimpanan peramban bila benar-benar bisa dipakai, selain itu
 * memori. Aplikasi tidak boleh gagal render hanya karena `localStorage` diblokir.
 */
export function buatPenyimpananAman(akses: () => Penyimpanan | null): Penyimpanan {
  try {
    const tersedia = akses();
    if (tersedia) {
      const uji = "__dmc_uji__";
      tersedia.setItem(uji, "1");
      tersedia.removeItem(uji);
      return createAmanPenyimpanan(tersedia);
    }
  } catch {
    // Lanjut ke memori.
  }
  return createMemoriPenyimpanan();
}
