# Dani Medical Center — Administrasi Rawat Inap

Prototipe interaktif sistem administrasi rawat inap untuk **Dani Medical Center**, dibuat sebagai tugas mata kuliah Interaksi Manusia dan Komputer. Yang dinilai adalah kualitas UI dan UX, bukan implementasi backend.

**Demo:** https://dani-medical-center.vercel.app

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

Playwright menjalankan `next dev` sendiri pada port 3100. Jangan menyalakan server
pengembangan di port itu saat menjalankan `npm run test:e2e`: konfigurasinya
sengaja tidak memakai server yang sudah ada (`reuseExistingServer: false`),
sehingga suite tidak pernah diam-diam berjalan di atas kode lama.

## Menjalankan ulang dari kondisi bersih

Zip proyek berisi berkas yang dilacak git — tanpa `node_modules`, `.next`, dan
`.env.local`. Ekstrak ke direktori kosong, lalu:

```bash
npm ci
npx playwright install chromium
npm run typecheck && npm run lint && npm test && npm run test:e2e
```

Perintah yang sama dipakai untuk memeriksa zip sebelum dikumpulkan.

## Aksesibilitas

Prototipe mengikuti WCAG 2.1 AA dan diperiksa otomatis, bukan hanya oleh token:

| Berkas | Yang dijaga |
|---|---|
| `lib/design-tokens.test.ts` | kontras setiap pasangan warna yang dideklarasikan |
| `tests/e2e/aksesibilitas.spec.ts` | audit axe pada setiap rute yang dapat dibuka tiap peran, ditambah login dan sistem desain |
| `tests/e2e/aksesibilitas-interaktif.spec.ts` | audit axe, target 44×44, dan label kolom pada dialog dan formulir yang sedang terbuka |
| `tests/e2e/ukuran-target-dan-tablet.spec.ts` | target interaktif ≥44×44 px dan tablet 1024×768 tanpa scroll horizontal |
| `tests/e2e/interaksi-keyboard.spec.ts` | kedua alur selesai dengan Tab/Enter/panah saja, urutan Tab, fokus dialog, klik ganda di tujuh modul |
| `tests/e2e/kualitas-layar.spec.ts` | tidak ada layar kosong, status terbaca tanpa warna, istilah terlarang glossary |
| `tests/e2e/kondisi-kosong.spec.ts` | setiap daftar, laporan, dan master data punya kondisi kosong yang menjelaskan |
| `tests/e2e/halaman-tidak-ditemukan.spec.ts` | alamat yang salah pun menjelaskan diri |

Kontras diukur dua kali: oleh axe untuk teks HTML, dan oleh `kontrasTakTerukur` di
`tests/e2e/bantuan.ts` untuk teks SVG yang tidak dibaca axe. Rute per peran diturunkan
dari matriks izin di `lib/domain/izin.ts`, bukan daftar kedua.

## Susunan

```
app/                    rute dan layout Next.js App Router
components/brand/       logomark dan wordmark
lib/                    token desain dan pendukung
tests/e2e/              skenario Playwright
docs/adr/               keputusan arsitektur
docs/agents/            konfigurasi skill engineering
docs/usability/         kit evaluasi usability dan rasional desain
.scratch/               spec dan ticket
```

## Dokumen

- `GLOSSARY.md` — istilah domain dan istilah yang dihindari
- `PRD_Sistem_Administrasi_Rawat_Inap.md` — PRD asal
- `docs/adr/` — keputusan yang sulit dibalik
- `docs/usability/` — kit evaluasi usability (skenario, script, persetujuan, laporan) dan rasional desain
- `.scratch/administrasi-rawat-inap/spec.md` — spec prototipe
- `.scratch/administrasi-rawat-inap/issues/` — ticket per slice

## Token desain

Warna, tipografi, radius, dan bayangan didefinisikan di `lib/design-tokens.ts` dan dicerminkan ke `app/globals.css` di bawah `@theme`. Test `lib/design-tokens.test.ts` menjaga keduanya tetap sinkron dan memverifikasi kontras WCAG 2.1 AA.

Komponen **tidak boleh** memakai nilai warna mentah — selalu lewat token.

## Catatan data

Tidak ada data pasien sungguhan. Seluruh isi aplikasi adalah data demo yang dibangkitkan secara lokal.
