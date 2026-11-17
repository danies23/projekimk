# 16: Penyempurnaan akhir dan audit aksesibilitas

**What to build:** Prototipe yang siap dinilai: dapat dipakai dengan keyboard dan pembaca layar, terbaca pada tablet, tidak pernah menampilkan layar kosong tanpa penjelasan, dan dapat dikumpulkan dalam bentuk URL serta zip.

**Blocked by:** 14 (Administrasi — pengguna dan master tindakan), 15 (Kit evaluasi usability dan dokumen pendukung)

**Status:** done

- [x] Seluruh teks antarmuka berbahasa Indonesia dan memakai istilah sesuai glossary.
- [x] Kontras teks memenuhi WCAG 2.1 AA (≥4.5:1 untuk teks normal, ≥3:1 untuk teks besar) pada seluruh layar, diverifikasi dengan pengukuran kontras.
- [x] Setiap target interaktif berukuran minimal 44×44 px.
- [x] Alur pendaftaran dan alur pembayaran dapat diselesaikan sepenuhnya dengan keyboard.
- [x] Dialog memindahkan fokus ke dalam saat terbuka dan mengembalikannya ke pemicu saat ditutup.
- [x] Setiap kolom formulir memiliki label yang terhubung secara programatik.
- [x] Status tidak pernah dibedakan hanya dengan warna.
- [x] Setiap daftar dan laporan memiliki kondisi kosong yang menjelaskan apa yang harus dilakukan.
- [x] Aksi yang berjalan lama menampilkan indikator sehingga tidak terjadi klik ganda.
- [x] Tata letak terbaca pada lebar tablet lanskap tanpa scroll horizontal.
- [x] Tidak ada rute atau tombol yang membawa pengguna ke layar kosong atau halaman error.
- [x] Seluruh test Vitest dan Playwright hijau pada keadaan akhir.
- [x] Aplikasi ter-deploy ke Vercel pada keadaan akhir.
- [x] Zip proyek tersedia dan dapat dijalankan ulang dari kondisi bersih dengan instruksi yang jelas.

## Comments

- 2026-11-17: Audit dikerjakan dengan mengukur DOM yang benar-benar dirender, bukan dengan
  membaca token. Enam berkas E2E baru (59 skenario) ditambahkan; `README.md` menjelaskan perannya.

  **Dua bug nyata ditemukan dan diperbaiki.** Audit target 44×44 memerahkan 12 dari 23 rute:
  - Tautan logomark di header hanya setinggi **39 px** (`components/shell/shell.tsx`); kini
    `inline-flex min-h-11`.
  - Tautan breadcrumb hanya setinggi **21 px** (`components/shell/jejak-navigasi.tsx`); kini
    `inline-flex min-h-11`.

  Sisanya adalah overlay Dev Tools milik `next dev`, bukan UI prototipe. Test menyaringnya lewat
  shadow root (`getRootNode().host`) karena `closest()` tidak melewati batas shadow.

  **Yang sudah benar tanpa perubahan** (dibuktikan test, bukan diasumsikan): kontras diukur axe
  pada 1.043 node di halaman audit dan lulus tanpa pelanggaran; alur pendaftaran dan pembayaran
  selesai dengan Tab/Enter/Space saja; kedua dialog memindahkan fokus ke dalam dan mengembalikannya
  ke pemicu; halaman 1024×768 tidak melebar horizontal; seluruh rute berisi dan tidak ada tautan
  mati; kondisi kosong menjelaskan langkah berikutnya.

  **Klik ganda:** dashboard, kasir, klinis, farmasi, kamar, dan administrasi masing-masing diuji
  dengan `dblclick()` sungguhan dan dua Enter berurutan. Tidak ada yang tercatat dua kali — store
  adalah penjaga terakhir. Tidak ada indikator loading yang ditambahkan karena `dispatch` bersifat
  sinkron dan tidak ada panggilan jaringan saat runtime (ADR-0001); indikator untuk aksi nol-detik
  hanya akan berkedip tanpa memberi informasi.

  **Deploy:** URL demo di README ternyata **404 pada `/login` dan `/dashboard`** — deployment
  terakhir 13 November, sebelum ticket 14 dan 15. Repo ditautkan ke proyek `dani-medical-center`
  dan di-deploy ulang; seluruh rute kini 200 dan login diverifikasi di peramban terhadap URL publik.

  Verifikasi akhir: `npx tsc --noEmit`, `npx eslint .`, `npx vitest run` (296 test), dan
  `npx playwright test` (176 skenario) semuanya hijau; `npm run build` menghasilkan 15 rute statis.

