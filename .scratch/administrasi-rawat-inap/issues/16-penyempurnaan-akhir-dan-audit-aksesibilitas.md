# 16: Penyempurnaan akhir dan audit aksesibilitas

**What to build:** Prototipe yang siap dinilai: dapat dipakai dengan keyboard dan pembaca layar, terbaca pada tablet, tidak pernah menampilkan layar kosong tanpa penjelasan, dan dapat dikumpulkan dalam bentuk URL serta zip.

**Blocked by:** 14 (Administrasi — pengguna dan master tindakan), 15 (Kit evaluasi usability dan dokumen pendukung)

**Status:** ready-for-agent

- [ ] Seluruh teks antarmuka berbahasa Indonesia dan memakai istilah sesuai glossary.
- [ ] Kontras teks memenuhi WCAG 2.1 AA (≥4.5:1 untuk teks normal, ≥3:1 untuk teks besar) pada seluruh layar, diverifikasi dengan pengukuran kontras.
- [ ] Setiap target interaktif berukuran minimal 44×44 px.
- [ ] Alur pendaftaran dan alur pembayaran dapat diselesaikan sepenuhnya dengan keyboard.
- [ ] Dialog memindahkan fokus ke dalam saat terbuka dan mengembalikannya ke pemicu saat ditutup.
- [ ] Setiap kolom formulir memiliki label yang terhubung secara programatik.
- [ ] Status tidak pernah dibedakan hanya dengan warna.
- [ ] Setiap daftar dan laporan memiliki kondisi kosong yang menjelaskan apa yang harus dilakukan.
- [ ] Aksi yang berjalan lama menampilkan indikator sehingga tidak terjadi klik ganda.
- [ ] Tata letak terbaca pada lebar tablet lanskap tanpa scroll horizontal.
- [ ] Tidak ada rute atau tombol yang membawa pengguna ke layar kosong atau halaman error.
- [ ] Seluruh test Vitest dan Playwright hijau pada keadaan akhir.
- [ ] Aplikasi ter-deploy ke Vercel pada keadaan akhir.
- [ ] Zip proyek tersedia dan dapat dijalankan ulang dari kondisi bersih dengan instruksi yang jelas.
