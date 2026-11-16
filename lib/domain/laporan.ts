import { geserTanggal, selisihHari, tanggalLokal } from "./lama-inap";
import { boleh, type Tindakan } from "./izin";
import { infoAdmisi, type InfoAdmisi } from "./selectors";
import { nilaiTagihan } from "./tagihan";
import type { Bed, Id, Kamar, KelasKamar, Obat, Pasien, Peran, State, StatusAdmisi, Tanggal } from "./types";

/**
 * Angka dashboard dan laporan, semuanya diturunkan dari data yang sama dengan
 * modul asalnya. Tidak ada rumus kedua di layar: komponen hanya memformat.
 */

export interface TitikPendapatan {
  tanggal: Tanggal;
  jumlah: number;
}

/**
 * Pendapatan per hari selama 30 hari terakhir, termasuk hari tanpa transaksi
 * agar grafik tetap punya sumbu waktu yang rata. Stempel waktu dicatat UTC,
 * jadi setiap pembayaran dikonversi ke tanggal lokal lebih dulu — kalau tidak,
 * transaksi dini hari WIB jatuh di hari sebelumnya.
 */
export function trenPendapatan(state: State, hariIni: Tanggal): TitikPendapatan[] {
  const jumlah = new Map<Tanggal, number>();
  for (const p of state.pembayaran) {
    const tanggal = tanggalLokal(new Date(p.waktu));
    jumlah.set(tanggal, (jumlah.get(tanggal) ?? 0) + p.jumlah);
  }
  return Array.from({ length: 30 }, (_, i) => {
    const tanggal = geserTanggal(hariIni, i - 29);
    return { tanggal, jumlah: jumlah.get(tanggal) ?? 0 };
  });
}

export interface OkupansiKelas {
  kelas: KelasKamar;
  total: number;
  terisi: number;
  /** Tingkat hunian kelas dalam persen, satu desimal. */
  bor: number;
}

/**
 * Bed aktif dikelompokkan per kelas, urut sesuai kamar di master. Dipakai
 * okupansi saat ini dan laporan per periode supaya keduanya tidak menghitung
 * kelas dengan cara berbeda.
 */
function bedPerKelasAktif(state: State): Array<{ kelas: KelasKamar; bed: Bed[] }> {
  const kelasKamar = new Map(state.kamar.filter((k) => k.aktif).map((k) => [k.id, k.kelas]));
  const hasil = new Map<KelasKamar, Bed[]>();
  for (const bed of state.bed) {
    const kelas = kelasKamar.get(bed.kamarId);
    if (!kelas) continue;
    const daftar = hasil.get(kelas);
    if (daftar) daftar.push(bed);
    else hasil.set(kelas, [bed]);
  }
  return [...hasil].map(([kelas, bed]) => ({ kelas, bed }));
}

function bor(terisi: number, total: number): number {
  return total === 0 ? 0 : Math.round((terisi / total) * 1000) / 10;
}

/** Tingkat hunian per kelas kamar aktif; kelas tanpa bed aktif tidak ditampilkan. */
export function okupansiKelasSaatIni(state: State): OkupansiKelas[] {
  return bedPerKelasAktif(state).map(({ kelas, bed }) => {
    const terisi = bed.filter((b) => b.status === "terisi").length;
    return { kelas, total: bed.length, terisi, bor: bor(terisi, bed.length) };
  });
}

export interface BarisPasienTerbaru extends InfoAdmisi {
  tanggalPulang: Tanggal | null;
  status: StatusAdmisi;
}

/**
 * Admisi terbaru untuk tabel ringkas dashboard. Admisi selesai ikut tampil:
 * pimpinan perlu melihat pasien yang baru keluar, bukan hanya yang dirawat.
 */
export function admisiTerbaru(state: State, batas = 5): BarisPasienTerbaru[] {
  return [...state.admisi]
    .sort((a, b) => b.tanggalMasuk.localeCompare(a.tanggalMasuk))
    .flatMap((admisi) => {
      const info = infoAdmisi(state, admisi.id);
      if (!info) return [];
      return [{ ...info, tanggalPulang: admisi.tanggalPulang, status: admisi.status }];
    })
    .slice(0, batas);
}

export interface Periode {
  dari: Tanggal;
  sampai: Tanggal;
}

/**
 * Pesan penolakan rentang tidak valid, atau `null` bila periode dapat dipakai.
 * Tinggal di domain supaya layar dan test membaca aturan yang sama.
 */
export function validasiPeriode(periode: Periode): string | null {
  if (!periode.dari || !periode.sampai) return "Isi tanggal awal dan tanggal akhir laporan.";
  if (periode.dari > periode.sampai) {
    return "Rentang tidak valid: tanggal awal melewati tanggal akhir. Perbaiki rentang agar laporan menampilkan periode yang benar.";
  }
  return null;
}

/** `YYYY-MM-DD` dibandingkan sebagai string; formatnya sudah urut secara leksikal. */
function diPeriode(tanggal: Tanggal, periode: Periode): boolean {
  return tanggal >= periode.dari && tanggal <= periode.sampai;
}

/** Tanggal transaksi terbaru dari daftar tanggal, atau `null` bila tidak ada yang masuk. */
function terbaru(tanggal: Tanggal[]): Tanggal | null {
  return tanggal.length === 0 ? null : tanggal.reduce((a, b) => (b > a ? b : a));
}

export interface JenisLaporan {
  jenis: "pasien" | "keuangan" | "okupansi" | "obat";
  label: string;
  izin: Tindakan;
}

/** Empat laporan per periode beserta izin yang membukanya (matriks `IZIN`, bukan daftar terpisah). */
export const LAPORAN: JenisLaporan[] = [
  { jenis: "pasien", label: "Pasien", izin: "laporan.lihat" },
  { jenis: "keuangan", label: "Keuangan", izin: "laporan.keuangan" },
  { jenis: "okupansi", label: "Okupansi kamar", izin: "laporan.lihat" },
  { jenis: "obat", label: "Pemakaian obat", izin: "laporan.obat" },
];

/** Laporan yang dapat dibuka peran aktif; peran tanpa izin laporan mendapat daftar kosong. */
export function laporanUntuk(peran: Peran | null | undefined): JenisLaporan[] {
  return LAPORAN.filter((l) => boleh(peran, l.izin));
}

export interface BarisPasien {
  admisiId: Id;
  pasien: Pasien;
  tanggalMasuk: Tanggal;
  tanggalPulang: Tanggal | null;
  kamar: Kamar;
  bed: Bed;
}

export interface LaporanPasien {
  masuk: BarisPasien[];
  keluar: BarisPasien[];
  dirawat: BarisPasien[];
  transaksiTerakhir: Tanggal | null;
}

/**
 * Arus pasien dalam periode. Satu admisi dapat muncul di dua daftar dengan
 * arti berbeda: "masuk" menghitung tanggal masuk, "dirawat" menghitung admisi
 * yang masih aktif pada akhir periode.
 */
export function laporanPasien(state: State, periode: Periode): LaporanPasien {
  const baris = state.admisi.flatMap((admisi): BarisPasien[] => {
    const info = infoAdmisi(state, admisi.id);
    if (!info) return [];
    return [
      {
        admisiId: admisi.id,
        pasien: info.pasien,
        tanggalMasuk: admisi.tanggalMasuk,
        tanggalPulang: admisi.tanggalPulang,
        kamar: info.kamar,
        bed: info.bed,
      },
    ];
  });
  const urut = (b: BarisPasien[]) => b.sort((a, c) => c.tanggalMasuk.localeCompare(a.tanggalMasuk));
  const masuk = urut(baris.filter((b) => diPeriode(b.tanggalMasuk, periode)));
  const keluar = urut(
    baris.filter((b) => b.tanggalPulang !== null && diPeriode(b.tanggalPulang, periode)),
  );
  // Masih dirawat pada akhir periode: masuk sebelum periode berakhir dan
  // belum keluar atau keluar setelah periode berakhir.
  const dirawat = urut(
    baris.filter(
      (b) => b.tanggalMasuk <= periode.sampai && (!b.tanggalPulang || b.tanggalPulang > periode.sampai),
    ),
  );
  return {
    masuk,
    keluar,
    dirawat,
    // Setiap baris yang tampil berasal dari tanggal masuk atau pulang, jadi
    // ketiga daftar ikut menentukan kesegaran data — termasuk pasien yang
    // masuk sebelum periode dan masih dirawat.
    transaksiTerakhir: terbaru([
      ...masuk.map((b) => b.tanggalMasuk),
      ...keluar.flatMap((b) => (b.tanggalPulang ? [b.tanggalPulang] : [])),
      ...dirawat.map((b) => b.tanggalMasuk),
    ]),
  };
}

export interface LaporanKeuanganPeriode {
  totalTagihan: number;
  totalTerbayar: number;
  sisaPiutang: number;
  transaksiTerakhir: Tanggal | null;
}

/**
 * Posisi keuangan untuk admisi yang tersentuh periode: tagihan dihitung dari
 * rincian sampai `hariIni` (bukan sampai akhir periode, agar periode di masa
 * depan tidak menagih hari yang belum terjadi), pembayaran hanya yang jatuh di
 * dalam periode.
 */
export function laporanKeuangan(state: State, periode: Periode, hariIni: Tanggal): LaporanKeuanganPeriode {
  const tagihanIds = state.tagihan
    .filter((tagihan) => {
      const admisi = state.admisi.find((a) => a.id === tagihan.admisiId);
      if (!admisi) return false;
      return (
        admisi.tanggalMasuk <= periode.sampai && (!admisi.tanggalPulang || admisi.tanggalPulang >= periode.dari)
      );
    })
    .map((t) => t.id);
  const totalTagihan = tagihanIds.reduce((n, id) => n + nilaiTagihan(state, id, hariIni).total, 0);
  const pembayaranPeriode = state.pembayaran.filter((p) => diPeriode(tanggalLokal(new Date(p.waktu)), periode));
  const totalTerbayar = pembayaranPeriode.reduce((n, p) => n + p.jumlah, 0);
  // Sisa piutang adalah sisa atas tagihan periode, bukan tagihan dikurangi
  // pembayaran periode: tagihan yang sudah lunas sebelum periode tidak boleh
  // muncul lagi sebagai piutang.
  const sisaPiutang = tagihanIds.reduce((n, id) => n + nilaiTagihan(state, id, hariIni).sisa, 0);
  return {
    totalTagihan,
    totalTerbayar,
    sisaPiutang,
    transaksiTerakhir: terbaru(pembayaranPeriode.map((p) => tanggalLokal(new Date(p.waktu)))),
  };
}

export interface BarisOkupansiPeriode {
  kelas: KelasKamar;
  /** Jumlah bed-hari terpakai dalam periode. */
  bedHari: number;
  /** Bed aktif × jumlah hari periode. */
  kapasitasBedHari: number;
  bor: number;
}

export interface LaporanOkupansi {
  baris: BarisOkupansiPeriode[];
  transaksiTerakhir: Tanggal | null;
}

/** Pemanfaatan per kelas selama periode: bed-hari terpakai dibagi kapasitas bed-hari. */
export function laporanOkupansi(state: State, periode: Periode, hariIni: Tanggal): LaporanOkupansi {
  // Hari yang belum terjadi tidak dihitung di sisi mana pun: periode yang
  // berakhir di masa depan dipotong pada hari ini.
  const akhir = minTanggal(periode.sampai, hariIni);
  const hariPeriode = Math.max(selisihHari(periode.dari, akhir) + 1, 0);
  const baris = bedPerKelasAktif(state).map(({ kelas, bed }) => {
    const bedIds = new Set(bed.map((b) => b.id));
    let bedHari = 0;
    for (const admisi of state.admisi) {
      for (const [index, segmen] of admisi.segmenBed.entries()) {
        if (!bedIds.has(segmen.bedId)) continue;
        // Segmen pertama mulai pada tanggal masuk admisi, bukan jam pencatatan
        // yang bisa diisi mundur — aturan yang sama dengan `barisKamar`.
        const dari = maxTanggal(
          index === 0 ? admisi.tanggalMasuk : tanggalLokal(new Date(segmen.dari)),
          periode.dari,
        );
        // Segmen yang sudah ditutup berakhir sehari sebelum segmen berikutnya
        // dimulai (tanggal perpindahan milik segmen baru), sehingga hari
        // perpindahan tidak terhitung dua kali. `barisKamar` memakai aturan
        // yang sama dan harus tetap selaras.
        const terakhirSegmen = index === admisi.segmenBed.length - 1;
        const sampai = minTanggal(
          segmen.sampai
            ? geserTanggal(tanggalLokal(new Date(segmen.sampai)), terakhirSegmen ? 0 : -1)
            : (admisi.tanggalPulang ?? akhir),
          akhir,
        );
        if (dari <= sampai) bedHari += selisihHari(dari, sampai) + 1;
      }
    }
    const kapasitasBedHari = bed.length * hariPeriode;
    return { kelas, bedHari, kapasitasBedHari, bor: bor(bedHari, kapasitasBedHari) };
  });

  // Yang dihitung adalah tanggal keluar/kembali tiap admisi: tanggal pulang
  // terbaru, atau hari ini untuk admisi yang masih berjalan.
  const tanggalAdmisi = state.admisi.flatMap((admisi) => {
    const keluar = admisi.tanggalPulang ?? hariIni;
    return admisi.tanggalMasuk <= periode.sampai && keluar >= periode.dari ? [keluar] : [];
  });
  return { baris, transaksiTerakhir: terbaru(tanggalAdmisi) };
}

export interface BarisObatPemakaian {
  obat: Obat;
  pemakaian: number;
  stokAkhir: number;
  /** Stok akhir sudah di bawah stok minimum master obat. */
  menipis: boolean;
}

export interface LaporanObat {
  baris: BarisObatPemakaian[];
  transaksiTerakhir: Tanggal | null;
}

/** Pemakaian obat dari resep yang diserahkan dalam periode, beserta stok akhir saat ini. */
export function laporanObat(state: State, periode: Periode): LaporanObat {
  const pemakaian = new Map<Id, number>();
  // Penyerahan obat dicatat store sebagai mutasi stok `keluar`; tanggal resep
  // dibuat bisa berbeda beberapa hari dari tanggal obat benar-benar diserahkan.
  const mutasiPeriode = state.mutasiStok.filter(
    (m) => m.jenis === "keluar" && diPeriode(tanggalLokal(new Date(m.waktu)), periode),
  );
  for (const mutasi of mutasiPeriode) {
    pemakaian.set(mutasi.obatId, (pemakaian.get(mutasi.obatId) ?? 0) + mutasi.jumlah);
  }
  return {
    baris: state.obat.map((obat) => ({
      obat,
      pemakaian: pemakaian.get(obat.id) ?? 0,
      stokAkhir: obat.stok,
      // Ambang batas yang sama dengan peringatan stok di modul Farmasi.
      menipis: obat.stok < obat.stokMinimum,
    })),
    transaksiTerakhir: terbaru(mutasiPeriode.map((m) => tanggalLokal(new Date(m.waktu)))),
  };
}

function maxTanggal(a: Tanggal, b: Tanggal): Tanggal {
  return a > b ? a : b;
}

function minTanggal(a: Tanggal, b: Tanggal): Tanggal {
  return a < b ? a : b;
}

