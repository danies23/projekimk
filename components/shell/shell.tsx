"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Wordmark } from "@/components/brand/wordmark";
import { bolehAkses } from "@/lib/domain/izin";
import type { Peran } from "@/lib/domain/types";
import { labelPeran } from "@/lib/label-peran";
import { modulUntuk } from "@/lib/navigasi";
import { JejakNavigasi } from "./jejak-navigasi";
import { PengalihPeran } from "./pengalih-peran";
import { useSesi } from "./sesi-provider";
import { Sidebar } from "./sidebar";

/**
 * Shell aplikasi: header, sidebar, dan area konten. Rute yang tidak ada di
 * matriks izin peran diganti layar penolakan yang menjelaskan sebabnya —
 * bukan halaman kosong, karena pengguna harus tahu kenapa dan ke mana.
 */
export function Shell({ children }: { children: React.ReactNode }) {
  const { status, pengguna } = useSesi();
  const pathname = usePathname();
  const router = useRouter();

  // Sesi demo kosong mengembalikan pengguna ke halaman login. Dijalankan di
  // shell (bukan di halaman) supaya berlaku untuk setiap rute aplikasi.
  useEffect(() => {
    if (status === "keluar") router.replace("/login");
  }, [status, router]);

  if (status === "memuat") {
    return (
      <div className="grid min-h-dvh place-items-center bg-canvas">
        <p role="status" className="text-small text-text-muted">
          Memuat sesi demo…
        </p>
      </div>
    );
  }
  if (!pengguna) return null;

  const modul = modulUntuk(pathname);
  const boleh = !modul || bolehAkses(pengguna.peran, modul.resource);

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header role="banner" className="border-b border-border bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-6">
          <Link href="/dashboard" className="rounded-sm">
            <Wordmark />
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-small text-text-muted">
              <span className="font-semibold text-text">{labelPeran(pengguna.peran)}</span>
              <span className="mx-1.5" aria-hidden="true">
                ·
              </span>
              {pengguna.nama}
            </p>
            <PengalihPeran />
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        <Sidebar />
        <main className="min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <JejakNavigasi />
          <div className="mt-6">{boleh ? children : <AksesDitolak peran={pengguna.peran} />}</div>
        </main>
      </div>
    </div>
  );
}

/** Layar penolakan menjelaskan peran mana yang tidak berhak dan apa langkah berikutnya. */
function AksesDitolak({ peran }: { peran: Peran }) {
  const label = labelPeran(peran);
  return (
    <section role="region" aria-label="Akses ditolak" className="max-w-prose rounded-lg border border-border bg-surface p-6 shadow-sm">
      <p className="text-caption font-semibold uppercase tracking-wide text-danger">Akses ditolak</p>
      <h1 id="tolak-judul" className="mt-2 text-heading">
        Peran {label} tidak memiliki akses ke halaman ini
      </h1>
      <p className="mt-3 text-body text-text-muted">
        Menu di sidebar hanya memuat modul yang menjadi hak peran aktif. Gunakan pengalih peran demo
        untuk mencoba peran yang berhak, atau kembali ke dashboard.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-small font-semibold text-on-primary transition-colors hover:bg-primary-hover"
      >
        Kembali ke Dashboard
      </Link>
    </section>
  );
}
