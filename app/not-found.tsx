import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";

/**
 * Rute yang tidak ada tetap harus menjelaskan dirinya, bukan menampilkan
 * halaman error bawaan Next.js (spec, user story 106). Tidak ada tautan di
 * aplikasi yang menunjuk ke sini, tetapi alamat yang salah ketik pun harus
 * memberi jalan kembali.
 */
export default function HalamanTidakDitemukan() {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-6 py-10">
      <section className="max-w-prose rounded-lg border border-border bg-surface p-8 shadow-sm">
        <Wordmark />
        <h1 className="mt-6 text-heading">Halaman tidak ditemukan</h1>
        <p className="mt-3 text-body text-text-muted">
          Alamat ini tidak ada di dalam aplikasi. Alamat yang Anda ketik mungkin salah, atau
          halaman sudah berganti nama.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-small font-semibold text-on-primary transition-colors hover:bg-primary-hover"
        >
          Kembali ke Dashboard
        </Link>      </section>
    </main>
  );
}
