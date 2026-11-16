"use client";

import { useMemo, useState } from "react";
import { useSelector } from "@/components/shell/store-provider";
import { daftarAudit, type FilterAudit } from "@/lib/domain/selectors";
import type { AksiAudit } from "@/lib/domain/types";
import { formatTanggalWaktu } from "@/lib/format";

/** Label aksi audit; satu tempat agar tabel dan penyaring menyebut aksi dengan nama yang sama. */
const LABEL_AKSI: Record<AksiAudit, string> = {
  "pasien.dibuat": "Pasien dibuat",
  "admisi.dibuat": "Admisi dibuat",
  "bed.dialokasikan": "Bed dialokasikan",
  "bed.dipindah": "Bed dipindah",
  "bed.dibersihkan": "Bed dibersihkan",
  "bed.siap": "Bed siap dipakai",
  checkout: "Checkout",
  "checkout.override": "Override checkout",
  "rekam_medis.ditulis": "Rekam medis ditulis",
  "rekam_medis.dikoreksi": "Rekam medis dikoreksi",
  "instruksi.dijalankan": "Instruksi dijalankan",
  "resep.dibuat": "Resep dibuat",
  "resep.status": "Status resep berubah",
  "obat.diserahkan": "Obat diserahkan",
  "obat.stok_masuk": "Stok obat masuk",
  "obat.dibuat": "Obat dibuat",
  "obat.diubah": "Obat diubah",
  "tindakan.ditambahkan": "Tindakan ditambahkan",
  "pembayaran.dicatat": "Pembayaran dicatat",
  "kamar.dibuat": "Kamar dibuat",
  "kamar.diubah": "Kamar diubah",
  "tindakan_master.dibuat": "Master tindakan dibuat",
  "tindakan_master.diubah": "Master tindakan diubah",
  "pengguna.dibuat": "Pengguna dibuat",
  "pengguna.diubah": "Pengguna diubah",
};

/**
 * Audit log untuk Admin: waktu, pengguna, aksi, entitas, dan ringkasan, dapat
 * disaring per pengguna dan per jenis aksi. Urutan dan penyaringan hidup di
 * `daftarAudit`, bukan di layar.
 */
export default function HalamanAudit() {
  const state = useSelector((s) => s);
  const [filter, setFilter] = useState<FilterAudit>({});

  // Pilihan pengguna diambil dari state, jadi akun yang pernah aktif selalu
  // bisa disaring walau sekarang sudah nonaktif.
  const pengguna = useMemo(
    () => [...state.pengguna].sort((a, b) => a.nama.localeCompare(b.nama)),
    [state.pengguna],
  );
  const aksiTersedia = useMemo(() => {
    const unik = Array.from(new Set(state.audit.map((a) => a.aksi)));
    // Snapshot lama dapat memuat aksi yang belum dikenal kode ini; urutkan
    // lewat label yang jatuh kembali ke nama aksinya, bukan melempar.
    const label = (aksi: AksiAudit) => LABEL_AKSI[aksi] ?? aksi;
    return unik.sort((a, b) => label(a).localeCompare(label(b)));
  }, [state.audit]);

  const daftar = daftarAudit(state, filter);
  const adaFilter = Boolean(filter.penggunaId || filter.aksi);

  return (
    <div>
      <header>
        <h1 className="text-heading">Audit Log</h1>
        <p className="mt-2 max-w-prose text-body text-text-muted">
          Setiap perubahan penting meninggalkan jejak: waktu, pengguna, aksi, entitas, dan ringkasan
          perubahannya. Gunakan penyaring untuk menyelidiki kejadian tertentu.
        </p>
      </header>

      <section aria-label="Penyaring audit" className="mt-6 rounded-lg border border-border bg-surface p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="audit-pengguna" className="block text-small font-medium text-text">
              Pengguna
            </label>
            <select
              id="audit-pengguna"
              value={filter.penggunaId ?? ""}
              onChange={(e) => setFilter((f) => ({ ...f, penggunaId: e.target.value || undefined }))}
              className="mt-1 min-h-11 w-full rounded-md border border-border bg-canvas px-3 text-body text-text"
            >
              <option value="">Semua pengguna</option>
              {pengguna.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="audit-aksi" className="block text-small font-medium text-text">
              Jenis aksi
            </label>
            <select
              id="audit-aksi"
              value={filter.aksi ?? ""}
              onChange={(e) => setFilter((f) => ({ ...f, aksi: (e.target.value || undefined) as AksiAudit | undefined }))}
              className="mt-1 min-h-11 w-full rounded-md border border-border bg-canvas px-3 text-body text-text"
            >
              <option value="">Semua aksi</option>
              {aksiTersedia.map((aksi) => (
                <option key={aksi} value={aksi}>
                  {LABEL_AKSI[aksi]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p aria-live="polite" className="text-small text-text-muted">
            Menampilkan {daftar.length} dari {state.audit.length} entri.
          </p>
          {adaFilter ? (
            <button type="button" onClick={() => setFilter({})} className={tombolSekunder}>
              Hapus penyaring
            </button>
          ) : null}
        </div>
      </section>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-surface shadow-sm">
        {daftar.length === 0 ? (
          <p className="p-6 text-small text-text-muted">
            {adaFilter
              ? "Tidak ada entri yang cocok dengan penyaring ini. Hapus penyaring untuk melihat semua aktivitas."
              : "Belum ada aktivitas tercatat. Entri muncul setelah data demo diubah."}
          </p>
        ) : (
          <table className="w-full text-small">
            <caption className="sr-only">Entri audit log terbaru lebih dulu</caption>
            <thead>
              <tr className="border-b border-border text-left">
                <th scope="col" className="px-4 py-3 font-semibold">Waktu</th>
                <th scope="col" className="px-4 py-3 font-semibold">Pengguna</th>
                <th scope="col" className="px-4 py-3 font-semibold">Aksi</th>
                <th scope="col" className="px-4 py-3 font-semibold">Entitas</th>
                <th scope="col" className="px-4 py-3 font-semibold">Ringkasan</th>
              </tr>
            </thead>
            <tbody>
              {daftar.map(({ audit, pengguna: pelaku }) => (
                <tr key={audit.id} className="border-b border-border align-top last:border-b-0">
                  <th scope="row" className="whitespace-nowrap px-4 py-3 text-left font-medium text-text">
                    {formatTanggalWaktu(audit.waktu)}
                  </th>
                  <td className="px-4 py-3 text-text">{pelaku?.nama ?? "Pengguna tidak dikenal"}</td>
                  <td className="px-4 py-3 text-text">{LABEL_AKSI[audit.aksi]}</td>
                  <td className="px-4 py-3 text-text-muted">
                    {audit.entitas}
                    <span className="sr-only"> {audit.entitasId}</span>
                  </td>
                  <td className="px-4 py-3 text-text">{audit.ringkasan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const tombolSekunder =
  "inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-small font-semibold text-text transition-colors hover:bg-surface-muted";
