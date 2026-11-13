"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useRef, useState } from "react";
import { useSesi } from "@/components/shell/sesi-provider";
import { useStoreDemo, useSelector } from "@/components/shell/store-provider";
import { boleh } from "@/lib/domain/izin";
import {
  alasanBedTidakTersedia,
  denahBed,
  infoAdmisi,
  riwayatPindahBed,
  ringkasanBed,
  semuaKamar,
  type BedKamar,
  type RingkasanBed,
  type RiwayatPindahBed,
} from "@/lib/domain/selectors";
import type { Bed, Hasil, KelasKamar, StatusBed } from "@/lib/domain/types";
import { formatAngka, formatRupiah, formatTanggalWaktu } from "@/lib/format";

/** Warna status melengkapi teks, bukan menggantikannya (WCAG 1.4.1). */
const labelStatus: Record<StatusBed, string> = {
  terisi: "text-danger",
  kosong: "text-success",
  dibersihkan: "text-warning",
};

const KELAS: KelasKamar[] = ["VIP", "I", "II", "III"];

/**
 * Modul Kamar & Bed. Petugas dan perawat melihat denah beserta aksi bed,
 * perawat dapat memindahkan pasien, dan admin mengelola master kamar. Semua
 * perubahan melewati store sehingga ringkasan di layar ini dan pemilih bed di
 * pendaftaran membaca angka yang sama.
 */
export default function HalamanKamar() {
  const { pengguna } = useSesi();
  const store = useStoreDemo();
  const state = useSelector((s) => s);

  const [pengumuman, setPengumuman] = useState("");
  const [galatAksi, setGalatAksi] = useState<string | null>(null);
  const [bedDipindah, setBedDipindah] = useState<Bed | null>(null);
  const [kamarDikelola, setKamarDikelola] = useState<string | null>(null);
  // Dialog tanpa pemicu Radix harus mengembalikan fokus sendiri ke tombol asal
  // setelah ditutup, agar pengguna keyboard tidak kembali ke awal dokumen.
  const pemicuPindah = useRef<HTMLButtonElement | null>(null);
  const judulHalaman = useRef<HTMLHeadingElement>(null);

  if (!pengguna) return null;

  // Hak baca/tulis dibaca dari matriks izin, bukan dari nama peran di sini.
  const perawat = boleh(pengguna.peran, "bed.pindah");
  const admin = boleh(pengguna.peran, "master.kamar");
  const ringkasan = ringkasanBed(state);

  function jalankan(aksi: Parameters<typeof store.dispatch>[0], sukses: string) {
    setGalatAksi(null);
    const hasil = store.dispatch(aksi);
    if (!hasil.ok) {
      setGalatAksi(hasil.alasan);
      return false;
    }
    setPengumuman(sukses);
    return true;
  }

  return (
    <div>
      <header>
        <h1 ref={judulHalaman} tabIndex={-1} className="text-heading">
          Kamar &amp; Bed
        </h1>
        <p className="mt-2 max-w-prose text-body text-text-muted">
          Ketersediaan di layar ini dihitung langsung dari data yang sama dengan pemilih bed pada
          pendaftaran. Status setiap bed ditulis sebagai teks, bukan hanya warna.
        </p>
      </header>

      <p role="status" className="sr-only">
        {pengumuman}
      </p>
      {galatAksi ? (
        <p role="alert" className="mt-4 rounded-md border border-danger px-3 py-2 text-small text-danger">
          {galatAksi}
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]">
        <DenahKamar
          denah={denahBed(state)}
          perawat={perawat}
          onSiapkan={(bed) =>
            jalankan({ type: "bed/siap", olehId: pengguna.id, bedId: bed.id }, `Bed ${bed.kode} siap dipakai kembali.`)
          }
          onPindahkan={(bed, tombol) => {
            setGalatAksi(null);
            pemicuPindah.current = tombol;
            setBedDipindah(bed);
          }}
        />
        <div className="space-y-6">
          <Ringkasan ringkasan={ringkasan} />
          <RiwayatPindah riwayat={riwayatPindahBed(state)} />
        </div>
      </div>

      {admin ? (
        <MasterKamar
          kamar={semuaKamar(state)}
          kamarDikelola={kamarDikelola}
          setKamarDikelola={setKamarDikelola}
          onHasil={(hasil, sukses) => {
            if (!hasil.ok) {
              setGalatAksi(hasil.alasan);
              return;
            }
            setGalatAksi(null);
            setPengumuman(sukses);
          }}
        />
      ) : null}

      <DialogPindahBed
        bedAsal={bedDipindah}
        pemicu={pemicuPindah}
        cadanganFokus={judulHalaman}
        onTutup={() => setBedDipindah(null)}
        onPindah={(admisiId, bedId) => {
          const berhasil = jalankan(
            { type: "admisi/pindah-bed", olehId: pengguna.id, admisiId, bedId },
            "Pasien dipindahkan. Bed asal menunggu dibersihkan.",
          );
          // Dialog hanya ditutup bila perpindahan benar-benar tercatat;
          // kalau ditolak, pesannya tampil di dekat pilihan bed.
          if (berhasil) setBedDipindah(null);
        }}
      />
    </div>
  );
}

/** Denah bed per kamar aktif dengan aksi kontekstual di tiap bed. */
function DenahKamar({
  denah,
  perawat,
  onSiapkan,
  onPindahkan,
}: {
  denah: BedKamar[];
  perawat: boolean;
  onSiapkan: (bed: Bed) => void;
  onPindahkan: (bed: Bed, tombol: HTMLButtonElement) => void;
}) {
  return (
    <section aria-label="Denah bed" className="space-y-5">
      {denah.length === 0 ? (
        <p className="rounded-md border border-border bg-surface-muted p-4 text-small text-text-muted">
          Belum ada kamar aktif. Admin dapat menambahkan kamar pada bagian master di bawah.
        </p>
      ) : null}
      {denah.map((k) => (
        <section key={k.id} aria-label={k.nama} className="rounded-lg border border-border bg-surface p-5 shadow-sm">
          <header className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-title">{k.nama}</h2>
            <p className="text-small text-text-muted">
              Kelas {k.kelas}
              <span className="mx-1.5" aria-hidden="true">·</span>
              {formatRupiah(k.tarifHarian)}/hari
              <span className="mx-1.5" aria-hidden="true">·</span>
              {formatAngka(k.bed.length, "jumlah")} bed
            </p>
          </header>
          <ul role="list" className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {k.bed.map((b) => (
              <li
                key={b.id}
                className="flex flex-col gap-2 rounded-md border border-border px-4 py-3"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-small font-semibold text-text">{b.kode}</span>
                  <span className={`text-caption font-semibold ${labelStatus[b.status]}`}>{b.status}</span>
                </div>
                {perawat && b.status === "dibersihkan" ? (
                  <button
                    type="button"
                    onClick={() => onSiapkan(b)}
                    className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-3 text-small font-semibold text-on-primary transition-colors hover:bg-primary-hover"
                  >
                    Tandai siap dipakai<span className="sr-only">, bed {b.kode}</span>
                  </button>
                ) : null}
                {perawat && b.status === "terisi" ? (
                  <button
                    type="button"
                    onClick={(e) => onPindahkan(b, e.currentTarget)}
                    className={tombolSekunder}
                  >
                    Pindahkan pasien<span className="sr-only"> dari bed {b.kode}</span>
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </section>
  );
}

/** Jumlah bed per status dan BOR, satu sumber dengan pemilih bed pendaftaran. */
function Ringkasan({ ringkasan }: { ringkasan: RingkasanBed }) {
  const baris: Array<[string, number]> = [
    ["Terisi", ringkasan.terisi],
    ["Kosong", ringkasan.kosong],
    ["Dibersihkan", ringkasan.dibersihkan],
  ];
  return (
    <section
      aria-label="Ringkasan ketersediaan bed"
      className="rounded-md border border-border bg-surface-muted p-4"
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
        Dihitung dari kamar aktif, termasuk bed yang sedang dibersihkan ({formatAngka(ringkasan.total, "jumlah")} bed).
      </p>
    </section>
  );
}

function RiwayatPindah({ riwayat }: { riwayat: RiwayatPindahBed[] }) {
  return (
    <section aria-label="Riwayat perpindahan bed" className="rounded-lg border border-border bg-surface p-4 shadow-sm">
      <h2 className="text-small font-semibold text-text">Riwayat perpindahan bed</h2>
      {riwayat.length === 0 ? (
        <p className="mt-2 text-caption text-text-muted">
          Belum ada pasien yang dipindahkan. Riwayat muncul setelah perawat memindahkan pasien ke bed lain.
        </p>
      ) : (
        <ol className="mt-3 space-y-3">
          {riwayat.map((r) => (
            <li key={`${r.admisiId}-${r.waktu}`} className="border-b border-border pb-3 text-caption last:border-b-0 last:pb-0">
              <p className="font-semibold text-text">{r.pasien.nama}</p>
              <p className="text-text-muted">
                {r.dariBed.kode} ({r.dariKamar.nama}) → {r.keBed.kode} ({r.keKamar.nama})
              </p>
              <p className="text-text-muted">{formatTanggalWaktu(r.waktu)}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/**
 * Master kamar untuk admin: tambah kamar, ubah nama/kelas/tarif/kapasitas, dan
 * nonaktifkan. Kamar nonaktif tetap tampil di sini agar dapat diaktifkan lagi.
 */
function MasterKamar({
  kamar,
  kamarDikelola,
  setKamarDikelola,
  onHasil,
}: {
  kamar: ReturnType<typeof semuaKamar>;
  kamarDikelola: string | null;
  setKamarDikelola: (id: string | null) => void;
  onHasil: (hasil: Hasil, sukses: string) => void;
}) {
  const store = useStoreDemo();
  const { pengguna } = useSesi();
  const state = useSelector((s) => s);
  const [isianBaru, setIsianBaru] = useState({ nama: "", kelas: "I" as KelasKamar, tarifHarian: "", kapasitas: "" });

  function tambah(e: React.FormEvent) {
    e.preventDefault();
    if (!pengguna) return;
    const hasil = store.dispatch({
      type: "kamar/dibuat",
      olehId: pengguna.id,
      input: {
        nama: isianBaru.nama,
        kelas: isianBaru.kelas,
        tarifHarian: Number(isianBaru.tarifHarian),
        kapasitas: Number(isianBaru.kapasitas),
      },
    });
    if (hasil.ok) setIsianBaru({ nama: "", kelas: "I", tarifHarian: "", kapasitas: "" });
    onHasil(hasil, `Kamar ${isianBaru.nama.trim()} dibuat.`);
  }

  return (
    <section aria-labelledby="master-kamar" className="mt-10">
      <h2 id="master-kamar" className="text-title">
        Master kamar
      </h2>
      <p className="mt-1 max-w-prose text-small text-text-muted">
        Perubahan di sini langsung tercermin pada pilihan bed di wizard pendaftaran. Kamar yang masih
        berisi pasien tidak dapat dinonaktifkan, dan kapasitas hanya dapat dikurangi dari bed kosong.
      </p>

      <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-surface shadow-sm">
        <table className="w-full text-small">
          <caption className="sr-only">Daftar kamar beserta kelas, tarif, kapasitas, dan statusnya</caption>
          <thead>
            <tr className="border-b border-border text-left">
              <th scope="col" className="px-4 py-3 font-semibold">Kamar</th>
              <th scope="col" className="px-4 py-3 font-semibold">Kelas</th>
              <th scope="col" className="px-4 py-3 font-semibold">Tarif harian</th>
              <th scope="col" className="px-4 py-3 font-semibold">Bed</th>
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              <th scope="col" className="px-4 py-3 font-semibold">
                <span className="sr-only">Aksi</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {kamar.map((k) => (
              <tr key={k.kamar.id} className="border-b border-border last:border-b-0">
                <th scope="row" className="px-4 py-3 text-left font-medium text-text">{k.kamar.nama}</th>
                <td className="px-4 py-3 text-text">{k.kamar.kelas}</td>
                <td className="px-4 py-3 text-text">{formatRupiah(k.kamar.tarifHarian)}</td>
                <td className="px-4 py-3 text-text">
                  {formatAngka(k.bed.length, "jumlah")} bed
                  <span className="ml-1.5 text-text-muted">
                    ({formatAngka(k.bed.filter((b) => b.status === "terisi").length, "jumlah")} terisi)
                  </span>
                </td>
                <td className="px-4 py-3 text-text">{k.kamar.aktif ? "Aktif" : "Nonaktif"}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    aria-expanded={kamarDikelola === k.kamar.id}
                    onClick={() => setKamarDikelola(kamarDikelola === k.kamar.id ? null : k.kamar.id)}
                    className="inline-flex min-h-11 items-center rounded-md px-2 text-small font-semibold text-primary hover:underline"
                  >
                    Ubah<span className="sr-only"> kamar {k.kamar.nama}</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {kamar.map((k) =>
        kamarDikelola === k.kamar.id ? (
          <FormUbahKamar key={k.kamar.id} kamar={k.kamar} onHasil={onHasil} onTutup={() => setKamarDikelola(null)} />
        ) : null,
      )}

      <form onSubmit={tambah} className="mt-6 max-w-prose rounded-lg border border-border bg-surface p-5 shadow-sm">
        <h3 className="text-title">Tambah kamar</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Bidang id="kamar-nama" label="Nama kamar" nilai={isianBaru.nama} onChange={(v) => setIsianBaru((l) => ({ ...l, nama: v }))} />
          <div>
            <label htmlFor="kamar-kelas" className="block text-small font-medium text-text">
              Kelas
            </label>
            <select
              id="kamar-kelas"
              value={isianBaru.kelas}
              onChange={(e) => setIsianBaru((l) => ({ ...l, kelas: e.target.value as KelasKamar }))}
              className="mt-1 min-h-11 w-full rounded-md border border-border bg-canvas px-3 text-body text-text"
            >
              {KELAS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          <Bidang
            id="kamar-tarif"
            label="Tarif harian (Rp)"
            nilai={isianBaru.tarifHarian}
            inputMode="numeric"
            onChange={(v) => setIsianBaru((l) => ({ ...l, tarifHarian: v }))}
          />
          <Bidang
            id="kamar-kapasitas"
            label="Kapasitas bed"
            nilai={isianBaru.kapasitas}
            inputMode="numeric"
            onChange={(v) => setIsianBaru((l) => ({ ...l, kapasitas: v }))}
          />
        </div>
        <button type="submit" className={`mt-4 ${tombolUtama}`}>
          Simpan kamar
        </button>
      </form>
    </section>
  );
}

function FormUbahKamar({
  kamar,
  onHasil,
  onTutup,
}: {
  kamar: ReturnType<typeof semuaKamar>[number]["kamar"];
  onHasil: (hasil: Hasil, sukses: string) => void;
  onTutup: () => void;
}) {
  const store = useStoreDemo();
  const { pengguna } = useSesi();
  const state = useSelector((s) => s);
  const [isian, setIsian] = useState({
    nama: kamar.nama,
    kelas: kamar.kelas,
    tarifHarian: String(kamar.tarifHarian),
    kapasitas: String(state.bed.filter((b) => b.kamarId === kamar.id).length),
  });

  function simpan(e: React.FormEvent) {
    e.preventDefault();
    if (!pengguna) return;
    const hasil = store.dispatch({
      type: "kamar/diubah",
      olehId: pengguna.id,
      kamarId: kamar.id,
      perubahan: {
        nama: isian.nama,
        kelas: isian.kelas,
        tarifHarian: Number(isian.tarifHarian),
        kapasitas: Number(isian.kapasitas),
      },
    });
    onHasil(hasil, `Kamar ${isian.nama.trim()} diperbarui.`);
    if (hasil.ok) onTutup();
  }

  return (
    <form
      onSubmit={simpan}
      aria-label={`Ubah kamar ${kamar.nama}`}
      className="mt-4 max-w-prose rounded-lg border border-primary bg-surface p-5 shadow-sm"
    >
      <h3 className="text-title">Ubah kamar {kamar.nama}</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Bidang id="ubah-nama" label="Nama kamar" nilai={isian.nama} onChange={(v) => setIsian((l) => ({ ...l, nama: v }))} />
        <div>
          <label htmlFor="ubah-kelas" className="block text-small font-medium text-text">
            Kelas
          </label>
          <select
            id="ubah-kelas"
            value={isian.kelas}
            onChange={(e) => setIsian((l) => ({ ...l, kelas: e.target.value as KelasKamar }))}
            className="mt-1 min-h-11 w-full rounded-md border border-border bg-canvas px-3 text-body text-text"
          >
            {KELAS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
        <Bidang
          id="ubah-tarif"
          label="Tarif harian (Rp)"
          nilai={isian.tarifHarian}
          inputMode="numeric"
          onChange={(v) => setIsian((l) => ({ ...l, tarifHarian: v }))}
        />
        <Bidang
          id="ubah-kapasitas"
          label="Kapasitas bed"
          nilai={isian.kapasitas}
          inputMode="numeric"
          onChange={(v) => setIsian((l) => ({ ...l, kapasitas: v }))}
        />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="submit" className={tombolUtama}>
          Simpan perubahan
        </button>
        <button
          type="button"
          onClick={() => {
            if (!pengguna) return;
            onHasil(
              store.dispatch({
                type: "kamar/diubah",
                olehId: pengguna.id,
                kamarId: kamar.id,
                perubahan: { aktif: !kamar.aktif },
              }),
              `Kamar ${kamar.nama} ${kamar.aktif ? "dinonaktifkan" : "diaktifkan kembali"}.`,
            );
          }}
          className={tombolSekunder}
        >
          {kamar.aktif ? "Nonaktifkan kamar" : "Aktifkan kamar"}
        </button>
        <button type="button" onClick={onTutup} className={tombolSekunder}>
          Batal
        </button>
      </div>
    </form>
  );
}

/**
 * Pemindahan pasien: pilih admisi aktif di bed asal, lalu bed tujuan yang
 * kosong. Bed yang terisi atau belum siap tidak ditawarkan sama sekali.
 * Radix Dialog memberi jebakan fokus, Escape, dan pengembalian fokus ke
 * pemicunya (ADR-0003, WCAG 2.4.3). Root sengaja tetap terpasang: mematikannya
 * bersamaan dengan penutupan membuat fokus tidak sempat kembali ke tombol asal.
 */
function DialogPindahBed({
  bedAsal,
  onTutup,
  onPindah,
  pemicu,
  cadanganFokus,
}: {
  bedAsal: Bed | null;
  onTutup: () => void;
  onPindah: (admisiId: string, bedId: string) => void;
  pemicu: React.RefObject<HTMLButtonElement | null>;
  /** Tujuan fokus bila pemicu sudah hilang, mis. bed asal berubah status setelah dipindahkan. */
  cadanganFokus: React.RefObject<HTMLHeadingElement | null>;
}) {
  return (
    <Dialog.Root open={!!bedAsal} onOpenChange={(buka) => !buka && onTutup()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-text/40" />
        <Dialog.Content
          // Radix mengembalikan fokus ke Dialog.Trigger; dialog ini dibuka dari
          // banyak tombol bed, jadi fokus diarahkan sendiri ke pemicunya.
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            if (pemicu.current?.isConnected) pemicu.current.focus();
            else cadanganFokus.current?.focus();
          }}
          className="fixed inset-x-4 top-1/2 z-50 max-h-[90dvh] max-w-2xl -translate-y-1/2 overflow-y-auto rounded-lg border border-border bg-surface p-6 shadow-lg sm:left-1/2 sm:right-auto sm:w-[min(42rem,calc(100vw-2rem))] sm:-translate-x-1/2"
        >
          {bedAsal ? <IsiPindahBed bedAsal={bedAsal} onPindah={onPindah} /> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function IsiPindahBed({ bedAsal, onPindah }: { bedAsal: Bed; onPindah: (admisiId: string, bedId: string) => void }) {
  const state = useSelector((s) => s);
  // Pasien terikat pada bed yang tombolnya ditekan; dialog tidak boleh menjadi
  // pintu memindahkan pasien lain tanpa melihat bednya.
  const admisiId = state.admisi.find((a) => a.status === "aktif" && a.bedId === bedAsal.id)?.id ?? "";
  const [bedTujuan, setBedTujuan] = useState("");

  const info = infoAdmisi(state, admisiId);
  const tujuan = denahBed(state)
    .flatMap((k) => k.bed.map((b) => ({ ...b, kamar: k })))
    .filter((b) => !alasanBedTidakTersedia(state, b.id));

  return (
    <>
      <Dialog.Title className="text-title">Pindahkan pasien dari bed {bedAsal.kode}</Dialog.Title>
      <Dialog.Description className="mt-1 text-small text-text-muted">
        Bed asal akan berstatus <span className="font-semibold text-warning">dibersihkan</span> sampai
        perawat menandainya siap dipakai lagi. Riwayat perpindahan tercatat otomatis.
      </Dialog.Description>

      {info ? (
        <p className="mt-4 text-body text-text">
          {info.pasien.nama} <span className="text-text-muted">({info.pasien.nomorRM})</span>
          <br />
          <span className="text-small text-text-muted">
            Saat ini di {info.bed.kode}, {info.kamar.nama} — kelas {info.kamar.kelas}.
          </span>
        </p>
      ) : (
        <p role="alert" className="mt-4 text-small text-danger">
          Tidak ada pasien aktif di bed ini. Tutup dialog lalu pilih bed yang berstatus terisi.
        </p>
      )}

      <div className="mt-4">
        <label htmlFor="pindah-bed" className="block text-small font-medium text-text">
          Bed tujuan
        </label>
        <select
          id="pindah-bed"
          value={bedTujuan}
          onChange={(e) => setBedTujuan(e.target.value)}
          className="mt-1 min-h-11 w-full rounded-md border border-border bg-canvas px-3 text-body text-text"
        >
          <option value="">Pilih bed kosong…</option>
          {tujuan.map((b) => (
            <option key={b.id} value={b.id}>
              {b.kode} — {b.kamar.nama} (kelas {b.kamar.kelas}, {formatRupiah(b.kamar.tarifHarian)}/hari)
            </option>
          ))}
        </select>
        <p className="mt-1 text-caption text-text-muted">Hanya bed berstatus kosong yang ditawarkan.</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={!admisiId || !bedTujuan}
          onClick={() => onPindah(admisiId, bedTujuan)}
          className={`${tombolUtama} disabled:cursor-not-allowed disabled:opacity-60`}
        >
          Pindahkan pasien
        </button>
        <Dialog.Close asChild>
          <button type="button" className={tombolSekunder}>
            Batal
          </button>
        </Dialog.Close>
      </div>
    </>
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

const tombolUtama =
  "inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-small font-semibold text-on-primary transition-colors hover:bg-primary-hover";
const tombolSekunder =
  "inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface px-3 text-small font-semibold text-text transition-colors hover:bg-surface-muted";
