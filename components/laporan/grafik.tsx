"use client";

import { formatJumlah, formatRupiah, formatTanggal } from "@/lib/format";
import type { OkupansiKelas, TitikPendapatan } from "@/lib/domain/laporan";

/**
 * Grafik garis tanpa pustaka chart. Bentuk visual hanya pelengkap: label sumbu
 * dan tabel nilai di bawahnya membuat angka terbaca oleh pembaca layar dan
 * pengguna yang tidak dapat membedakan warna atau bentuk.
 *
 * Garis, bukan batang: yang ditanyakan Pimpinan adalah arah pendapatan, dan
 * garis menyambung hari-hari tanpa transaksi (Rp0) sebagai titik nol, bukan
 * sebagai celah yang menganga seperti pada batang.
 */
const LEBAR = 720;
const TINGGI = 190;
/** Ruang kiri untuk label sumbu Y; tanpa ini labelnya menimpa garis pertama. */
const PAD_KIRI = 72;
const PAD_KANAN = 12;
const PAD_ATAS = 12;
const PAD_BAWAH = 26;
const PLOT_LEBAR = LEBAR - PAD_KIRI - PAD_KANAN;
const PLOT_TINGGI = TINGGI - PAD_ATAS - PAD_BAWAH;
/** Jendela rata-rata bergerak; 7 hari cukup untuk meredam lonjakan harian. */
const JENDELA = 7;

export function GrafikTrenPendapatan({ tren }: { tren: TitikPendapatan[] }) {
  const total = tren.reduce((n, t) => n + t.jumlah, 0);
  const puncak = Math.max(...tren.map((t) => t.jumlah), 1);
  // Skala dibulatkan ke satu angka penting supaya label sumbu enak dibaca.
  const pangkat = 10 ** Math.floor(Math.log10(puncak));
  const maks = Math.ceil(puncak / pangkat) * pangkat;

  const x = (index: number) =>
    tren.length === 1 ? PAD_KIRI + PLOT_LEBAR / 2 : PAD_KIRI + (index / (tren.length - 1)) * PLOT_LEBAR;
  const y = (nilai: number) => PAD_ATAS + PLOT_TINGGI - (nilai / maks) * PLOT_TINGGI;
  const garisDasar = y(0);

  const titik = tren.map((t, i) => `${x(i)},${y(t.jumlah)}`).join(" ");
  const area = `M ${x(0)},${garisDasar} L ${tren.map((t, i) => `${x(i)},${y(t.jumlah)}`).join(" L ")} L ${x(tren.length - 1)},${garisDasar} Z`;

  // Jendela yang belum penuh di awal dihitung dari hari yang ada saja, bukan
  // dianggap nol: membagi dengan 7 saat baru 2 hari terisi membuat garis
  // rata-rata terjun ke bawah lalu naik lagi — penurunan yang tidak pernah
  // terjadi. Dengan pembagi sebenarnya, garis mulai tepat di titik pertama dan
  // menjadi rata-rata 7 hari penuh pada hari ketujuh.
  const rataRata = tren.map((_, i) => {
    const jendela = tren.slice(Math.max(0, i - JENDELA + 1), i + 1);
    return jendela.reduce((n, t) => n + t.jumlah, 0) / jendela.length;
  });
  const titikRataRata = rataRata.map((n, i) => `${x(i)},${y(n)}`).join(" ");

  const hariIni = tren.length - 1;
  const labelY = [
    { nilai: maks, teks: formatRupiah(maks) },
    { nilai: maks / 2, teks: formatRupiah(maks / 2) },
    { nilai: 0, teks: "Rp0" },
  ];
  // Hanya hari ini dan puncaknya yang diberi nilai langsung; sisanya lewat tabel.
  const puncakHari = tren.reduce((a, b) => (b.jumlah > a.jumlah ? b : a), tren[0]!);

  return (
    <div>
      <svg
        viewBox={`0 0 ${LEBAR} ${TINGGI}`}
        role="img"
        aria-label={`Tren pendapatan ${tren.length} hari terakhir, tertinggi ${formatRupiah(puncak)}, total ${formatRupiah(total)}`}
        className="h-auto w-full"
      >
        <title>Tren pendapatan {tren.length} hari terakhir</title>

        {labelY.map((l) => (
          <g key={l.nilai}>
            <line
              x1={PAD_KIRI}
              y1={y(l.nilai)}
              x2={LEBAR - PAD_KANAN}
              y2={y(l.nilai)}
              stroke="var(--color-border)"
              strokeDasharray={l.nilai === 0 ? undefined : "3 5"}
            />
            <text x={PAD_KIRI - 10} y={y(l.nilai) + 4} fontSize="11" textAnchor="end" fill="var(--color-text-muted)">
              {l.teks}
            </text>
          </g>
        ))}

        {/* Isian lembut di bawah garis; warnanya sama, hanya lebih pudar. */}
        <path d={area} fill="var(--color-primary)" fillOpacity="0.12" />
        <polyline points={titik} fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {titikRataRata ? (
          <polyline
            points={titikRataRata}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="1.5"
            strokeDasharray="5 4"
            strokeLinecap="round"
          />
        ) : null}
        {tren.map((t, i) => (
          <circle key={t.tanggal} cx={x(i)} cy={y(t.jumlah)} r={i === hariIni ? 4 : 2} fill="var(--color-primary)">
            <title>
              {formatTanggal(t.tanggal)}: {formatRupiah(t.jumlah)}
            </title>
          </circle>
        ))}

        {/* Nilai puncak diberi label langsung supaya skalanya berarti. Bila
            puncak menyentuh tepi atas, label ditaruh di bawah titik agar tidak
            menempel garis kisi; di ujung, digeser ke dalam agar tidak terpotong. */}
        <text
          x={Math.min(Math.max(x(tren.indexOf(puncakHari)), PAD_KIRI + 30), LEBAR - PAD_KANAN - 40)}
          y={y(puncakHari.jumlah) - PAD_ATAS < 16 ? y(puncakHari.jumlah) + 15 : y(puncakHari.jumlah) - 8}
          fontSize="11"
          textAnchor="middle"
          fill="var(--color-text)"
          fontWeight="600"
        >
          {formatRupiah(puncakHari.jumlah)}
        </text>

        {/* Hari ini ditandai oleh label sumbu kanan dan titik yang lebih besar. */}

        {/* Label sumbu X: awal, tengah, dan akhir jendela agar tidak menumpuk.
            Ujung kanan sekaligus menandai hari ini — lebih baik daripada teks
            tambahan yang bertabrakan dengan label tanggal. */}
        {[0, Math.floor((tren.length - 1) / 2), tren.length - 1].map((index) => (
          <text
            key={index}
            x={x(index)}
            y={TINGGI - 6}
            fontSize="11"
            textAnchor={index === 0 ? "start" : index === tren.length - 1 ? "end" : "middle"}
            fill={index === tren.length - 1 ? "var(--color-primary)" : "var(--color-text-muted)"}
            fontWeight={index === tren.length - 1 ? "600" : undefined}
          >
            {index === tren.length - 1 ? "Hari ini · " : ""}
            {formatTanggal(tren[index]!.tanggal)}
          </text>
        ))}
      </svg>

      {/* Keterangan garis; tanpa ini garis putus-putus tidak berarti apa pun. */}
      <ul role="list" className="mt-2 flex flex-wrap items-center gap-4 text-caption text-text-muted">
        <li className="flex items-center gap-1.5">
          <span className="h-0.5 w-5 rounded-full bg-primary" aria-hidden="true" />
          Pendapatan harian
        </li>
        <li className="flex items-center gap-1.5">
          <span
            className="h-0.5 w-5 rounded-full bg-accent"
            style={{ backgroundImage: "repeating-linear-gradient(to right, currentColor 0 3px, transparent 3px 6px)" }}
            aria-hidden="true"
          />
          Rata-rata {JENDELA} hari
        </li>
      </ul>

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
