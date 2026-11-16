import { describe, expect, it } from "vitest";
import { okupansiKelasSaatIni, admisiTerbaru, trenPendapatan } from "./laporan";
import { tanggalLokal } from "./lama-inap";
import { buatStateKosong } from "./state";
import type { State, Tanggal } from "./types";

/** State buatan tangan dengan angka yang dihitung manual, supaya test tidak mengulang rumus implementasi. */
const HARI_INI = "2026-11-16";

/** Stempel waktu pada tengah hari waktu lokal: tanggalnya sama di zona mana pun. */
function jamLokal(tanggal: Tanggal, jam = 12): string {
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
      { id: "k-3", nama: "Dahlia III-1", kelas: "III", tarifHarian: 250_000, aktif: true },
      // Kamar nonaktif tidak ditawarkan, jadi bed-nya tidak masuk perhitungan okupansi.
      { id: "k-off", nama: "Mawar II-1", kelas: "II", tarifHarian: 400_000, aktif: false },
    ],
    bed: [
      { id: "b-vip-1", kamarId: "k-vip", kode: "V1", status: "terisi" },
      { id: "b-vip-2", kamarId: "k-vip", kode: "V2", status: "kosong" },
      { id: "b-1-1", kamarId: "k-1", kode: "A", status: "terisi" },
      { id: "b-1-2", kamarId: "k-1", kode: "B", status: "terisi" },
      { id: "b-3-1", kamarId: "k-3", kode: "C", status: "kosong" },
      { id: "b-off-1", kamarId: "k-off", kode: "X", status: "terisi" },
    ],
    pengguna: [
      { id: "u-dokter", nama: "dr. Ayu", peran: "dokter", aktif: true },
      { id: "u-kasir", nama: "Joko", peran: "kasir", aktif: true },
    ],
    admisi: [
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
      {
        id: "admisi-2",
        pasienId: "2",
        dokterId: "u-dokter",
        bedId: "b-1-1",
        tanggalMasuk: "2026-11-14",
        tanggalPulang: null,
        diagnosaAwal: "Observasi",
        status: "aktif",
        segmenBed: [{ bedId: "b-1-1", kamarId: "k-1", dari: jamLokal("2026-11-14"), sampai: null, tarifHarian: 600_000 }],
        overrideCheckout: null,
      },
      {
        id: "admisi-3",
        pasienId: "3",
        dokterId: "u-dokter",
        bedId: "b-1-2",
        tanggalMasuk: "2026-10-01",
        tanggalPulang: "2026-11-05",
        diagnosaAwal: "Selesai",
        status: "selesai",
        segmenBed: [
          { bedId: "b-1-2", kamarId: "k-1", dari: jamLokal("2026-10-01"), sampai: jamLokal("2026-11-05"), tarifHarian: 600_000 },
        ],
        overrideCheckout: null,
      },
    ],
  };
}

describe("tren pendapatan 30 hari", () => {
  it("menghasilkan satu titik per hari, termasuk hari tanpa transaksi", () => {
    const state = stateContoh();
    state.pembayaran = [
      { id: "p-1", tagihanId: "t-1", jumlah: 300_000, metode: "tunai", waktu: jamLokal("2026-11-15"), kasirId: "u-kasir" },
      // Hari yang sama dijumlahkan menjadi satu titik.
      { id: "p-2", tagihanId: "t-1", jumlah: 200_000, metode: "transfer", waktu: jamLokal("2026-11-15", 15), kasirId: "u-kasir" },
      { id: "p-3", tagihanId: "t-2", jumlah: 100_000, metode: "debit", waktu: jamLokal("2026-10-20"), kasirId: "u-kasir" },
      // Di luar jendela 30 hari terakhir.
      { id: "p-4", tagihanId: "t-2", jumlah: 999_000, metode: "tunai", waktu: jamLokal("2026-10-17"), kasirId: "u-kasir" },
    ];

    const tren = trenPendapatan(state, HARI_INI);

    expect(tren).toHaveLength(30);
    expect(tren[0]!.tanggal).toBe("2026-10-18");
    expect(tren.at(-1)!.tanggal).toBe("2026-11-16");
    expect(tren.find((t) => t.tanggal === "2026-11-15")!.jumlah).toBe(500_000);
    expect(tren.find((t) => t.tanggal === "2026-10-20")!.jumlah).toBe(100_000);
    expect(tren.find((t) => t.tanggal === "2026-11-16")!.jumlah).toBe(0);
    expect(tren.reduce((n, t) => n + t.jumlah, 0)).toBe(600_000);
  });

  it("membaca tanggal lokal, bukan potongan tanggal UTC", () => {
    // 22:00 UTC = dini hari berikutnya di WIB.
    const instan = new Date(`${HARI_INI}T22:00:00.000Z`);
    const tanggalLokalInstan = tanggalLokal(instan);
    const state = stateContoh();
    state.pembayaran = [
      { id: "p-dini", tagihanId: "t-1", jumlah: 125_000, metode: "tunai", waktu: instan.toISOString(), kasirId: "u-kasir" },
    ];

    // Hanya bermakna bila tanggal UTC dan lokal memang berbeda; jendela
    // diakhiri pada tanggal lokal transaksi, yang di WIB adalah hari berikutnya.
    if (instan.toISOString().slice(0, 10) === tanggalLokalInstan) return;
    expect(trenPendapatan(state, tanggalLokalInstan).find((t) => t.tanggal === tanggalLokalInstan)?.jumlah).toBe(125_000);
  });
});

describe("okupansi per kelas kamar", () => {
  it("menghitung bed terisi dan BOR per kelas dari kamar aktif", () => {
    const rows = okupansiKelasSaatIni(stateContoh());

    expect(rows).toEqual([
      { kelas: "VIP", total: 2, terisi: 1, bor: 50 },
      { kelas: "I", total: 2, terisi: 2, bor: 100 },
      { kelas: "III", total: 1, terisi: 0, bor: 0 },
    ]);
  });

  it("tidak menampilkan kelas tanpa bed aktif", () => {
    expect(okupansiKelasSaatIni(stateContoh()).map((r) => r.kelas)).not.toContain("II");
  });
});

describe("pasien terbaru", () => {
  it("mengurutkan admisi terbaru lebih dulu beserta bed dan dokternya", () => {
    const rows = admisiTerbaru(stateContoh(), 2);

    expect(rows).toHaveLength(2);
    expect(rows[0]!.pasien.nama).toBe("Siti Rahmawati");
    expect(rows[0]!.tanggalMasuk).toBe("2026-11-14");
    expect(rows[0]!.kamar.nama).toBe("Melati I-1");
    expect(rows[1]!.pasien.nama).toBe("Ahmad Fauzi");
    expect(rows[1]!.dokter.nama).toBe("dr. Ayu");
  });

  it("tidak melebihi jumlah yang diminta", () => {
    expect(admisiTerbaru(stateContoh(), 1)).toHaveLength(1);
    expect(admisiTerbaru(stateContoh())).toHaveLength(3);
  });
});
