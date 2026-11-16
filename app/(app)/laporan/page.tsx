"use client";

import { useState } from "react";
import { useSesi } from "@/components/shell/sesi-provider";
import { useHariIni, useSelector } from "@/components/shell/store-provider";
import {
  laporanKeuangan,
  laporanObat,
  laporanOkupansi,
  laporanPasien,
  laporanUntuk,
  validasiPeriode,
  type JenisLaporan,
  type Periode,
} from "@/lib/domain/laporan";
import type { State } from "@/lib/domain/types";
import { formatJumlah, formatRupiah, formatTanggal } from "@/lib/format";

/**
 * Laporan per periode untuk Pimpinan (semua), Kasir (keuangan), dan Apoteker
 * (pemakaian obat). Angka dihitung selector domain yang sama dengan dashboard
 * dan modul asalnya; layar ini hanya memilih periode dan memformat.
 */
export default function HalamanLaporan() {
  const { pengguna } = useSesi();
  const state = useSelector((s) => s);
  const hariIni = useHariIni();

  const [periode, setPeriode] = useState<Periode>(() => {
    const awalBulan = `${hariIni.slice(0, 7)}-01`;
    return { dari: awalBulan, sampai: hariIni };
  });
  // Default laporan pertama yang boleh dibuka peran; pilihan pengguna menang.
  const [dipilih, setJenis] = useState<JenisLaporan["jenis"] | null>(null);

  if (!pengguna) return null;

  const tersedia = laporanUntuk(pengguna.peran);
  // Shell hanya mengizinkan rute ini bagi peran yang memegang resource
  // "laporan", dan setiap peran seperti itu memegang sedikitnya satu izin.
  const aktif = tersedia.find((l) => l.jenis === dipilih) ?? tersedia[0]!;

  const galat = validasiPeriode(periode);

  return (
    <div>
      <header>
        <h1 className="text-heading">Laporan</h1>
        <p className="mt-2 max-w-prose text-body text-text-muted">
          Pilih jenis laporan dan rentang tanggal. Semua angka berasal dari data yang sama dengan
          modul pendaftaran, kasir, kamar, dan farmasi — bukan rekap terpisah.
        </p>
      </header>

      {/* Tab laporan hanya memuat yang menjadi hak peran aktif (matriks izin). */}
      <div role="group" aria-label="Jenis laporan" className="mt-6 flex flex-wrap gap-2">
        {tersedia.map((l) => (
          <button
            key={l.jenis}
            type="button"
            aria-pressed={l.jenis === aktif.jenis}
            onClick={() => setJenis(l.jenis)}
            className={`inline-flex min-h-11 items-center rounded-md border px-4 text-small font-semibold transition-colors ${
              l.jenis === aktif.jenis
                ? "border-primary bg-primary-soft text-primary"
                : "border-border bg-surface text-text hover:bg-surface-muted"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      <section aria-label="Rentang tanggal" className="mt-4 rounded-lg border border-border bg-surface p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="laporan-dari" className="block text-small font-medium text-text">
              Dari tanggal
            </label>
            <input
              id="laporan-dari"
              type="date"
              value={periode.dari}
              max={periode.sampai}
              onChange={(e) => setPeriode((p) => ({ ...p, dari: e.target.value }))}
              className="mt-1 min-h-11 rounded-md border border-border bg-canvas px-3 text-body text-text"
            />
          </div>
          <div>
            <label htmlFor="laporan-sampai" className="block text-small font-medium text-text">
              Sampai tanggal
            </label>
            <input
              id="laporan-sampai"
              type="date"
              value={periode.sampai}
              min={periode.dari}
              onChange={(e) => setPeriode((p) => ({ ...p, sampai: e.target.value }))}
              className="mt-1 min-h-11 rounded-md border border-border bg-canvas px-3 text-body text-text"
            />
          </div>
          <p className="text-caption text-text-muted">Tanggal masuk, keluar, dan transaksi dihitung inklusif.</p>
        </div>
      </section>

      {galat ? (
        <p role="alert" className="mt-4 rounded-md border border-danger px-3 py-2 text-small text-danger">
          {galat}
        </p>
      ) : (
        <div className="mt-6">
          <PanelLaporan jenis={aktif.jenis} state={state} periode={periode} hariIni={hariIni} />
        </div>
      )}
    </div>
  );
}

function PanelLaporan({
  jenis,
  state,
  periode,
  hariIni,
}: {
  jenis: JenisLaporan["jenis"];
  state: State;
  periode: Periode;
  hariIni: string;
}) {
  switch (jenis) {
    case "pasien":
      return <LaporanPasienPanel hasil={laporanPasien(state, periode)} />;
    case "keuangan":
      return <LaporanKeuanganPanel hasil={laporanKeuangan(state, periode, hariIni)} />;
    case "okupansi":
      return <LaporanOkupansiPanel hasil={laporanOkupansi(state, periode, hariIni)} />;
    case "obat":
      return <LaporanObatPanel hasil={laporanObat(state, periode)} />;
  }
}

/** Baris keterangan data terbaru; setiap laporan menampilkannya (spec, user story 91). */
function KeteranganData({ transaksiTerakhir }: { transaksiTerakhir: string | null }) {
  return (
    <p className="mt-4 border-t border-border pt-3 text-caption text-text-muted">
      {transaksiTerakhir
        ? `Transaksi terakhir yang masuk perhitungan: ${formatTanggal(transaksiTerakhir)}.`
        : "Tidak ada transaksi dalam periode ini, jadi belum ada tanggal transaksi terakhir."}
    </p>
  );
}

/** Kondisi kosong menjelaskan penyebabnya, bukan tabel kosong (spec, user story 92). */
function Kosong({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-md border border-border bg-surface-muted p-4 text-small text-text-muted">
      <p className="font-medium text-text">Tidak ada data pada periode ini.</p>
      <p className="mt-1">{children}</p>
      <p className="mt-1">Coba lebarkan rentang tanggal atau pilih bulan lain.</p>
    </div>
  );
}

function LaporanPasienPanel({ hasil }: { hasil: ReturnType<typeof laporanPasien> }) {
  const kosong = hasil.masuk.length === 0 && hasil.keluar.length === 0 && hasil.dirawat.length === 0;
  return (
    <section
      aria-label="Laporan pasien"
      className="rounded-lg border border-border bg-surface p-5 shadow-sm"
    >
      <h2 className="text-title">Laporan pasien</h2>
      <p className="mt-1 text-small text-text-muted">
        Pasien masuk dihitung dari tanggal masuk, pasien keluar dari tanggal pulang, dan sedang
        dirawat dari admisi yang masih terbuka pada akhir periode.
      </p>

      {kosong ? (
        <Kosong>Tidak ada admisi yang masuk, keluar, atau dirawat pada rentang tanggal ini.</Kosong>
      ) : (
        <div className="mt-4 grid gap-6 xl:grid-cols-3">
          <TabelPasien judul="Pasien masuk" baris={hasil.masuk} kolom="masuk" />
          <TabelPasien judul="Pasien keluar" baris={hasil.keluar} kolom="keluar" />
          <TabelPasien judul="Sedang dirawat" baris={hasil.dirawat} kolom="masuk" />
        </div>
      )}

      <KeteranganData transaksiTerakhir={hasil.transaksiTerakhir} />
    </section>
  );
}

function TabelPasien({
  judul,
  baris,
  kolom,
}: {
  judul: string;
  baris: ReturnType<typeof laporanPasien>["masuk"];
  kolom: "masuk" | "keluar";
}) {
  return (
    <div>
      <h3 className="text-small font-semibold text-text">
        {judul}
        <span className="ml-1 font-normal text-text-muted">({formatJumlah(baris.length)})</span>
      </h3>
      {baris.length === 0 ? (
        <p className="mt-1 text-caption text-text-muted">Tidak ada pada periode ini.</p>
      ) : (
        <table className="mt-2 w-full text-small">
          <caption className="sr-only">{judul} pada periode terpilih</caption>
          <thead>
            <tr className="border-b border-border text-left">
              <th scope="col" className="py-1.5 font-semibold">Pasien</th>
              <th scope="col" className="py-1.5 font-semibold">Bed</th>
              <th scope="col" className="py-1.5 font-semibold">{kolom === "masuk" ? "Masuk" : "Pulang"}</th>
            </tr>
          </thead>
          <tbody>
            {baris.map((b) => (
              <tr key={b.admisiId} className="border-b border-border last:border-b-0">
                <th scope="row" className="py-1.5 text-left font-medium text-text">
                  {b.pasien.nama}
                  <span className="block text-caption font-normal text-text-muted">{b.pasien.nomorRM}</span>
                </th>
                <td className="py-1.5 text-text-muted">
                  {b.bed.kode}
                  <span className="block text-caption">{b.kamar.nama}</span>
                </td>
                <td className="py-1.5 text-text">
                  {formatTanggal(kolom === "masuk" ? b.tanggalMasuk : (b.tanggalPulang ?? b.tanggalMasuk))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function LaporanKeuanganPanel({ hasil }: { hasil: ReturnType<typeof laporanKeuangan> }) {
  const kosong = hasil.totalTagihan === 0 && hasil.totalTerbayar === 0;
  return (
    <section aria-label="Laporan keuangan" className="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <h2 className="text-title">Laporan keuangan</h2>
      <p className="mt-1 text-small text-text-muted">
        Total tagihan dihitung dari rincian kamar, tindakan, dan obat pada admisi yang tersentuh
        periode; total terbayar hanya pembayaran yang jatuh di dalam periode.
      </p>

      {kosong ? (
        <Kosong>Tidak ada tagihan maupun pembayaran pada rentang tanggal ini.</Kosong>
      ) : (
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          {(
            [
              ["Total tagihan", formatRupiah(hasil.totalTagihan), "text-text"],
              ["Total terbayar", formatRupiah(hasil.totalTerbayar), "text-success"],
              ["Sisa piutang", formatRupiah(hasil.sisaPiutang), hasil.sisaPiutang > 0 ? "text-danger" : "text-text"],
            ] as const
          ).map(([label, nilai, warna]) => (
            <div key={label} className="rounded-md border border-border p-4">
              <dt className="text-small text-text-muted">{label}</dt>
              <dd className={`mt-1 font-serif text-title font-semibold ${warna}`}>{nilai}</dd>
            </div>
          ))}
        </dl>
      )}

      <KeteranganData transaksiTerakhir={hasil.transaksiTerakhir} />
    </section>
  );
}

function LaporanOkupansiPanel({ hasil }: { hasil: ReturnType<typeof laporanOkupansi> }) {
  const kosong =
    hasil.baris.length === 0 ||
    hasil.baris.every((b) => b.kapasitasBedHari === 0 || b.bedHari === 0);
  return (
    <section aria-label="Laporan okupansi kamar" className="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <h2 className="text-title">Laporan okupansi kamar</h2>
      <p className="mt-1 text-small text-text-muted">
        Pemanfaatan dihitung dalam bed-hari: jumlah hari setiap segmen bed beririsan dengan periode,
        dibagi kapasitas semua bed aktif pada kelas tersebut.
      </p>

      {kosong ? (
        <Kosong>
          Tidak ada bed terpakai pada kelas mana pun sepanjang periode ini — mungkin karena
          periode berada di masa depan atau sebelum ada pasien dirawat.
        </Kosong>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-small">
            <caption className="text-left text-caption text-text-muted">
              Pemanfaatan per kelas kamar pada periode terpilih
            </caption>
            <thead>
              <tr className="border-b border-border text-left">
                <th scope="col" className="py-2 font-semibold">Kelas</th>
                <th scope="col" className="py-2 text-right font-semibold">Bed-hari terpakai</th>
                <th scope="col" className="py-2 text-right font-semibold">Kapasitas bed-hari</th>
                <th scope="col" className="py-2 text-right font-semibold">Pemanfaatan</th>
              </tr>
            </thead>
            <tbody>
              {hasil.baris.map((b) => (
                <tr key={b.kelas} className="border-b border-border last:border-b-0">
                  <th scope="row" className="py-2 text-left font-medium text-text">Kelas {b.kelas}</th>
                  <td className="py-2 text-right text-text">{formatJumlah(b.bedHari)}</td>
                  <td className="py-2 text-right text-text">{formatJumlah(b.kapasitasBedHari)}</td>
                  <td className="py-2 text-right text-text">{formatJumlah(b.bor)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <KeteranganData transaksiTerakhir={hasil.transaksiTerakhir} />
    </section>
  );
}

function LaporanObatPanel({ hasil }: { hasil: ReturnType<typeof laporanObat> }) {
  const kosong = hasil.baris.length === 0 || hasil.baris.every((b) => b.pemakaian === 0);
  return (
    <section aria-label="Laporan pemakaian obat" className="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <h2 className="text-title">Laporan pemakaian obat</h2>
      <p className="mt-1 text-small text-text-muted">
        Pemakaian dihitung dari resep yang sudah diserahkan apoteker dalam periode. Stok akhir adalah
        posisi stok terbaru, bukan stok awal periode.
      </p>

      {kosong ? (
        <Kosong>
          Tidak ada obat yang diserahkan pada periode ini, sehingga pemakaian belum dapat
          dihitung. Stok akhir di bawah adalah posisi stok saat ini.
        </Kosong>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-small">
            <caption className="text-left text-caption text-text-muted">
              Pemakaian dan stok akhir per obat pada periode terpilih
            </caption>
            <thead>
              <tr className="border-b border-border text-left">
                <th scope="col" className="py-2 font-semibold">Obat</th>
                <th scope="col" className="py-2 text-right font-semibold">Pemakaian</th>
                <th scope="col" className="py-2 text-right font-semibold">Stok akhir</th>
              </tr>
            </thead>
            <tbody>
              {hasil.baris.map((b) => (
                <tr key={b.obat.id} className="border-b border-border last:border-b-0">
                  <th scope="row" className="py-2 text-left font-medium text-text">{b.obat.nama}</th>
                  <td className="py-2 text-right text-text">
                    {formatJumlah(b.pemakaian)} {b.obat.satuan}
                  </td>
                  <td className="py-2 text-right text-text">
                    {formatJumlah(b.stokAkhir)} {b.obat.satuan}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <KeteranganData transaksiTerakhir={hasil.transaksiTerakhir} />
    </section>
  );
}
