"use client";

import Link from "next/link";
import { GrafikOkupansiKelas, GrafikTrenPendapatan } from "@/components/laporan/grafik";
import { formatAngka, formatTanggal } from "@/lib/format";
import { boleh } from "@/lib/domain/izin";
import { okupansiKelasSaatIni, admisiTerbaru, trenPendapatan } from "@/lib/domain/laporan";
import { ringkasanPeran, type KartuRingkasan } from "@/lib/ringkasan-peran";
import { useSesi } from "@/components/shell/sesi-provider";
import { useHariIni, useSelector } from "@/components/shell/store-provider";

export default function HalamanDashboard() {
  const { pengguna } = useSesi();
  const hariIni = useHariIni();
  const state = useSelector((s) => s);

  if (!pengguna) return null;
  const kartu = ringkasanPeran(state, pengguna, hariIni);
  // Ringkasan kondisi rumah sakit hanya untuk pemegang izin laporan, dibaca
  // dari matriks izin yang sama dengan sidebar dan penjagaan rute.
  const pimpinan = boleh(pengguna.peran, "laporan.lihat");

  return (
    <div>
      <header>
        <h1 className="text-heading">Selamat bertugas, {pengguna.nama}</h1>
        <p className="mt-2 max-w-prose text-body text-text-muted">
          Angka di bawah dihitung langsung dari data demo yang sama dengan modul lain, bukan salinan.
        </p>
        {pengguna.peran === "pendaftaran" ? (
          // Pintasan untuk alur tersibuk petugas pendaftaran (spec, user story 14).
          <Link
            href="/pendaftaran"
            className="mt-5 inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-small font-semibold text-on-primary transition-colors hover:bg-primary-hover"
          >
            Daftarkan Pasien
          </Link>
        ) : null}
      </header>

      <section aria-labelledby="ringkasan" className="mt-8">
        <h2 id="ringkasan" className="text-title">
          Ringkasan peran
        </h2>
        <ul role="list" aria-label="Ringkasan peran" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kartu.map((k) => (
            <li key={k.label}>
              <KartuAngka kartu={k} />
            </li>
          ))}
        </ul>
      </section>

      {/* Grafik hanya relevan bagi Pimpinan (spec, user story 9–10). */}
      {pimpinan ? (
        <>
          <section
            aria-label="Tren pendapatan 30 hari terakhir"
            className="mt-8 rounded-lg border border-border bg-surface p-5 shadow-sm"
          >
            <h2 className="text-title">Tren pendapatan 30 hari terakhir</h2>
            <p className="mt-1 text-small text-text-muted">
              Jumlah pembayaran yang tercatat per hari, termasuk hari tanpa transaksi. Nilai yang sama
              tercetak pada tabel di bawah grafik.
            </p>
            <div className="mt-4">
              <GrafikTrenPendapatan tren={trenPendapatan(state, hariIni)} />
            </div>
          </section>

          <section
            aria-label="Okupansi per kelas kamar"
            className="mt-6 rounded-lg border border-border bg-surface p-5 shadow-sm"
          >
            <h2 className="text-title">Okupansi per kelas kamar</h2>
            <p className="mt-1 text-small text-text-muted">
              Bed terisi dibagi total bed aktif. Bed yang sedang dibersihkan belum dihitung terisi.
            </p>
            <div className="mt-4">
              <GrafikOkupansiKelas okupansi={okupansiKelasSaatIni(state)} />
            </div>
          </section>

          <section
            aria-label="Pasien terbaru"
            className="mt-6 rounded-lg border border-border bg-surface p-5 shadow-sm"
          >
            <h2 className="text-title">Pasien terbaru</h2>
            <p className="mt-1 text-small text-text-muted">
              Lima admisi terakhir beserta bed dan dokter penanggung jawabnya.{" "}
              <Link
                href="/laporan"
                className="inline-flex min-h-11 items-center font-semibold text-primary hover:underline"
              >
                Buka laporan per periode
              </Link>
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-small">
                <caption className="sr-only">Admisi terbaru</caption>
                <thead>
                  <tr className="border-b border-border text-left">
                    <th scope="col" className="py-2 font-semibold">Pasien</th>
                    <th scope="col" className="py-2 font-semibold">Masuk</th>
                    <th scope="col" className="py-2 font-semibold">Bed</th>
                    <th scope="col" className="py-2 font-semibold">Dokter</th>
                    <th scope="col" className="py-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {admisiTerbaru(state).map((b) => (
                    <tr key={b.admisiId} className="border-b border-border last:border-b-0">
                      <th scope="row" className="py-2 text-left font-medium text-text">
                        {b.pasien.nama}
                        <span className="block text-caption font-normal text-text-muted">{b.pasien.nomorRM}</span>
                      </th>
                      <td className="py-2 text-text-muted">{formatTanggal(b.tanggalMasuk)}</td>
                      <td className="py-2 text-text">
                        {b.bed.kode}
                        <span className="block text-caption text-text-muted">{b.kamar.nama}</span>
                      </td>
                      <td className="py-2 text-text">{b.dokter.nama}</td>
                      <td className="py-2 text-text">
                        {b.status === "aktif" ? "Aktif (masih dirawat)" : `Selesai ${formatTanggal(b.tanggalPulang!)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

function KartuAngka({ kartu }: { kartu: KartuRingkasan }) {
  return (
    <Link
      href={kartu.href}
      className="flex min-h-24 flex-col justify-between gap-3 rounded-lg border border-border bg-surface p-5 shadow-sm transition-colors hover:border-primary"
    >
      <span className="text-small font-medium text-text-muted">{kartu.label}</span>
      <span className="break-words font-serif text-heading font-semibold leading-tight text-text lg:text-display">
        {formatAngka(kartu.nilai, kartu.satuan)}
      </span>
    </Link>
  );
}
