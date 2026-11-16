# 15: Kit evaluasi usability dan dokumen pendukung

**What to build:** Perangkat lengkap untuk menjalankan usability testing bersama lima responden dan melaporkan hasilnya, sehingga prototipe yang sudah jadi dapat dievaluasi secara formal dan temuannya terdokumentasi.

**Blocked by:** 12 (Checkout, override, dan audit log), 13 (Laporan dan dashboard Pimpinan penuh)

**Status:** done

- [x] Skenario tugas per peran tersedia, masing-masing berisi tujuan, langkah awal, dan kriteria keberhasilan yang dapat diamati.
- [x] Skenario mencakup jalur emas pasien masuk sampai pulang dan setidaknya satu skenario penanganan kesalahan.
- [x] Script pembuka moderator tersedia, termasuk penjelasan bahwa yang diuji adalah rancangan, bukan kemampuan responden.
- [x] Script penutup moderator tersedia, termasuk pertanyaan umpan balik terbuka.
- [x] Lembar persetujuan responden tersedia dan mencakup penggunaan rekaman serta hak untuk berhenti.
- [x] Template laporan temuan tersedia dengan kolom tugas, temuan, severity, heuristic yang terkait, dan rekomendasi perbaikan.
- [x] Panduan singkat cara menjalankan sesi (persiapan data demo, reset antar responden, pencatatan waktu tugas) tersedia.
- [x] Dokumen rasional desain tersedia dan menjelaskan pilihan arah visual, pola navigasi, wizard pendaftaran, dan penanganan kesalahan.
- [x] Dokumen rasional desain merujuk pada glossary dan ADR proyek, bukan mengulang isinya.
- [x] Seluruh dokumen berbahasa Indonesia dan dapat dilampirkan pada laporan akhir.

## Comments

- 2026-11-16: Selesai. Kit ada di `docs/usability/`: `README.md` (indeks), `skenario-tugas.md`
  (A–K), `script-moderator.md`, `lembar-persetujuan.md`, `template-laporan-temuan.md`,
  `panduan-sesi.md`, dan `rasional-desain.md`. `README.md` root dan `docs/usability/` ditautkan.

  **Celah yang ditemukan saat menulis panduan:** spec (user story 112) meminta tombol **Reset data
  demo** yang meminta konfirmasi, tetapi tidak ada kontrol itu di antarmuka — hanya `store.reset()`
  di lapisan domain. Panduan "reset antar responden" tidak akan bisa dijalankan, jadi tombolnya
  ditambahkan di header (`components/shell/reset-data-demo.tsx`, Radix Dialog, pengumuman
  `role="status"`), dengan test E2E `tests/e2e/reset-demo.spec.ts`. Test menutup dua perilaku:
  **Batal** tidak mengubah data, dan konfirmasi mengembalikan data tanpa mengeluarkan pengguna dari
  perannya.

  **Review dua agen (Standards + Spec) menemukan dan sudah diperbaiki:**
  - Skenario F (stok kurang) semula mustahil dijalankan: data demo tidak memuat resep yang stoknya
    kurang (Furosemide diresepkan 10 dari 45; Amoxicillin tidak diresepkan sama sekali). Kini
    menjadi Skenario K bagian 2 dengan persiapan moderator eksplisit.
  - Matriks responden semula menyuruh Dokter dan Perawat mengerjakan Skenario B (modul Pendaftaran),
    yang akan menampilkan layar **Akses ditolak**. Matriks disusun ulang: R1=A+B, R2=C+I, R3=F+J,
    R4=D+K, R5=G+H, dengan Skenario E dijalankan pada peran Kasir/Admin untuk semua responden.
    Ditambahkan skenario yang sebelumnya tidak ada: I (koreksi catatan dokter), J (bed siap dan
    pindah bed), F (tanda vital dan instruksi dokter).
  - Rasional desain semula menyatakan perpindahan peran kembali ke dashboard. Itu keliru:
    `PengalihPeran` hanya memanggil `masukSebagai` dan tidak bernavigasi. Teks diperbaiki.
  - Panduan dan script semula menyuruh "tutup sesi", padahal aplikasi tidak punya tombol keluar.
    Diperbaiki: sesi dibiarkan aktif, peran diganti lewat **Ganti peran**.
  - Istilah "seed" diganti "kondisi awal" sesuai `GLOSSARY.md`; salah kutip `theo` dan kutip
    keriting yang tidak berpasangan diperbaiki; kredit user story 24 dikoreksi (≤3 menit untuk
    seluruh wizard, bukan sampai Nomor Rekam Medis).

  Verifikasi akhir: `npx vitest run` (31 berkas, 296 test), `npx playwright test` (86 skenario),
  `npx tsc --noEmit`, dan `npx eslint .` semuanya hijau.

  **Sengaja tidak dikerjakan:** konstanta kelas tombol (`tombolUtama`/`tombolSekunder`) sudah
  disalin di ~10 berkas sebelum ticket ini; mengangkatnya menjadi modul bersama adalah refactor
  lintas berkas di luar lingkup ticket dokumentasi, dan mengikuti pola yang sudah ada lebih murah
  daripada memperkenalkan abstraksi yang hanya dipakai satu komponen baru.
