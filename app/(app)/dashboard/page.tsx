"use client";

import Link from "next/link";
import { formatAngka } from "@/lib/format";
import { ringkasanPeran, type KartuRingkasan } from "@/lib/ringkasan-peran";
import { useSesi } from "@/components/shell/sesi-provider";
import { useHariIni, useSelector } from "@/components/shell/store-provider";

export default function HalamanDashboard() {
  const { pengguna } = useSesi();
  const hariIni = useHariIni();
  const state = useSelector((s) => s);

  if (!pengguna) return null;
  const kartu = ringkasanPeran(state, pengguna, hariIni);

  return (
    <div>
      <header>
        <h1 className="text-heading">Selamat bertugas, {pengguna.nama}</h1>
        <p className="mt-2 max-w-prose text-body text-text-muted">
          Angka di bawah dihitung langsung dari data demo yang sama dengan modul lain, bukan salinan.
        </p>
        {pengguna.peran === "pendaftaran" ? (
          // Pintasan untuk alur tersibuk petugas pendaftaran (spec, user story 14).
          <Link
            href="/pendaftaran"
            className="mt-5 inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-small font-semibold text-on-primary transition-colors hover:bg-primary-hover"
          >
            Daftarkan Pasien
          </Link>
        ) : null}
      </header>

      <section aria-labelledby="ringkasan" className="mt-8">
        <h2 id="ringkasan" className="text-title">
          Ringkasan peran
        </h2>
        <ul role="list" aria-label="Ringkasan peran" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kartu.map((k) => (
            <li key={k.label}>
              <KartuAngka kartu={k} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function KartuAngka({ kartu }: { kartu: KartuRingkasan }) {
  return (
    <Link
      href={kartu.href}
      className="flex min-h-24 flex-col justify-between gap-3 rounded-lg border border-border bg-surface p-5 shadow-sm transition-colors hover:border-primary"
    >
      <span className="text-small font-medium text-text-muted">{kartu.label}</span>
      <span className="break-words font-serif text-heading font-semibold leading-tight text-text lg:text-display">
        {formatAngka(kartu.nilai, kartu.satuan)}
      </span>
    </Link>
  );
}
