import { describe, expect, it } from "vitest";
import { buatStoreDemo } from "./store-demo";
import { createMemoriPenyimpanan } from "./penyimpanan";
import { muatSnapshot } from "./persistensi";
import { IDENTITAS_PASIEN, PENGGUNA_UJI } from "./test-utils";
import { nilaiTagihan } from "./tagihan";

describe("store demo aplikasi", () => {
  it("menanam data demo pada muatan pertama", () => {
    const penyimpanan = createMemoriPenyimpanan();
    const store = buatStoreDemo({ penyimpanan, hariIni: "2026-03-15" });

    expect(store.getState().pasien.length).toBeGreaterThanOrEqual(36);
    expect(muatSnapshot(penyimpanan)).not.toBeNull();
  });

  it("memuat kembali snapshot yang sudah ada alih-alih menanam ulang", () => {
    const penyimpanan = createMemoriPenyimpanan();
    const pertama = buatStoreDemo({ penyimpanan, hariIni: "2026-03-15" });
    const sebelum = pertama.getState().pasien.length;

    const kedua = buatStoreDemo({ penyimpanan, hariIni: "2026-03-15" });

    expect(kedua.getState().pasien.length).toBe(sebelum);
  });

  it("menyimpan perubahan sehingga bertahan setelah dimuat ulang", () => {
    const penyimpanan = createMemoriPenyimpanan();
    const store = buatStoreDemo({ penyimpanan, hariIni: "2026-03-15" });
    const jumlahAwal = store.getState().pasien.length;

    const hasil = store.dispatch({
      type: "pasien/dibuat",
      olehId: PENGGUNA_UJI.pendaftaran,
      input: { ...IDENTITAS_PASIEN, nik: "3271010101010001", nama: "Pasien Demo Baru" },
    });
    expect(hasil.ok).toBe(true);

    const dimuatUlang = buatStoreDemo({ penyimpanan, hariIni: "2026-03-15" });
    expect(dimuatUlang.getState().pasien.length).toBe(jumlahAwal + 1);
    expect(dimuatUlang.getState().pasien.some((p) => p.nama === "Pasien Demo Baru")).toBe(true);
  });

  it("reset mengembalikan ke kondisi awal dan menyimpannya", () => {
    const penyimpanan = createMemoriPenyimpanan();
    const store = buatStoreDemo({ penyimpanan, hariIni: "2026-03-15" });
    const jumlahAwal = store.getState().pasien.length;
    store.dispatch({
      type: "pasien/dibuat",
      olehId: PENGGUNA_UJI.pendaftaran,
      input: { ...IDENTITAS_PASIEN, nik: "3271010101010002", nama: "Sementara" },
    });

    store.reset();

    expect(store.getState().pasien.length).toBe(jumlahAwal);
    expect(muatSnapshot(penyimpanan)!.pasien.length).toBe(jumlahAwal);
    const dimuatUlang = buatStoreDemo({ penyimpanan, hariIni: "2026-03-15" });
    expect(dimuatUlang.getState().pasien.length).toBe(jumlahAwal);
  });

  it("tetap berjalan ketika penyimpanan tidak tersedia", () => {
    const penyimpanan = {
      getItem: () => {
        throw new Error("diblokir");
      },
      setItem: () => {
        throw new Error("diblokir");
      },
      removeItem: () => {
        throw new Error("diblokir");
      },
    };

    const store = buatStoreDemo({ penyimpanan, hariIni: "2026-03-15" });

    expect(store.getState().pasien.length).toBeGreaterThan(0);
    const hasil = store.dispatch({
      type: "pasien/dibuat",
      olehId: PENGGUNA_UJI.pendaftaran,
      input: { ...IDENTITAS_PASIEN, nik: "3271010101010003" },
    });
    expect(hasil.ok).toBe(true);
  });

  it("data demo tidak memuat tagihan yang dibayar melebihi totalnya", () => {
    const store = buatStoreDemo({ penyimpanan: createMemoriPenyimpanan(), hariIni: "2026-03-15" });
    const state = store.getState();
    for (const tagihan of state.tagihan) {
      const nilai = nilaiTagihan(state, tagihan.id, "2026-03-15");
      expect(nilai.dibayar, `tagihan ${tagihan.id} dibayar ${nilai.dibayar} dari ${nilai.total}`).toBeLessThanOrEqual(
        nilai.total,
      );
    }
  });
});

describe("konsistensi jam", () => {
  it("memakai tanggal lokal dari jam yang sama untuk tanggal pulang", () => {
    const penyimpanan = createMemoriPenyimpanan();
    // 23:30 UTC 15 Maret = 16 Maret pukul 06:30 di zona UTC+7. Tanggal kalender
    // lokal dan stempel waktu harus merujuk hari yang sama.
    const store = buatStoreDemo({ penyimpanan, sekarang: () => "2026-03-15T23:30:00.000Z" });

    const state = store.getState();
    const admisi = state.admisi.find((a) => a.status === "aktif")!;
    const tagihan = state.tagihan.find((t) => t.admisiId === admisi.id)!;
    const lunas = nilaiTagihan(state, tagihan.id, tanggalLokalBaru()).total;
    store.dispatch({ type: "pembayaran/dicatat", olehId: PENGGUNA_UJI.kasir, tagihanId: tagihan.id, jumlah: lunas, metode: "tunai" });
    const keluar = store.dispatch({ type: "checkout", olehId: PENGGUNA_UJI.kasir, admisiId: admisi.id, override: null });
    expect(keluar.ok).toBe(true);

    const sesudah = store.getState().admisi.find((a) => a.id === admisi.id)!;
    expect(sesudah.tanggalPulang).toBe(tanggalLokalBaru());
  });

  it("menghormati hariIni yang dipatok meskipun jam berjalan", () => {
    const penyimpanan = createMemoriPenyimpanan();
    const store = buatStoreDemo({ penyimpanan, hariIni: "2026-03-15", sekarang: () => "2030-01-01T00:00:00.000Z" });

    const hasil = store.dispatch({
      type: "pasien/dibuat",
      olehId: PENGGUNA_UJI.pendaftaran,
      input: { ...IDENTITAS_PASIEN, nik: "3271010101010009" },
    });

    expect(hasil.ok).toBe(true);
    expect(store.getState().pasien.at(-1)!.nomorRM.startsWith("RM-2026-")).toBe(true);
  });
});

/** Tanggal lokal dari instan yang dipakai test, dihitung dengan cara yang sama seperti store. */
function tanggalLokalBaru(): string {
  const d = new Date("2026-03-15T23:30:00.000Z");
  const bulan = String(d.getMonth() + 1).padStart(2, "0");
  const tanggal = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${bulan}-${tanggal}`;
}
