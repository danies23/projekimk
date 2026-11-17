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
  membaca token. Tujuh berkas E2E baru (114 skenario) ditambahkan; `README.md` menjelaskan perannya.
  Rute per peran di test diturunkan dari matriks izin `lib/domain/izin.ts`, bukan daftar kedua.

  **Tiga bug nyata ditemukan dan diperbaiki.** Audit target 44×44 memerahkan sebagian rute:
  - Tautan logomark di header hanya setinggi **39 px** (`components/shell/shell.tsx`).
  - Tautan breadcrumb hanya setinggi **21 px** (`components/shell/jejak-navigasi.tsx`).
  - Tautan "Buka laporan per periode" di dashboard hanya setinggi **20 px**
    (`app/(app)/dashboard/page.tsx`) — baru terlihat setelah cakupan rute diperluas ke semua peran.
  Ketiganya kini `inline-flex min-h-11`.

  Sisanya adalah overlay Dev Tools milik `next dev`, bukan UI prototipe. Test menyaringnya lewat
  shadow root (`getRootNode().host`) karena `closest()` tidak melewati batas shadow.

  **Kondisi kosong:** kalimat penjelas diperiksa sebagai kalimat lengkap, bukan pola longgar.
  Pemeriksaan itu menemukan satu kondisi kosong yang hanya menyebut "tidak ada data" tanpa langkah
  berikutnya — kelompok resep di Farmasi — dan kalimatnya dilengkapi. Tiga tabel master (kamar,
  obat, tindakan) juga tidak punya kondisi kosong sama sekali; kini masing-masing menjelaskan cara
  mengisinya. Tabel pengguna dikecualikan: ia selalu berisi pengguna yang sedang masuk.

  **Kontras:** axe melewati teks SVG dengan alasan "latar tidak dapat ditentukan", padahal seluruh
  label grafik dashboard berukuran 11 px. `kontrasTakTerukur` di `tests/e2e/bantuan.ts` mengukur
  sendiri teks SVG dengan rumus WCAG yang sama; tidak ada yang di bawah 4.5:1. Login dan sistem
  desain juga ikut diaudit — keduanya di luar matriks peran.

  **Klik ganda:** tujuh aksi yang menambah baris (admisi, pembayaran, catatan klinis, tindakan,
  obat, pengguna, kamar) diuji dengan Enter dua kali berurutan pada tombol yang sama. Semua
  bertambah tepat satu. Dua klik di dalam satu tick JavaScript memang tercatat dua kali, tetapi
  peramban tidak dapat menghasilkannya dari pengguna; `dblclick` dan dua Enter sungguhan pada
  kasir dan klinis masing-masing tercatat satu. Tidak ada indikator loading yang ditambahkan karena
  `dispatch` bersifat sinkron dan tidak ada panggilan jaringan saat runtime (ADR-0001).

  **Keyboard:** kedua alur diselesaikan dengan Tab, Enter, Space, panah, dan pengetikan saja.
  Dua hal yang hanya terlihat dari test ini: setelah pasien tersimpan, tombol "Lanjut ke langkah 2"
  berada di atas daftar admisi sehingga pengguna keyboard mencapainya dengan Shift+Tab; dan radio
  metode pembayaran berbagi satu titik Tab, jadi antar-metode berpindah dengan panah.

  **Yang sudah benar tanpa perubahan** (dibuktikan test, bukan diasumsikan): kedua dialog
  memindahkan fokus ke dalam dan mengembalikannya ke pemicu; halaman 1024×768 tidak melebar
  horizontal; seluruh rute berisi dan tidak ada tautan mati.

  **Deploy:** URL demo di README ternyata **404 pada `/login` dan `/dashboard`** — deployment
  terakhir 13 November, sebelum ticket 14 dan 15. Repo ditautkan ke proyek `dani-medical-center`
  dan di-deploy ulang; seluruh rute kini 200 dan login diverifikasi di peramban terhadap URL publik.

  **Halaman tidak ditemukan:** alamat yang salah ketik semula jatuh ke halaman error bawaan
  Next.js (404 polos tanpa logomark). Tidak ada tautan aplikasi yang menunjuk ke sana, tetapi
  kriteria "tidak ada halaman error" lebih jujur bila alamat salah pun menjelaskan dirinya, jadi
  `app/not-found.tsx` ditambahkan — lolos axe tanpa pelanggaran dan targetnya ≥44 px.

  Verifikasi akhir: `npx tsc --noEmit`, `npx eslint .`, `npx vitest run` (296 test), dan
  `npx playwright test` semuanya hijau; `npm run build` menghasilkan 15 rute statis.
  Zip diuji dengan cara diekstrak ke direktori kosong, `npm ci`, lalu seluruh perintah di README.

