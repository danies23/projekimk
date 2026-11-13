# 03: Login demo, RBAC, dan shell per peran

**What to build:** Pengguna dapat masuk sebagai salah satu dari tujuh peran demo, melihat menu yang hanya berisi modul yang menjadi haknya, berpindah peran tanpa keluar, dan dikembalikan ke halaman login bila sesi demo kosong.

**Blocked by:** 02 (Store domain, persistensi, dan data demo)

**Status:** ready-for-human

- [x] Halaman login menampilkan tujuh akun demo yang dapat diklik untuk mengisi kredensial otomatis.
- [x] Login berhasil mengarahkan ke dashboard dengan peran aktif terlihat.
- [x] Menu sidebar hanya memuat modul yang diizinkan untuk peran aktif.
- [x] Pengalih peran cepat di header memungkinkan pergantian peran tanpa keluar, dan ditandai jelas sebagai fitur demo.
- [x] Satu deklarasi pusat memetakan peran ke izin resource/tindakan; sidebar, penjagaan tombol, dan penjagaan rute membaca dari sumber yang sama.
- [x] Membuka rute yang tidak diizinkan menampilkan layar penolakan yang menjelaskan peran tidak memiliki akses, bukan halaman kosong.
- [x] Dashboard ringkas per peran menampilkan angka dasar yang relevan bagi peran tersebut.
- [x] Sesi demo kosong mengembalikan pengguna ke halaman login.
- [x] E2E: peralihan peran mengubah menu, dan rute terlarang menampilkan layar penolakan.

## Comments

Kerangka aplikasi selesai: login demo, sesi, shell per peran, dan dashboard ringkas.
Verifikasi: `npx vitest run` (21 berkas, 166 test), `npx playwright test` (14 skenario),
`npx tsc --noEmit`, `npx eslint .`, dan `npx next build` semuanya hijau.

Catatan implementasi:
- Sesi disimpan terpisah dari snapshot domain (`dmc.sesi.v1`) agar "Reset data demo" tidak
  mengeluarkan pengguna dari perannya. Sesi dibaca lewat `useSyncExternalStore` sehingga render
  server memakai snapshot kosong tanpa `setState` di dalam efek.
- Provider dipasang di root layout karena halaman login butuh data demo untuk mencocokkan akun;
  `Shell` hanya membungkus rute di grup `(app)`.
- Label peran disatukan di `lib/label-peran.ts`; sidebar, header, pengalih peran, dan layar
  penolakan membacanya dari sana.
- `useBoleh(tindakan)` menyediakan penjagaan tombol dari matriks izin yang sama dengan penjagaan
  rute dan sidebar. Belum ada tombol aksi nyata karena modulnya menyusul di ticket 04–14, jadi hook
  itu dibuang setelah review (belum ada pemakainya). Sebagai gantinya,
  `lib/domain/izin-konsisten.test.ts` membuktikan sidebar, penjagaan rute, dan penjagaan aksi
  membaca deklarasi yang sama dan tidak pernah berbeda jawaban.
- Halaman contoh sistem desain dipindah dari `/` ke `/design-system`; `/` kini mengarah ke
  dashboard. Test E2E halaman contoh ikut diperbarui dan dibatasi ke `main` agar tombol dev-tools
  Next.js tidak ikut diukur.
- Modul yang belum dibangun memakai `ModulTertunda`, yang menyatakan terus terang bahwa isinya
  menyusul — bukan layar kosong.
- Ditemukan dan diperbaiki: byte non-UTF-8 di komentar `lib/domain/izin.ts` (tanda `…` rusak)
  yang membuat berkas tidak bisa disunting dengan aman.
- Regresi yang tertangkap E2E: angka rupiah pada kartu dashboard meluber keluar viewport pada
  lebar tablet 1024 px. Grid kini 2 kolom sampai `xl`, dan angka memakai `break-words` dengan
  ukuran lebih kecil di bawah `lg`. Test "tanpa scroll horizontal" memverifikasi perbaikan ini
  dan terbukti merah saat perbaikan dibatalkan.

### Hasil review (Standards + Spec, dua agen paralel)

Standards: tidak ada pelanggaran standar terdokumentasi (tanpa warna mentah, tanpa tema pihak
ketiga, kosakata sesuai glossary, API Next 16 benar). Sebelas temuan smell bersifat penilaian;
sepuluh diperbaiki, satu ditolak: `min-h-11` memang target sentuh 44 px dan
`lib/design-tokens.test.ts` menegakkan model `--spacing` berbasis perkalian, jadi skalanya tidak
dekoratif.

Spec: tiga kekurangan nyata diperbaiki.
- **Pendapatan hari ini/bulan ini salah pada dini hari.** Stempel waktu adalah instan UTC,
  sedangkan "hari ini" adalah tanggal lokal; membandingkan potongan string membuat transaksi
  22:00 UTC (= 05:00 WIB) terhitung di hari sebelumnya. Kini setiap waktu dikonversi ke tanggal
  lokal lebih dulu. Test-nya lulus baik dengan `TZ=Asia/Jakarta` maupun `TZ=UTC`.
- **Pintasan "Daftarkan Pasien"** (user story 14) belum ada; kini tampil di dashboard petugas
  pendaftaran dan tidak muncul untuk peran lain.
- **Story 96 (admin ikut memelihara master obat)** tidak dapat diungkapkan: admin tidak punya
  resource `farmasi` maupun `obat.buat`/`obat.stokMasuk`. Kini admin berhak atas keduanya.

Selain itu `Resource` memiliki anggota `"checkout"` yang tidak dipegang peran mana pun, sehingga
rute yang memakainya akan menolak semua orang; anggota itu dihapus dan test baru memastikan
setiap resource setidaknya menjadi hak satu peran.

Satu temuan spec sengaja dibiarkan untuk ticket 13: apoteker dan kasir sama-sama memegang resource
`laporan`, sehingga pembedaan `laporan.keuangan` vs `laporan.obat` baru bisa ditegakkan saat layar
laporan dibangun (izin tindakannya sudah tersedia di matriks).
