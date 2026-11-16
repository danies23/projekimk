"use client";

import { useEffect, useRef, useState } from "react";
import { Wordmark } from "@/components/brand/wordmark";
import { useSesi } from "@/components/shell/sesi-provider";
import { useHariIni, useSelector, useStoreDemo } from "@/components/shell/store-provider";
import { boleh } from "@/lib/domain/izin";
import {
  daftarTagihan,
  nilaiTagihan,
  rincianTagihan,
  riwayatPembayaran,
  ringkasanKasir,
  type BarisTagihan,
  type RincianTagihan,
} from "@/lib/domain/tagihan";
import type { Hasil, Id, MetodePembayaran, StatusTagihan } from "@/lib/domain/types";
import { formatJumlah, formatRupiah, formatTanggal, formatTanggalWaktu } from "@/lib/format";

/** Warna status melengkapi teks, bukan menggantikannya (WCAG 1.4.1). */
const WARNA_STATUS: Record<StatusTagihan, string> = {
  "belum bayar": "text-danger",
  sebagian: "text-warning",
  lunas: "text-success",
};

const LABEL_METODE: Record<MetodePembayaran, string> = {
  tunai: "Tunai",
  transfer: "Transfer",
  debit: "Debit",
};

const METODE: MetodePembayaran[] = ["tunai", "transfer", "debit"];

/** Dokumen pengganti isi halaman, dengan tombol Cetak yang memanggil dialog peramban. */
type Dokumen = { jenis: "rincian"; tagihanId: Id } | { jenis: "kuitansi"; pembayaranId: Id };

/**
 * Modul Kasir: daftar tagihan, rincian per jenis biaya, pencatatan pembayaran,
 * dan pratinjau cetak. Angka berasal dari `rincianTagihan` dan `nilaiTagihan`
 * yang sama dengan yang dipakai checkout, jadi status tagihan tidak pernah
 * dihitung dua kali dengan cara berbeda.
 */
export default function HalamanKasir() {
  const { pengguna } = useSesi();
  const store = useStoreDemo();
  const state = useSelector((s) => s);
  const hariIni = useHariIni();

  const [tagihanId, setTagihanId] = useState<Id | null>(null);
  const [dokumen, setDokumen] = useState<Dokumen | null>(null);
  const [pengumuman, setPengumuman] = useState("");
  const judulDetail = useRef<HTMLHeadingElement>(null);

  // Memilih tagihan mengganti panel kanan; fokus pindah ke judulnya agar
  // pengguna keyboard tidak tertinggal di daftar (WCAG 2.4.3).
  useEffect(() => {
    if (tagihanId) judulDetail.current?.focus();
  }, [tagihanId]);

  if (!pengguna) return null;

  /** Penolakan pembayaran ditampilkan di kolom jumlah oleh `FormPembayaran`, bukan di sini. */
  function catatPembayaran(target: Id, jumlah: number, metode: MetodePembayaran): Hasil {
    const hasil = store.dispatch({ type: "pembayaran/dicatat", olehId: pengguna!.id, tagihanId: target, jumlah, metode });
    if (!hasil.ok) return hasil;
    const sisa = nilaiTagihan(store.getState(), target, hariIni).sisa;
    setPengumuman(
      sisa === 0
        ? `Pembayaran ${formatRupiah(jumlah)} dicatat. Tagihan lunas.`
        : `Pembayaran ${formatRupiah(jumlah)} dicatat. Sisa tagihan ${formatRupiah(sisa)}.`,
    );
    return hasil;
  }

  if (dokumen) {
    return (
      <PratinjauCetak dokumen={dokumen} hariIni={hariIni} onTutup={() => setDokumen(null)} />
    );
  }

  const daftar = daftarTagihan(state, hariIni);
  const dipilih = tagihanId ? daftar.find((b) => b.tagihanId === tagihanId) ?? null : null;

  return (
    <div>
      <header>
        <h1 className="text-heading">Kasir</h1>
        <p className="mt-2 max-w-prose text-body text-text-muted">
          Tagihan terkumpul otomatis dari biaya kamar, tindakan, dan obat yang sudah diserahkan.
          Catat pembayaran sebagian atau penuh, lalu cetak kuitansi sebagai bukti bayar.
        </p>
      </header>

      <p role="status" className="sr-only">
        {pengumuman}
      </p>

      <RingkasanPendapatan ringkasan={ringkasanKasir(state, pengguna.id, hariIni)} />

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <DaftarTagihan
          daftar={daftar}
          dipilihId={tagihanId}
          onPilih={setTagihanId}
        />

        {dipilih ? (
          <DetailTagihan
            key={dipilih.tagihanId}
            baris={dipilih}
            hariIni={hariIni}
            bolehBayar={boleh(pengguna.peran, "pembayaran.catat")}
            bolehCheckout={boleh(pengguna.peran, "checkout.lakukan")}
            bolehOverride={boleh(pengguna.peran, "checkout.override")}
            judulRef={judulDetail}
            onBukaDokumen={setDokumen}
            onCatat={(jumlah, metode) => catatPembayaran(dipilih.tagihanId, jumlah, metode)}
            onPengumuman={setPengumuman}
          />
        ) : (
          <section className="rounded-lg border border-border bg-surface-muted p-6">
            <h2 className="text-title">Pilih tagihan</h2>
            <p className="mt-2 text-small text-text-muted">
              Pilih satu tagihan dari daftar untuk melihat rincian kamar, tindakan, dan obat, lalu
              mencatat pembayaran.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

function RingkasanPendapatan({ ringkasan }: { ringkasan: ReturnType<typeof ringkasanKasir> }) {
  const baris: Array<[string, string]> = [
    ["Pendapatan hari ini", formatRupiah(ringkasan.hariIni)],
    ["Total diterima kasir ini", formatRupiah(ringkasan.total)],
    ["Transaksi tercatat", `${formatJumlah(ringkasan.transaksi)} pembayaran`],
  ];
  return (
    <section aria-label="Ringkasan pendapatan" className="mt-6 rounded-lg border border-border bg-surface p-5 shadow-sm">
      <h2 className="text-title">Ringkasan pendapatan</h2>
      <dl className="mt-3 grid gap-4 sm:grid-cols-3">
        {baris.map(([label, nilai]) => (
          <div key={label}>
            <dt className="text-small text-text-muted">{label}</dt>
            <dd className="mt-1 font-serif text-title font-semibold text-text">{nilai}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-caption text-text-muted">
        Dihitung dari seluruh pembayaran yang tercatat atas nama kasir ini, termasuk data demo awal.
      </p>
    </section>
  );
}

function DaftarTagihan({
  daftar,
  dipilihId,
  onPilih,
}: {
  daftar: BarisTagihan[];
  dipilihId: Id | null;
  onPilih: (tagihanId: Id) => void;
}) {
  return (
    <section aria-label="Daftar tagihan" className="self-start rounded-lg border border-border bg-surface p-4 shadow-sm">
      <h2 className="text-title">Daftar tagihan</h2>
      <p className="mt-1 text-caption text-text-muted">
        Tagihan yang belum lunas tampil lebih dulu. Jumlah {formatJumlah(daftar.length)} tagihan.
      </p>

      {daftar.length === 0 ? (
        <p className="mt-3 rounded-md border border-border bg-surface-muted p-3 text-caption text-text-muted">
          Belum ada tagihan. Tagihan dibuat otomatis saat pasien didaftarkan.
        </p>
      ) : (
        <ul role="list" className="mt-3 max-h-[32rem] space-y-2 overflow-y-auto">
          {daftar.map((b) => (
            <li key={b.tagihanId}>
              <button
                type="button"
                onClick={() => onPilih(b.tagihanId)}
                aria-current={dipilihId === b.tagihanId ? "true" : undefined}
                className={`w-full rounded-md border px-3 py-2 text-left transition-colors ${
                  dipilihId === b.tagihanId
                    ? "border-primary bg-primary-soft"
                    : "border-border hover:border-primary hover:bg-primary-soft"
                }`}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-small font-semibold text-text">{b.pasien.nama}</span>
                  <span className={`text-caption font-semibold ${WARNA_STATUS[b.nilai.status]}`}>
                    {b.nilai.status}
                  </span>
                </span>
                <span className="block text-caption text-text-muted">
                  {b.pasien.nomorRM}
                  <span className="mx-1.5" aria-hidden="true">·</span>
                  {b.kodeBed} {b.namaKamar}
                  {b.statusAdmisi === "selesai" ? " · admisi selesai" : ""}
                </span>
                <span className="block text-caption text-text-muted">
                  Total {formatRupiah(b.nilai.total)} · sisa {formatRupiah(b.nilai.sisa)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function DetailTagihan({
  baris,
  hariIni,
  bolehBayar,
  bolehCheckout,
  bolehOverride,
  judulRef,
  onBukaDokumen,
  onCatat,
  onPengumuman,
}: {
  baris: BarisTagihan;
  hariIni: string;
  bolehBayar: boolean;
  bolehCheckout: boolean;
  bolehOverride: boolean;
  judulRef: React.Ref<HTMLHeadingElement>;
  onBukaDokumen: (dokumen: Dokumen) => void;
  onCatat: (jumlah: number, metode: MetodePembayaran) => Hasil;
  onPengumuman: (pesan: string) => void;
}) {
  const state = useSelector((s) => s);
  const rincian = rincianTagihan(state, baris.tagihanId, hariIni);
  const riwayat = riwayatPembayaran(state, baris.tagihanId);

  if (!rincian) {
    return (
      <section className="rounded-lg border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-title">Rincian tagihan tidak ditemukan</h2>
        <p className="mt-2 text-small text-text-muted">
          Data tagihan tidak lagi tersedia, mungkin karena data demo direset. Pilih tagihan lain.
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Rincian tagihan" className="rounded-lg border border-border bg-surface p-6 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 ref={judulRef} tabIndex={-1} className="text-title">Tagihan {baris.pasien.nama}</h2>
          <p className="mt-1 text-small text-text-muted">
            {baris.pasien.nomorRM}
            <span className="mx-1.5" aria-hidden="true">·</span>
            {baris.kodeBed} {baris.namaKamar}
            <span className="mx-1.5" aria-hidden="true">·</span>
            Masuk {formatTanggal(baris.tanggalMasuk)}
          </p>
        </div>
        <p className={`text-small font-semibold ${WARNA_STATUS[baris.nilai.status]}`}>{baris.nilai.status}</p>
      </header>

      <p className="mt-4 text-small text-text">
        Lama inap <span className="font-semibold">{formatJumlah(rincian.lamaInap)} hari</span>
        <span className="text-text-muted">
          {baris.statusAdmisi === "selesai"
            ? " (termasuk hari masuk dan hari pulang)."
            : " (termasuk hari masuk dan hari ini)."}
        </span>
      </p>

      <BagianKamar rincian={rincian} />
      <BagianTindakan rincian={rincian} />
      <BagianObat rincian={rincian} />

      <dl className="mt-5 grid gap-2 border-t border-border pt-4 text-small sm:grid-cols-2">
        <BarisNilai label="Subtotal kamar" nilai={formatRupiah(rincian.subtotalKamar)} />
        <BarisNilai label="Subtotal tindakan" nilai={formatRupiah(rincian.subtotalTindakan)} />
        <BarisNilai label="Subtotal obat" nilai={formatRupiah(rincian.subtotalObat)} />
        <BarisNilai label="Total tagihan" nilai={formatRupiah(baris.nilai.total)} tebal />
        <BarisNilai label="Sudah dibayar" nilai={formatRupiah(baris.nilai.dibayar)} />
        <BarisNilai label="Sisa tagihan" nilai={formatRupiah(baris.nilai.sisa)} tebal />
      </dl>

      <div className="mt-5">
        <button
          type="button"
          onClick={() => onBukaDokumen({ jenis: "rincian", tagihanId: baris.tagihanId })}
          className={tombolSekunder}
        >
          Pratinjau rincian tagihan
        </button>
      </div>

      {bolehBayar ? (
        <FormPembayaran
          sisa={baris.nilai.sisa}
          lunas={baris.nilai.status === "lunas"}
          onCatat={onCatat}
        />
      ) : (
        <p className="mt-5 rounded-md border border-border bg-surface-muted px-3 py-2 text-small text-text-muted">
          Peran Anda dapat melihat tagihan tetapi tidak mencatat pembayaran.
        </p>
      )}

      <RiwayatPembayaranTagihan
        riwayat={riwayat}
        onBukaKuitansi={(pembayaranId) => onBukaDokumen({ jenis: "kuitansi", pembayaranId })}
      />

      <section aria-label="Checkout pasien" className="mt-6">
        <h3 className="text-small font-semibold text-text">Checkout</h3>
        <Checkout
          admisiId={rincian.admisiId}
          baris={baris}
          bolehCheckout={bolehCheckout}
          bolehOverride={bolehOverride}
          onPengumuman={onPengumuman}
        />
      </section>
    </section>
  );
}

/**
 * Checkout hanya dijalankan setelah tagihan lunas. Admin dapat membuka blokir
 * itu dengan alasan; aturan siapa yang boleh dan alasan wajib tetap di store,
 * layar hanya menampilkan pesan penolakannya.
 */
function Checkout({
  admisiId,
  baris,
  bolehCheckout,
  bolehOverride,
  onPengumuman,
}: {
  admisiId: Id;
  baris: BarisTagihan;
  bolehCheckout: boolean;
  bolehOverride: boolean;
  onPengumuman: (pesan: string) => void;
}) {
  const store = useStoreDemo();
  const { pengguna } = useSesi();
  const state = useSelector((s) => s);
  const [alasan, setAlasan] = useState("");
  const [bukaOverride, setBukaOverride] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  // Panel berubah setelah checkout berhasil; fokus dipindah ke judulnya agar
  // pengguna keyboard tidak kembali ke awal dokumen (WCAG 2.4.3).
  const judulCheckout = useRef<HTMLHeadingElement>(null);

  if (!pengguna) return null;

  const admisi = state.admisi.find((a) => a.id === admisiId);
  const sudahSelesai = baris.statusAdmisi === "selesai";
  const override = admisi?.overrideCheckout ?? null;
  const overrideOleh = override ? state.pengguna.find((p) => p.id === override.olehId) : undefined;
  const belumLunas = baris.nilai.status !== "lunas";

  function jalankan(pakaiOverride: boolean) {
    const hasil = store.dispatch({
      type: "checkout",
      olehId: pengguna!.id,
      admisiId,
      override: pakaiOverride ? { alasan } : null,
    });
    if (!hasil.ok) {
      setGalat(hasil.alasan);
      return;
    }
    setGalat(null);
    setBukaOverride(false);
    setAlasan("");
    onPengumuman(
      pakaiOverride
        ? `Admisi ${baris.pasien.nama} ditutup dengan override. Alasan tercatat di audit log.`
        : `Admisi ${baris.pasien.nama} ditutup. Bed ${baris.kodeBed} menunggu dibersihkan.`,
    );
    // Setelah re-render, tombol pemicu sudah hilang; arahkan fokus ke judul panel.
    requestAnimationFrame(() => judulCheckout.current?.focus());
  }

  // Riwayat administrasi admisi: cara keluar dan, bila lewat override, alasannya.
  const riwayat = (
    <dl className="mt-3 grid gap-2 border-t border-border pt-3 text-small">
      <div className="flex items-baseline justify-between gap-3">
        <dt className="text-text-muted">Status admisi</dt>
        <dd className="font-medium text-text">{sudahSelesai ? "Selesai" : "Aktif (masih dirawat)"}</dd>
      </div>
      {sudahSelesai ? (
        <div className="grid gap-1">
          <dt className="text-text-muted">Checkout</dt>
          <dd className="text-text">
            {override ? (
              <>
                Lewat override oleh {overrideOleh?.nama ?? "Admin tidak dikenal"}: <span className="font-medium">“{override.alasan}”</span>
              </>
            ) : (
              "Checkout normal setelah tagihan lunas."
            )}
          </dd>
        </div>
      ) : null}
    </dl>
  );

  if (!bolehCheckout) {
    return (
      <>
        <p className="mt-2 rounded-md border border-border bg-surface-muted px-3 py-2 text-small text-text-muted">
          Peran Anda dapat melihat tagihan tetapi tidak melakukan checkout.
        </p>
        {riwayat}
      </>
    );
  }

  if (sudahSelesai) {
    return (
      <>
        <h4 ref={judulCheckout} tabIndex={-1} className="sr-only">
          Status checkout
        </h4>
        <p className="mt-2 text-small text-text-muted">
          Admisi ini sudah ditutup; pasien tidak lagi muncul di daftar admisi aktif.
        </p>
        {riwayat}
      </>
    );
  }

  return (
    <>
      <h4 ref={judulCheckout} tabIndex={-1} className="sr-only">
        Status checkout
      </h4>
      {belumLunas ? (
        <p className="mt-2 rounded-md border border-warning px-3 py-2 text-small text-warning">
          Checkout diblokir karena tagihan belum lunas. Catat pelunasan di kolom pembayaran di atas,
          atau minta Admin melakukan override dengan alasan.
        </p>
      ) : (
        <p className="mt-2 text-small text-text-muted">
          Tagihan lunas. Checkout menutup admisi dan mengubah bed menjadi dibersihkan.
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-3">
        <button type="button" onClick={() => jalankan(false)} disabled={belumLunas} className={`${tombolUtama} disabled:cursor-not-allowed disabled:opacity-60`}>
          Checkout pasien
        </button>
        {/* Override hanya dirender untuk pemegang izinnya; peran lain tidak melihatnya sama sekali. */}
        {bolehOverride && belumLunas ? (
          <button type="button" onClick={() => setBukaOverride(!bukaOverride)} className={tombolSekunder}>
            {bukaOverride ? "Batal override" : "Override checkout"}
          </button>
        ) : null}
      </div>

      {/* Penolakan checkout normal (mis. admisi sudah ditutup di tab lain). */}
      {galat && !bukaOverride ? (
        <p role="alert" className="mt-3 rounded-md border border-danger px-3 py-2 text-small text-danger">
          {galat}
        </p>
      ) : null}

      {bolehOverride && belumLunas && bukaOverride ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            jalankan(true);
          }}
          className="mt-3 rounded-md border border-border bg-surface-muted p-4"
        >
          <label htmlFor="alasan-override" className="block text-small font-medium text-text">
            Alasan override (wajib)
          </label>
          <textarea
            id="alasan-override"
            value={alasan}
            rows={2}
            onChange={(e) => {
              setGalat(null);
              setAlasan(e.target.value);
            }}
            aria-invalid={galat ? true : undefined}
            aria-describedby={galat ? "alasan-override-galat" : "alasan-override-bantuan"}
            className="mt-1 w-full rounded-md border border-border bg-canvas px-3 py-2 text-body text-text"
          />
          {galat ? (
            <p id="alasan-override-galat" role="alert" className="mt-1 text-caption text-danger">
              {galat}
            </p>
          ) : null}
          <p id="alasan-override-bantuan" className="mt-1 text-caption text-text-muted">
            Override menutup admisi meski tagihan belum lunas. Alasan dan nama Admin tercatat di audit log.
          </p>
          <button type="submit" className={`mt-3 ${tombolUtama}`}>
            Checkout dengan override
          </button>
        </form>
      ) : null}

      {riwayat}
    </>
  );
}

function BagianKamar({ rincian }: { rincian: RincianTagihan }) {
  return (
    <section aria-label="Biaya kamar" className="mt-5">
      <h3 className="text-small font-semibold text-text">Biaya kamar</h3>
      <table className="mt-2 w-full text-small">
        <caption className="sr-only">Segmen masa inap beserta lama hari, tarif harian, dan subtotal</caption>
        <thead>
          <tr className="border-b border-border text-left">
            <th scope="col" className="py-2 font-semibold">Kamar</th>
            <th scope="col" className="py-2 font-semibold">Periode</th>
            <th scope="col" className="py-2 text-right font-semibold">Lama</th>
            <th scope="col" className="py-2 text-right font-semibold">Tarif/hari</th>
            <th scope="col" className="py-2 text-right font-semibold">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {rincian.kamar.map((b, index) => (
            <tr key={`${b.bedId}-${index}`} className="border-b border-border last:border-b-0">
              <th scope="row" className="py-2 text-left font-medium text-text">
                {b.namaKamar}
                <span className="block text-caption font-normal text-text-muted">Kelas {b.kelas}</span>
              </th>
              <td className="py-2 text-text-muted">
                {formatTanggal(b.dari)} – {formatTanggal(b.sampai)}
              </td>
              <td className="py-2 text-right text-text">{formatJumlah(b.lamaHari)} hari</td>
              <td className="py-2 text-right text-text">{formatRupiah(b.tarifHarian)}</td>
              <td className="py-2 text-right text-text">{formatRupiah(b.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function BagianTindakan({ rincian }: { rincian: RincianTagihan }) {
  return (
    <section aria-label="Biaya tindakan" className="mt-5">
      <h3 className="text-small font-semibold text-text">Biaya tindakan</h3>
      {rincian.tindakan.length === 0 ? (
        <p className="mt-2 text-caption text-text-muted">Belum ada tindakan yang dicatat pada admisi ini.</p>
      ) : (
        <table className="mt-2 w-full text-small">
          <caption className="sr-only">Tindakan beserta waktu, kuantitas, tarif, dan subtotal</caption>
          <thead>
            <tr className="border-b border-border text-left">
              <th scope="col" className="py-2 font-semibold">Tindakan</th>
              <th scope="col" className="py-2 font-semibold">Waktu</th>
              <th scope="col" className="py-2 text-right font-semibold">Kuantitas</th>
              <th scope="col" className="py-2 text-right font-semibold">Tarif</th>
              <th scope="col" className="py-2 text-right font-semibold">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {rincian.tindakan.map((t) => (
              <tr key={t.id} className="border-b border-border last:border-b-0">
                <th scope="row" className="py-2 text-left font-medium text-text">{t.nama}</th>
                <td className="py-2 text-text-muted">{formatTanggalWaktu(t.waktu)}</td>
                {/* Tindakan dicatat sekali per baris, jadi kuantitasnya selalu 1. */}
                <td className="py-2 text-right text-text">1</td>
                <td className="py-2 text-right text-text">{formatRupiah(t.tarif)}</td>
                <td className="py-2 text-right text-text">{formatRupiah(t.tarif)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function BagianObat({ rincian }: { rincian: RincianTagihan }) {
  return (
    <section aria-label="Biaya obat" className="mt-5">
      <h3 className="text-small font-semibold text-text">Biaya obat</h3>
      {rincian.obat.length === 0 ? (
        <p className="mt-2 text-caption text-text-muted">
          Belum ada obat yang diserahkan. Obat hanya ditagih setelah apoteker menyerahkannya.
        </p>
      ) : (
        <table className="mt-2 w-full text-small">
          <caption className="sr-only">Obat yang diserahkan beserta jumlah, satuan, harga, dan subtotal</caption>
          <thead>
            <tr className="border-b border-border text-left">
              <th scope="col" className="py-2 font-semibold">Obat</th>
              <th scope="col" className="py-2 text-right font-semibold">Jumlah</th>
              <th scope="col" className="py-2 text-right font-semibold">Harga</th>
              <th scope="col" className="py-2 text-right font-semibold">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {rincian.obat.map((o, index) => (
              <tr key={`${o.id}-${index}`} className="border-b border-border last:border-b-0">
                <th scope="row" className="py-2 text-left font-medium text-text">{o.nama}</th>
                <td className="py-2 text-right text-text">
                  {formatJumlah(o.jumlah)} {o.satuan}
                </td>
                <td className="py-2 text-right text-text">{formatRupiah(o.harga)}</td>
                <td className="py-2 text-right text-text">{formatRupiah(o.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function BarisNilai({ label, nilai, tebal }: { label: string; nilai: string; tebal?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border pb-1.5">
      <dt className="text-text-muted">{label}</dt>
      <dd className={tebal ? "font-semibold text-text" : "text-text"}>{nilai}</dd>
    </div>
  );
}

function FormPembayaran({
  sisa,
  lunas,
  onCatat,
}: {
  sisa: number;
  lunas: boolean;
  onCatat: (jumlah: number, metode: MetodePembayaran) => Hasil;
}) {
  const [jumlah, setJumlah] = useState("");
  const [metode, setMetode] = useState<MetodePembayaran>("tunai");
  const [galatKolom, setGalatKolom] = useState<string | undefined>();

  // Kasir mengetik rupiah dengan pemisah ribuan Indonesia ("1.500.000"),
  // persis seperti `formatRupiah` menampilkannya. `Number` membaca satu titik
  // sebagai desimal, sehingga tanpa ini "500.000" menjadi Rp500.
  const nilai = Number(jumlah.replace(/[^\d]/g, ""));
  // Kelebihan bayar tidak dilarang, tetapi kasir harus melihat akibatnya lebih
  // dulu: peringatan tampil dan label tombol berubah sebelum ditekan.
  const kelebihan = jumlah !== "" && nilai > sisa ? nilai - sisa : 0;

  if (lunas) {
    return (
      <p className="mt-5 rounded-md border border-success px-3 py-2 text-small text-success">
        Tagihan ini sudah lunas. Pembayaran tambahan ditolak agar tidak terjadi pembayaran ganda.
      </p>
    );
  }

  function simpan(e: React.FormEvent) {
    e.preventDefault();
    // Store tetap penjaga terakhir: pesannya (termasuk "harus bilangan bulat
    // lebih dari nol") ditampilkan pada kolom jumlah, bukan diulang di sini.
    const hasil = onCatat(nilai, metode);
    setGalatKolom(hasil.ok ? undefined : hasil.alasan);
    // Isian hanya dikosongkan bila store menerima; kalau ditolak, kasir dapat
    // memperbaiki angkanya tanpa mengetik ulang.
    if (hasil.ok) setJumlah("");
  }

  return (
    <form onSubmit={simpan} className="mt-5 rounded-md border border-border bg-surface-muted p-4">
      <h3 className="text-small font-semibold text-text">Catat pembayaran</h3>
      <p className="mt-1 text-caption text-text-muted">
        Pembayaran sebagian diperbolehkan. Status tagihan berubah otomatis setelah disimpan.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="pembayaran-jumlah" className="block text-small font-medium text-text">
            Jumlah dibayar (Rp)
          </label>
          <input
            id="pembayaran-jumlah"
            type="text"
            inputMode="numeric"
            value={jumlah}
            placeholder="Contoh: 1.500.000"
            onChange={(e) => {
              setGalatKolom(undefined);
              setJumlah(e.target.value);
            }}
            aria-invalid={galatKolom ? true : undefined}
            aria-describedby={galatKolom ? "pembayaran-jumlah-galat" : "pembayaran-jumlah-sisa"}
            className="mt-1 min-h-11 w-full rounded-md border border-border bg-canvas px-3 text-body text-text"
          />
          {galatKolom ? (
            <p id="pembayaran-jumlah-galat" role="alert" className="mt-1 text-caption text-danger">
              {galatKolom}
            </p>
          ) : null}
          <p id="pembayaran-jumlah-sisa" className="mt-1 text-caption text-text-muted">
            Sisa tagihan {formatRupiah(sisa)}. Titik pemisah ribuan boleh dipakai.
          </p>
        </div>

        <fieldset>
          <legend className="block text-small font-medium text-text">Metode pembayaran</legend>
          <div className="mt-1 flex flex-wrap gap-3">
            {METODE.map((m) => (
              <label key={m} className="inline-flex min-h-11 items-center gap-2 text-small text-text">
                <input
                  type="radio"
                  name="metode-pembayaran"
                  value={m}
                  checked={metode === m}
                  onChange={() => setMetode(m)}
                  className="size-4 accent-primary"
                />
                {LABEL_METODE[m]}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {kelebihan > 0 ? (
        <p role="alert" className="mt-3 rounded-md border border-warning px-3 py-2 text-small text-warning">
          Jumlah melebihi sisa tagihan sebesar {formatRupiah(kelebihan)}. Tekan tombol di bawah bila
          kelebihan ini memang diterima.
        </p>
      ) : null}

      <button type="submit" className={`mt-4 ${tombolUtama}`}>
        {kelebihan > 0 ? "Catat pembayaran dengan kelebihan" : "Catat pembayaran"}
      </button>
    </form>
  );
}

function RiwayatPembayaranTagihan({
  riwayat,
  onBukaKuitansi,
}: {
  riwayat: ReturnType<typeof riwayatPembayaran>;
  onBukaKuitansi: (pembayaranId: Id) => void;
}) {
  return (
    <section aria-label="Riwayat pembayaran" className="mt-6">
      <h3 className="text-small font-semibold text-text">Riwayat pembayaran</h3>
      {riwayat.length === 0 ? (
        <p className="mt-2 text-caption text-text-muted">Belum ada pembayaran pada tagihan ini.</p>
      ) : (
        <table className="mt-2 w-full text-small">
          <caption className="sr-only">Pembayaran beserta waktu, jumlah, metode, kasir, dan kuitansi</caption>
          <thead>
            <tr className="border-b border-border text-left">
              <th scope="col" className="py-2 font-semibold">Waktu</th>
              <th scope="col" className="py-2 text-right font-semibold">Jumlah</th>
              <th scope="col" className="py-2 font-semibold">Metode</th>
              <th scope="col" className="py-2 font-semibold">Kasir</th>
              <th scope="col" className="py-2 font-semibold">
                <span className="sr-only">Kuitansi</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {riwayat.map(({ pembayaran, kasir }) => (
              <tr key={pembayaran.id} className="border-b border-border last:border-b-0">
                <th scope="row" className="py-2 text-left font-medium text-text">
                  {formatTanggalWaktu(pembayaran.waktu)}
                </th>
                <td className="py-2 text-right text-text">{formatRupiah(pembayaran.jumlah)}</td>
                <td className="py-2 text-text">{LABEL_METODE[pembayaran.metode]}</td>
                <td className="py-2 text-text">{kasir?.nama ?? "Kasir tidak dikenal"}</td>
                <td className="py-2 text-right">
                  <button
                    type="button"
                    onClick={() => onBukaKuitansi(pembayaran.id)}
                    className="inline-flex min-h-11 items-center rounded-md px-2 text-small font-semibold text-primary hover:underline"
                  >
                    Kuitansi<span className="sr-only"> {formatRupiah(pembayaran.jumlah)}</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

/**
 * Pratinjau cetak kuitansi dan rincian tagihan. Menggantikan isi halaman seperti
 * bukti pendaftaran, supaya menu dan tombol tidak ikut tercetak (spec: dokumen
 * bukan berkas PDF terpisah).
 */
function PratinjauCetak({
  dokumen,
  hariIni,
  onTutup,
}: {
  dokumen: Dokumen;
  hariIni: string;
  onTutup: () => void;
}) {
  const state = useSelector((s) => s);
  const judulRef = useRef<HTMLHeadingElement>(null);
  // Pratinjau menggantikan seluruh isi halaman; fokus harus ikut pindah atau
  // pengguna keyboard kembali ke awal dokumen (WCAG 2.4.3).
  useEffect(() => judulRef.current?.focus(), []);
  const pembayaran =
    dokumen.jenis === "kuitansi" ? state.pembayaran.find((p) => p.id === dokumen.pembayaranId) : undefined;
  const tagihanId = dokumen.jenis === "rincian" ? dokumen.tagihanId : pembayaran?.tagihanId;
  const rincian = tagihanId ? rincianTagihan(state, tagihanId, hariIni) : null;
  const admisi = rincian ? state.admisi.find((a) => a.id === rincian.admisiId) : undefined;
  const pasien = admisi ? state.pasien.find((p) => p.id === admisi.pasienId) : undefined;

  if (!rincian || !tagihanId || !admisi || !pasien) {
    return (
      <section className="max-w-prose rounded-lg border border-border bg-surface p-6 shadow-sm">
        <h1 ref={judulRef} tabIndex={-1} className="text-title">
          Dokumen tidak ditemukan
        </h1>
        <p className="mt-2 text-small text-text-muted">
          Data tagihan tidak lagi tersedia, mungkin karena data demo direset.
        </p>
        <button type="button" onClick={onTutup} className={`mt-4 ${tombolUtama}`}>
          Kembali ke daftar tagihan
        </button>
      </section>
    );
  }

  const nilai = nilaiTagihan(state, tagihanId, hariIni);
  const kasir = pembayaran ? state.pengguna.find((p) => p.id === pembayaran.kasirId) : undefined;
  // Kuitansi membuktikan satu pembayaran, jadi sisa yang dicetak adalah sisa
  // setelah pembayaran itu — bukan sisa hari ini setelah pembayaran berikutnya.
  // shortcut: total memakai tagihan saat ini karena store tidak menyimpan total
  // per pembayaran; tambahkan snapshot bila kuitansi harus benar-benar tetap.
  const dibayarSampai = pembayaran
    ? state.pembayaran
        .filter(
          (p) =>
            p.tagihanId === tagihanId &&
            (p.waktu < pembayaran.waktu || (p.waktu === pembayaran.waktu && p.id <= pembayaran.id)),
        )
        .reduce((n, p) => n + p.jumlah, 0)
    : nilai.dibayar;
  const sisaSetelah = Math.max(nilai.total - dibayarSampai, 0);
  const statusSetelah: StatusTagihan =
    dibayarSampai === 0 ? "belum bayar" : dibayarSampai >= nilai.total ? "lunas" : "sebagian";
  // Dokumen yang sama dengan dua label; satu tempat agar judul, aria-label,
  // dan tombol cetak tidak pernah menyebut jenis yang berbeda.
  const kuitansi = dokumen.jenis === "kuitansi";
  const labelDokumen = kuitansi ? "Kuitansi pembayaran" : "Rincian tagihan";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 no-print">
        <button type="button" onClick={() => window.print()} className={tombolUtama}>
          Cetak {kuitansi ? "kuitansi" : "rincian tagihan"}
        </button>
        <button type="button" onClick={onTutup} className={tombolSekunder}>
          Kembali ke daftar tagihan
        </button>
      </div>

      <section
        aria-label={kuitansi ? "Kuitansi pembayaran" : "Rincian tagihan pasien"}
        className="mt-6 max-w-prose rounded-lg border border-border bg-surface p-8 shadow-sm print:max-w-none print:border-0 print:shadow-none"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <Wordmark />
          <div className="text-right text-caption text-text-muted">
            <p className="font-semibold uppercase tracking-wide text-text">
              {kuitansi ? "Kuitansi Pembayaran" : "Rincian Tagihan"}
            </p>
            <p>Rawat Inap</p>
          </div>
        </header>

        <h1 ref={judulRef} tabIndex={-1} className="mt-6 text-title">
          {labelDokumen} {pasien.nama}
        </h1>

        <dl className="mt-4 grid gap-2 text-small">
          <BarisDokumen label="Nama pasien" nilai={pasien.nama} />
          <BarisDokumen label="Nomor Rekam Medis" nilai={pasien.nomorRM} />
          <BarisDokumen label="Tanggal masuk" nilai={formatTanggal(admisi.tanggalMasuk)} />
          <BarisDokumen label="Lama inap" nilai={`${formatJumlah(rincian.lamaInap)} hari`} />
          {pembayaran ? (
            <>
              <BarisDokumen label="Waktu pembayaran" nilai={formatTanggalWaktu(pembayaran.waktu)} />
              <BarisDokumen label="Metode" nilai={LABEL_METODE[pembayaran.metode]} />
              <BarisDokumen label="Kasir" nilai={kasir?.nama ?? "Kasir tidak dikenal"} />
            </>
          ) : null}
        </dl>

        {pembayaran ? (
          <p className="mt-6 rounded-md border border-border bg-primary-soft px-4 py-3 text-body text-text">
            Diterima pembayaran sebesar <span className="font-semibold">{formatRupiah(pembayaran.jumlah)}</span>{" "}
            dengan metode {LABEL_METODE[pembayaran.metode]}. Setelah pembayaran ini status tagihan{" "}
            <span className="font-semibold">{statusSetelah}</span>, sisa {formatRupiah(sisaSetelah)}.
          </p>
        ) : (
          <table className="mt-5 w-full text-small">
            <caption className="sr-only">Rincian biaya kamar, tindakan, dan obat</caption>
            <tbody>
              {rincian.kamar.map((b, index) => (
                <tr key={`k-${index}`} className="border-b border-border">
                  <th scope="row" className="py-2 text-left font-normal text-text">
                    Kamar {b.namaKamar} · {formatJumlah(b.lamaHari)} hari × {formatRupiah(b.tarifHarian)}
                  </th>
                  <td className="py-2 text-right text-text">{formatRupiah(b.subtotal)}</td>
                </tr>
              ))}
              {rincian.tindakan.map((t) => (
                <tr key={t.id} className="border-b border-border">
                  <th scope="row" className="py-2 text-left font-normal text-text">
                    Tindakan {t.nama}
                  </th>
                  <td className="py-2 text-right text-text">{formatRupiah(t.tarif)}</td>
                </tr>
              ))}
              {rincian.obat.map((o, index) => (
                <tr key={`o-${index}`} className="border-b border-border">
                  <th scope="row" className="py-2 text-left font-normal text-text">
                    {o.nama} · {formatJumlah(o.jumlah)} {o.satuan}
                  </th>
                  <td className="py-2 text-right text-text">{formatRupiah(o.subtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" className="pt-3 text-left font-semibold text-text">Total tagihan</th>
                <td className="pt-3 text-right font-semibold text-text">{formatRupiah(nilai.total)}</td>
              </tr>
              <tr>
                <th scope="row" className="text-left font-normal text-text-muted">Sudah dibayar</th>
                <td className="text-right text-text-muted">{formatRupiah(nilai.dibayar)}</td>
              </tr>
              <tr>
                <th scope="row" className="text-left font-semibold text-text">Sisa tagihan</th>
                <td className="text-right font-semibold text-text">{formatRupiah(nilai.sisa)}</td>
              </tr>
            </tfoot>
          </table>
        )}

        <p className="mt-6 border-t border-border pt-4 text-caption text-text-muted">
          Dicetak dari data demo Dani Medical Center; bukan bukti pembayaran yang sah.
        </p>
      </section>
    </div>
  );
}

function BarisDokumen({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div className="grid grid-cols-[10rem_minmax(0,1fr)] gap-2 border-b border-border pb-2 last:border-b-0">
      <dt className="text-text-muted">{label}</dt>
      <dd className="font-medium text-text">{nilai}</dd>
    </div>
  );
}

const tombolUtama =
  "inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-small font-semibold text-on-primary transition-colors hover:bg-primary-hover";
const tombolSekunder =
  "inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-small font-semibold text-text transition-colors hover:bg-surface-muted";
