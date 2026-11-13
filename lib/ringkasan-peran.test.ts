import { describe, expect, it } from "vitest";
import { ringkasanPeran } from "./ringkasan-peran";
import { tanggalLokal } from "./domain/store-demo";
import { buatStateKosong } from "./domain/state";
import type { Pengguna, State } from "./domain/types";

const HARI_INI = "2026-03-15";

function pengguna(peran: Pengguna["peran"], id = `u-${peran}`): Pengguna {
  return { id, nama: `Staf ${peran}`, peran, aktif: true };
}

/**
 * State buatan tangan dengan angka yang sudah dihitung manual, sehingga test
 * tidak mengulang rumus yang dipakai implementasi.
 */
function stateContoh(): State {
  const dasar = buatStateKosong();
  const segmen = (bedId: string, kamarId: string) => ({ bedId, kamarId, dari: "2026-03-01T08:00:00.000Z", sampai: null });
  return {
    ...dasar,
    kamar: [{ id: "kamar-1", nama: "Melati I-1", kelas: "I", tarifHarian: 500_000, aktif: true }],
    pengguna: [
      pengguna("pendaftaran"),
      pengguna("dokter"),
      { ...pengguna("dokter", "u-dokter-lain"), aktif: true },
      pengguna("perawat"),
      pengguna("apoteker"),
      pengguna("kasir"),
      pengguna("pimpinan"),
      pengguna("admin"),
    ],
    bed: [
      { id: "bed-1", kamarId: "kamar-1", kode: "A", status: "terisi" },
      { id: "bed-2", kamarId: "kamar-1", kode: "B", status: "kosong" },
      { id: "bed-3", kamarId: "kamar-1", kode: "C", status: "dibersihkan" },
      { id: "bed-4", kamarId: "kamar-1", kode: "D", status: "terisi" },
    ],
    admisi: [
      {
        id: "admisi-1",
        pasienId: "pasien-1",
        dokterId: "u-dokter",
        bedId: "bed-1",
        tanggalMasuk: "2026-03-10",
        tanggalPulang: null,
        diagnosaAwal: "Observasi",
        status: "aktif",
        segmenBed: [segmen("bed-1", "kamar-1")],
        overrideCheckout: null,
      },
      {
        id: "admisi-2",
        pasienId: "pasien-2",
        dokterId: "u-dokter-lain",
        bedId: "bed-4",
        tanggalMasuk: "2026-03-12",
        tanggalPulang: null,
        diagnosaAwal: "Observasi",
        status: "aktif",
        segmenBed: [segmen("bed-4", "kamar-1")],
        overrideCheckout: null,
      },
      {
        id: "admisi-3",
        pasienId: "pasien-3",
        dokterId: "u-dokter",
        bedId: "bed-2",
        tanggalMasuk: "2026-02-01",
        tanggalPulang: "2026-02-05",
        diagnosaAwal: "Selesai",
        status: "selesai",
        segmenBed: [{ bedId: "bed-2", kamarId: "kamar-1", dari: "2026-02-01T08:00:00.000Z", sampai: "2026-02-05T08:00:00.000Z" }],
        overrideCheckout: null,
      },
    ],
    resep: [
      // Dua resep milik dokter uji yang belum diserahkan: menunggu dan disiapkan.
      { id: "resep-1", admisiId: "admisi-1", dokterId: "u-dokter", waktu: "2026-03-14T09:00:00.000Z", status: "menunggu", items: [] },
      { id: "resep-2", admisiId: "admisi-1", dokterId: "u-dokter", waktu: "2026-03-14T09:00:00.000Z", status: "diserahkan", items: [] },
      { id: "resep-4", admisiId: "admisi-1", dokterId: "u-dokter", waktu: "2026-03-14T09:00:00.000Z", status: "disiapkan", items: [] },
      // Resep dokter lain tidak boleh ikut dihitung sebagai beban dokter uji.
      { id: "resep-3", admisiId: "admisi-2", dokterId: "u-dokter-lain", waktu: "2026-03-14T09:00:00.000Z", status: "menunggu", items: [] },
    ],
    tagihan: [
      { id: "tagihan-1", admisiId: "admisi-1" },
      { id: "tagihan-2", admisiId: "admisi-2" },
      { id: "tagihan-3", admisiId: "admisi-3" },
    ],
    pembayaran: [
      // Hari ini: 200.000. Bulan ini tetapi bukan hari ini: 300.000.
      { id: "p-1", tagihanId: "tagihan-1", jumlah: 200_000, metode: "tunai", waktu: "2026-03-15T08:00:00.000Z", kasirId: "u-kasir" },
      { id: "p-2", tagihanId: "tagihan-2", jumlah: 300_000, metode: "transfer", waktu: "2026-03-02T10:00:00.000Z", kasirId: "u-kasir" },
      // Admisi Februari 5 hari × 500.000 = 2.500.000 dan lunas; tidak masuk pendapatan bulan ini.
      { id: "p-3", tagihanId: "tagihan-3", jumlah: 2_500_000, metode: "debit", waktu: "2026-02-20T10:00:00.000Z", kasirId: "u-kasir" },
    ],
    obat: [
      { id: "obat-1", nama: "Paracetamol", satuan: "tablet", harga: 2_000, stok: 10, stokMinimum: 20 },
      { id: "obat-2", nama: "Amoxicillin", satuan: "kapsul", harga: 5_000, stok: 30, stokMinimum: 20 },
      { id: "obat-3", nama: "Furosemide", satuan: "tablet", harga: 1_800, stok: 5, stokMinimum: 10 },
    ],
    audit: [
      { id: "a-1", waktu: "2026-03-15T08:00:00.000Z", penggunaId: "u-kasir", aksi: "pembayaran.dicatat", entitas: "tagihan", entitasId: "tagihan-1", ringkasan: "" },
      { id: "a-2", waktu: "2026-03-14T08:00:00.000Z", penggunaId: "u-kasir", aksi: "pembayaran.dicatat", entitas: "tagihan", entitasId: "tagihan-2", ringkasan: "" },
    ],
  };
}

function angka(state: State, peran: Pengguna["peran"], hariIni: string = HARI_INI) {
  const kartu = ringkasanPeran(state, pengguna(peran), hariIni);
  return Object.fromEntries(kartu.map((k) => [k.label, k.nilai]));
}

describe("ringkasan dashboard per peran", () => {
  it("petugas pendaftaran melihat pasien dirawat dan bed kosong", () => {
    expect(angka(stateContoh(), "pendaftaran")).toEqual({
      "Pasien dirawat": 2,
      "Bed kosong": 1,
      "Bed menunggu dibersihkan": 1,
    });
  });

  it("dokter hanya menghitung pasien dan resep yang menjadi tanggung jawabnya", () => {
    expect(angka(stateContoh(), "dokter")).toEqual({
      "Pasien saya": 1,
      "Resep belum diserahkan": 2,
    });
  });

  it("perawat melihat beban rawat dan bed yang perlu disiapkan", () => {
    expect(angka(stateContoh(), "perawat")).toEqual({
      "Pasien dirawat": 2,
      "Bed perlu disiapkan": 1,
    });
  });

  it("apoteker melihat antrean resep dan obat yang menipis", () => {
    expect(angka(stateContoh(), "apoteker")).toEqual({
      "Resep menunggu": 2,
      "Resep disiapkan": 1,
      "Obat stok menipis": 2,
    });
  });

  it("kasir melihat tagihan belum lunas dan pendapatan hari ini", () => {
    expect(angka(stateContoh(), "kasir")).toEqual({
      "Tagihan belum lunas": 2,
      "Pendapatan hari ini": 200_000,
    });
  });

  it("pimpinan melihat BOR dan pendapatan bulan ini", () => {
    const nilai = angka(stateContoh(), "pimpinan");

    expect(nilai["Pasien dirawat"]).toBe(2);
    expect(nilai["BOR (%)"]).toBe(50);
    expect(nilai["Pendapatan hari ini"]).toBe(200_000);
    // 200.000 + 300.000; pembayaran Februari tidak ikut.
    expect(nilai["Pendapatan bulan ini"]).toBe(500_000);
  });

  it("admin melihat pengguna aktif, bed kosong, dan aktivitas hari ini", () => {
    expect(angka(stateContoh(), "admin")).toEqual({
      "Pengguna aktif": 8,
      "Bed kosong": 1,
      "Aktivitas hari ini": 1,
    });
  });

  it("menghitung pendapatan hari ini menurut tanggal lokal, bukan tanggal UTC", () => {
    // Transaksi bertanggal 1 Maret 22:00 UTC = 2 Maret 05:00 WIB. Bagi kasir
    // di WIB, itu pembayaran "hari ini" tanggal 2, bukan kemarin tanggal 1.
    const instan = new Date("2026-03-01T22:00:00.000Z");
    const hariIniLokal = tanggalLokal(instan);
    const state = stateContoh();
    state.pembayaran = [
      {
        id: "p-dini-hari",
        tagihanId: "tagihan-1",
        jumlah: 125_000,
        metode: "tunai",
        waktu: instan.toISOString(),
        kasirId: "u-kasir",
      },
    ];

    // Hanya bermakna bila tanggal UTC dan lokal memang berbeda; lewati bila tidak.
    if (instan.toISOString().slice(0, 10) === hariIniLokal) return;

    expect(angka(state, "kasir", hariIniLokal)["Pendapatan hari ini"]).toBe(125_000);
  });

  it("transaksi yang jelas bukan hari ini tidak ikut dihitung", () => {
    const kemarin = tanggalLokal(new Date(Date.now() - 24 * 60 * 60 * 1000));
    const state = stateContoh();
    state.pembayaran = [
      {
        id: "p-kemarin",
        tagihanId: "tagihan-1",
        jumlah: 125_000,
        metode: "tunai",
        waktu: `${kemarin}T12:00:00.000Z`,
        kasirId: "u-kasir",
      },
    ];

    expect(angka(state, "kasir", tanggalLokal(new Date()))["Pendapatan hari ini"]).toBe(0);
  });

  it("memberi setiap angka tujuan tautan supaya dashboard bisa ditindaklanjuti", () => {
    const kartu = ringkasanPeran(stateContoh(), pengguna("pendaftaran"), HARI_INI);

    expect(kartu.every((k) => typeof k.href === "string" && k.href.startsWith("/"))).toBe(true);
  });
});
