"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useRef, useState } from "react";
import { useSesi } from "@/components/shell/sesi-provider";
import { useHariIni, useSelector, useStoreDemo } from "@/components/shell/store-provider";
import type { Action } from "@/lib/domain/actions";
import { boleh } from "@/lib/domain/izin";
import {
  antreanFarmasi,
  kebutuhanObat,
  obatStokMenipis,
  tagihanUntukAdmisi,
  type BarisAntreanResep,
  type AntreanFarmasi,
} from "@/lib/domain/selectors";
import { rincianTagihan } from "@/lib/domain/tagihan";
import type { Hasil, Id, Obat, Peran, StatusResep } from "@/lib/domain/types";
import { formatJumlah, formatRupiah, formatTanggalWaktu } from "@/lib/format";
import { LABEL_RESEP, WARNA_RESEP } from "../klinis/riwayat";

/**
 * Modul Farmasi. Apoteker memproses antrean resep sampai obat diserahkan;
 * stok berkurang pada saat penyerahan dan biaya obat masuk tagihan lewat
 * store. Master obat dipelihara di sini bersama admin. Tidak ada aturan bisnis
 * di layar ini — semua mutasi dan penolakannya milik store.
 */
export default function HalamanFarmasi() {
  const { pengguna } = useSesi();
  const store = useStoreDemo();
  const state = useSelector((s) => s);
  const hariIni = useHariIni();

  const [resepId, setResepId] = useState<Id | null>(null);
  const [pengumuman, setPengumuman] = useState("");
  const [galat, setGalat] = useState<string | null>(null);
  const [konfirmasiId, setKonfirmasiId] = useState<Id | null>(null);
  const judulDetail = useRef<HTMLHeadingElement>(null);

  // Memilih resep mengganti panel kanan; fokus pindah ke judulnya agar
  // pengguna keyboard tidak tertinggal di daftar antrean (WCAG 2.4.3).
  useEffect(() => {
    if (resepId) judulDetail.current?.focus();
  }, [resepId]);

  if (!pengguna) return null;

  const antrean = antreanFarmasi(state);
  const dipilih = resepId
    ? [...antrean.menunggu, ...antrean.disiapkan, ...antrean.diserahkan].find((b) => b.resepId === resepId) ?? null
    : null;

  function jalankan(aksi: Action, sukses: string): Hasil {
    setGalat(null);
    const hasil = store.dispatch(aksi);
    if (!hasil.ok) {
      setGalat(hasil.alasan);
      return hasil;
    }
    setPengumuman(sukses);
    return hasil;
  }

  return (
    <div>
      <header>
        <h1 className="text-heading">Farmasi</h1>
        <p className="mt-2 max-w-prose text-body text-text-muted">
          Antrean resep dari dokter, dikelompokkan per status. Stok berkurang saat obat diserahkan,
          dan biaya obat langsung masuk rincian tagihan pasien.
        </p>
      </header>

      <p role="status" className="sr-only">
        {pengumuman}
      </p>
      {galat ? (
        <p role="alert" className="mt-4 rounded-md border border-danger px-3 py-2 text-small text-danger">
          {galat}
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <DaftarAntrean antrean={antrean} dipilihId={resepId} onPilih={setResepId} />

        {dipilih ? (
          <DetailResep
            key={dipilih.resepId}
            baris={dipilih}
            hariIni={hariIni}
            penggunaId={pengguna.id}
            peran={pengguna.peran}
            judulRef={judulDetail}
            onAksi={jalankan}
            onMintaSerahkan={() => setKonfirmasiId(dipilih.resepId)}
          />
        ) : (
          <section className="rounded-lg border border-border bg-surface-muted p-6">
            <h2 className="text-title">Pilih resep</h2>
            <p className="mt-2 text-small text-text-muted">
              Pilih satu resep dari antrean untuk membaca rincian pasien dan obat, lalu menyiapkan
              atau menyerahkannya.
            </p>
          </section>
        )}
      </div>

      <DialogSerahkanObat
        resepId={konfirmasiId}
        pemicu={judulDetail}
        onTutup={() => setKonfirmasiId(null)}
        onSerahkan={() => {
          if (!konfirmasiId) return;
          // Penyerahan tidak dapat dibatalkan (stok dan tagihan sudah berubah),
          // jadi konfirmasi ditutup hanya setelah store menerimanya.
          const hasil = jalankan(
            { type: "resep/serahkan", olehId: pengguna.id, resepId: konfirmasiId },
            "Obat diserahkan. Stok berkurang dan biaya masuk ke tagihan pasien.",
          );
          if (hasil.ok) setKonfirmasiId(null);
        }}
      />

      <MasterObat penggunaId={pengguna.id} peran={pengguna.peran} onSukses={setPengumuman} />
    </div>
  );
}

function DaftarAntrean({
  antrean,
  dipilihId,
  onPilih,
}: {
  antrean: AntreanFarmasi;
  dipilihId: Id | null;
  onPilih: (resepId: Id) => void;
}) {
  const kelompok: Array<{ status: StatusResep; label: string; baris: BarisAntreanResep[] }> = [
    { status: "menunggu", label: "Menunggu disiapkan", baris: antrean.menunggu },
    { status: "disiapkan", label: "Siap diserahkan", baris: antrean.disiapkan },
    { status: "diserahkan", label: "Sudah diserahkan", baris: antrean.diserahkan },
  ];

  return (
    <section aria-label="Antrean resep" className="self-start rounded-lg border border-border bg-surface p-4 shadow-sm">
      <h2 className="text-title">Antrean resep</h2>
      <p className="mt-1 text-caption text-text-muted">
        Tiap kelompok diurutkan dari resep terlama. Obat diserahkan dari kelompok siap diserahkan.
      </p>

      <div className="mt-4 space-y-5">
        {kelompok.map((k) => (
          <section key={k.status} aria-label={k.label}>
            <h3 className="flex items-baseline justify-between gap-2 text-small font-semibold text-text">
              {k.label}
              <span className="font-normal text-text-muted">{formatJumlah(k.baris.length)} resep</span>
            </h3>
            {k.baris.length === 0 ? (
              <p className="mt-2 rounded-md border border-border bg-surface-muted p-3 text-caption text-text-muted">
                Tidak ada resep pada kelompok ini.
              </p>
            ) : (
              <ul role="list" className="mt-2 space-y-2">
                {k.baris.map((b) => (
                  <li key={b.resepId}>
                    <button
                      type="button"
                      onClick={() => onPilih(b.resepId)}
                      aria-current={dipilihId === b.resepId ? "true" : undefined}
                      className={`w-full rounded-md border px-3 py-2 text-left transition-colors ${
                        dipilihId === b.resepId
                          ? "border-primary bg-primary-soft"
                          : "border-border hover:border-primary hover:bg-primary-soft"
                      }`}
                    >
                      <span className="block text-small font-semibold text-text">{b.pasien.nama}</span>
                      <span className="block text-caption text-text-muted">
                        {b.resep.items.length} obat
                        <span className="mx-1.5" aria-hidden="true">·</span>
                        {b.dokter?.nama ?? "Dokter tidak dikenal"}
                      </span>
                      <span className="block text-caption text-text-muted">{formatTanggalWaktu(b.waktu)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </section>
  );
}

function DetailResep({
  baris,
  hariIni,
  penggunaId,
  peran,
  judulRef,
  onAksi,
  onMintaSerahkan,
}: {
  baris: BarisAntreanResep;
  hariIni: string;
  penggunaId: Id;
  peran: Peran;
  judulRef: React.Ref<HTMLHeadingElement>;
  onAksi: (aksi: Action, sukses: string) => Hasil;
  onMintaSerahkan: () => void;
}) {
  const state = useSelector((s) => s);
  const { resep, pasien, dokter } = baris;
  const tagihan = tagihanUntukAdmisi(state, baris.admisiId);
  const rincian = tagihan ? rincianTagihan(state, tagihan.id, hariIni) : null;
  const kebutuhan = kebutuhanObat(resep);

  function siapkan() {
    onAksi(
      { type: "resep/siapkan", olehId: penggunaId, resepId: resep.id },
      "Resep ditandai sedang disiapkan.",
    );
  }

  return (
    <section aria-label="Detail resep" className="rounded-lg border border-border bg-surface p-6 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 ref={judulRef} tabIndex={-1} className="text-title">
            Resep {pasien.nama}
          </h2>
          <p className="mt-1 text-small text-text-muted">
            {pasien.nomorRM}
            <span className="mx-1.5" aria-hidden="true">·</span>
            Dokter {dokter?.nama ?? "tidak dikenal"}
            <span className="mx-1.5" aria-hidden="true">·</span>
            {formatTanggalWaktu(resep.waktu)}
          </p>
        </div>
        <p className={`text-small font-semibold ${WARNA_RESEP[resep.status]}`}>{LABEL_RESEP[resep.status]}</p>
      </header>

      <table className="mt-4 w-full text-small">
        <caption className="sr-only">Obat pada resep beserta jumlah, aturan pakai, harga, dan stok tersedia</caption>
        <thead>
          <tr className="border-b border-border text-left">
            <th scope="col" className="py-2 font-semibold">Obat</th>
            <th scope="col" className="py-2 font-semibold">Jumlah</th>
            <th scope="col" className="py-2 font-semibold">Aturan pakai</th>
            <th scope="col" className="py-2 text-right font-semibold">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {resep.items.map((item, index) => {
            const stok = state.obat.find((o) => o.id === item.obatId)?.stok ?? 0;
            // Kebutuhan per obat (baris ganda dijumlahkan), sama dengan yang
            // diperiksa store saat penyerahan.
            // Setelah diserahkan, stok yang tersisa memang sudah berkurang oleh
            // resep ini sendiri — melabelinya "kurang" akan menyesatkan.
            const kurang = resep.status !== "diserahkan" && stok < (kebutuhan.get(item.obatId) ?? 0);
            return (
              <tr key={`${resep.id}-${index}`} className="border-b border-border last:border-b-0">
                <th scope="row" className="py-2 text-left font-medium text-text">
                  {item.nama}
                  <span className="block text-caption font-normal text-text-muted">
                    {kurang ? "Stok kurang: " : "Stok tersedia: "}
                    {formatJumlah(stok)}
                  </span>
                </th>
                <td className="py-2 text-text">{formatJumlah(item.jumlah)}</td>
                <td className="py-2 text-text-muted">{item.aturanPakai}</td>
                <td className="py-2 text-right text-text">{formatRupiah(item.jumlah * item.harga)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <dl className="mt-4 grid gap-2 text-small sm:grid-cols-2">
        <div className="border-b border-border pb-2">
          <dt className="text-text-muted">Total biaya obat resep ini</dt>
          <dd className="font-semibold text-text">
            {formatRupiah(resep.items.reduce((n, item) => n + item.jumlah * item.harga, 0))}
          </dd>
        </div>
        <div className="border-b border-border pb-2">
          <dt className="text-text-muted">Biaya obat pada tagihan admisi ini</dt>
          <dd className="font-semibold text-text">{formatRupiah(rincian?.subtotalObat ?? 0)}</dd>
        </div>
      </dl>
      <p className="mt-2 text-caption text-text-muted">
        Tagihan bertambah saat obat benar-benar diserahkan, bukan saat resep dibuat.
      </p>

      {baris.admisiSelesai ? (
        <p className="mt-5 rounded-md border border-warning px-3 py-2 text-small text-warning">
          Admisi pasien ini sudah selesai dan tagihannya ditutup, sehingga resep ini tidak dapat
          disiapkan atau diserahkan lagi.
        </p>
      ) : (
        <div className="mt-5 flex flex-wrap gap-3">
          {resep.status === "menunggu" && boleh(peran, "resep.siapkan") ? (
            <button type="button" onClick={siapkan} className={tombolSekunder}>
              Mulai siapkan
            </button>
          ) : null}
          {resep.status === "disiapkan" && boleh(peran, "obat.serahkan") ? (
            <button type="button" onClick={onMintaSerahkan} className={tombolUtama}>
              Serahkan obat
            </button>
          ) : null}
        </div>
      )}
      {!baris.admisiSelesai && resep.status === "menunggu" ? (
        <p className="mt-2 text-caption text-text-muted">
          Resep harus disiapkan terlebih dahulu, lalu diserahkan. Status tidak dapat mundur.
        </p>
      ) : null}
      {resep.status === "diserahkan" ? (
        <p className="mt-2 text-caption text-text-muted">
          Obat sudah diserahkan; stok sudah berkurang dan biaya sudah masuk tagihan.
        </p>
      ) : null}
    </section>
  );
}

/** Master obat: stok menipis, barang masuk, obat baru, dan riwayat pergerakan. */
function MasterObat({
  penggunaId,
  peran,
  onSukses,
}: {
  penggunaId: Id;
  peran: Peran;
  onSukses: (pesan: string) => void;
}) {
  const store = useStoreDemo();
  const state = useSelector((s) => s);
  const [dibuka, setDibuka] = useState<{ obatId: Id; panel: "stok" | "riwayat" } | null>(null);
  const [isianBaru, setIsianBaru] = useState({ nama: "", satuan: "", harga: "", stok: "0", stokMinimum: "0" });
  const [jumlahMasuk, setJumlahMasuk] = useState("");
  const [keteranganMasuk, setKeteranganMasuk] = useState("Penerimaan barang");
  const [galatKolom, setGalatKolom] = useState<Record<string, string | undefined>>({});
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Panel terbuka dirender setelah tabel, jauh dari tombol pemicunya. Fokus
  // dipindahkan ke panel agar pengguna keyboard tidak harus mencari (WCAG 2.4.3).
  useEffect(() => {
    if (dibuka) panelRef.current?.focus();
  }, [dibuka]);

  /** Menaruh alasan penolakan store pada kolom yang paling mungkin menyebabkannya. */
  function catatGalat(alasan: string) {
    const kolom = /nama/i.test(alasan)
      ? "obat-nama"
      : /satuan/i.test(alasan)
        ? "obat-satuan"
        : /harga/i.test(alasan)
          ? "obat-harga"
          : "obat-stok";
    setGalatKolom({ [kolom]: alasan });
  }

  const bolehStok = boleh(peran, "obat.stokMasuk");
  const bolehBuat = boleh(peran, "obat.buat");
  // Ambang stok menipis dibaca dari satu selector, bukan diulang per baris.
  const menipis = new Set(obatStokMenipis(state).map((o) => o.id));

  /** Panel yang sedang terbuka untuk satu obat; menekan panel yang sama menutupnya. */
  function panelTerbuka(obatId: Id, panel: "stok" | "riwayat"): boolean {
    return dibuka?.obatId === obatId && dibuka.panel === panel;
  }

  function alihkan(obatId: Id, panel: "stok" | "riwayat") {
    if (panel === "stok") setJumlahMasuk("");
    setDibuka(panelTerbuka(obatId, panel) ? null : { obatId, panel });
  }

  function simpanMasuk(e: React.FormEvent, obat: Obat) {
    e.preventDefault();
    const hasil = store.dispatch({
      type: "obat/stok-masuk",
      olehId: penggunaId,
      obatId: obat.id,
      jumlah: Number(jumlahMasuk),
      keterangan: keteranganMasuk.trim() || "Penerimaan barang",
    });
    if (hasil.ok) {
      setGalatKolom({});
      setJumlahMasuk("");
      setDibuka(null);
      onSukses(`Stok ${obat.nama} bertambah ${jumlahMasuk}.`);
    } else {
      setGalatKolom({ [`stok-jumlah-${obat.id}`]: hasil.alasan });
    }
  }

  function tambahObat(e: React.FormEvent) {
    e.preventDefault();
    const hasil = store.dispatch({
      type: "obat/dibuat",
      olehId: penggunaId,
      input: {
        nama: isianBaru.nama,
        satuan: isianBaru.satuan,
        harga: Number(isianBaru.harga),
        stok: Number(isianBaru.stok),
        stokMinimum: Number(isianBaru.stokMinimum),
      },
    });
    if (hasil.ok) {
      setGalatKolom({});
      setIsianBaru({ nama: "", satuan: "", harga: "", stok: "0", stokMinimum: "0" });
      onSukses(`Obat ${isianBaru.nama.trim()} ditambahkan ke master.`);
    } else {
      catatGalat(hasil.alasan);
    }
  }

  return (
    <section aria-labelledby="judul-master-obat" className="mt-10">
      <h2 id="judul-master-obat" className="text-title">
        Daftar obat
      </h2>
      <p className="mt-1 max-w-prose text-small text-text-muted">
        Obat dengan stok di bawah minimum ditandai <span className="font-semibold">stok menipis</span>{" "}
        agar pengadaan dapat diajukan lebih awal.
      </p>

      <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-surface shadow-sm">
        <table className="w-full text-small">
          <caption className="sr-only">Daftar obat beserta satuan, harga, stok, dan stok minimum</caption>
          <thead>
            <tr className="border-b border-border text-left">
              <th scope="col" className="px-4 py-3 font-semibold">Obat</th>
              <th scope="col" className="px-4 py-3 font-semibold">Satuan</th>
              <th scope="col" className="px-4 py-3 font-semibold">Harga</th>
              <th scope="col" className="px-4 py-3 font-semibold">Stok</th>
              <th scope="col" className="px-4 py-3 font-semibold">Stok minimum</th>
              <th scope="col" className="px-4 py-3 font-semibold">
                <span className="sr-only">Aksi</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {state.obat.map((o) => {
              const stokMenipis = menipis.has(o.id);
              return (
                <tr key={o.id} className="border-b border-border last:border-b-0">
                  <th scope="row" className="px-4 py-3 text-left font-medium text-text">{o.nama}</th>
                  <td className="px-4 py-3 text-text">{o.satuan}</td>
                  <td className="px-4 py-3 text-text">{formatRupiah(o.harga)}</td>
                  <td className="px-4 py-3 text-text">
                    {formatJumlah(o.stok)}
                    {/* Peringatan terbaca tanpa warna (WCAG 1.4.1). */}
                    {stokMenipis ? (
                      <span className="ml-1.5 font-semibold text-warning">
                        <span aria-hidden="true">⚠ </span>
                        Stok menipis
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-text">{formatJumlah(o.stokMinimum)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-1">
                      {bolehStok ? (
                        <button
                          type="button"
                          aria-expanded={panelTerbuka(o.id, "stok")}
                          aria-controls={`panel-stok-${o.id}`}
                          onClick={() => alihkan(o.id, "stok")}
                          className="inline-flex min-h-11 items-center rounded-md px-2 text-small font-semibold text-primary hover:underline"
                        >
                          Tambah stok<span className="sr-only"> {o.nama}</span>
                        </button>
                      ) : null}
                      <button
                        type="button"
                        aria-expanded={panelTerbuka(o.id, "riwayat")}
                        aria-controls={`panel-riwayat-${o.id}`}
                        onClick={() => alihkan(o.id, "riwayat")}
                        className="inline-flex min-h-11 items-center rounded-md px-2 text-small font-semibold text-primary hover:underline"
                      >
                        Riwayat<span className="sr-only"> pergerakan stok {o.nama}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {state.obat.map((o) => {
        if (dibuka?.obatId !== o.id) return null;
        return dibuka.panel === "stok" ? (
          <div
            key={`${o.id}-stok`}
            id={`panel-stok-${o.id}`}
            ref={panelRef}
            tabIndex={-1}
            role="region"
            aria-label={`Barang masuk ${o.nama}`}
            className="mt-3 max-w-prose rounded-lg border border-border bg-surface p-4 shadow-sm"
          >
            <form onSubmit={(e) => simpanMasuk(e, o)}>
            <h3 className="text-small font-semibold text-text">Barang masuk — {o.nama}</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Bidang
                id={`stok-jumlah-${o.id}`}
                label={`Jumlah masuk (${o.satuan})`}
                nilai={jumlahMasuk}
                inputMode="numeric"
                galat={galatKolom[`stok-jumlah-${o.id}`]}
                onChange={(nilai) => {
                  setGalatKolom({});
                  setJumlahMasuk(nilai);
                }}
              />
              <Bidang
                id={`stok-keterangan-${o.id}`}
                label="Keterangan"
                nilai={keteranganMasuk}
                onChange={setKeteranganMasuk}
              />
            </div>
              <button type="submit" className={`mt-3 ${tombolUtama}`}>
                Simpan barang masuk
              </button>
            </form>
          </div>
        ) : (
          <RiwayatStok key={`${o.id}-riwayat`} obat={o} panelRef={panelRef} />
        );
      })}

      {bolehBuat ? (
        <form onSubmit={tambahObat} className="mt-6 max-w-prose rounded-lg border border-border bg-surface p-5 shadow-sm">
          <h3 className="text-title">Tambah obat</h3>
          <p className="mt-1 text-small text-text-muted">
            Obat baru langsung dapat diresepkan dokter dan ikut dipantau stoknya.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Bidang
              id="obat-nama"
              label="Nama obat"
              nilai={isianBaru.nama}
              galat={galatKolom["obat-nama"]}
              onChange={(v) => setIsianBaru((l) => ({ ...l, nama: v }))}
            />
            <Bidang
              id="obat-satuan"
              label="Satuan"
              nilai={isianBaru.satuan}
              galat={galatKolom["obat-satuan"]}
              onChange={(v) => setIsianBaru((l) => ({ ...l, satuan: v }))}
            />
            <Bidang
              id="obat-harga"
              label="Harga (Rp)"
              nilai={isianBaru.harga}
              galat={galatKolom["obat-harga"]}
              inputMode="numeric"
              onChange={(v) => setIsianBaru((l) => ({ ...l, harga: v }))}
            />
            <Bidang
              id="obat-stok"
              label="Stok awal"
              nilai={isianBaru.stok}
              galat={galatKolom["obat-stok"]}
              inputMode="numeric"
              onChange={(v) => setIsianBaru((l) => ({ ...l, stok: v }))}
            />
            <Bidang
              id="obat-stok-minimum"
              label="Stok minimum"
              nilai={isianBaru.stokMinimum}
              galat={galatKolom["obat-stok-minimum"]}
              inputMode="numeric"
              onChange={(v) => setIsianBaru((l) => ({ ...l, stokMinimum: v }))}
            />
          </div>
          <button type="submit" className={`mt-4 ${tombolUtama}`}>
            Simpan obat
          </button>
        </form>
      ) : null}
    </section>
  );
}

function RiwayatStok({ obat, panelRef }: { obat: Obat; panelRef: React.RefObject<HTMLDivElement | null> }) {
  const state = useSelector((s) => s);
  const mutasi = state.mutasiStok.filter((m) => m.obatId === obat.id).slice().reverse();

  return (
    <div
      id={`panel-riwayat-${obat.id}`}
      ref={panelRef}
      tabIndex={-1}
      role="region"
      aria-label={`Riwayat pergerakan stok ${obat.nama}`}
      className="mt-3 rounded-lg border border-border bg-surface p-4 shadow-sm"
    >
      <h3 className="text-small font-semibold text-text">Riwayat pergerakan stok — {obat.nama}</h3>
      {mutasi.length === 0 ? (
        <p className="mt-2 text-caption text-text-muted">Belum ada pergerakan stok untuk obat ini.</p>
      ) : (
        <ul role="list" className="mt-2 space-y-2">
          {mutasi.map((m) => (
            <li key={m.id} className="border-b border-border pb-2 text-caption last:border-b-0 last:pb-0">
              <p className="font-semibold text-text">
                <span aria-hidden="true">{m.jenis === "masuk" ? "＋" : "−"} </span>
                {m.jenis === "masuk" ? "Masuk" : "Keluar"} {formatJumlah(m.jumlah)} {obat.satuan}
              </p>
              <p className="text-text-muted">
                {m.keterangan} · {formatTanggalWaktu(m.waktu)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Konfirmasi penyerahan obat. Penyerahan mengubah stok dan tagihan dan tidak
 * dapat dibatalkan (status resep tidak bisa mundur), jadi Radix Dialog dipakai
 * untuk jebakan fokus, Escape, dan pengembalian fokus ke pemicunya (ADR-0003).
 */
function DialogSerahkanObat({
  resepId,
  pemicu,
  onTutup,
  onSerahkan,
}: {
  resepId: Id | null;
  pemicu: React.RefObject<HTMLHeadingElement | null>;
  onTutup: () => void;
  onSerahkan: () => void;
}) {
  const state = useSelector((s) => s);
  const resep = resepId ? state.resep.find((r) => r.id === resepId) : null;
  const pasien = resep
    ? state.pasien.find((p) => p.id === state.admisi.find((a) => a.id === resep.admisiId)?.pasienId)
    : null;

  return (
    <Dialog.Root open={!!resep} onOpenChange={(buka) => !buka && onTutup()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-text/40" />
        <Dialog.Content
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            pemicu.current?.focus();
          }}
          className="fixed inset-x-4 top-1/2 z-50 max-h-[90dvh] max-w-lg -translate-y-1/2 overflow-y-auto rounded-lg border border-border bg-surface p-6 shadow-lg sm:left-1/2 sm:right-auto sm:w-[min(32rem,calc(100vw-2rem))] sm:-translate-x-1/2"
        >
          <Dialog.Title className="text-title">Serahkan obat untuk {pasien?.nama ?? "pasien ini"}?</Dialog.Title>
          <Dialog.Description className="mt-2 text-small text-text-muted">
            Stok obat berkurang saat itu juga dan biaya obat masuk ke tagihan pasien. Status resep
            tidak dapat dikembalikan setelah ini.
          </Dialog.Description>
          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <button type="button" onClick={onTutup} className={tombolSekunder}>
              Batal
            </button>
            <button type="button" onClick={onSerahkan} className={tombolUtama}>
              Ya, serahkan obat
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Bidang({
  id,
  label,
  nilai,
  onChange,
  inputMode,
  galat,
}: {
  id: string;
  label: string;
  nilai: string;
  onChange: (nilai: string) => void;
  inputMode?: "numeric";
  /** Pesan galat milik kolom ini, tampil tepat di bawahnya (WCAG 3.3.1). */
  galat?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-small font-medium text-text">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode={inputMode}
        value={nilai}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={galat ? true : undefined}
        aria-describedby={galat ? `${id}-galat` : undefined}
        className="mt-1 min-h-11 w-full rounded-md border border-border bg-canvas px-3 text-body text-text"
      />
      {galat ? (
        <p id={`${id}-galat`} role="alert" className="mt-1 text-caption text-danger">
          {galat}
        </p>
      ) : null}
    </div>
  );
}

const tombolUtama =
  "inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-small font-semibold text-on-primary transition-colors hover:bg-primary-hover";
const tombolSekunder =
  "inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-small font-semibold text-text transition-colors hover:bg-surface-muted";
