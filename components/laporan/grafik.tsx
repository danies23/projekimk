"use client";

import { formatJumlah, formatRupiah, formatTanggal } from "@/lib/format";
import type { OkupansiKelas, TitikPendapatan } from "@/lib/domain/laporan";

/**
 * Grafik batang sederhana tanpa pustaka chart. Bentuk visual hanya pelengkap:
 * sumbu berlabel dan tabel nilai di bawahnya membuat angka terbaca oleh
 * pembaca layar dan pengguna yang tidak dapat membaca warna atau bentuk.
 */

const TINGGI = 160;
const LEBAR = 720;

export function GrafikTrenPendapatan({ tren }: { tren: TitikPendapatan[] }) {
  const maks = Math.max(...tren.map((t) => t.jumlah), 1);
  const lebarBatang = LEBAR / tren.length;
  const total = tren.reduce((n, t) => n + t.jumlah, 0);

  return (
    <div>
      <svg
        viewBox={`0 0 ${LEBAR} ${TINGGI + 28}`}
        role="img"
        aria-label={`Tren pendapatan ${tren.length} hari terakhir, tertinggi ${formatRupiah(maks)}`}
        className="h-auto w-full"
      >
        <title>Tren pendapatan {tren.length} hari terakhir</title>
        {/* Garis sumbu Y atas dan bawah, keduanya diberi nilai. */}
        <line x1="0" y1="0.5" x2={LEBAR} y2="0.5" stroke="var(--color-border)" />
        <line x1="0" y1={TINGGI - 0.5} x2={LEBAR} y2={TINGGI - 0.5} stroke="var(--color-border)" />
        <text x="0" y="12" fontSize="11" fill="var(--color-text-muted)">
          {formatRupiah(maks)}
        </text>
        <text x="0" y={TINGGI - 6} fontSize="11" fill="var(--color-text-muted)">
          Rp0
        </text>
        {tren.map((t, index) => {
          const tinggi = (t.jumlah / maks) * (TINGGI - 8);
          return (
            <rect
              key={t.tanggal}
              x={index * lebarBatang + 1}
              y={TINGGI - tinggi}
              width={Math.max(lebarBatang - 2, 1)}
              height={tinggi}
              fill="var(--color-primary)"
            >
              <title>
                {formatTanggal(t.tanggal)}: {formatRupiah(t.jumlah)}
              </title>
            </rect>
          );
        })}
        {/* Label sumbu X: awal, tengah, dan akhir jendela agar tidak menumpuk. */}
        {[0, Math.floor(tren.length / 2), tren.length - 1].map((index) => (
          <text
            key={index}
            x={index * lebarBatang + lebarBatang / 2}
            y={TINGGI + 18}
            fontSize="11"
            textAnchor={index === 0 ? "start" : index === tren.length - 1 ? "end" : "middle"}
            fill="var(--color-text-muted)"
          >
            {formatTanggal(tren[index]!.tanggal)}
          </text>
        ))}
      </svg>

      <table className="mt-3 w-full text-small">
        <caption className="text-left text-caption text-text-muted">
          Nilai harian yang diplot grafik di atas. Total {formatRupiah(total)}.
        </caption>
        <thead>
          <tr className="border-b border-border text-left">
            <th scope="col" className="py-1.5 font-semibold">Tanggal</th>
            <th scope="col" className="py-1.5 text-right font-semibold">Pendapatan (Rp)</th>
          </tr>
        </thead>
        <tbody>
          {/* Hari tanpa transaksi tetap ditampilkan agar angka total dapat diperiksa. */}
          {tren.map((t) => (
            <tr key={t.tanggal} className="border-b border-border last:border-b-0">
              <th scope="row" className="py-1 font-normal text-text-muted">{formatTanggal(t.tanggal)}</th>
              <td className="py-1 text-right text-text">{formatRupiah(t.jumlah)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function GrafikOkupansiKelas({ okupansi }: { okupansi: OkupansiKelas[] }) {
  return (
    <div>
      <ul role="list" className="space-y-3">
        {okupansi.map((k) => (
          <li key={k.kelas}>
            <div className="flex items-baseline justify-between gap-2 text-small">
              <span className="font-medium text-text">Kelas {k.kelas}</span>
              <span className="text-text-muted">
                {formatJumlah(k.terisi)} dari {formatJumlah(k.total)} bed · {formatJumlah(k.bor)}%
              </span>
            </div>
            {/* Batang hanya pelengkap; teks di atas sudah memuat angka yang sama. */}
            <div className="mt-1 h-2.5 w-full rounded-full bg-surface-muted" aria-hidden="true">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(k.bor, 100)}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <table className="mt-4 w-full text-small">
        <caption className="text-left text-caption text-text-muted">
          Tingkat hunian per kelas, dihitung dari kamar aktif.
        </caption>
        <thead>
          <tr className="border-b border-border text-left">
            <th scope="col" className="py-1.5 font-semibold">Kelas</th>
            <th scope="col" className="py-1.5 text-right font-semibold">Bed terisi</th>
            <th scope="col" className="py-1.5 text-right font-semibold">Total bed</th>
            <th scope="col" className="py-1.5 text-right font-semibold">BOR</th>
          </tr>
        </thead>
        <tbody>
          {okupansi.map((k) => (
            <tr key={k.kelas} className="border-b border-border last:border-b-0">
              <th scope="row" className="py-1 font-normal text-text">Kelas {k.kelas}</th>
              <td className="py-1 text-right text-text">{formatJumlah(k.terisi)}</td>
              <td className="py-1 text-right text-text">{formatJumlah(k.total)}</td>
              <td className="py-1 text-right text-text">{formatJumlah(k.bor)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
