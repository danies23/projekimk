# Dani Medical Center — Administrasi Rawat Inap

Prototipe interaktif sistem administrasi rawat inap untuk **Dani Medical Center**, dibuat sebagai tugas mata kuliah Interaksi Manusia dan Komputer. Yang dinilai adalah kualitas UI dan UX, bukan implementasi backend.

## Menjalankan

```bash
npm install
npm run dev          # http://localhost:3000
```

## Perintah

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | Server pengembangan |
| `npm run build` | Build produksi |
| `npm run start` | Menjalankan hasil build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript tanpa emit |
| `npm test` | Test unit (Vitest) |
| `npm run test:watch` | Test unit mode watch |
| `npm run test:e2e` | Test end-to-end (Playwright) |

Test E2E memakai Chromium. Sekali saja setelah clone:

```bash
npx playwright install chromium
```

## Susunan

```
app/                    rute dan layout Next.js App Router
components/brand/       logomark dan wordmark
lib/                    token desain dan pendukung
tests/e2e/              skenario Playwright
docs/adr/               keputusan arsitektur
docs/agents/            konfigurasi skill engineering
.scratch/               spec dan ticket
```

## Dokumen

- `GLOSSARY.md` — istilah domain dan istilah yang dihindari
- `PRD_Sistem_Administrasi_Rawat_Inap.md` — PRD asal
- `docs/adr/` — keputusan yang sulit dibalik
- `.scratch/administrasi-rawat-inap/spec.md` — spec prototipe
- `.scratch/administrasi-rawat-inap/issues/` — ticket per slice

## Token desain

Warna, tipografi, radius, dan bayangan didefinisikan di `lib/design-tokens.ts` dan dicerminkan ke `app/globals.css` di bawah `@theme`. Test `lib/design-tokens.test.ts` menjaga keduanya tetap sinkron dan memverifikasi kontras WCAG 2.1 AA.

Komponen **tidak boleh** memakai nilai warna mentah — selalu lewat token.

## Catatan data

Tidak ada data pasien sungguhan. Seluruh isi aplikasi adalah data demo yang dibangkitkan secara lokal.
