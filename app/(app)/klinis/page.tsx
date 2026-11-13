"use client";

import { useEffect, useRef, useState } from "react";
import { useSesi } from "@/components/shell/sesi-provider";
import { ModulTertunda } from "@/components/shell/modul-tertunda";
import { useStoreDemo, useSelector } from "@/components/shell/store-provider";
import type { Action } from "@/lib/domain/actions";
import { boleh } from "@/lib/domain/izin";
import {
  admisiUntukDokter,
  infoAdmisi,
  riwayatKlinis,
  totalTindakan,
  type InfoAdmisi,
  type ItemRiwayat,
} from "@/lib/domain/selectors";
import type { Id, StatusResep } from "@/lib/domain/types";
import { formatRupiah, formatTanggal, formatTanggalWaktu } from "@/lib/format";

const LABEL_RESEP: Record<StatusResep, string> = {
  menunggu: "Menunggu",
  disiapkan: "Disiapkan",
  diserahkan: "Diserahkan",
};

/** Warna status melengkapi teks, bukan menggantikannya (WCAG 1.4.1). */
const WARNA_RESEP: Record<StatusResep, string> = {
  menunggu: "text-warning",
  disiapkan: "text-info",
  diserahkan: "text-success",
};

const LABEL_JENIS_CATATAN = {
  visite: "Visite dokter",
  perkembangan: "Catatan perkembangan",
  tanda_vital: "Tanda vital",
} as const;

interface BarisResep {
  kunci: number;
  obatId: string;
  jumlah: string;
  aturanPakai: string;
}

/**
 * Modul Klinis untuk dokter: daftar pasien yang menjadi tanggung jawabnya,
 * catatan visite, tindakan berbayar, resep, dan riwayat klinis pasien.
 * Semua mutasi melewati store; layar ini tidak menyimpan aturan bisnis.
 */
export default function HalamanKlinis() {
  const { pengguna } = useSesi();
  const store = useStoreDemo();
  const state = useSelector((s) => s);

  const [admisiId, setAdmisiId] = useState<Id | null>(null);
  const [pengumuman, setPengumuman] = useState("");
  const [galat, setGalat] = useState<string | null>(null);
  const judulDetail = useRef<HTMLHeadingElement>(null);

  // Memilih pasien mengganti seluruh isi panel kanan; fokus pindah ke judulnya
  // agar pengguna keyboard tidak tertinggal di tombol daftar (WCAG 2.4.3).
  useEffect(() => {
    if (admisiId) judulDetail.current?.focus();
  }, [admisiId]);

  if (!pengguna) return null;

  // Dokter adalah satu-satunya peran yang boleh membuat resep.
  if (!boleh(pengguna.peran, "resep.buat")) {
    return (
      <ModulTertunda
        judul="Klinis — perawat"
        keterangan="Pemantauan perawat (tanda vital, instruksi dokter, dan catatan perkembangan) dibangun pada ticket berikutnya."
      />
    );
  }

  const pasienSaya = admisiUntukDokter(state, pengguna.id);
  const info = admisiId ? infoAdmisi(state, admisiId) : null;
  const admisi = admisiId ? state.admisi.find((a) => a.id === admisiId) : null;

  function jalankan(aksi: Action, sukses: string): boolean {
    setGalat(null);
    const hasil = store.dispatch(aksi);
    if (!hasil.ok) {
      setGalat(hasil.alasan);
      return false;
    }
    setPengumuman(sukses);
    return true;
  }

  return (
    <div>
      <header>
        <h1 className="text-heading">Klinis</h1>
        <p className="mt-2 max-w-prose text-body text-text-muted">
          Pasien yang menjadi tanggung jawab Anda hari ini. Catatan klinis tidak dapat dihapus;
          koreksi dibuat sebagai catatan baru yang menunjuk catatan aslinya.
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

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <DaftarPasien pasien={pasienSaya} dipilihId={admisiId} onPilih={setAdmisiId} />

        {admisiId ? (
          info && admisi ? (
            <DetailAdmisi
              info={info}
              sudahSelesai={admisi.status === "selesai"}
              penggunaId={pengguna.id}
              judulRef={judulDetail}
              onAksi={jalankan}
            />
          ) : (
            <section className="rounded-lg border border-border bg-surface p-6 shadow-sm">
              <h2 ref={judulDetail} tabIndex={-1} className="text-title">
                Admisi tidak ditemukan
              </h2>
              <p className="mt-2 text-small text-text-muted">
                Data admisi tidak lagi tersedia, mungkin karena data demo direset. Pilih pasien lain
                dari daftar.
              </p>
            </section>
          )
        ) : (
          <section className="rounded-lg border border-border bg-surface-muted p-6">
            <h2 className="text-title">Pilih pasien</h2>
            <p className="mt-2 text-small text-text-muted">
              Pilih satu pasien dari daftar untuk melihat konteks admisi, menulis catatan visite,
              menambahkan tindakan, membuat resep, dan menelusuri riwayat klinisnya.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

function DaftarPasien({
  pasien,
  dipilihId,
  onPilih,
}: {
  pasien: InfoAdmisi[];
  dipilihId: Id | null;
  onPilih: (admisiId: Id) => void;
}) {
  return (
    <section aria-label="Pasien saya" className="self-start rounded-lg border border-border bg-surface p-4 shadow-sm">
      <h2 className="text-title">Pasien saya</h2>
      <p className="mt-1 text-caption text-text-muted">
        {pasien.length === 0
          ? "Tidak ada pasien aktif."
          : `${pasien.length} pasien sedang dirawat di bawah tanggung jawab Anda.`}
      </p>
      {pasien.length === 0 ? (
        <p className="mt-3 rounded-md border border-border bg-surface-muted p-3 text-small text-text-muted">
          Belum ada pasien aktif atas nama Anda. Pasien muncul di sini setelah petugas pendaftaran
          memilih Anda sebagai dokter penanggung jawab.
        </p>
      ) : (
        <ul role="list" className="mt-3 space-y-2">
          {pasien.map((p) => (
            <li key={p.admisiId}>
              <button
                type="button"
                onClick={() => onPilih(p.admisiId)}
                aria-current={dipilihId === p.admisiId ? "true" : undefined}
                className={`w-full rounded-md border px-3 py-2 text-left transition-colors ${
                  dipilihId === p.admisiId
                    ? "border-primary bg-primary-soft"
                    : "border-border hover:border-primary hover:bg-primary-soft"
                }`}
              >
                <span className="block text-small font-semibold text-text">{p.pasien.nama}</span>
                <span className="block text-caption text-text-muted">
                  {p.pasien.nomorRM}
                  <span className="mx-1.5" aria-hidden="true">·</span>
                  {p.bed.kode}
                </span>
                <span className="block text-caption text-text-muted">
                  Masuk {formatTanggal(p.tanggalMasuk)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function DetailAdmisi({
  info,
  sudahSelesai,
  penggunaId,
  judulRef,
  onAksi,
}: {
  info: InfoAdmisi;
  sudahSelesai: boolean;
  penggunaId: Id;
  judulRef: React.Ref<HTMLHeadingElement>;
  onAksi: (aksi: Action, sukses: string) => boolean;
}) {
  const { pasien, kamar, bed, tanggalMasuk, diagnosaAwal } = info;
  return (
    <div className="space-y-6">
      <section aria-label="Konteks admisi" className="rounded-lg border border-border bg-surface p-6 shadow-sm">
        <h2 ref={judulRef} tabIndex={-1} className="text-title">
          {pasien.nama}
        </h2>
        <dl className="mt-4 grid gap-2 text-body sm:grid-cols-2">
          <BarisRingkas label="Nomor Rekam Medis" nilai={pasien.nomorRM} />
          <BarisRingkas
            label="Jenis kelamin"
            nilai={`${pasien.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}, lahir ${formatTanggal(pasien.tanggalLahir)}`}
          />
          <BarisRingkas label="Bed" nilai={`${bed.kode} — ${kamar.nama} (kelas ${kamar.kelas})`} />
          <BarisRingkas label="Tanggal masuk" nilai={formatTanggal(tanggalMasuk)} />
          <BarisRingkas label="Diagnosa awal" nilai={diagnosaAwal || "—"} />
        </dl>
        {sudahSelesai ? (
          <p className="mt-4 rounded-md border border-warning px-3 py-2 text-small text-warning">
            Admisi ini sudah selesai. Catatan, tindakan, dan resep baru tidak dapat ditambahkan.
          </p>
        ) : null}
      </section>

      {sudahSelesai ? null : (
        <>
          <FormVisite admisiId={info.admisiId} penggunaId={penggunaId} onAksi={onAksi} />
          <BagianTindakan admisiId={info.admisiId} penggunaId={penggunaId} onAksi={onAksi} />
          <BagianResep admisiId={info.admisiId} penggunaId={penggunaId} onAksi={onAksi} />
        </>
      )}

      <RiwayatKlinis pasienId={pasien.id} penggunaId={penggunaId} onAksi={onAksi} />
    </div>
  );
}

function BarisRingkas({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div className="border-b border-border pb-2">
      <dt className="text-small text-text-muted">{label}</dt>
      <dd className="text-small font-medium text-text">{nilai}</dd>
    </div>
  );
}

function FormVisite({
  admisiId,
  penggunaId,
  onAksi,
}: {
  admisiId: Id;
  penggunaId: Id;
  onAksi: (aksi: Action, sukses: string) => boolean;
}) {
  const [isi, setIsi] = useState("");
  const [diagnosa, setDiagnosa] = useState("");
  const [rencana, setRencana] = useState("");
  const [galatIsi, setGalatIsi] = useState<string | null>(null);

  function simpan(e: React.FormEvent) {
    e.preventDefault();
    if (!isi.trim()) {
      setGalatIsi("Isi visite wajib diisi.");
      return;
    }
    setGalatIsi(null);
    const berhasil = onAksi(
      {
        type: "catatan/ditulis",
        olehId: penggunaId,
        admisiId,
        jenis: "visite",
        isi,
        diagnosa: diagnosa.trim() || null,
        rencana: rencana.trim() || null,
        tandaVital: null,
      },
      "Catatan visite tersimpan.",
    );
    if (berhasil) {
      setIsi("");
      setDiagnosa("");
      setRencana("");
    }
  }

  return (
    <section aria-labelledby="judul-visite" className="rounded-lg border border-border bg-surface p-6 shadow-sm">
      <h2 id="judul-visite" className="text-title">
        Catatan visite
      </h2>
      <form onSubmit={simpan} noValidate className="mt-4 space-y-4">
        <div>
          <label htmlFor="visite-isi" className="block text-small font-medium text-text">
            Isi visite
          </label>
          <textarea
            id="visite-isi"
            rows={4}
            value={isi}
            onChange={(e) => {
              setIsi(e.target.value);
              setGalatIsi(null);
            }}
            aria-invalid={galatIsi ? true : undefined}
            aria-describedby={galatIsi ? "visite-isi-galat" : undefined}
            className="mt-1 w-full rounded-md border border-border bg-canvas px-3 py-2 text-body text-text"
          />
          {galatIsi ? (
            <p id="visite-isi-galat" role="alert" className="mt-1 text-caption text-danger">
              {galatIsi}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="visite-diagnosa" className="block text-small font-medium text-text">
            Diagnosa
          </label>
          <input
            id="visite-diagnosa"
            type="text"
            value={diagnosa}
            onChange={(e) => setDiagnosa(e.target.value)}
            className="mt-1 min-h-11 w-full rounded-md border border-border bg-canvas px-3 text-body text-text"
          />
        </div>
        <div>
          <label htmlFor="visite-rencana" className="block text-small font-medium text-text">
            Rencana
          </label>
          <textarea
            id="visite-rencana"
            rows={2}
            value={rencana}
            onChange={(e) => setRencana(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-canvas px-3 py-2 text-body text-text"
          />
        </div>
        <button type="submit" className={tombolUtama}>
          Simpan catatan visite
        </button>
      </form>
    </section>
  );
}

function BagianTindakan({
  admisiId,
  penggunaId,
  onAksi,
}: {
  admisiId: Id;
  penggunaId: Id;
  onAksi: (aksi: Action, sukses: string) => boolean;
}) {
  const state = useSelector((s) => s);
  const [tindakanId, setTindakanId] = useState("");

  const master = state.tindakanMaster.filter((t) => t.aktif);
  const tercatat = state.tindakanAdmisi.filter((t) => t.admisiId === admisiId);
  const totalSaya = totalTindakan(state, admisiId, penggunaId);

  function tambah() {
    if (!tindakanId) return;
    if (onAksi({ type: "tindakan/ditambahkan", olehId: penggunaId, admisiId, tindakanId }, "Tindakan ditambahkan ke tagihan admisi.")) {
      setTindakanId("");
    }
  }

  return (
    <section aria-labelledby="judul-tindakan" className="rounded-lg border border-border bg-surface p-6 shadow-sm">
      <h2 id="judul-tindakan" className="text-title">
        Tindakan
      </h2>
      <p className="mt-1 text-small text-text-muted">
        Tarif tindakan yang ditambahkan langsung masuk ke rincian tagihan admisi.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div>
          <label htmlFor="tindakan-pilih" className="block text-small font-medium text-text">
            Tindakan dari master
          </label>
          <select
            id="tindakan-pilih"
            value={tindakanId}
            onChange={(e) => setTindakanId(e.target.value)}
            className="mt-1 min-h-11 w-full rounded-md border border-border bg-canvas px-3 text-body text-text"
          >
            <option value="">Pilih tindakan…</option>
            {master.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nama} — {formatRupiah(t.tarif)}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={tambah}
          disabled={!tindakanId}
          className={`${tombolUtama} disabled:cursor-not-allowed disabled:opacity-60`}
        >
          Tambahkan tindakan
        </button>
      </div>

      <p className="mt-4 text-body text-text">
        Total tindakan yang Anda tambahkan pada admisi ini:{" "}
        <span className="font-semibold">{formatRupiah(totalSaya)}</span>
      </p>

      {tercatat.length === 0 ? (
        <p className="mt-3 rounded-md border border-border bg-surface-muted p-3 text-small text-text-muted">
          Belum ada tindakan tercatat pada admisi ini.
        </p>
      ) : (
        <table className="mt-3 w-full text-small">
          <caption className="sr-only">Tindakan yang sudah dicatat pada admisi ini</caption>
          <thead>
            <tr className="border-b border-border text-left">
              <th scope="col" className="py-2 font-semibold">Tindakan</th>
              <th scope="col" className="py-2 font-semibold">Waktu</th>
              <th scope="col" className="py-2 text-right font-semibold">Tarif</th>
            </tr>
          </thead>
          <tbody>
            {tercatat.map((t) => (
              <tr key={t.id} className="border-b border-border last:border-b-0">
                <th scope="row" className="py-2 text-left font-medium text-text">{t.nama}</th>
                <td className="py-2 text-text-muted">{formatTanggalWaktu(t.waktu)}</td>
                <td className="py-2 text-right text-text">{formatRupiah(t.tarif)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function BagianResep({
  admisiId,
  penggunaId,
  onAksi,
}: {
  admisiId: Id;
  penggunaId: Id;
  onAksi: (aksi: Action, sukses: string) => boolean;
}) {
  const state = useSelector((s) => s);
  const [baris, setBaris] = useState<BarisResep[]>([]);
  const [obatId, setObatId] = useState("");
  const [jumlah, setJumlah] = useState("1");
  const [aturanPakai, setAturanPakai] = useState("");
  const [galatBaris, setGalatBaris] = useState<string | null>(null);
  const [galatResep, setGalatResep] = useState<string | null>(null);
  const urutan = useRef(0);

  const resepAdmisi = state.resep.filter((r) => r.admisiId === admisiId);

  function tambahBaris() {
    if (!obatId) {
      setGalatBaris("Pilih obat terlebih dahulu.");
      return;
    }
    if (!Number.isInteger(Number(jumlah)) || Number(jumlah) <= 0) {
      setGalatBaris("Jumlah harus bilangan bulat lebih dari nol.");
      return;
    }
    if (!aturanPakai.trim()) {
      setGalatBaris("Aturan pakai wajib diisi, mis. 3×1 sesudah makan.");
      return;
    }
    setGalatBaris(null);
    setBaris((lama) => [...lama, { kunci: ++urutan.current, obatId, jumlah, aturanPakai }]);
    setObatId("");
    setJumlah("1");
    setAturanPakai("");
  }

  function buatResep() {
    if (baris.length === 0) {
      setGalatResep("Resep harus memuat minimal satu obat.");
      return;
    }
    setGalatResep(null);
    const berhasil = onAksi(
      {
        type: "resep/dibuat",
        olehId: penggunaId,
        admisiId,
        items: baris.map((b) => ({ obatId: b.obatId, jumlah: Number(b.jumlah), aturanPakai: b.aturanPakai })),
      },
      "Resep dikirim ke antrean farmasi dengan status menunggu.",
    );
    if (berhasil) setBaris([]);
  }

  return (
    <section aria-labelledby="judul-resep" className="rounded-lg border border-border bg-surface p-6 shadow-sm">
      <h2 id="judul-resep" className="text-title">
        Resep
      </h2>
      <p className="mt-1 text-small text-text-muted">
        Resep masuk ke antrean farmasi dengan status <span className="font-semibold">menunggu</span>,
        lalu bergerak satu arah sampai obat diserahkan.
      </p>

      <fieldset className="mt-4 rounded-md border border-border p-4">
        <legend className="px-1 text-small font-semibold text-text">Tambah obat ke resep</legend>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_6rem_minmax(0,1fr)]">
          <div>
            <label htmlFor="resep-obat" className="block text-small font-medium text-text">
              Obat
            </label>
            <select
              id="resep-obat"
              value={obatId}
              onChange={(e) => setObatId(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-md border border-border bg-canvas px-3 text-body text-text"
            >
              <option value="">Pilih obat…</option>
              {state.obat.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nama} ({o.satuan})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="resep-jumlah" className="block text-small font-medium text-text">
              Jumlah
            </label>
            <input
              id="resep-jumlah"
              type="number"
              min={1}
              step={1}
              value={jumlah}
              onChange={(e) => setJumlah(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-md border border-border bg-canvas px-3 text-body text-text"
            />
          </div>
          <div>
            <label htmlFor="resep-aturan" className="block text-small font-medium text-text">
              Aturan pakai
            </label>
            <input
              id="resep-aturan"
              type="text"
              placeholder="Mis. 3×1 sesudah makan"
              value={aturanPakai}
              onChange={(e) => setAturanPakai(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-md border border-border bg-canvas px-3 text-body text-text"
            />
          </div>
        </div>
        {galatBaris ? (
          <p role="alert" className="mt-2 text-caption text-danger">
            {galatBaris}
          </p>
        ) : null}
        <button type="button" onClick={tambahBaris} className={`mt-3 ${tombolSekunder}`}>
          Tambahkan ke resep
        </button>

        {baris.length === 0 ? (
          <p className="mt-3 text-caption text-text-muted">Belum ada obat pada resep yang sedang disusun.</p>
        ) : (
          <ul role="list" className="mt-3 space-y-2">
            {baris.map((b) => {
              const obat = state.obat.find((o) => o.id === b.obatId);
              return (
                <li key={b.kunci} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-surface-muted px-3 py-2 text-small">
                  <span className="text-text">
                    <span className="font-semibold">{obat?.nama}</span> — {b.jumlah} {obat?.satuan}, {b.aturanPakai}
                  </span>
                  <button
                    type="button"
                    onClick={() => setBaris((lama) => lama.filter((x) => x.kunci !== b.kunci))}
                    className="rounded-md px-2 py-1 text-caption font-semibold text-danger hover:underline"
                  >
                    Batalkan baris<span className="sr-only"> {obat?.nama}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {galatResep ? (
          <p role="alert" className="mt-2 text-caption text-danger">
            {galatResep}
          </p>
        ) : null}
        <button type="button" onClick={buatResep} className={`mt-3 ${tombolUtama}`}>
          Buat resep
        </button>
      </fieldset>

      <h3 className="mt-6 text-title">Resep pada admisi ini</h3>
      {resepAdmisi.length === 0 ? (
        <p className="mt-2 rounded-md border border-border bg-surface-muted p-3 text-small text-text-muted">
          Belum ada resep untuk admisi ini.
        </p>
      ) : (
        <ul role="list" className="mt-3 space-y-3">
          {resepAdmisi.map((r) => (
            <li key={r.id} className="rounded-md border border-border px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-small font-semibold text-text">
                  Resep {formatTanggalWaktu(r.waktu)}
                  {r.dokterId !== penggunaId ? <span className="ml-1.5 font-normal text-text-muted">oleh dokter lain</span> : null}
                </p>
                <p className={`text-small font-semibold ${WARNA_RESEP[r.status]}`}>{LABEL_RESEP[r.status]}</p>
              </div>
              <ul role="list" className="mt-2 space-y-1 text-small text-text">
                {r.items.map((item, index) => (
                  <li key={`${r.id}-${index}`}>
                    {item.nama} — {item.jumlah} · {item.aturanPakai}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RiwayatKlinis({
  pasienId,
  penggunaId,
  onAksi,
}: {
  pasienId: Id;
  penggunaId: Id;
  onAksi: (aksi: Action, sukses: string) => boolean;
}) {
  const state = useSelector((s) => s);
  const riwayat = riwayatKlinis(state, pasienId);
  const [koreksiId, setKoreksiId] = useState<Id | null>(null);
  const [isiKoreksi, setIsiKoreksi] = useState("");
  const [galatKoreksi, setGalatKoreksi] = useState<string | null>(null);

  function mulaiKoreksi(item: Extract<ItemRiwayat, { jenis: "catatan" }>) {
    setKoreksiId(item.catatan.id);
    setIsiKoreksi(item.catatan.isi);
    setGalatKoreksi(null);
  }

  function simpanKoreksi(e: React.FormEvent) {
    e.preventDefault();
    if (!koreksiId) return;
    if (!isiKoreksi.trim()) {
      setGalatKoreksi("Isi koreksi wajib diisi.");
      return;
    }
    setGalatKoreksi(null);
    const berhasil = onAksi(
      { type: "catatan/dikoreksi", olehId: penggunaId, catatanId: koreksiId, isi: isiKoreksi },
      "Koreksi tersimpan; catatan asli tetap tersimpan dan ditandai telah dikoreksi.",
    );
    if (berhasil) {
      setKoreksiId(null);
      setIsiKoreksi("");
    }
  }

  return (
    <section aria-labelledby="judul-riwayat" className="rounded-lg border border-border bg-surface p-6 shadow-sm">
      <h2 id="judul-riwayat" className="text-title">
        Riwayat klinis pasien
      </h2>
      <p className="mt-1 text-small text-text-muted">
        Seluruh catatan, tindakan, dan resep lintas admisi, terbaru lebih dahulu. Catatan tidak dapat
        dihapus.
      </p>

      {riwayat.length === 0 ? (
        <p className="mt-3 rounded-md border border-border bg-surface-muted p-3 text-small text-text-muted">
          Belum ada riwayat klinis untuk pasien ini. Riwayat terisi setelah catatan visite, tindakan,
          resep, atau catatan perawat ditambahkan.
        </p>
      ) : (
        <ol className="mt-4 space-y-4">
          {riwayat.map((item) => {
            const kunci = item.jenis === "catatan" ? item.catatan.id : item.jenis === "tindakan" ? item.tindakan.id : item.resep.id;
            return (
              <li key={kunci} className="border-b border-border pb-4 last:border-b-0 last:pb-0">
                <p className="text-caption text-text-muted">
                  <time dateTime={item.waktu}>{formatTanggalWaktu(item.waktu)}</time>
                </p>
                {item.jenis === "catatan" ? (
                  <IsiCatatan
                    item={item}
                    koreksiId={koreksiId}
                    isiKoreksi={isiKoreksi}
                    galatKoreksi={galatKoreksi}
                    onMulaiKoreksi={() => mulaiKoreksi(item)}
                    onBatalKoreksi={() => {
                      setKoreksiId(null);
                      setGalatKoreksi(null);
                    }}
                    onUbahKoreksi={setIsiKoreksi}
                    onSimpanKoreksi={simpanKoreksi}
                  />
                ) : item.jenis === "tindakan" ? (
                  <>
                    <p className="text-small font-semibold text-text">
                      Tindakan: {item.tindakan.nama}
                      <span className="ml-2 font-normal text-text-muted">{formatRupiah(item.tindakan.tarif)}</span>
                    </p>
                    <p className="text-caption text-text-muted">Dicatat oleh {item.oleh?.nama ?? "—"}</p>
                  </>
                ) : (
                  <>
                    <p className="text-small font-semibold text-text">
                      Resep
                      <span className={`ml-2 font-semibold ${WARNA_RESEP[item.resep.status]}`}>
                        {LABEL_RESEP[item.resep.status]}
                      </span>
                    </p>
                    <ul role="list" className="mt-1 space-y-1 text-small text-text">
                      {item.resep.items.map((resepItem, index) => (
                        <li key={`${item.resep.id}-${index}`}>
                          {resepItem.nama} — {resepItem.jumlah} · {resepItem.aturanPakai}
                        </li>
                      ))}
                    </ul>
                    <p className="text-caption text-text-muted">Diresepkan oleh {item.dokter?.nama ?? "—"}</p>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function IsiCatatan({
  item,
  koreksiId,
  isiKoreksi,
  galatKoreksi,
  onMulaiKoreksi,
  onBatalKoreksi,
  onUbahKoreksi,
  onSimpanKoreksi,
}: {
  item: Extract<ItemRiwayat, { jenis: "catatan" }>;
  koreksiId: Id | null;
  isiKoreksi: string;
  galatKoreksi: string | null;
  onMulaiKoreksi: () => void;
  onBatalKoreksi: () => void;
  onUbahKoreksi: (isi: string) => void;
  onSimpanKoreksi: (e: React.FormEvent) => void;
}) {
  const { catatan, penulis } = item;
  const sedangDikoreksi = koreksiId === catatan.id;
  return (
    <>
      <p className="text-small font-semibold text-text">
        {LABEL_JENIS_CATATAN[catatan.jenis]}
        {catatan.koreksiUntukId ? (
          <span className="ml-2 rounded-sm bg-info/10 px-1.5 py-0.5 text-caption font-semibold text-info">Koreksi</span>
        ) : null}
        {catatan.dikoreksiOlehId ? (
          <span className="ml-2 rounded-sm bg-warning/10 px-1.5 py-0.5 text-caption font-semibold text-warning">
            Telah dikoreksi
          </span>
        ) : null}
      </p>
      <p className="mt-1 whitespace-pre-line text-body text-text">{catatan.isi}</p>
      {catatan.diagnosa ? (
        <p className="mt-1 text-small text-text">
          <span className="text-text-muted">Diagnosa: </span>
          {catatan.diagnosa}
        </p>
      ) : null}
      {catatan.rencana ? (
        <p className="mt-1 text-small text-text">
          <span className="text-text-muted">Rencana: </span>
          {catatan.rencana}
        </p>
      ) : null}
      {catatan.tandaVital ? (
        <p className="mt-1 text-small text-text">
          <span className="text-text-muted">Tanda vital: </span>
          TD {catatan.tandaVital.tekananDarah} · Suhu {catatan.tandaVital.suhu} °C · Nadi {catatan.tandaVital.nadi} ·
          RR {catatan.tandaVital.pernapasan} · SpO₂ {catatan.tandaVital.saturasi}%
        </p>
      ) : null}
      <p className="mt-1 text-caption text-text-muted">Ditulis oleh {penulis?.nama ?? "—"}</p>

      {!catatan.dikoreksiOlehId && !sedangDikoreksi ? (
        <button type="button" onClick={onMulaiKoreksi} className={`mt-2 ${tombolSekunderKecil}`}>
          Koreksi catatan
          {/* Nama tombol sama di setiap entri; waktu membedakannya bagi pembaca layar. */}
          <span className="sr-only"> {LABEL_JENIS_CATATAN[catatan.jenis]} {formatTanggalWaktu(catatan.waktu)}</span>
        </button>
      ) : null}

      {sedangDikoreksi ? (
        <form onSubmit={onSimpanKoreksi} className="mt-3 rounded-md border border-border bg-surface-muted p-3">
          <label htmlFor={`koreksi-${catatan.id}`} className="block text-small font-medium text-text">
            Isi koreksi
          </label>
          <textarea
            id={`koreksi-${catatan.id}`}
            rows={3}
            value={isiKoreksi}
            onChange={(e) => onUbahKoreksi(e.target.value)}
            aria-invalid={galatKoreksi ? true : undefined}
            aria-describedby={galatKoreksi ? `koreksi-${catatan.id}-galat` : undefined}
            className="mt-1 w-full rounded-md border border-border bg-canvas px-3 py-2 text-body text-text"
          />
          {galatKoreksi ? (
            <p id={`koreksi-${catatan.id}-galat`} role="alert" className="mt-1 text-caption text-danger">
              {galatKoreksi}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="submit" className={tombolUtama}>
              Simpan koreksi
            </button>
            <button type="button" onClick={onBatalKoreksi} className={tombolSekunderKecil}>
              Batal
            </button>
          </div>
        </form>
      ) : null}
    </>
  );
}

const tombolUtama =
  "inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-small font-semibold text-on-primary transition-colors hover:bg-primary-hover";
const tombolSekunder =
  "inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-small font-semibold text-text transition-colors hover:bg-surface-muted";
const tombolSekunderKecil =
  "inline-flex min-h-11 items-center rounded-md px-2 text-small font-semibold text-primary hover:underline";
