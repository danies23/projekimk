"use client";

import { useEffect, useRef, useState } from "react";
import { Wordmark } from "@/components/brand/wordmark";
import { useSesi } from "@/components/shell/sesi-provider";
import { useHariIni, useSelector, useStoreDemo } from "@/components/shell/store-provider";
import type { InputPasien } from "@/lib/domain/actions";
import {
  alasanBedTidakTersedia,
  cariPasien,
  daftarAdmisiAktif,
  denahBed,
  dokterAktif,
  infoAdmisi,
  pasienDenganNik,
  penggunaById,
  pilihPasienById,
  ringkasanBed,
  type InfoAdmisi,
  type RingkasanBed,
} from "@/lib/domain/selectors";
import type { Pasien, StatusBed } from "@/lib/domain/types";
import { formatAngka, formatRupiah, formatTanggal } from "@/lib/format";

/** Warna status melengkapi teks, bukan menggantikannya (WCAG 1.4.1). */
const labelStatus: Record<StatusBed, string> = {
  terisi: "text-danger",
  kosong: "text-success",
  dibersihkan: "text-warning",
};

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
 * Wizard pendaftaran tiga langkah: cari/buat pasien, pilih dokter dan bed,
 * lalu konfirmasi. Isian hidup di state halaman, bukan di store, supaya
 * petugas dapat bergerak antar langkah tanpa kehilangan apa pun.
 */
export default function HalamanPendaftaran() {
  const { pengguna } = useSesi();
  const store = useStoreDemo();
  const state = useSelector((s) => s);
  const hariIni = useHariIni();

  const [langkah, setLangkah] = useState<1 | 2 | 3>(1);
  const [kataKunci, setKataKunci] = useState("");
  const [isian, setIsian] = useState<Isian>(ISIAN_AWAL);
  const [galat, setGalat] = useState<Galat>({});
  const [pasien, setPasien] = useState<Pasien | null>(null);
  const [baruDisimpan, setBaruDisimpan] = useState(false);
  const [galatSimpan, setGalatSimpan] = useState<string | null>(null);
  const [pengumuman, setPengumuman] = useState("");
  const [dokterId, setDokterId] = useState("");
  const [tanggalMasuk, setTanggalMasuk] = useState(hariIni);
  const [diagnosaAwal, setDiagnosaAwal] = useState("");
  const [bedId, setBedId] = useState("");
  const [galatLangkah2, setGalatLangkah2] = useState<{ dokter?: string; bed?: string }>({});
  const [galatAdmisi, setGalatAdmisi] = useState<string | null>(null);
  const [admisiTersimpan, setAdmisiTersimpan] = useState<string | null>(null);
  const [buktiDibuka, setBuktiDibuka] = useState<string | null>(null);
  const judulLangkah = useRef<HTMLHeadingElement>(null);
  const judulAwal = useRef<HTMLHeadingElement>(null);
  // Ditulis oleh tombol "Daftarkan pasien lain" sebelum kembali ke langkah 1.
  const keLangkah1 = useRef(false);
  const namaPasien = useRef<HTMLInputElement>(null);

  // Perpindahan langkah dan bukti pendaftaran mengganti seluruh isi halaman;
  // tanpa memindahkan fokus ke judul, pengguna keyboard kembali ke awal dokumen
  // (WCAG 2.4.3) atau tertinggal di tombol yang sudah tidak ada.
  useEffect(() => {
    if (admisiTersimpan || buktiDibuka || langkah > 1) {
      judulLangkah.current?.focus();
    } else if (keLangkah1.current) {
      judulAwal.current?.focus();
      keLangkah1.current = false;
    }
  }, [langkah, admisiTersimpan, buktiDibuka]);

  if (!pengguna) return null;

  const hasilCari = cariPasien(state, kataKunci);
  const kandidat = isian.nik.trim() ? pasienDenganNik(state, isian.nik.trim()) : undefined;
  // Pasien yang baru saja dibuat dari formulir ini bukan duplikat dirinya sendiri.
  const duplikat = baruDisimpan && kandidat?.id === pasien?.id ? undefined : kandidat;
  // Denah dan ringkasan dibaca dari store pada tiap render, sehingga bed yang
  // terisi di sela waktu langsung hilang dari pilihan saat petugas kembali.
  const denah = denahBed(state);
  const ringkasan = ringkasanBed(state);
  // Pilihan bed bisa basi: bed diambil admisi lain, atau kamarnya dinonaktifkan.
  const kamarTerpilih = denah.find((k) => k.bed.some((b) => b.id === bedId));
  const bedTerpilih = kamarTerpilih?.bed.find((b) => b.id === bedId);
  const alasanBedBasi = bedId
    ? bedTerpilih
      ? alasanBedTidakTersedia(state, bedId)
      : "Bed pilihan tidak lagi tersedia, pilih bed lain."
    : null;

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

  function lanjutLangkah3() {
    const salah = {
      dokter: dokterId ? undefined : "Pilih dokter penanggung jawab.",
      // Bed basi sudah punya pesannya sendiri di atas denah; jangan diulang di sini.
      bed: bedId ? undefined : "Pilih satu bed kosong sebelum lanjut.",
    };
    setGalatLangkah2(salah);
    if (salah.dokter || salah.bed || alasanBedBasi) return;
    // Pesan gagal simpan sebelumnya tidak boleh menghantui kunjungan berikutnya.
    setGalatAdmisi(null);
    setLangkah(3);
  }

  function simpanAdmisi() {
    setGalatAdmisi(null);
    if (!pasien) {
      setGalatAdmisi("Pasien belum dipilih. Kembali ke langkah 1.");
      return;
    }
    const hasil = store.dispatch({
      type: "admisi/dibuat",
      olehId: pengguna!.id,
      pasienId: pasien.id,
      dokterId,
      bedId,
      tanggalMasuk,
      diagnosaAwal: diagnosaAwal.trim(),
    });
    if (!hasil.ok) {
      setGalatAdmisi(hasil.alasan);
      return;
    }
    setAdmisiTersimpan(hasil.id);
  }

  // Sumber bukti: admisi yang baru disimpan, atau bukti lama yang dibuka lagi
  // dari daftar admisi aktif. Bukti bisa dibuka ulang setelah muat ulang.
  const buktiId = admisiTersimpan ?? buktiDibuka;
  if (buktiId) {
    return (
      <div>
        <BuktiPendaftaran
          info={infoAdmisi(state, buktiId)}
          judulRef={judulLangkah}
          onDaftarLagi={() => {
            keLangkah1.current = true;
            setAdmisiTersimpan(null);
            setBuktiDibuka(null);
            setPasien(null);
            setBaruDisimpan(false);
            setIsian(ISIAN_AWAL);
            setKataKunci("");
            setDokterId("");
            setTanggalMasuk(hariIni);
            setDiagnosaAwal("");
            setBedId("");
            setGalat({});
            setGalatLangkah2({});
            setGalatSimpan(null);
            setGalatAdmisi(null);
            setPengumuman("");
            setLangkah(1);
          }}
        />
        <DaftarAdmisiAktif baris={daftarAdmisiAktif(state)} onBukaBukti={setBuktiDibuka} />
      </div>
    );
  }

  if (langkah === 3) {
    return (
      <div>
        <KepalaWizard langkah={3} pengumuman={pengumuman} />
        <section
          aria-label="Ringkasan konfirmasi"
          className="mt-4 max-w-prose rounded-lg border border-border bg-surface p-6 shadow-sm"
        >
          <h2 ref={judulLangkah} tabIndex={-1} className="text-title">
            Konfirmasi pendaftaran
          </h2>
          <p className="mt-2 text-small text-text-muted">
            Periksa kembali isian berikut. Admisi baru dibuat setelah petugas menekan Simpan admisi.
          </p>
          <dl className="mt-4 grid gap-2 text-body">
            <BarisRingkas label="Pasien" nilai={`${pasien?.nama ?? ""} (${pasien?.nomorRM ?? ""})`} />
            <BarisRingkas label="NIK" nilai={pasien?.nik ?? ""} />
            <BarisRingkas label="Dokter penanggung jawab" nilai={penggunaById(state, dokterId)?.nama ?? ""} />
            <BarisRingkas label="Kamar" nilai={kamarTerpilih?.nama ?? ""} />
            <BarisRingkas
              label="Bed"
              nilai={`${bedTerpilih?.kode ?? ""} (${kamarTerpilih?.kelas ?? ""})`}
            />
            <BarisRingkas
              label="Tarif harian"
              nilai={kamarTerpilih ? `${formatRupiah(kamarTerpilih.tarifHarian)}/hari` : ""}
            />
            <BarisRingkas label="Tanggal masuk" nilai={formatTanggal(tanggalMasuk)} />
            <BarisRingkas label="Diagnosa awal" nilai={diagnosaAwal.trim() || "—"} />
          </dl>
          {galatAdmisi ? (
            <p role="alert" className="mt-4 rounded-md border border-danger px-3 py-2 text-small text-danger">
              {galatAdmisi}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={() => setLangkah(2)} className={tombolSekunder}>
              Kembali ke langkah 2
            </button>
            <button type="button" onClick={simpanAdmisi} className={tombolUtama}>
              Simpan admisi
            </button>
          </div>
        </section>
      </div>
    );
  }

  if (langkah === 2) {
    const dokter = dokterAktif(state);
    return (
      <div>
        <KepalaWizard langkah={2} pengumuman={pengumuman} />
        <section
          aria-label="Dokter dan bed"
          className="mt-4 rounded-lg border border-border bg-surface p-6 shadow-sm"
        >
          <h2 ref={judulLangkah} tabIndex={-1} className="text-title">
            Dokter, tanggal masuk, dan bed
          </h2>
          <p className="mt-3 text-body">
            Pasien terpilih: <span className="font-semibold">{pasien?.nama}</span>
            <span className="mx-1.5" aria-hidden="true">·</span>
            {pasien?.nomorRM}
          </p>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
            <div className="space-y-4">
              <div>
                <label htmlFor="dokter" className="block text-small font-medium text-text">
                  Dokter penanggung jawab
                </label>
                <select
                  id="dokter"
                  value={dokterId}
                  onChange={(e) => {
                    setDokterId(e.target.value);
                    setGalatLangkah2((lama) => ({ ...lama, dokter: undefined }));
                  }}
                  aria-invalid={galatLangkah2.dokter ? true : undefined}
                  aria-describedby={galatLangkah2.dokter ? "dokter-galat" : undefined}
                  className="mt-1 min-h-11 w-full rounded-md border border-border bg-canvas px-3 text-body text-text"
                >
                  <option value="">Pilih dokter…</option>
                  {dokter.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nama}
                    </option>
                  ))}
                </select>
                <PesanGalat id="dokter-galat" pesan={galatLangkah2.dokter} />
              </div>

              <div>
                <label htmlFor="tanggal-masuk" className="block text-small font-medium text-text">
                  Tanggal masuk
                </label>
                <input
                  id="tanggal-masuk"
                  type="date"
                  max={hariIni}
                  value={tanggalMasuk}
                  onChange={(e) => setTanggalMasuk(e.target.value)}
                  className="mt-1 min-h-11 w-full rounded-md border border-border bg-canvas px-3 text-body text-text"
                />
              </div>

              <div>
                <label htmlFor="diagnosa-awal" className="block text-small font-medium text-text">
                  Diagnosa awal
                </label>
                <textarea
                  id="diagnosa-awal"
                  rows={3}
                  value={diagnosaAwal}
                  onChange={(e) => setDiagnosaAwal(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-canvas px-3 py-2 text-body text-text"
                />
              </div>
            </div>

            <RecordKetersediaan ringkasan={ringkasan} />
          </div>

          <div className="mt-8">
            <h3 className="text-title">Pilih bed</h3>
            <p className="mt-1 text-small text-text-muted">
              Hanya bed berstatus kosong yang dapat dipilih. Status setiap bed ditulis sebagai teks.
            </p>
            {alasanBedBasi ? (
              // Bukan `role="alert"`: pesan ini muncul karena kembali ke langkah,
              // bukan akibat isian yang baru diketik.
              <p className="mt-3 rounded-md border border-danger px-3 py-2 text-small text-danger">
                {alasanBedBasi}
              </p>
            ) : null}
            <div role="region" aria-label="Denah bed" className="mt-4 space-y-5">
              {denah.length === 0 ? (
                <p className="rounded-md border border-border bg-surface-muted p-4 text-small text-text-muted">
                  Belum ada kamar aktif. Hubungi admin untuk mengaktifkan kamar sebelum mendaftarkan
                  pasien.
                </p>
              ) : null}
              {denah.map((k) => (
                <fieldset key={k.id} className="rounded-md border border-border p-4">
                  <legend className="px-1 text-small font-semibold text-text">
                    {k.nama}
                    <span className="ml-2 font-normal text-text-muted">
                      Kelas {k.kelas}
                      <span className="mx-1.5" aria-hidden="true">·</span>
                      {formatRupiah(k.tarifHarian)}/hari
                    </span>
                  </legend>
                  <ul role="list" className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    {k.bed.map((b) => {
                      const tersedia = !alasanBedTidakTersedia(state, b.id);
                      return (
                        <li key={b.id}>
                          <label
                            className={`flex min-h-11 items-center gap-2 rounded-md border px-3 py-2 text-small ${
                              tersedia
                                ? "cursor-pointer border-border hover:border-primary hover:bg-primary-soft"
                                : "cursor-not-allowed border-border bg-surface-muted text-text-muted"
                            }`}
                          >
                            <input
                              type="radio"
                              name="bed"
                              value={b.id}
                              checked={bedId === b.id}
                              disabled={!tersedia}
                              onChange={() => {
                                setBedId(b.id);
                                setGalatLangkah2((lama) => ({ ...lama, bed: undefined }));
                              }}
                              className="h-4 w-4"
                            />
                            <span className="font-medium text-text">{b.kode}</span>
                            <span className={`text-caption ${labelStatus[b.status]}`}>{b.status}</span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </fieldset>
              ))}
            </div>
            {galatLangkah2.bed ? (
              <p role="alert" className="mt-2 text-caption text-danger">
                {galatLangkah2.bed}
              </p>
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setLangkah(1)}
              className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-small font-semibold text-text transition-colors hover:bg-surface-muted"
            >
              Kembali ke langkah 1
            </button>
            <button
              type="button"
              onClick={lanjutLangkah3}
              className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-small font-semibold text-on-primary transition-colors hover:bg-primary-hover"
            >
              Lanjut ke langkah 3
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div>
      <KepalaWizard langkah={1} pengumuman={pengumuman} judulRef={judulAwal} />
      <p className="mt-2 max-w-prose text-body text-text-muted">
        Cari pasien lama lebih dulu agar tidak ada rekam medis ganda. Bila belum pernah terdaftar, buat
        pasien baru di bawah.
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

      <DaftarAdmisiAktif baris={daftarAdmisiAktif(state)} onBukaBukti={setBuktiDibuka} />
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

/** Judul halaman dan posisi langkah; wilayah live ikut di sini agar tidak hanya ada di langkah 1. */
/** Judul halaman dan posisi langkah; wilayah live ikut di sini agar tidak hanya ada di langkah 1. */
function KepalaWizard({
  langkah,
  pengumuman,
  judulRef,
}: {
  langkah: 1 | 2 | 3;
  pengumuman: string;
  judulRef?: React.Ref<HTMLHeadingElement>;
}) {
  const sisa = 3 - langkah;
  return (
    <>
      <h1 ref={judulRef} tabIndex={judulRef ? -1 : undefined} className="text-heading">
        Pendaftaran pasien
      </h1>
      <p className="mt-2 text-caption font-semibold uppercase tracking-wide text-text-muted">
        Langkah {langkah} dari 3
        <span className="mx-1.5" aria-hidden="true">·</span>
        {sisa === 0 ? "Langkah terakhir" : `${sisa} langkah lagi`}
      </p>
      <p role="status" className="sr-only">
        {pengumuman}
      </p>
    </>
  );
}

function BarisRingkas({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div className="grid grid-cols-[10rem_minmax(0,1fr)] gap-2 border-b border-border pb-2 last:border-b-0">
      <dt className="text-small text-text-muted">{label}</dt>
      <dd className="text-small font-medium text-text">{nilai}</dd>
    </div>
  );
}

/** Jumlah bed per status dan BOR, dibaca langsung dari store agar selalu terkini. */
function RecordKetersediaan({ ringkasan }: { ringkasan: RingkasanBed }) {
  const baris: Array<[string, number]> = [
    ["Terisi", ringkasan.terisi],
    ["Kosong", ringkasan.kosong],
    ["Dibersihkan", ringkasan.dibersihkan],
  ];
  return (
    <section
      aria-label="Ringkasan ketersediaan bed"
      className="self-start rounded-md border border-border bg-surface-muted p-4"
    >
      <h2 className="text-small font-semibold text-text">Ketersediaan bed</h2>
      <table className="mt-2 w-full text-small">
        <caption className="sr-only">Jumlah bed menurut status</caption>
        <tbody>
          {baris.map(([label, jumlah]) => (
            <tr key={label} className="border-b border-border last:border-b-0">
              <th scope="row" className="py-1.5 text-left font-normal text-text-muted">
                {label}
              </th>
              <td className="py-1.5 text-right font-semibold text-text">{formatAngka(jumlah, "jumlah")}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" className="pt-2 text-left font-normal text-text">
              BOR
            </th>
            <td className="pt-2 text-right font-semibold text-text">{formatAngka(ringkasan.bor, "persen")}</td>
          </tr>
        </tfoot>
      </table>
      <p className="mt-2 text-caption text-text-muted">
        Jumlah bed dihitung dari kamar aktif (termasuk bed yang sedang dibersihkan).
      </p>
    </section>
  );
}

/** Pratinjau cetak bukti pendaftaran; tombol Cetak memanggil dialog cetak peramban. */
function BuktiPendaftaran({
  info,
  judulRef,
  onDaftarLagi,
}: {
  info: InfoAdmisi | null;
  judulRef: React.Ref<HTMLHeadingElement>;
  onDaftarLagi: () => void;
}) {
  if (!info) {
    return (
      <section aria-label="Bukti pendaftaran" className="max-w-prose rounded-lg border border-border bg-surface p-6 shadow-sm">
        <h1 ref={judulRef} tabIndex={-1} className="text-title">
          Bukti pendaftaran tidak ditemukan
        </h1>
        <p className="mt-2 text-small text-text-muted">
          Data admisi tidak lagi tersedia, mungkin karena data demo direset. Mulai pendaftaran baru.
        </p>
        <button type="button" onClick={onDaftarLagi} className={tombolUtama}>
          Daftarkan pasien lain
        </button>
      </section>
    );
  }

  const { pasien, dokter, kamar, bed, tanggalMasuk, diagnosaAwal } = info;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 no-print">
        <button type="button" onClick={() => window.print()} className={tombolUtama}>
          Cetak bukti pendaftaran
        </button>
        <button type="button" onClick={onDaftarLagi} className={tombolSekunder}>
          Daftarkan pasien lain
        </button>
      </div>
      <p role="status" className="sr-only">
        Admisi tersimpan. Bukti pendaftaran siap dicetak.
      </p>

      <section
        aria-label="Bukti pendaftaran"
        className="mt-6 max-w-prose rounded-lg border border-border bg-surface p-8 shadow-sm print:max-w-none print:border-0 print:shadow-none"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <Wordmark />
          <div className="text-right text-caption text-text-muted">
            <p className="font-semibold uppercase tracking-wide text-text">Bukti Pendaftaran</p>
            <p>Rawat Inap</p>
          </div>
        </header>

        <h1 ref={judulRef} tabIndex={-1} className="mt-6 text-title">
          Bukti pendaftaran {pasien.nama}
        </h1>
        <dl className="mt-4 grid gap-2 text-body">
          <BarisRingkas label="Nama pasien" nilai={pasien.nama} />
          <BarisRingkas label="Nomor Rekam Medis" nilai={pasien.nomorRM} />
          <BarisRingkas label="NIK" nilai={pasien.nik} />
          <BarisRingkas
            label="Jenis kelamin"
            nilai={`${pasien.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}, lahir ${formatTanggal(pasien.tanggalLahir)}`}
          />
          <BarisRingkas label="Alamat" nilai={pasien.alamat} />
          <BarisRingkas label="Dokter penanggung jawab" nilai={dokter.nama} />
          <BarisRingkas label="Kamar" nilai={`${kamar.nama} (kelas ${kamar.kelas})`} />
          <BarisRingkas label="Bed" nilai={bed.kode} />
          <BarisRingkas label="Tarif harian" nilai={`${formatRupiah(kamar.tarifHarian)}/hari`} />
          <BarisRingkas label="Tanggal masuk" nilai={formatTanggal(tanggalMasuk)} />
          <BarisRingkas label="Diagnosa awal" nilai={diagnosaAwal || "—"} />
          <BarisRingkas label="Penanggung jawab" nilai={`${pasien.penanggungJawab.nama} (${pasien.penanggungJawab.hubungan}) — ${pasien.penanggungJawab.telepon}`} />
        </dl>

        <p className="mt-6 border-t border-border pt-4 text-caption text-text-muted">
          Bawa bukti ini selama menjalani rawat inap. Nomor Rekam Medis dipakai untuk seluruh layanan
          Dani Medical Center.
        </p>
      </section>
    </div>
  );
}

const tombolUtama =
  "inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-small font-semibold text-on-primary transition-colors hover:bg-primary-hover";
const tombolSekunder =
  "inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-small font-semibold text-text transition-colors hover:bg-surface-muted";

/** Daftar admisi aktif: jawaban cepat "pasien ini dirawat di mana", dan pintu ke bukti pendaftaran. */
function DaftarAdmisiAktif({ baris, onBukaBukti }: { baris: InfoAdmisi[]; onBukaBukti: (admisiId: string) => void }) {
  return (
    <section aria-label="Admisi aktif" className="mt-10 no-print">
      <h2 className="text-title">Admisi aktif</h2>
      <p className="mt-1 text-small text-text-muted">
        {formatAngka(baris.length, "jumlah")} pasien sedang dirawat. Daftar diperbarui otomatis setelah
        admisi baru dibuat.
      </p>
      {baris.length === 0 ? (
        <p className="mt-4 rounded-md border border-border bg-surface-muted p-4 text-small text-text-muted">
          Belum ada pasien yang sedang dirawat. Selesaikan pendaftaran untuk mengisi daftar ini.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-surface shadow-sm">
          <table className="w-full text-small">
            <caption className="sr-only">Pasien yang sedang dirawat</caption>
            <thead>
              <tr className="border-b border-border text-left">
                <th scope="col" className="px-4 py-3 font-semibold">Pasien</th>
                <th scope="col" className="px-4 py-3 font-semibold">Bed</th>
                <th scope="col" className="px-4 py-3 font-semibold">Dokter</th>
                <th scope="col" className="px-4 py-3 font-semibold">Tanggal masuk</th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  <span className="sr-only">Bukti pendaftaran</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {baris.map((b) => (
                <tr key={b.admisiId} className="border-b border-border last:border-b-0">
                  <th scope="row" className="px-4 py-3 text-left font-medium text-text">
                    {b.pasien.nama}
                    <span className="ml-1.5 font-normal text-text-muted">{b.pasien.nomorRM}</span>
                  </th>
                  <td className="px-4 py-3 text-text">
                    {b.bed.kode}
                    <span className="ml-1.5 text-text-muted">{b.kamar.nama}</span>
                  </td>
                  <td className="px-4 py-3 text-text">{b.dokter.nama}</td>
                  <td className="px-4 py-3 text-text">{formatTanggal(b.tanggalMasuk)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onBukaBukti(b.admisiId)}
                      className="inline-flex min-h-11 items-center rounded-md px-2 text-small font-semibold text-primary hover:underline"
                    >
                      Buka bukti<span className="sr-only"> pendaftaran {b.pasien.nama}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
