import Link from "next/link";
import { semanticColors, radiusScale, shadowScale, typeScale } from "@/lib/design-tokens";
import { Wordmark } from "@/components/brand/wordmark";

const swatchLabels: Record<keyof typeof semanticColors, string> = {
  canvas: "Kanvas",
  surface: "Permukaan",
  surfaceMuted: "Permukaan redup",
  border: "Garis batas",
  text: "Teks",
  textMuted: "Teks sekunder",
  primary: "Primer",
  primaryHover: "Primer (hover)",
  primarySoft: "Primer lembut",
  accent: "Aksen",
  success: "Berhasil",
  warning: "Peringatan",
  danger: "Bahaya",
  info: "Informasi",
  onPrimary: "Di atas primer",
};

const typeSamples: Array<[string, keyof typeof typeScale]> = [
  ["Judul tampilan", "display"],
  ["Judul halaman", "heading"],
  ["Subjudul", "title"],
  ["Paragraf pengantar", "lead"],
  ["Isi", "body"],
  ["Kecil", "small"],
  ["Keterangan", "caption"],
];

export default function DesignSystemPage() {
  return (
    <div className="min-h-dvh bg-canvas">
      <header role="banner" className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Wordmark />
          <span className="rounded-full bg-primary-soft px-3 py-1 text-caption font-medium text-primary">
            Halaman contoh
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-display">Sistem Desain</h1>
        <p className="mt-3 max-w-2xl text-text-muted">
          Acuan visual Dani Medical Center. Setiap warna, ukuran teks, radius, dan bayangan di aplikasi
          berasal dari token di halaman ini — komponen tidak boleh memakai nilai mentah.
        </p>
        <p className="mt-3">
          <Link href="/login" className="text-small font-semibold text-primary underline underline-offset-4">
            Buka aplikasi
          </Link>
        </p>

        <section aria-labelledby="palet" className="mt-12">
          <h2 id="palet" className="text-heading">
            Palet warna
          </h2>
          <p className="mt-2 text-small text-text-muted">Palet biru-teal lembut dengan kontras teks memenuhi WCAG 2.1 AA.</p>
          <ul role="list" className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {Object.entries(semanticColors).map(([token, value]) => (
              <li key={token} className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
                <div className="h-16 w-full" style={{ backgroundColor: value }} aria-hidden="true" />
                <div className="px-3 py-2">
                  <p className="text-small font-medium">{swatchLabels[token as keyof typeof semanticColors]}</p>
                  <p className="font-mono text-caption text-text-muted">{value}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="tipografi" className="mt-12">
          <h2 id="tipografi" className="text-heading">
            Tipografi
          </h2>
          <p className="mt-2 text-small text-text-muted">
            Source Sans 3 untuk antarmuka, Source Serif 4 untuk judul — keduanya memakai huruf humanis
            yang ramah tanpa kehilangan ketegasan.
          </p>
          <div className="mt-6 rounded-lg border border-border bg-surface p-6 shadow-sm">
            {typeSamples.map(([label, token]) => (
              <div key={token} className="flex flex-wrap items-baseline justify-between gap-4 border-b border-border py-3 last:border-b-0">
                <span className="text-caption uppercase tracking-wide text-text-muted">{label}</span>
                <span
                  className={token === "display" || token === "heading" ? "font-serif" : ""}
                  style={{ fontSize: typeScale[token] }}
                >
                  Rawat inap yang tertata
                </span>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="komponen" className="mt-12">
          <h2 id="komponen" className="text-heading">
            Komponen dasar
          </h2>
          <p className="mt-2 text-small text-text-muted">
            Radius, bayangan, dan tombol memakai token yang sama dengan modul aplikasi.
          </p>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-surface p-6 shadow-sm">
              <h3 className="text-title">Tombol</h3>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-small font-semibold text-on-primary transition-colors hover:bg-primary-hover"
                >
                  Simpan pendaftaran
                </button>
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-small font-semibold text-text"
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center rounded-md bg-primary-soft px-4 text-small font-semibold text-primary"
                >
                  Lihat rincian
                </button>
              </div>

              <h3 className="mt-8 text-title">Status</h3>
              <ul role="list" className="mt-4 flex flex-wrap gap-2">
                {[
                  ["Berhasil", "bg-success text-on-primary"],
                  ["Peringatan", "bg-warning text-on-primary"],
                  ["Bahaya", "bg-danger text-on-primary"],
                  ["Informasi", "bg-info text-on-primary"],
                ].map(([label, classes]) => (
                  <li key={label} className={`inline-flex min-h-8 items-center rounded-full px-3 text-caption font-semibold ${classes}`}>
                    {label}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-border bg-surface p-6 shadow-sm">
              <h3 className="text-title">Radius dan bayangan</h3>
              <div className="mt-4 space-y-3">
                {Object.entries(radiusScale).map(([name, value]) => (
                  <div key={name} className="flex items-center gap-4">
                    <div
                      className="h-10 w-16 border border-border bg-surface-muted"
                      style={{ borderRadius: value }}
                      aria-hidden="true"
                    />
                    <span className="font-mono text-caption text-text-muted">radius-{name} · {value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3">
                {Object.entries(shadowScale).map(([name, value]) => (
                  <div
                    key={name}
                    className="rounded-md border border-border bg-surface p-3 text-caption text-text-muted"
                    style={{ boxShadow: value }}
                  >
                    shadow-{name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-5xl px-6 pb-12 pt-4">
        <p className="border-t border-border pt-6 text-caption text-text-muted">
          Halaman ini hanya untuk pemeriksaan visual. Tidak ada data pasien sungguhan di aplikasi ini.
        </p>
      </footer>
    </div>
  );
}
