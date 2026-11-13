"use client";

import { useEffect, useRef, useState } from "react";
import { useSesi } from "@/components/shell/sesi-provider";
import { useSelector, useStoreDemo } from "@/components/shell/store-provider";
import type { InputPasien } from "@/lib/domain/actions";
import { cariPasien, pasienDenganNik, pilihPasienById } from "@/lib/domain/selectors";
import type { Pasien } from "@/lib/domain/types";
import { formatTanggal } from "@/lib/format";

/** Isian datar supaya tiap kolom punya nama sendiri untuk pesan kesalahan. */
interface Isian {
  nama: string;
  nik: string;
  tanggalLahir: string;
  jenisKelamin: string;
  alamat: string;
  telepon: string;
  pjNama: string;
  pjHubungan: string;
  pjTelepon: string;
}

const ISIAN_AWAL: Isian = {
  nama: "",
  nik: "",
  tanggalLahir: "",
  jenisKelamin: "",
  alamat: "",
  telepon: "",
  pjNama: "",
  pjHubungan: "",
  pjTelepon: "",
};

/** Pesan per kolom; urutan mengikuti urutan formulir. */
const WAJIB: Array<[keyof Isian, string]> = [
  ["nama", "Nama pasien wajib diisi."],
  ["nik", "NIK wajib diisi."],
  ["tanggalLahir", "Tanggal lahir wajib diisi."],
  ["jenisKelamin", "Pilih jenis kelamin."],
  ["alamat", "Alamat wajib diisi."],
  ["telepon", "Telepon pasien wajib diisi."],
  ["pjNama", "Nama penanggung jawab wajib diisi."],
  ["pjHubungan", "Hubungan dengan pasien wajib diisi."],
  ["pjTelepon", "Telepon penanggung jawab wajib diisi."],
];

type Galat = Partial<Record<keyof Isian, string>>;

function validasi(isian: Isian): Galat {
  const galat: Galat = {};
  for (const [kunci, pesan] of WAJIB) {
    if (!isian[kunci].trim()) galat[kunci] = pesan;
  }
  return galat;
}

function keInput(isian: Isian): InputPasien {
  return {
    nama: isian.nama.trim(),
    nik: isian.nik.trim(),
    tanggalLahir: isian.tanggalLahir,
    jenisKelamin: isian.jenisKelamin === "L" ? "L" : "P",
    alamat: isian.alamat.trim(),
    telepon: isian.telepon.trim(),
    penanggungJawab: {
      nama: isian.pjNama.trim(),
      hubungan: isian.pjHubungan.trim(),
      telepon: isian.pjTelepon.trim(),
    },
  };
}

/**
 * Langkah 1 wizard pendaftaran: temukan pasien lama atau buat pasien baru.
 * Isian langkah ini hidup di state halaman, bukan di store, supaya petugas
 * dapat kembali dari langkah berikutnya tanpa kehilangan apa pun.
 */
export default function HalamanPendaftaran() {
  const { pengguna } = useSesi();
  const store = useStoreDemo();
  const state = useSelector((s) => s);

  const [langkah, setLangkah] = useState<1 | 2>(1);
  const [kataKunci, setKataKunci] = useState("");
  const [isian, setIsian] = useState<Isian>(ISIAN_AWAL);
  const [galat, setGalat] = useState<Galat>({});
  const [pasien, setPasien] = useState<Pasien | null>(null);
  const [baruDisimpan, setBaruDisimpan] = useState(false);
  const [galatSimpan, setGalatSimpan] = useState<string | null>(null);
  const [pengumuman, setPengumuman] = useState("");
  const judulLangkah = useRef<HTMLHeadingElement>(null);
  const namaPasien = useRef<HTMLInputElement>(null);

  // Perpindahan langkah mengganti seluruh isi halaman; tanpa memindahkan fokus
  // ke judul langkah, pengguna keyboard kembali ke awal dokumen (WCAG 2.4.3).
  useEffect(() => {
    if (langkah === 2) judulLangkah.current?.focus();
  }, [langkah]);

  if (!pengguna) return null;

  const hasilCari = cariPasien(state, kataKunci);
  const kandidat = isian.nik.trim() ? pasienDenganNik(state, isian.nik.trim()) : undefined;
  // Pasien yang baru saja dibuat dari formulir ini bukan duplikat dirinya sendiri.
  const duplikat = baruDisimpan && kandidat?.id === pasien?.id ? undefined : kandidat;

  function ubah<K extends keyof Isian>(kunci: K, nilai: string) {
    setIsian((lama) => ({ ...lama, [kunci]: nilai }));
    setGalat((lama) => ({ ...lama, [kunci]: undefined }));
  }

  function pilih(target: Pasien) {
    setPasien(target);
    setBaruDisimpan(false);
    setPengumuman(`Pasien ${target.nama} dipilih. Langkah 2 dari 3.`);
    setLangkah(2);
  }

  function simpan(e: React.FormEvent) {
    e.preventDefault();
    setGalatSimpan(null);
    const salah = validasi(isian);
    setGalat(salah);
    if (Object.keys(salah).length > 0 || duplikat) return;

    // Store tetap penjaga terakhir; pesan formulir hanya membimbing lebih awal.
    const hasil = store.dispatch({ type: "pasien/dibuat", olehId: pengguna!.id, input: keInput(isian) });
    if (!hasil.ok) {
      setGalatSimpan(hasil.alasan);
      return;
    }
    const baru = pilihPasienById(store.getState(), hasil.id) ?? null;
    setPasien(baru);
    setBaruDisimpan(true);
    setPengumuman(
      `Pasien ${baru?.nama ?? ""} tersimpan dengan Nomor Rekam Medis ${baru?.nomorRM ?? ""}.`,
    );
  }

  if (langkah === 2) {
    return (
      <div>
        <h1 className="text-heading">Pendaftaran pasien</h1>
        <p className="mt-2 text-caption font-semibold uppercase tracking-wide text-text-muted">
          Langkah 2 dari 3
        </p>
        <section aria-label="Dokter dan bed" className="mt-4 max-w-prose rounded-lg border border-border bg-surface p-6 shadow-sm">
          <h2 ref={judulLangkah} tabIndex={-1} className="text-title">
            Dokter, tanggal masuk, dan bed
          </h2>
          <p className="mt-3 text-body">
            Pasien terpilih: <span className="font-semibold">{pasien?.nama}</span>
            <span className="mx-1.5" aria-hidden="true">·</span>
            {pasien?.nomorRM}
          </p>
          <p className="mt-2 text-small text-text-muted">
            Pilihan dokter, tanggal masuk, diagnosa awal, dan bed dibangun pada ticket berikutnya.
          </p>
          <button
            type="button"
            onClick={() => setLangkah(1)}
            className="mt-5 inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-small font-semibold text-text transition-colors hover:bg-surface-muted"
          >
            Kembali ke langkah 1
          </button>
        </section>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-heading">Pendaftaran pasien</h1>
      <p className="mt-2 text-caption font-semibold uppercase tracking-wide text-text-muted">
        Langkah 1 dari 3
      </p>
      <p className="mt-2 max-w-prose text-body text-text-muted">
        Cari pasien lama lebih dulu agar tidak ada rekam medis ganda. Bila belum pernah terdaftar, buat
        pasien baru di bawah.
      </p>
      <p role="status" className="sr-only">
        {pengumuman}
      </p>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <section
          aria-label="Cari pasien lama"
          className="rounded-lg border border-border bg-surface p-6 shadow-sm"
        >
          <label htmlFor="kata-kunci" className="block text-small font-medium text-text">
            Kata kunci pencarian
          </label>
          <p className="mt-1 text-caption text-text-muted">Nama, NIK, atau Nomor Rekam Medis.</p>
          <input
            id="kata-kunci"
            type="search"
            autoComplete="off"
            value={kataKunci}
            onChange={(e) => setKataKunci(e.target.value)}
            className="mt-2 min-h-11 w-full rounded-md border border-border bg-canvas px-3 text-body text-text"
          />

          {kataKunci.trim() === "" ? (
            <p className="mt-4 text-small text-text-muted">Ketik nama pasien untuk mulai mencari.</p>
          ) : hasilCari.length === 0 ? (
            <div className="mt-4 rounded-md border border-border bg-surface-muted p-4">
              <p className="text-small text-text">
                Tidak ada pasien yang cocok dengan &ldquo;{kataKunci.trim()}&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => namaPasien.current?.focus()}
                className="mt-3 inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-small font-semibold text-on-primary transition-colors hover:bg-primary-hover"
              >
                Buat pasien baru
              </button>
            </div>
          ) : (
            <ul role="list" aria-label="Hasil pencarian" className="mt-4 space-y-2">
              {hasilCari.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => pilih(p)}
                    className="flex w-full flex-col items-start gap-1 rounded-md border border-border px-4 py-3 text-left transition-colors hover:border-primary hover:bg-primary-soft"
                  >
                    <span className="text-small font-semibold text-text">{p.nama}</span>
                    <span className="text-caption text-text-muted">
                      {p.nomorRM}
                      <span className="mx-1.5" aria-hidden="true">·</span>
                      Lahir {formatTanggal(p.tanggalLahir)}
                      <span className="mx-1.5" aria-hidden="true">·</span>
                      NIK {p.nik}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          aria-label="Pasien baru"
          className="rounded-lg border border-border bg-surface p-6 shadow-sm"
        >
          <h2 className="text-title">Pasien baru</h2>
          <p className="mt-1 text-small text-text-muted">
            Nomor Rekam Medis dibuat otomatis saat pasien disimpan.
          </p>

          {baruDisimpan ? (
            <div className="mt-4 rounded-md border border-success bg-surface-muted p-4">
              <p className="text-small font-semibold text-success">Pasien tersimpan.</p>
              <p className="mt-1 text-body text-text">
                Nomor Rekam Medis{" "}
                <span className="font-mono font-semibold">{pasien?.nomorRM}</span> — berikan nomor ini
                kepada pasien.
              </p>
              <button
                type="button"
                onClick={() => pasien && pilih(pasien)}
                className="mt-3 inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-small font-semibold text-on-primary transition-colors hover:bg-primary-hover"
              >
                Lanjut ke langkah 2
              </button>
            </div>
          ) : null}

          <form onSubmit={simpan} noValidate className="mt-5 space-y-4">
            <fieldset className="space-y-4">
              <legend className="text-small font-semibold text-text">Identitas</legend>
              <Bidang
                id="nama"
                label="Nama pasien"
                nilai={isian.nama}
                galat={galat.nama}
                autoComplete="name"
                inputRef={namaPasien}
                onChange={(v) => ubah("nama", v)}
              />
              <Bidang
                id="nik"
                label="NIK"
                nilai={isian.nik}
                galat={
                  galat.nik ??
                  (duplikat
                    ? `NIK ${isian.nik.trim()} sudah terdaftar atas nama ${duplikat.nama} (${duplikat.nomorRM}). Gunakan pasien yang sudah ada.`
                    : undefined)
                }
                inputMode="numeric"
                onChange={(v) => ubah("nik", v)}
              />
              <Bidang
                id="tanggal-lahir"
                label="Tanggal lahir"
                nilai={isian.tanggalLahir}
                galat={galat.tanggalLahir}
                type="date"
                onChange={(v) => ubah("tanggalLahir", v)}
              />
              <div>
                <label htmlFor="jenis-kelamin" className="block text-small font-medium text-text">
                  Jenis kelamin
                </label>
                <select
                  id="jenis-kelamin"
                  value={isian.jenisKelamin}
                  onChange={(e) => ubah("jenisKelamin", e.target.value)}
                  aria-invalid={galat.jenisKelamin ? true : undefined}
                  aria-describedby={galat.jenisKelamin ? "jenis-kelamin-galat" : undefined}
                  className="mt-1 min-h-11 w-full rounded-md border border-border bg-canvas px-3 text-body text-text"
                >
                  <option value="">Pilih…</option>
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
                <PesanGalat id="jenis-kelamin-galat" pesan={galat.jenisKelamin} />
              </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-small font-semibold text-text">Kontak</legend>
              <Bidang
                id="alamat"
                label="Alamat"
                nilai={isian.alamat}
                galat={galat.alamat}
                autoComplete="street-address"
                onChange={(v) => ubah("alamat", v)}
              />
              <Bidang
                id="telepon"
                label="Telepon pasien"
                nilai={isian.telepon}
                galat={galat.telepon}
                type="tel"
                inputMode="tel"
                onChange={(v) => ubah("telepon", v)}
              />
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-small font-semibold text-text">Penanggung jawab</legend>
              <Bidang
                id="pj-nama"
                label="Nama penanggung jawab"
                nilai={isian.pjNama}
                galat={galat.pjNama}
                onChange={(v) => ubah("pjNama", v)}
              />
              <Bidang
                id="pj-hubungan"
                label="Hubungan dengan pasien"
                nilai={isian.pjHubungan}
                galat={galat.pjHubungan}
                onChange={(v) => ubah("pjHubungan", v)}
              />
              <Bidang
                id="pj-telepon"
                label="Telepon penanggung jawab"
                nilai={isian.pjTelepon}
                galat={galat.pjTelepon}
                type="tel"
                inputMode="tel"
                onChange={(v) => ubah("pjTelepon", v)}
              />
            </fieldset>

            {galatSimpan ? (
              <p role="alert" className="rounded-md border border-danger px-3 py-2 text-small text-danger">
                {galatSimpan}
              </p>
            ) : null}

            <button
              type="submit"
              className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-small font-semibold text-on-primary transition-colors hover:bg-primary-hover"
            >
              Simpan pasien
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

interface BidangProps {
  id: string;
  label: string;
  nilai: string;
  galat?: string;
  type?: "text" | "date" | "tel";
  inputMode?: "numeric" | "tel";
  autoComplete?: string;
  inputRef?: React.Ref<HTMLInputElement>;
  onChange: (nilai: string) => void;
}

function Bidang({
  id,
  label,
  nilai,
  galat,
  type = "text",
  inputMode,
  autoComplete,
  inputRef,
  onChange,
}: BidangProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-small font-medium text-text">
        {label}
      </label>
      <input
        id={id}
        ref={inputRef}
        type={type}
        value={nilai}
        inputMode={inputMode}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={galat ? true : undefined}
        aria-describedby={galat ? `${id}-galat` : undefined}
        className="mt-1 min-h-11 w-full rounded-md border border-border bg-canvas px-3 text-body text-text"
      />
      <PesanGalat id={`${id}-galat`} pesan={galat} />
    </div>
  );
}

/** `role="alert"` hanya untuk pesan yang muncul akibat isian, bukan yang tampil sejak awal. */
function PesanGalat({ id, pesan }: { id: string; pesan?: string }) {
  if (!pesan) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-caption text-danger">
      {pesan}
    </p>
  );
}
