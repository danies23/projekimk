"use client";

import { useEffect, useRef, useState } from "react";
import { useSesi } from "@/components/shell/sesi-provider";
import { useStoreDemo, useSelector } from "@/components/shell/store-provider";
import type { Action } from "@/lib/domain/actions";
import { boleh } from "@/lib/domain/izin";
import {
  instruksiBelumDijalankan,
  tandaVitalTerakhir,
  type InfoAdmisi,
  type InstruksiDokter,
} from "@/lib/domain/selectors";
import type { CatatanKlinis, Id } from "@/lib/domain/types";
import { formatTanggalWaktu } from "@/lib/format";
import { RiwayatKlinis } from "./riwayat";

/**
 * Modul Klinis untuk perawat: daftar pasien yang dirawat, tanda vital terakhir
 * per pasien (agar dapat dipindai tanpa membuka catatan), instruksi dokter yang
 * belum dijalankan, dan catatan perkembangan harian. Semua mutasi lewat store.
 */
export function KlinisPerawat({
  penggunaId,
  pasien: semuaPasien,
}: {
  penggunaId: Id;
  pasien: InfoAdmisi[];
}) {
  const state = useSelector((s) => s);
  const [dipilihId, setDipilihId] = useState<Id | null>(null);
  const [pengumuman, setPengumuman] = useState("");
  const [galat, setGalat] = useState<string | null>(null);
  const judulDetail = useRef<HTMLHeadingElement>(null);
  const store = useStoreDemo();
  // Pesan galat milik pasien sebelumnya tidak boleh terbawa ke pasien berikutnya.
  const [galatUntuk, setGalatUntuk] = useState<Id | null>(null);
  // Pasien pertama yang sudah punya tanda vital dipilih otomatis selama
  // pengguna belum memilih sendiri: tampilan awal harus memuat kondisi terakhir.
  const admisiId =
    dipilihId ??
    semuaPasien.find((p) => tandaVitalTerakhir(state, p.admisiId))?.admisiId ??
    semuaPasien[0]?.admisiId ??
    null;

  // Fokus pindah ke judul hanya setelah pengguna memilih sendiri; pilihan
  // otomatis saat muat pertama tidak boleh merampas fokus (WCAG 2.4.3).
  useEffect(() => {
    if (dipilihId) judulDetail.current?.focus();
  }, [dipilihId]);

  // Pasien terpilih bisa keluar dari daftar (checkout orang lain); jatuh ke
  // pilihan otomatis alih-alih menampilkan layar kosong padahal daftar berisi.
  const dipilih = semuaPasien.find((p) => p.admisiId === admisiId) ?? semuaPasien[0] ?? null;

  function jalankan(aksi: Action, sukses: string): boolean {
    setGalat(null);
    const hasil = store.dispatch(aksi);
    if (!hasil.ok) {
      setGalat(hasil.alasan);
      setGalatUntuk(admisiId);
      return false;
    }
    setPengumuman(sukses);
    return true;
  }

  return (
    <div>
      <header>
        <h1 className="text-heading">Klinis — perawat</h1>
        <p className="mt-2 max-w-prose text-body text-text-muted">
          Pemantauan harian pasien yang dirawat. Tanda vital terakhir tampil di daftar, instruksi
          dokter ditandai setelah dijalankan, dan catatan perawat masuk ke riwayat klinis yang sama
          dengan yang dibaca dokter.
        </p>
      </header>

      <p role="status" className="sr-only">
        {pengumuman}
      </p>
      {galat && galatUntuk === admisiId ? (
        <p role="alert" className="mt-4 rounded-md border border-danger px-3 py-2 text-small text-danger">
          {galat}
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <DaftarPemantauan pasien={semuaPasien} dipilihId={admisiId} onPilih={setDipilihId} />

        {dipilih ? (
          <DetailPemantauan
            // Draf tanda vital pasien A tidak boleh terbawa ke pasien B.
            key={dipilih.admisiId}
            info={dipilih}
            penggunaId={penggunaId}
            judulRef={judulDetail}
            onAksi={jalankan}
          />
        ) : (
          <section className="rounded-lg border border-border bg-surface-muted p-6">
            <h2 className="text-title">Belum ada pasien dirawat</h2>
            <p className="mt-2 text-small text-text-muted">
              Pasien muncul di sini setelah petugas pendaftaran membuat admisi rawat inap.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

/** Daftar pasien beserta bed, dokter, dan tanda vital terakhir yang bisa dipindai. */
function DaftarPemantauan({
  pasien,
  dipilihId,
  onPilih,
}: {
  pasien: InfoAdmisi[];
  dipilihId: Id | null;
  onPilih: (admisiId: Id) => void;
}) {
  const state = useSelector((s) => s);
  return (
    <section aria-label="Pasien yang perlu dipantau" className="self-start rounded-lg border border-border bg-surface p-4 shadow-sm">
      <h2 className="text-title">Pasien yang perlu dipantau</h2>
      <p className="mt-1 text-caption text-text-muted">
        {pasien.length === 0 ? "Tidak ada pasien aktif." : `${pasien.length} pasien sedang dirawat.`}
      </p>
      <ul role="list" className="mt-3 space-y-2">
        {pasien.map((p) => {
          const vital = tandaVitalTerakhir(state, p.admisiId);
          return (
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
                  {p.bed.kode}
                  <span className="mx-1.5" aria-hidden="true">·</span>
                  {p.dokter.nama}
                </span>
                <span className="block text-caption text-text-muted">
                  {vital?.tandaVital ? ringkasVital(vital) : "Belum ada tanda vital"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Satu baris yang muat dipindai: TD · suhu · nadi · RR · SpO₂. */
function ringkasVital(catatan: CatatanKlinis): string {
  const v = catatan.tandaVital!;
  return `TD ${v.tekananDarah} · ${v.suhu}°C · N ${v.nadi} · RR ${v.pernapasan} · SpO₂ ${v.saturasi}%`;
}

function DetailPemantauan({
  info,
  penggunaId,
  judulRef,
  onAksi,
}: {
  info: InfoAdmisi;
  penggunaId: Id;
  judulRef: React.Ref<HTMLHeadingElement>;
  onAksi: (aksi: Action, sukses: string) => boolean;
}) {
  const state = useSelector((s) => s);
  const vital = tandaVitalTerakhir(state, info.admisiId);
  const instruksi = instruksiBelumDijalankan(state, info.admisiId);

  return (
    <div className="space-y-6">
      <section aria-label="Konteks admisi" className="rounded-lg border border-border bg-surface p-6 shadow-sm">
        <h2 ref={judulRef} tabIndex={-1} className="text-title">
          {info.pasien.nama}
        </h2>
        <dl className="mt-4 grid gap-2 text-body sm:grid-cols-2">
          <BarisRingkas label="Nomor Rekam Medis" nilai={info.pasien.nomorRM} />
          <BarisRingkas label="Bed" nilai={`${info.bed.kode} — ${info.kamar.nama} (kelas ${info.kamar.kelas})`} />
          <BarisRingkas label="Dokter penanggung jawab" nilai={info.dokter.nama} />
          <BarisRingkas label="Diagnosa awal" nilai={info.diagnosaAwal || "—"} />
        </dl>
      </section>

      <section aria-label="Tanda vital terakhir" className="rounded-lg border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-title">Tanda vital terakhir</h2>
        {vital?.tandaVital ? (
          <>
            <p className="mt-2 text-caption text-text-muted">
              Dicatat <time dateTime={vital.waktu}>{formatTanggalWaktu(vital.waktu)}</time>
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
              <AngkaVital label="Tekanan darah" nilai={vital.tandaVital.tekananDarah} satuan="mmHg" />
              <AngkaVital label="Suhu" nilai={String(vital.tandaVital.suhu)} satuan="°C" />
              <AngkaVital label="Nadi" nilai={String(vital.tandaVital.nadi)} satuan="x/menit" />
              <AngkaVital label="Pernapasan" nilai={String(vital.tandaVital.pernapasan)} satuan="x/menit" />
              <AngkaVital label="Saturasi" nilai={String(vital.tandaVital.saturasi)} satuan="%" />
            </dl>
          </>
        ) : (
          <p className="mt-2 rounded-md border border-border bg-surface-muted p-3 text-small text-text-muted">
            Belum ada tanda vital untuk pasien ini. Catat pemantauan pertama di bawah.
          </p>
        )}
      </section>

      <FormTandaVital admisiId={info.admisiId} penggunaId={penggunaId} onAksi={onAksi} />

      <BagianInstruksi instruksi={instruksi} penggunaId={penggunaId} onAksi={onAksi} />

      <FormPerkembangan admisiId={info.admisiId} penggunaId={penggunaId} onAksi={onAksi} />

      {/* Riwayat yang sama dengan yang dibaca dokter, termasuk penanda koreksi;
          perawat mengoreksi catatan di sini dengan aturan yang sama. */}
      <RiwayatKlinis pasienId={info.pasien.id} penggunaId={penggunaId} onAksi={onAksi} />
    </div>
  );
}

function AngkaVital({ label, nilai, satuan }: { label: string; nilai: string; satuan: string }) {
  return (
    <div className="rounded-md border border-border px-3 py-2">
      <dt className="text-caption text-text-muted">{label}</dt>
      <dd className="text-body font-semibold text-text">
        {nilai} <span className="text-caption font-normal text-text-muted">{satuan}</span>
      </dd>
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

/** Form tanda vital; rentangnya sama dengan pemeriksaan store. */
function FormTandaVital({
  admisiId,
  penggunaId,
  onAksi,
}: {
  admisiId: Id;
  penggunaId: Id;
  onAksi: (aksi: Action, sukses: string) => boolean;
}) {
  const KOLOM = ["tekananDarah", "suhu", "nadi", "pernapasan", "saturasi"] as const;
  type Kolom = (typeof KOLOM)[number];
  const [vital, setVital] = useState<Record<Kolom, string>>({
    tekananDarah: "",
    suhu: "",
    nadi: "",
    pernapasan: "",
    saturasi: "",
  });
  const [galat, setGalat] = useState<Partial<Record<Kolom, string>>>({});

  function ubah(kunci: Kolom, nilai: string) {
    setVital((lama) => ({ ...lama, [kunci]: nilai }));
    setGalat((lama) => ({ ...lama, [kunci]: undefined }));
  }

  function simpan(e: React.FormEvent) {
    e.preventDefault();
    // Kolom kosong ditolak di sini agar pesannya menempel pada kolomnya;
    // rentang nilai tetap milik store, satu tempat untuk semua layar.
    const kosong = Object.fromEntries(
      KOLOM.filter((k) => !vital[k].trim()).map((k) => [k, "Wajib diisi."]),
    ) as Partial<Record<Kolom, string>>;
    setGalat(kosong);
    if (Object.keys(kosong).length > 0) return;

    const angka = {
      suhu: Number(vital.suhu),
      nadi: Number(vital.nadi),
      pernapasan: Number(vital.pernapasan),
      saturasi: Number(vital.saturasi),
    };
    const berhasil = onAksi(
      {
        type: "catatan/ditulis",
        olehId: penggunaId,
        admisiId,
        jenis: "tanda_vital",
        isi: "Pemantauan tanda vital.",
        diagnosa: null,
        rencana: null,
        tandaVital: { tekananDarah: vital.tekananDarah, ...angka },
      },
      "Tanda vital tersimpan.",
    );
    if (berhasil) setVital({ tekananDarah: "", suhu: "", nadi: "", pernapasan: "", saturasi: "" });
  }

  return (
    <section aria-labelledby="judul-vital" className="rounded-lg border border-border bg-surface p-6 shadow-sm">
      <h2 id="judul-vital" className="text-title">
        Catat tanda vital
      </h2>
      <form onSubmit={simpan} noValidate className="mt-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <BidangVital
            id="vital-td"
            label="Tekanan darah (mmHg)"
            placeholder="120/80"
            nilai={vital.tekananDarah}
            galat={galat.tekananDarah}
            onChange={(v) => ubah("tekananDarah", v)}
          />
          <BidangVital
            id="vital-suhu"
            label="Suhu (°C)"
            nilai={vital.suhu}
            galat={galat.suhu}
            onChange={(v) => ubah("suhu", v)}
          />
          <BidangVital
            id="vital-nadi"
            label="Nadi (x/menit)"
            nilai={vital.nadi}
            galat={galat.nadi}
            onChange={(v) => ubah("nadi", v)}
          />
          <BidangVital
            id="vital-rr"
            label="Pernapasan (x/menit)"
            nilai={vital.pernapasan}
            galat={galat.pernapasan}
            onChange={(v) => ubah("pernapasan", v)}
          />
          <BidangVital
            id="vital-spo2"
            label="Saturasi (%)"
            nilai={vital.saturasi}
            galat={galat.saturasi}
            onChange={(v) => ubah("saturasi", v)}
          />
        </div>
        <p className="mt-2 text-caption text-text-muted">
          Nilai di luar rentang wajar (mis. suhu 47 °C) ditolak saat disimpan.
        </p>
        <button type="submit" className={`mt-4 ${tombolUtama}`}>
          Simpan tanda vital
        </button>
      </form>
    </section>
  );
}

function BidangVital({
  id,
  label,
  nilai,
  placeholder,
  galat,
  onChange,
}: {
  id: string;
  label: string;
  nilai: string;
  placeholder?: string;
  /** Pesan milik kolom ini, ditautkan lewat aria-describedby. */
  galat?: string;
  onChange: (nilai: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-small font-medium text-text">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        placeholder={placeholder}
        value={nilai}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={galat ? true : undefined}
        aria-describedby={galat ? `${id}-galat` : undefined}
        className="mt-1 min-h-11 w-full rounded-md border border-border bg-canvas px-3 text-body text-text"
      />
      {galat ? (
        <p id={`${id}-galat`} className="mt-1 text-caption text-danger">
          {galat}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Instruksi dokter (rencana visite) yang belum dijalankan. Ditandai lewat store
 * sehingga statusnya terlihat semua peran yang membaca catatan itu.
 */
function BagianInstruksi({
  instruksi,
  penggunaId,
  onAksi,
}: {
  instruksi: InstruksiDokter[];
  penggunaId: Id;
  onAksi: (aksi: Action, sukses: string) => boolean;
}) {
  const peran = useSesi().pengguna?.peran;
  const bolehJalankan = boleh(peran, "instruksi.jalankan");
  return (
    <section aria-labelledby="judul-instruksi" className="rounded-lg border border-border bg-surface p-6 shadow-sm">
      <h2 id="judul-instruksi" className="text-title">
        Instruksi dokter
      </h2>
      <p className="mt-1 text-small text-text-muted">
        Rencana visite yang belum ditandai dijalankan. Penanda ini dibaca juga oleh dokter pada
        riwayat klinis pasien.
      </p>
      {instruksi.length === 0 ? (
        <p className="mt-3 rounded-md border border-border bg-surface-muted p-3 text-small text-text-muted">
          Tidak ada instruksi yang menunggu dijalankan.
        </p>
      ) : (
        <ul role="list" className="mt-3 space-y-3">
          {instruksi.map(({ catatan, dokter }) => (
            <li key={catatan.id} className="rounded-md border border-border px-4 py-3">
              <p className="text-small text-text">{catatan.rencana}</p>
              <p className="mt-1 text-caption text-text-muted">
                {dokter?.nama ?? "Dokter"} · <time dateTime={catatan.waktu}>{formatTanggalWaktu(catatan.waktu)}</time>
              </p>
              <button
                type="button"
                onClick={() =>
                  onAksi(
                    { type: "instruksi/dijalankan", olehId: penggunaId, catatanId: catatan.id },
                    "Instruksi ditandai sudah dijalankan.",
                  )
                }
                className={`mt-2 ${tombolSekunderKecil}`}
                disabled={!bolehJalankan}
              >
                Tandai sudah dijalankan
                <span className="sr-only">: {catatan.rencana}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function FormPerkembangan({
  admisiId,
  penggunaId,
  onAksi,
}: {
  admisiId: Id;
  penggunaId: Id;
  onAksi: (aksi: Action, sukses: string) => boolean;
}) {
  const [isi, setIsi] = useState("");
  const [galat, setGalat] = useState<string | null>(null);

  function simpan(e: React.FormEvent) {
    e.preventDefault();
    if (!isi.trim()) {
      setGalat("Isi catatan perkembangan wajib diisi.");
      return;
    }
    setGalat(null);
    const berhasil = onAksi(
      {
        type: "catatan/ditulis",
        olehId: penggunaId,
        admisiId,
        jenis: "perkembangan",
        isi,
        diagnosa: null,
        rencana: null,
        tandaVital: null,
      },
      "Catatan perkembangan tersimpan.",
    );
    if (berhasil) setIsi("");
  }

  return (
    <section aria-labelledby="judul-perkembangan" className="rounded-lg border border-border bg-surface p-6 shadow-sm">
      <h2 id="judul-perkembangan" className="text-title">
        Catatan perkembangan harian
      </h2>
      <form onSubmit={simpan} noValidate className="mt-4">
        <label htmlFor="perkembangan-isi" className="block text-small font-medium text-text">
          Isi catatan
        </label>
        <textarea
          id="perkembangan-isi"
          rows={3}
          value={isi}
          onChange={(e) => {
            setIsi(e.target.value);
            setGalat(null);
          }}
          aria-invalid={galat ? true : undefined}
          aria-describedby={galat ? "perkembangan-galat" : undefined}
          className="mt-1 w-full rounded-md border border-border bg-canvas px-3 py-2 text-body text-text"
        />
        {galat ? (
          <p id="perkembangan-galat" role="alert" className="mt-1 text-caption text-danger">
            {galat}
          </p>
        ) : null}
        <button type="submit" className={`mt-3 ${tombolUtama}`}>
          Simpan catatan perkembangan
        </button>
      </form>
    </section>
  );
}

const tombolUtama =
  "inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-small font-semibold text-on-primary transition-colors hover:bg-primary-hover";
const tombolSekunderKecil =
  "inline-flex min-h-11 items-center rounded-md px-2 text-small font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-60";
