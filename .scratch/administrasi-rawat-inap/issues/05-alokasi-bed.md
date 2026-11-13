# 05: Alokasi bed — langkah 2 pendaftaran

**What to build:** Petugas pendaftaran melihat ketersediaan bed secara sekilas, memilih dokter penanggung jawab, tanggal masuk, diagnosa awal, dan sebuah bed — dengan bed yang sudah terisi atau belum siap dipakai tidak pernah muncul sebagai pilihan.

**Blocked by:** 04 (Pendaftaran langkah 1 — cari dan buat pasien)

**Status:** ready-for-agent

- [ ] Grid denah bed menampilkan bed per kamar dengan kelas dan tarif harian kamar.
- [ ] Setiap bed menampilkan status `terisi`, `kosong`, atau `dibersihkan` sebagai teks, bukan hanya warna.
- [ ] Tabel ringkasan menampilkan jumlah bed per status dan BOR terkini.
- [ ] Hanya bed berstatus `kosong` yang dapat dipilih; bed `terisi` dan `dibersihkan` tidak dapat dipilih.
- [ ] Petugas dapat memilih dokter penanggung jawab dari daftar dokter aktif.
- [ ] Petugas dapat mengisi tanggal masuk dan diagnosa awal.
- [ ] Bila bed yang dipilih ternyata sudah terisi sebelum langkah diselesaikan, sistem menampilkan pesan bahwa bed tersebut baru saja terisi dan meminta petugas memilih bed lain.
- [ ] Pilihan dokter, tanggal, diagnosa, dan bed tetap tersimpan saat petugas bergerak antar langkah.
- [ ] Daftar bed diperbarui saat petugas kembali ke langkah ini, sehingga bed yang terisi di sela waktu tidak lagi ditawarkan.
