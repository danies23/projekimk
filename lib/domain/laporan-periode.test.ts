import { describe, expect, it } from "vitest";
import { laporanKeuangan, laporanObat, laporanOkupansi, laporanPasien, laporanUntuk, validasiPeriode } from "./laporan";
import { buatStateKosong } from "./state";
import type { State } from "./types";

/**
 * Periode uji: 1–30 November 2026. Setiap laporan diuji dengan data yang
 * sebagian sengaja berada di luar periode agar penyaring rentang tanggal
 * benar-benar bekerja.
 */

function jamLokal(tanggal: string, jam = 12): string {
  return new Date(`${tanggal}T${String(jam).padStart(2, "0")}:00:00`).toISOString();
}

function stateContoh(): State {
  const pasien = (id: string, nama: string) => ({
    id,
    nomorRM: `RM-2026-${id}`,
    nama,
    nik: `3271010101${id}`,
    tanggalLahir: "1980-01-01",
    jenisKelamin: "L" as const,
    alamat: "Jl. Merdeka 1, Bandung",
    telepon: "08120000000",
    penanggungJawab: { nama: "Keluarga", hubungan: "Pasangan", telepon: "08130000000" },
  });

  return {
    ...buatStateKosong(),
    pasien: [pasien("1", "Ahmad Fauzi"), pasien("2", "Siti Rahmawati"), pasien("3", "Bambang Sutrisno")],
    kamar: [
      { id: "k-vip", nama: "Anggrek VIP-1", kelas: "VIP", tarifHarian: 900_000, aktif: true },
      { id: "k-1", nama: "Melati I-1", kelas: "I", tarifHarian: 600_000, aktif: true },
    ],
    bed: [
      { id: "b-vip-1", kamarId: "k-vip", kode: "V1", status: "terisi" },
      { id: "b-vip-2", kamarId: "k-vip", kode: "V2", status: "kosong" },
      { id: "b-1-1", kamarId: "k-1", kode: "A", status: "terisi" },
      { id: "b-1-2", kamarId: "k-1", kode: "B", status: "kosong" },
    ],
    pengguna: [
      { id: "u-dokter", nama: "dr. Ayu", peran: "dokter", aktif: true },
      { id: "u-kasir", nama: "Joko", peran: "kasir", aktif: true },
    ],
    admisi: [
      // Masuk dan masih dirawat di dalam periode.
      {
        id: "admisi-1",
        pasienId: "1",
        dokterId: "u-dokter",
        bedId: "b-vip-1",
        tanggalMasuk: "2026-11-10",
        tanggalPulang: null,
        diagnosaAwal: "Observasi",
        status: "aktif",
        segmenBed: [{ bedId: "b-vip-1", kamarId: "k-vip", dari: jamLokal("2026-11-10"), sampai: null, tarifHarian: 900_000 }],
        overrideCheckout: null,
      },
      // Masuk sebelum periode, keluar di dalam periode.
      {
        id: "admisi-2",
        pasienId: "2",
        dokterId: "u-dokter",
        bedId: "b-1-1",
        tanggalMasuk: "2026-10-28",
        tanggalPulang: "2026-11-03",
        diagnosaAwal: "Selesai",
        status: "selesai",
        segmenBed: [
          { bedId: "b-1-1", kamarId: "k-1", dari: jamLokal("2026-10-28"), sampai: jamLokal("2026-11-03"), tarifHarian: 600_000 },
        ],
        overrideCheckout: null,
      },
      // Seluruhnya di luar periode.
      {
        id: "admisi-3",
        pasienId: "3",
        dokterId: "u-dokter",
        bedId: "b-1-2",
        tanggalMasuk: "2026-09-01",
        tanggalPulang: "2026-09-10",
        diagnosaAwal: "Selesai",
        status: "selesai",
        segmenBed: [
          { bedId: "b-1-2", kamarId: "k-1", dari: jamLokal("2026-09-01"), sampai: jamLokal("2026-09-10"), tarifHarian: 600_000 },
        ],
        overrideCheckout: null,
      },
    ],
    tagihan: [
      { id: "t-1", admisiId: "admisi-1" },
      { id: "t-2", admisiId: "admisi-2" },
      { id: "t-3", admisiId: "admisi-3" },
    ],
    pembayaran: [
      { id: "p-1", tagihanId: "t-1", jumlah: 2_000_000, metode: "tunai", waktu: jamLokal("2026-11-12"), kasirId: "u-kasir" },
      { id: "p-2", tagihanId: "t-1", jumlah: 1_000_000, metode: "transfer", waktu: jamLokal("2026-11-20"), kasirId: "u-kasir" },
      { id: "p-3", tagihanId: "t-2", jumlah: 500_000, metode: "debit", waktu: jamLokal("2026-10-15"), kasirId: "u-kasir" },
    ],
    obat: [
      { id: "o-1", nama: "Paracetamol 500 mg", satuan: "tablet", harga: 2_000, stok: 200, stokMinimum: 100 },
      { id: "o-2", nama: "Amoxicillin 500 mg", satuan: "kapsul", harga: 5_000, stok: 40, stokMinimum: 80 },
    ],
    resep: [
      { id: "r-1", admisiId: "admisi-1", dokterId: "u-dokter", waktu: jamLokal("2026-11-11"), status: "diserahkan", items: [
        { obatId: "o-1", nama: "Paracetamol 500 mg", jumlah: 30, aturanPakai: "3×1", harga: 2_000 },
        { obatId: "o-2", nama: "Amoxicillin 500 mg", jumlah: 10, aturanPakai: "2×1", harga: 5_000 },
      ] },
      // Resep belum diserahkan: tidak ada pemakaian.
      { id: "r-2", admisiId: "admisi-1", dokterId: "u-dokter", waktu: jamLokal("2026-11-14"), status: "menunggu", items: [
        { obatId: "o-1", nama: "Paracetamol 500 mg", jumlah: 99, aturanPakai: "3×1", harga: 2_000 },
      ] },
    ],
    mutasiStok: [
      { id: "m-1", obatId: "o-1", jenis: "masuk", jumlah: 100, waktu: jamLokal("2026-11-01"), keterangan: "Penerimaan", olehId: "u-apoteker" },
      { id: "m-2", obatId: "o-1", jenis: "masuk", jumlah: 50, waktu: jamLokal("2026-10-01"), keterangan: "Penerimaan", olehId: "u-apoteker" },
      { id: "m-3", obatId: "o-1", jenis: "keluar", jumlah: 30, waktu: jamLokal("2026-11-11"), keterangan: "Penyerahan", olehId: "u-apoteker" },
      { id: "m-4", obatId: "o-2", jenis: "keluar", jumlah: 10, waktu: jamLokal("2026-11-11"), keterangan: "Penyerahan", olehId: "u-apoteker" },
    ],
  };
}

const PERIODE = { dari: "2026-11-01", sampai: "2026-11-30" };

describe("laporan pasien", () => {
  it("memisahkan pasien masuk, keluar, dan sedang dirawat dalam periode", () => {
    const hasil = laporanPasien(stateContoh(), PERIODE);

    expect(hasil.masuk.map((b) => b.pasien.nama)).toEqual(["Ahmad Fauzi"]);
    expect(hasil.keluar.map((b) => b.pasien.nama)).toEqual(["Siti Rahmawati"]);
    expect(hasil.dirawat.map((b) => b.pasien.nama)).toEqual(["Ahmad Fauzi"]);
    // Pasien yang seluruh admisinya di luar periode tidak muncul di mana pun.
    expect(JSON.stringify(hasil)).not.toContain("Bambang Sutrisno");
  });

  it("menyertakan tanggal transaksi terakhir yang masuk perhitungan", () => {
    // Transaksi terakhir pada laporan pasien adalah tanggal masuk/kembali terbaru.
    expect(laporanPasien(stateContoh(), PERIODE).transaksiTerakhir).toBe("2026-11-10");
  });

  it("periode yang hanya berisi pasien sedang dirawat tetap melaporkan transaksi terakhir", () => {
    // 16–30 Nov: admisi 1 (masuk 10 Nov) masih dirawat, tidak ada yang masuk/keluar.
    const hasil = laporanPasien(stateContoh(), { dari: "2026-11-16", sampai: "2026-11-30" });
    expect(hasil.dirawat).toHaveLength(1);
    expect(hasil.masuk).toHaveLength(0);
    expect(hasil.keluar).toHaveLength(0);
    expect(hasil.transaksiTerakhir).not.toBeNull();
  });

  it("periode tanpa data menghasilkan daftar kosong, bukan lemparan", () => {
    const hasil = laporanPasien(stateContoh(), { dari: "2025-01-01", sampai: "2025-01-31" });

    expect(hasil.masuk).toEqual([]);
    expect(hasil.keluar).toEqual([]);
    expect(hasil.dirawat).toEqual([]);
    expect(hasil.transaksiTerakhir).toBeNull();
  });
});

describe("laporan keuangan", () => {
  it("menjumlahkan tagihan, terbayar, dan sisa piutang untuk admisi yang tersentuh periode", () => {
    const hasil = laporanKeuangan(stateContoh(), PERIODE, "2026-11-30");

    // Admisi 1: 10 Nov aktif s.d. 30 Nov = 21 hari × 900.000 = 18.900.000, obat 30×2.000 + 10×5.000 = 110.000.
    // Admisi 2: 28 Okt–3 Nov = 7 hari × 600.000 = 4.200.000.
    expect(hasil.totalTagihan).toBe(18_900_000 + 110_000 + 4_200_000);
    // P-1 dan P-2 jatuh di November; P-3 Oktober tidak ikut.
    expect(hasil.totalTerbayar).toBe(3_000_000);
    // Piutang = sisa seluruh tagihan tersentuh periode (semua pembayarannya),
    // bukan tagihan periode dikurangi pembayaran periode.
    // t-1: 19.010.000 − 3.000.000 = 16.010.000; t-2: 4.200.000 − 500.000 = 3.700.000.
    expect(hasil.sisaPiutang).toBe(16_010_000 + 3_700_000);
  });

  it("sisa piutang tidak menghitung tagihan yang sudah lunas sebelum periode", () => {
    const state = stateContoh();
    // Tagihan admisi 2 dilunasi Oktober; periode November tidak boleh
    // melaporkannya sebagai piutang hanya karena pembayarannya di luar periode.
    state.pembayaran = [
      ...state.pembayaran,
      { id: "p-lunas", tagihanId: "t-2", jumlah: 3_700_000, metode: "tunai", waktu: jamLokal("2026-10-30"), kasirId: "u-kasir" },
    ];
    const hasil = laporanKeuangan(state, PERIODE, "2026-11-30");
    // Hanya admisi 1 yang masih menyisakan piutang.
    expect(hasil.sisaPiutang).toBe(19_010_000 - 3_000_000);
    expect(hasil.totalTerbayar).toBe(3_000_000);
  });

  it("menyertakan tanggal pembayaran terakhir dalam periode", () => {
    expect(laporanKeuangan(stateContoh(), PERIODE, "2026-11-30").transaksiTerakhir).toBe("2026-11-20");
  });

  it("periode tanpa pembayaran tidak melaporkan transaksi palsu", () => {
    const hasil = laporanKeuangan(stateContoh(), { dari: "2025-01-01", sampai: "2025-01-31" }, "2026-11-16");

    expect(hasil.totalTagihan).toBe(0);
    expect(hasil.totalTerbayar).toBe(0);
    expect(hasil.transaksiTerakhir).toBeNull();
  });
});

describe("laporan okupansi", () => {
  it("menghitung pemanfaatan per kelas selama periode", () => {
    const { baris } = laporanOkupansi(stateContoh(), PERIODE, "2026-11-30");

    // VIP: bed V1 terisi 10–30 Nov = 21 bed-hari dari 2 bed × 30 hari = 60 → 35%.
    // Kelas I: bed A terisi 1–3 Nov = 3 bed-hari dari 60 → 5%.
    expect(baris).toEqual([
      { kelas: "VIP", bedHari: 21, kapasitasBedHari: 60, bor: 35 },
      { kelas: "I", bedHari: 3, kapasitasBedHari: 60, bor: 5 },
    ]);
  });

  it("menyertakan tanggal transaksi terakhir yang dihitung", () => {
    expect(laporanOkupansi(stateContoh(), PERIODE, "2026-11-30").transaksiTerakhir).toBe("2026-11-30");
  });

  it("hari perpindahan bed tidak dihitung dua kali", () => {
    const state = stateContoh();
    // Admisi 2 pindah dari kelas I (A) ke VIP (V2) pada 2 November.
    state.bed = state.bed.map((b) => (b.id === "b-vip-2" ? { ...b, status: "terisi" as const } : b));
    state.admisi = state.admisi.map((a) =>
      a.id === "admisi-2"
        ? {
            ...a,
            bedId: "b-vip-2",
            segmenBed: [
              { bedId: "b-1-1", kamarId: "k-1", dari: jamLokal("2026-10-28"), sampai: jamLokal("2026-11-02"), tarifHarian: 600_000 },
              { bedId: "b-vip-2", kamarId: "k-vip", dari: jamLokal("2026-11-02"), sampai: null, tarifHarian: 900_000 },
            ],
          }
        : a,
    );
    const { baris } = laporanOkupansi(state, PERIODE, "2026-11-30");
    // Kelas I: segmen berakhir 1 Nov, jadi hanya 1 hari di dalam periode
    // (28–31 Okt jatuh di luar periode); 2 Nov milik segmen baru.
    expect(baris.find((b) => b.kelas === "I")!.bedHari).toBe(1);
    // VIP: segmen V2 berakhir pada tanggal pulang 3 Nov, jadi 2–3 Nov = 2 hari,
    // ditambah V1 10–30 Nov 21 hari.
    expect(baris.find((b) => b.kelas === "VIP")!.bedHari).toBe(21 + 2);
    // Total bed-hari tidak boleh melebihi kapasitas.
    for (const b of baris) expect(b.bedHari).toBeLessThanOrEqual(b.kapasitasBedHari);
  });

  it("kapasitas bed-hari tidak menghitung hari yang belum terjadi", () => {
    // Periode 1–30 Nov dibaca pada 15 Nov: kapasitas hanya sampai hari ini.
    const { baris } = laporanOkupansi(stateContoh(), PERIODE, "2026-11-15");
    expect(baris.find((b) => b.kelas === "VIP")!.kapasitasBedHari).toBe(2 * 15);
  });

  it("admisi yang masih aktif tidak menghuni hari yang belum terjadi", () => {
    const { baris } = laporanOkupansi(stateContoh(), PERIODE, "2026-11-15");
    // Sampai 15 Nov V1 baru 6 bed-hari.
    expect(baris.find((b) => b.kelas === "VIP")!.bedHari).toBe(6);
  });

  it("periode di masa depan tanpa hunian menghasilkan BOR nol", () => {
    const { baris } = laporanOkupansi(stateContoh(), { dari: "2030-01-01", sampai: "2030-01-31" }, "2026-11-16");
    expect(baris.every((b) => b.bedHari === 0 && b.bor === 0)).toBe(true);
  });
});

describe("laporan pemakaian obat", () => {
  it("menghitung pemakaian dari resep yang diserahkan dan posisi stok akhir", () => {
    const hasil = laporanObat(stateContoh(), PERIODE).baris;
    const paracetamol = hasil.find((b) => b.obat.nama === "Paracetamol 500 mg")!;
    const amoxicillin = hasil.find((b) => b.obat.nama === "Amoxicillin 500 mg")!;

    // Hanya resep diserahkan dihitung; resep menunggu 99 tablet tidak ikut.
    expect(paracetamol.pemakaian).toBe(30);
    expect(amoxicillin.pemakaian).toBe(10);
    // Stok akhir adalah stok master saat ini, bukan stok awal periode.
    expect(paracetamol.stokAkhir).toBe(200);
    expect(amoxicillin.stokAkhir).toBe(40);
    expect(amoxicillin.stokAkhir).toBeLessThan(amoxicillin.obat.stokMinimum);
  });

  it("memakai tanggal penyerahan obat, bukan tanggal resep dibuat", () => {
    const state = stateContoh();
    // Resep dibuat 31 Oktober, obat baru diserahkan 2 November.
    state.resep = state.resep.map((r) => (r.id === "r-1" ? { ...r, waktu: jamLokal("2026-10-31") } : r));
    state.mutasiStok = state.mutasiStok.map((m) =>
      m.id === "m-3" ? { ...m, waktu: jamLokal("2026-11-02") } : m,
    );
    state.mutasiStok = state.mutasiStok.map((m) =>
      m.id === "m-4" ? { ...m, waktu: jamLokal("2026-11-02") } : m,
    );
    const { baris, transaksiTerakhir } = laporanObat(state, PERIODE);
    expect(baris.find((b) => b.obat.nama === "Paracetamol 500 mg")!.pemakaian).toBe(30);
    expect(transaksiTerakhir).toBe("2026-11-02");
  });

  it("periode tanpa penyerahan obat melaporkan pemakaian nol", () => {
    const { baris } = laporanObat(stateContoh(), { dari: "2026-09-01", sampai: "2026-09-30" });
    expect(baris.every((b) => b.pemakaian === 0)).toBe(true);
  });

  it("menandai obat yang stok akhirnya di bawah minimum tanpa hitung ulang di layar", () => {
    const baris = laporanObat(stateContoh(), PERIODE).baris;
    expect(baris.find((b) => b.obat.nama === "Amoxicillin 500 mg")!.menipis).toBe(true);
    expect(baris.find((b) => b.obat.nama === "Paracetamol 500 mg")!.menipis).toBe(false);
  });

  it("menyertakan tanggal mutasi obat terakhir dalam periode", () => {
    expect(laporanObat(stateContoh(), PERIODE).transaksiTerakhir).toBe("2026-11-11");
  });
});

describe("rentang tanggal", () => {
  it("menolak rentang terbalik dengan pesan yang bisa ditampilkan", () => {
    const galat = validasiPeriode({ dari: "2026-11-30", sampai: "2026-11-01" });
    expect(galat).toContain("Rentang tidak valid");
  });

  it("menerima rentang yang wajar dan menolak tanggal kosong", () => {
    expect(validasiPeriode(PERIODE)).toBeNull();
    expect(validasiPeriode({ dari: "", sampai: "2026-11-30" })).toContain("Isi tanggal");
  });

  it("rentang terbalik tidak menghasilkan angka palsu bila tetap dihitung", () => {
    expect(laporanPasien(stateContoh(), { dari: "2026-11-30", sampai: "2026-11-01" }).masuk).toEqual([]);
  });
});

describe("laporan yang boleh dibuka", () => {
  it("kasir membuka laporan keuangan, apoteker laporan obat, pimpinan semuanya", () => {
    expect(laporanUntuk("kasir").map((l) => l.jenis)).toEqual(["keuangan"]);
    expect(laporanUntuk("apoteker").map((l) => l.jenis)).toEqual(["obat"]);
    expect(laporanUntuk("pimpinan").map((l) => l.jenis)).toEqual(["pasien", "keuangan", "okupansi", "obat"]);
  });

  it("peran lain tidak membuka laporan per periode", () => {
    expect(laporanUntuk("dokter")).toEqual([]);
    expect(laporanUntuk("perawat")).toEqual([]);
    expect(laporanUntuk(null)).toEqual([]);
  });
});
