"use client";

interface Props {
  judul: string;
  keterangan: string;
}

/**
 * Tempat jujur untuk modul yang belum dibangun. Layar kosong atau halaman
 * error akan membuat pengguna mengira aplikasinya rusak; layar ini menjelaskan
 * bahwa modulnya menyusul.
 */
export function ModulTertunda({ judul, keterangan }: Props) {
  return (
    <section aria-labelledby="judul-modul" className="max-w-prose rounded-lg border border-border bg-surface p-6 shadow-sm">
      <p className="text-caption font-semibold uppercase tracking-wide text-text-muted">Modul</p>
      <h1 id="judul-modul" className="mt-1 text-heading">
        {judul}
      </h1>
      <p className="mt-3 text-body text-text-muted">{keterangan}</p>
      <p className="mt-4 border-t border-border pt-4 text-small text-text-muted">
        Kerangka aplikasi, menu per peran, dan penjagaan akses sudah aktif. Isi modul ini menyusul
        pada ticket tersendiri.
      </p>
    </section>
  );
}
