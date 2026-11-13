# 06: Penyelesaian pendaftaran, admisi, dan bukti pendaftaran

**What to build:** Petugas menyelesaikan wizard pendaftaran lewat layar konfirmasi, admisi terbentuk, bed terkunci untuk pasien tersebut, dan bukti pendaftaran siap dicetak — melengkapi jalur emas pertama dari pasien masuk sampai punya bukti.

**Blocked by:** 05 (Alokasi bed — langkah 2 pendaftaran)

**Status:** ready-for-human

- [x] Langkah konfirmasi menampilkan ringkasan pasien, Nomor Rekam Medis, dokter, kamar, bed, tarif harian, dan tanggal masuk sebelum admisi disimpan.
- [x] Menyimpan admisi mengubah status bed menjadi `terisi` dan membuat tagihan awal untuk admisi tersebut.
- [x] Indikator langkah menunjukkan posisi sekarang dan jumlah langkah tersisa sepanjang wizard.
- [x] Kembali ke langkah sebelumnya tidak menghilangkan isian mana pun.
- [x] Setelah admisi tersimpan, petugas dapat membuka bukti pendaftaran yang memuat identitas pasien, Nomor Rekam Medis, dokter, kamar, bed, dan tanggal masuk.
- [x] Bukti pendaftaran tampil sebagai pratinjau halaman cetak dan tombol Cetak membuka dialog cetak peramban.
- [x] Daftar admisi aktif menampilkan pasien, bed, dokter, dan tanggal masuk, serta diperbarui setelah admisi baru dibuat.
- [x] Wizard dapat diselesaikan dalam waktu ≤3 menit oleh pengguna yang sudah familiar, dan durasinya dapat diukur saat usability testing.
- [x] E2E: petugas membuat pasien baru, memilih dokter dan bed, menyelesaikan konfirmasi, lalu membuka bukti pendaftaran.

## Comments

Wizard pendaftaran selesai: konfirmasi, penyimpanan admisi, bukti pendaftaran, dan daftar
admisi aktif. Verifikasi: `npx vitest run` (23 berkas, 190 test), `npx playwright test`
(33 skenario), `npx tsc --noEmit`, `npx eslint .`, dan `npx next build` hijau.

Catatan implementasi:
- `infoAdmisi` dan `daftarAdmisiAktif` adalah selector murni di `lib/domain/selectors.ts`;
  `daftarAdmisiAktif` mengembalikan `InfoAdmisi[]` terurut tanggal masuk terbaru dulu, tanpa
  DTO kedua. Halaman hanya merender, bukan menyusun ulang relasi.
- Penyimpanan admisi memakai aksi store yang sudah ada (`admisi/dibuat`), sehingga aturan
  bed `terisi`, tagihan awal, dan pesan bentrok alokasi tetap satu sumber.
- Bukti pendaftaran dapat dibuka ulang dari baris "Buka bukti" di daftar admisi aktif, jadi
  bukti tidak hilang saat pengguna menutup pratinjau atau memuat ulang halaman. Tombol Cetak
  memanggil `window.print()`; header, sidebar, breadcrumb, tombol, dan daftar admisi memakai
  kelas `.no-print` yang sudah ada di `globals.css` agar hasil cetak hanya berisi bukti.
- Fokus dipindahkan ke judul setiap kali isi halaman diganti (perpindahan langkah, bukti
  tampil, dan "Daftarkan pasien lain" yang kembali ke langkah 1) — WCAG 2.4.3.
- Pesan gagal simpan dibersihkan saat petugas kembali ke langkah 2, sehingga tidak menghantui
  kunjungan berikutnya ke langkah 3.

Temuan review yang sengaja tidak diambil:
- Reset 15 field pada "Daftarkan pasien lain" tetap ditulis satu per satu; satu-satunya
  pemanggilnya adalah tombol itu, dan `key` remount akan menghapus state store yang justru
  harus bertahan. Bila alur ini bertambah, ekstrak `resetWizard()`.
- Penjagaan kamar nonaktif untuk bed yang dipilih tetap di `denahBed` (pilihan tidak pernah
  ditawarkan); store belum menolak bed di kamar nonaktif karena belum ada aksi yang bisa
  menonaktifkan kamar. Ticket 07 yang menambah aksi itu perlu menutup celah ini.
- Daftar admisi aktif belum memuat Nomor Rekam Medis sebagai kolom terpisah — ia menempel pada
  nama pasien — karena tabel harus tetap terbaca pada lebar tablet.
