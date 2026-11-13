import { tanggalLokal, lamaInap, selisihHari } from "./lama-inap";
import type { Admisi, Id, State, StatusTagihan, Tanggal } from "./types";

/** Stempel waktu dicatat UTC; tanggal kalender harus dibaca di zona pengguna. */
function tanggalDari(iso: string): Tanggal {
  return tanggalLokal(new Date(iso));
}

export interface BarisKamar {
  bedId: Id;
  namaKamar: string;
  kelas: string;
  dari: Tanggal;
  sampai: Tanggal;
  lamaHari: number;
  tarifHarian: number;
  subtotal: number;
}

export interface BarisTindakan {
  id: Id;
  nama: string;
  waktu: string;
  tarif: number;
}

export interface BarisObat {
  id: Id;
  nama: string;
  jumlah: number;
  satuan: string;
  harga: number;
  subtotal: number;
}

export interface RincianTagihan {
  tagihanId: Id;
  admisiId: Id;
  lamaInap: number;
  kamar: BarisKamar[];
  tindakan: BarisTindakan[];
  obat: BarisObat[];
  subtotalKamar: number;
  subtotalTindakan: number;
  subtotalObat: number;
  total: number;
}

/**
 * Biaya kamar dihitung per segmen masa inap. Segmen yang sudah ditutup menagih
 * malam sampai tanggal perpindahan (tanggal perpindahan sudah masuk segmen
 * baru); segmen terakhir menagih sampai tanggal pulang/hari ini secara
 * inklusif. Dengan begitu jumlah hari seluruh segmen selalu sama dengan lama
 * inap inklusif (ADR-0002).
 */
function barisKamar(state: State, admisi: Admisi, hariIni: Tanggal): BarisKamar[] {
  const akhirAdmisi = admisi.tanggalPulang ?? hariIni;
  return admisi.segmenBed.flatMap((segmen, index) => {
    const kamar = state.kamar.find((k) => k.id === segmen.kamarId);
    if (!kamar) return [];
    // Segmen pertama mulai pada tanggal masuk, bukan pada jam pencatatan admisi
    // yang bisa saja diisi mundur oleh petugas.
    const dari = index === 0 ? admisi.tanggalMasuk : tanggalDari(segmen.dari);
    // Segmen terakhir berakhir pada tanggal pulang admisi. Memakai tanggal
    // `sampai` segmen (jam checkout) akan kehilangan satu hari, karena checkout
    // menutup segmen pada jam yang sama dengan tanggal pulangnya.
    const terakhir = index === admisi.segmenBed.length - 1;
    const sampai = terakhir ? akhirAdmisi : tanggalDari(segmen.sampai!);
    const lamaHari = terakhir ? selisihHari(dari, sampai) + 1 : selisihHari(dari, sampai);
    // Tarif disalin saat segmen dibuka; perubahan master kamar tidak boleh
    // menagih ulang masa inap yang sudah terjadi. Snapshot lama tanpa tarif
    // memakai tarif kamar saat ini.
    const tarifHarian = segmen.tarifHarian ?? kamar.tarifHarian;
    return [
      {
        bedId: segmen.bedId,
        namaKamar: kamar.nama,
        kelas: kamar.kelas,
        dari,
        sampai,
        lamaHari,
        tarifHarian,
        subtotal: lamaHari * tarifHarian,
      },
    ];
  });
}

/** Tagihan terkumpul otomatis: kamar per segmen + tindakan + obat yang sudah diserahkan. */
export function rincianTagihan(state: State, tagihanId: Id, hariIni: Tanggal): RincianTagihan | null {
  const tagihan = state.tagihan.find((t) => t.id === tagihanId);
  if (!tagihan) return null;
  const admisi = state.admisi.find((a) => a.id === tagihan.admisiId);
  if (!admisi) return null;

  const kamar = barisKamar(state, admisi, hariIni);
  const tindakan: BarisTindakan[] = state.tindakanAdmisi
    .filter((t) => t.admisiId === admisi.id)
    .map((t) => ({ id: t.id, nama: t.nama, waktu: t.waktu, tarif: t.tarif }));
  const obat: BarisObat[] = state.resep
    .filter((r) => r.admisiId === admisi.id && r.status === "diserahkan")
    .flatMap((r) =>
      r.items.map((item) => ({
        id: r.id,
        nama: item.nama,
        jumlah: item.jumlah,
        satuan: state.obat.find((o) => o.id === item.obatId)?.satuan ?? "",
        harga: item.harga,
        subtotal: item.jumlah * item.harga,
      })),
    );

  const subtotalKamar = kamar.reduce((n, b) => n + b.subtotal, 0);
  const subtotalTindakan = tindakan.reduce((n, b) => n + b.tarif, 0);
  const subtotalObat = obat.reduce((n, b) => n + b.subtotal, 0);

  return {
    tagihanId,
    admisiId: admisi.id,
    lamaInap: lamaInap(admisi.tanggalMasuk, admisi.tanggalPulang, hariIni),
    kamar,
    tindakan,
    obat,
    subtotalKamar,
    subtotalTindakan,
    subtotalObat,
    total: subtotalKamar + subtotalTindakan + subtotalObat,
  };
}

export interface NilaiTagihan {
  total: number;
  dibayar: number;
  sisa: number;
  status: StatusTagihan;
}

/** Status tagihan diturunkan dari total pembayaran, tidak pernah diisi manual. */
export function nilaiTagihan(state: State, tagihanId: Id, hariIni: Tanggal): NilaiTagihan {
  const rincian = rincianTagihan(state, tagihanId, hariIni);
  const total = rincian?.total ?? 0;
  const dibayar = state.pembayaran
    .filter((p) => p.tagihanId === tagihanId)
    .reduce((n, p) => n + p.jumlah, 0);
  const status: StatusTagihan = dibayar === 0 ? "belum bayar" : dibayar >= total ? "lunas" : "sebagian";
  return { total, dibayar, sisa: Math.max(total - dibayar, 0), status };
}
