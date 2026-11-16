"use client";

import { useState } from "react";
import { useSesi } from "@/components/shell/sesi-provider";
import { useStoreDemo, useSelector } from "@/components/shell/store-provider";
import type { Action } from "@/lib/domain/actions";
import { boleh } from "@/lib/domain/izin";
import { labelPeran, URUTAN_PERAN } from "@/lib/label-peran";
import { formatRupiah } from "@/lib/format";
import type { Hasil, Id, Pengguna, Peran, TindakanMaster } from "@/lib/domain/types";

type KirimAksi = (aksi: Action, sukses: string) => Hasil;

/**
 * Modul Administrasi: admin mengelola akun pengguna beserta perannya dan
 * master tindakan beserta tarifnya. Semua aturan (nama wajib, nama tindakan
 * unik, tarif bulat, larangan menonaktifkan diri sendiri) hidup di store;
 * layar ini hanya menampilkan penolakannya.
 */
export default function HalamanAdministrasi() {
  const { pengguna } = useSesi();
  const store = useStoreDemo();
  const state = useSelector((s) => s);

  const [pengumuman, setPengumuman] = useState("");
  const [penggunaDikelola, setPenggunaDikelola] = useState<Id | null>(null);
  const [tindakanDikelola, setTindakanDikelola] = useState<Id | null>(null);

  if (!pengguna) return null;

  function jalankan(aksi: Action, sukses: string): Hasil {
    const hasil = store.dispatch(aksi);
    if (hasil.ok) setPengumuman(sukses);
    return hasil;
  }

  const penggunaUrut = [...state.pengguna].sort((a, b) => a.nama.localeCompare(b.nama));
  const tindakanUrut = [...state.tindakanMaster].sort((a, b) => a.nama.localeCompare(b.nama));

  return (
    <div>
      <header>
        <h1 className="text-heading">Administrasi</h1>
        <p className="mt-2 max-w-prose text-body text-text-muted">
          Kelola akun pengguna beserta perannya dan master tindakan beserta tarifnya. Setiap
          perubahan tercatat di Audit Log.
        </p>
      </header>

      <p role="status" className="sr-only">
        {pengumuman}
      </p>

      {/* Tiap bagian membaca izinnya sendiri dari matriks pusat; bila suatu
          peran hanya berhak atas salah satunya, bagian lain tidak dirender. */}
      {boleh(pengguna.peran, "pengguna.kelola") ? (
        <BagianPengguna
          pengguna={penggunaUrut}
          penggunaDikelola={penggunaDikelola}
          setPenggunaDikelola={setPenggunaDikelola}
          onHasil={jalankan}
        />
      ) : null}

      {boleh(pengguna.peran, "master.tindakan") ? (
        <BagianTindakan
          tindakan={tindakanUrut}
          tindakanDikelola={tindakanDikelola}
          setTindakanDikelola={setTindakanDikelola}
          onHasil={jalankan}
        />
      ) : null}
    </div>
  );
}

function BagianPengguna({
  pengguna,
  penggunaDikelola,
  setPenggunaDikelola,
  onHasil,
}: {
  pengguna: Pengguna[];
  penggunaDikelola: Id | null;
  setPenggunaDikelola: (id: Id | null) => void;
  onHasil: KirimAksi;
}) {
  const { pengguna: sesi } = useSesi();
  const [isianBaru, setIsianBaru] = useState({ nama: "", peran: "perawat" as Peran });
  const [galat, setGalat] = useState<string | null>(null);

  function tambah(e: React.FormEvent) {
    e.preventDefault();
    if (!sesi) return;
    const hasil = onHasil(
      { type: "pengguna/dibuat", olehId: sesi.id, input: isianBaru },
      `Pengguna ${isianBaru.nama.trim()} dibuat.`,
    );
    // Pesan penolakan milik store, ditempatkan tepat di bawah kolom nama.
    setGalat(hasil.ok ? null : hasil.alasan);
    if (hasil.ok) setIsianBaru({ nama: "", peran: "perawat" });
  }

  return (
    <section aria-labelledby="judul-pengguna" className="mt-10">
      <h2 id="judul-pengguna" className="text-title">
        Pengguna
      </h2>
      <p className="mt-1 max-w-prose text-small text-text-muted">
        Pengguna nonaktif tetap tampil di sini agar dapat diaktifkan kembali, tetapi tidak muncul
        pada alur yang membutuhkan pengguna aktif seperti pemilihan dokter penanggung jawab.
      </p>

      <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-surface shadow-sm">
        <table className="w-full text-small">
          <caption className="sr-only">Daftar pengguna beserta peran dan status aktifnya</caption>
          <thead>
            <tr className="border-b border-border text-left">
              <th scope="col" className="px-4 py-3 font-semibold">Nama</th>
              <th scope="col" className="px-4 py-3 font-semibold">Peran</th>
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              <th scope="col" className="px-4 py-3 font-semibold">
                <span className="sr-only">Aksi</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {pengguna.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-b-0">
                <th scope="row" className="px-4 py-3 text-left font-medium text-text">
                  {p.nama}
                  {p.id === sesi?.id ? <span className="ml-1.5 text-caption text-text-muted">(Anda)</span> : null}
                </th>
                <td className="px-4 py-3 text-text">{labelPeran(p.peran)}</td>
                <td className={`px-4 py-3 font-semibold ${p.aktif ? "text-success" : "text-text-muted"}`}>
                  {p.aktif ? "Aktif" : "Nonaktif"}
                </td>
                <td className="px-4 py-3 text-right">
                  {p.id === sesi?.id ? (
                    <span className="text-caption text-text-muted">Tidak dapat diubah sendiri</span>
                  ) : (
                    <button
                      type="button"
                      aria-expanded={penggunaDikelola === p.id}
                      onClick={() => setPenggunaDikelola(penggunaDikelola === p.id ? null : p.id)}
                      className="inline-flex min-h-11 items-center rounded-md px-2 text-small font-semibold text-primary hover:underline"
                    >
                      Ubah<span className="sr-only"> pengguna {p.nama}</span>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pengguna.map((p) =>
        penggunaDikelola === p.id ? (
          <FormUbahPengguna key={p.id} pengguna={p} onHasil={onHasil} onTutup={() => setPenggunaDikelola(null)} />
        ) : null,
      )}

      <form onSubmit={tambah} className="mt-6 max-w-prose rounded-lg border border-border bg-surface p-5 shadow-sm">
        <h3 className="text-title">Tambah pengguna</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Bidang
            id="pengguna-nama"
            label="Nama lengkap"
            nilai={isianBaru.nama}
            onChange={(v) => {
              setIsianBaru((l) => ({ ...l, nama: v }));
              setGalat(null);
            }}
          />
          <PilihPeran
            id="pengguna-peran"
            nilai={isianBaru.peran}
            onChange={(peran) => setIsianBaru((l) => ({ ...l, peran }))}
          />
        </div>
        <GalatForm id="pengguna-galat" pesan={galat} />
        <button type="submit" className={`mt-4 ${tombolUtama}`}>
          Simpan pengguna
        </button>
      </form>
    </section>
  );
}

function FormUbahPengguna({
  pengguna,
  onHasil,
  onTutup,
}: {
  pengguna: Pengguna;
  onHasil: KirimAksi;
  onTutup: () => void;
}) {
  const { pengguna: sesi } = useSesi();
  const [isian, setIsian] = useState({ nama: pengguna.nama, peran: pengguna.peran });
  const [galat, setGalat] = useState<string | null>(null);

  function simpan(e: React.FormEvent) {
    e.preventDefault();
    if (!sesi) return;
    const hasil = onHasil(
      { type: "pengguna/diubah", olehId: sesi.id, penggunaId: pengguna.id, perubahan: isian },
      `Pengguna ${isian.nama.trim()} diperbarui.`,
    );
    setGalat(hasil.ok ? null : hasil.alasan);
    if (hasil.ok) onTutup();
  }

  function ubahStatus() {
    if (!sesi) return;
    const hasil = onHasil(
      { type: "pengguna/diubah", olehId: sesi.id, penggunaId: pengguna.id, perubahan: { aktif: !pengguna.aktif } },
      `Pengguna ${pengguna.nama} ${pengguna.aktif ? "dinonaktifkan" : "diaktifkan kembali"}.`,
    );
    setGalat(hasil.ok ? null : hasil.alasan);
    if (hasil.ok) onTutup();
  }

  return (
    <form
      onSubmit={simpan}
      aria-label={`Ubah pengguna ${pengguna.nama}`}
      className="mt-4 max-w-prose rounded-lg border border-primary bg-surface p-5 shadow-sm"
    >
      <h3 className="text-title">Ubah pengguna {pengguna.nama}</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Bidang
          id="ubah-pengguna-nama"
          label="Nama lengkap"
          nilai={isian.nama}
          onChange={(v) => {
            setIsian((l) => ({ ...l, nama: v }));
            setGalat(null);
          }}
        />
        <PilihPeran id="ubah-pengguna-peran" nilai={isian.peran} onChange={(peran) => setIsian((l) => ({ ...l, peran }))} />
      </div>
      <GalatForm id="ubah-pengguna-galat" pesan={galat} />
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="submit" className={tombolUtama}>
          Simpan perubahan
        </button>
        <button type="button" onClick={ubahStatus} className={tombolSekunder}>
          {pengguna.aktif ? "Nonaktifkan pengguna" : "Aktifkan pengguna"}
        </button>
        <button type="button" onClick={onTutup} className={tombolSekunder}>
          Batal
        </button>
      </div>
    </form>
  );
}

function BagianTindakan({
  tindakan,
  tindakanDikelola,
  setTindakanDikelola,
  onHasil,
}: {
  tindakan: TindakanMaster[];
  tindakanDikelola: Id | null;
  setTindakanDikelola: (id: Id | null) => void;
  onHasil: KirimAksi;
}) {
  const { pengguna: sesi } = useSesi();
  const [isianBaru, setIsianBaru] = useState({ nama: "", tarif: "" });
  const [galat, setGalat] = useState<string | null>(null);

  function tambah(e: React.FormEvent) {
    e.preventDefault();
    if (!sesi) return;
    const hasil = onHasil(
      { type: "tindakan-master/dibuat", olehId: sesi.id, input: { nama: isianBaru.nama, tarif: Number(isianBaru.tarif) } },
      `Tindakan ${isianBaru.nama.trim()} dibuat.`,
    );
    setGalat(hasil.ok ? null : hasil.alasan);
    if (hasil.ok) setIsianBaru({ nama: "", tarif: "" });
  }

  return (
    <section aria-labelledby="judul-tindakan" className="mt-10">
      <h2 id="judul-tindakan" className="text-title">
        Master tindakan
      </h2>
      <p className="mt-1 max-w-prose text-small text-text-muted">
        Tindakan aktif langsung tersedia pada pilihan dokter di modul Klinis. Tindakan nonaktif
        tidak ditawarkan lagi, tetapi tindakan yang sudah tercatat pada admisi lama tetap utuh
        beserta tarif yang berlaku saat dicatat.
      </p>

      <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-surface shadow-sm">
        <table className="w-full text-small">
          <caption className="sr-only">Daftar tindakan beserta tarif dan statusnya</caption>
          <thead>
            <tr className="border-b border-border text-left">
              <th scope="col" className="px-4 py-3 font-semibold">Tindakan</th>
              <th scope="col" className="px-4 py-3 font-semibold">Tarif</th>
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              <th scope="col" className="px-4 py-3 font-semibold">
                <span className="sr-only">Aksi</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {tindakan.map((t) => (
              <tr key={t.id} className="border-b border-border last:border-b-0">
                <th scope="row" className="px-4 py-3 text-left font-medium text-text">{t.nama}</th>
                <td className="px-4 py-3 text-text">{formatRupiah(t.tarif)}</td>
                <td className={`px-4 py-3 font-semibold ${t.aktif ? "text-success" : "text-text-muted"}`}>
                  {t.aktif ? "Aktif" : "Nonaktif"}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    aria-expanded={tindakanDikelola === t.id}
                    onClick={() => setTindakanDikelola(tindakanDikelola === t.id ? null : t.id)}
                    className="inline-flex min-h-11 items-center rounded-md px-2 text-small font-semibold text-primary hover:underline"
                  >
                    Ubah<span className="sr-only"> tindakan {t.nama}</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tindakan.map((t) =>
        tindakanDikelola === t.id ? (
          <FormUbahTindakan key={t.id} tindakan={t} onHasil={onHasil} onTutup={() => setTindakanDikelola(null)} />
        ) : null,
      )}

      <form onSubmit={tambah} className="mt-6 max-w-prose rounded-lg border border-border bg-surface p-5 shadow-sm">
        <h3 className="text-title">Tambah tindakan</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Bidang
            id="tindakan-nama"
            label="Nama tindakan"
            nilai={isianBaru.nama}
            onChange={(v) => {
              setIsianBaru((l) => ({ ...l, nama: v }));
              setGalat(null);
            }}
          />
          <Bidang
            id="tindakan-tarif"
            label="Tarif (Rp)"
            nilai={isianBaru.tarif}
            inputMode="numeric"
            onChange={(v) => setIsianBaru((l) => ({ ...l, tarif: v }))}
          />
        </div>
        <GalatForm id="tindakan-galat" pesan={galat} />
        <button type="submit" className={`mt-4 ${tombolUtama}`}>
          Simpan tindakan
        </button>
      </form>
    </section>
  );
}

function FormUbahTindakan({
  tindakan,
  onHasil,
  onTutup,
}: {
  tindakan: TindakanMaster;
  onHasil: KirimAksi;
  onTutup: () => void;
}) {
  const { pengguna: sesi } = useSesi();
  const [isian, setIsian] = useState({ nama: tindakan.nama, tarif: String(tindakan.tarif) });
  const [galat, setGalat] = useState<string | null>(null);

  function simpan(e: React.FormEvent) {
    e.preventDefault();
    if (!sesi) return;
    const hasil = onHasil(
      { type: "tindakan-master/diubah", olehId: sesi.id, tindakanId: tindakan.id, perubahan: { nama: isian.nama, tarif: Number(isian.tarif) } },
      `Tindakan ${isian.nama.trim()} diperbarui.`,
    );
    setGalat(hasil.ok ? null : hasil.alasan);
    if (hasil.ok) onTutup();
  }

  function ubahStatus() {
    if (!sesi) return;
    const hasil = onHasil(
      { type: "tindakan-master/diubah", olehId: sesi.id, tindakanId: tindakan.id, perubahan: { aktif: !tindakan.aktif } },
      `Tindakan ${tindakan.nama} ${tindakan.aktif ? "dinonaktifkan" : "diaktifkan kembali"}.`,
    );
    setGalat(hasil.ok ? null : hasil.alasan);
    if (hasil.ok) onTutup();
  }

  return (
    <form
      onSubmit={simpan}
      aria-label={`Ubah tindakan ${tindakan.nama}`}
      className="mt-4 max-w-prose rounded-lg border border-primary bg-surface p-5 shadow-sm"
    >
      <h3 className="text-title">Ubah tindakan {tindakan.nama}</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Bidang
          id="ubah-tindakan-nama"
          label="Nama tindakan"
          nilai={isian.nama}
          onChange={(v) => {
            setIsian((l) => ({ ...l, nama: v }));
            setGalat(null);
          }}
        />
        <Bidang
          id="ubah-tindakan-tarif"
          label="Tarif (Rp)"
          nilai={isian.tarif}
          inputMode="numeric"
          onChange={(v) => setIsian((l) => ({ ...l, tarif: v }))}
        />
      </div>
      <GalatForm id="ubah-tindakan-galat" pesan={galat} />
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="submit" className={tombolUtama}>
          Simpan perubahan
        </button>
        <button type="button" onClick={ubahStatus} className={tombolSekunder}>
          {tindakan.aktif ? "Nonaktifkan tindakan" : "Aktifkan tindakan"}
        </button>
        <button type="button" onClick={onTutup} className={tombolSekunder}>
          Batal
        </button>
      </div>
    </form>
  );
}

function PilihPeran({
  id,
  nilai,
  onChange,
}: {
  id: string;
  nilai: Peran;
  onChange: (peran: Peran) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-small font-medium text-text">
        Peran
      </label>
      <select
        id={id}
        value={nilai}
        onChange={(e) => onChange(e.target.value as Peran)}
        className="mt-1 min-h-11 w-full rounded-md border border-border bg-canvas px-3 text-body text-text"
      >
        {URUTAN_PERAN.map((peran) => (
          <option key={peran} value={peran}>
            {labelPeran(peran)}
          </option>
        ))}
      </select>
    </div>
  );
}

function Bidang({
  id,
  label,
  nilai,
  inputMode,
  onChange,
}: {
  id: string;
  label: string;
  nilai: string;
  inputMode?: "numeric";
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
        inputMode={inputMode}
        value={nilai}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 min-h-11 w-full rounded-md border border-border bg-canvas px-3 text-body text-text"
      />
    </div>
  );
}

/**
 * Penolakan store ditampilkan di dalam form yang memicunya (WCAG 3.3.1),
 * bukan di puncak halaman yang bisa berada jauh dari pandangan pengguna.
 * Store mengembalikan satu pesan tanpa menandai kolomnya, jadi pesan ini
 * tidak dipasangkan ke kolom tertentu.
 */
function GalatForm({ id, pesan }: { id: string; pesan: string | null }) {
  if (!pesan) return null;
  return (
    <p id={id} role="alert" className="mt-4 rounded-md border border-danger px-3 py-2 text-small text-danger">
      {pesan}
    </p>
  );
}

const tombolUtama =
  "inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-small font-semibold text-on-primary transition-colors hover:bg-primary-hover";
const tombolSekunder =
  "inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface px-3 text-small font-semibold text-text transition-colors hover:bg-surface-muted";
