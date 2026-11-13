"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Wordmark } from "@/components/brand/wordmark";
import { AKUN_DEMO, SANDI_DEMO, type AkunDemo } from "@/lib/domain/demo-accounts";
import { masuk } from "@/lib/masuk";
import { useSesi } from "@/components/shell/sesi-provider";
import { useStoreDemo } from "@/components/shell/store-provider";

export default function HalamanLogin() {
  const store = useStoreDemo();
  const router = useRouter();
  const { masukSebagai } = useSesi();
  const [email, setEmail] = useState(AKUN_DEMO[0]!.email);
  const [sandi, setSandi] = useState(SANDI_DEMO);
  const [galat, setGalat] = useState<string | null>(null);

  function pilihAkun(akun: AkunDemo) {
    setEmail(akun.email);
    setSandi(SANDI_DEMO);
    setGalat(null);
  }

  function kirim(e: React.FormEvent) {
    e.preventDefault();
    const hasil = masuk(store.getState(), email, sandi);
    if (!hasil.ok) {
      setGalat(hasil.alasan);
      return;
    }
    masukSebagai(hasil.penggunaId);
    router.replace("/dashboard");
  }

  return (
    <main className="min-h-dvh bg-canvas">
      <div className="mx-auto grid min-h-dvh max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-center">
        <section aria-labelledby="akun-demo" className="order-2 lg:order-1">
          <h2 id="akun-demo" className="text-title">
            Akun demo
          </h2>
          <p className="mt-2 max-w-prose text-small text-text-muted">
            Prototipe ini tidak memakai autentikasi sungguhan. Klik salah satu akun untuk mengisi
            kredensialnya, lalu masuk. Sandi semua akun demo adalah <code className="font-mono">{SANDI_DEMO}</code>.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {AKUN_DEMO.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => pilihAkun(a)}
                aria-pressed={email === a.email}
                className="flex min-h-16 flex-col items-start gap-0.5 rounded-md border border-border bg-surface px-4 py-3 text-left transition-colors hover:border-primary hover:bg-primary-soft aria-pressed:border-primary aria-pressed:bg-primary-soft"
              >
                <span className="text-small font-semibold text-text">{a.nama}</span>
                <span className="text-caption text-text-muted">{a.label}</span>
                <span className="font-mono text-caption text-text-muted">{a.email}</span>
              </button>
            ))}
          </div>
        </section>

        <section aria-labelledby="masuk" className="order-1 lg:order-2">
          <div className="rounded-lg border border-border bg-surface p-6 shadow-md">
            <Wordmark />
            <h1 id="masuk" className="mt-6 text-heading">
              Masuk
            </h1>
            <p className="mt-1 text-small text-text-muted">Sistem administrasi rawat inap.</p>

            <form onSubmit={kirim} className="mt-6 space-y-4" noValidate>
              <div>
                <label htmlFor="email" className="block text-small font-medium text-text">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-describedby={galat ? "galat-masuk" : undefined}
                  className="mt-1 min-h-11 w-full rounded-md border border-border bg-canvas px-3 text-body text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                />
              </div>

              <div>
                <label htmlFor="sandi" className="block text-small font-medium text-text">
                  Sandi
                </label>
                <input
                  id="sandi"
                  type="password"
                  autoComplete="current-password"
                  value={sandi}
                  onChange={(e) => setSandi(e.target.value)}
                  aria-describedby={galat ? "galat-masuk" : undefined}
                  className="mt-1 min-h-11 w-full rounded-md border border-border bg-canvas px-3 text-body text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                />
              </div>

              {galat ? (
                <p id="galat-masuk" role="alert" className="rounded-md border border-danger px-3 py-2 text-small text-danger">
                  {galat}
                </p>
              ) : null}

              <button
                type="submit"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-small font-semibold text-on-primary transition-colors hover:bg-primary-hover"
              >
                Masuk
              </button>
            </form>
          </div>

          <p className="mt-4 text-caption text-text-muted">
            Data demo disimpan di peramban ini saja. Tidak ada data pasien sungguhan.
          </p>
        </section>
      </div>
    </main>
  );
}
