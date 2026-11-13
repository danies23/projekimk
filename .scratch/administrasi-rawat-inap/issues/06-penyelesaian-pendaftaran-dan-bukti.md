# 06: Penyelesaian pendaftaran, admisi, dan bukti pendaftaran

**What to build:** Petugas menyelesaikan wizard pendaftaran lewat layar konfirmasi, admisi terbentuk, bed terkunci untuk pasien tersebut, dan bukti pendaftaran siap dicetak — melengkapi jalur emas pertama dari pasien masuk sampai punya bukti.

**Blocked by:** 05 (Alokasi bed — langkah 2 pendaftaran)

**Status:** ready-for-agent

- [ ] Langkah konfirmasi menampilkan ringkasan pasien, Nomor Rekam Medis, dokter, kamar, bed, tarif harian, dan tanggal masuk sebelum admisi disimpan.
- [ ] Menyimpan admisi mengubah status bed menjadi `terisi` dan membuat tagihan awal untuk admisi tersebut.
- [ ] Indikator langkah menunjukkan posisi sekarang dan jumlah langkah tersisa sepanjang wizard.
- [ ] Kembali ke langkah sebelumnya tidak menghilangkan isian mana pun.
- [ ] Setelah admisi tersimpan, petugas dapat membuka bukti pendaftaran yang memuat identitas pasien, Nomor Rekam Medis, dokter, kamar, bed, dan tanggal masuk.
- [ ] Bukti pendaftaran tampil sebagai pratinjau halaman cetak dan tombol Cetak membuka dialog cetak peramban.
- [ ] Daftar admisi aktif menampilkan pasien, bed, dokter, dan tanggal masuk, serta diperbarui setelah admisi baru dibuat.
- [ ] Wizard dapat diselesaikan dalam waktu ≤3 menit oleh pengguna yang sudah familiar, dan durasinya dapat diukur saat usability testing.
- [ ] E2E: petugas membuat pasien baru, memilih dokter dan bed, menyelesaikan konfirmasi, lalu membuka bukti pendaftaran.
