# 07: Manajemen kamar dan bed

**What to build:** Admin mengelola master kamar, perawat menandai bed siap dipakai dan memindahkan pasien antar bed, dan semua orang melihat ketersediaan yang selalu mencerminkan keadaan sebenarnya.

**Blocked by:** 06 (Penyelesaian pendaftaran, admisi, dan bukti pendaftaran)

**Status:** ready-for-agent

- [ ] Admin dapat menambah, mengubah, dan menonaktifkan kamar beserta kelas, tarif harian, dan kapasitasnya.
- [ ] Perawat dapat menandai bed berstatus `dibersihkan` menjadi `kosong` melalui aksi eksplisit.
- [ ] Perawat dapat memindahkan pasien ke bed lain, baik dalam kamar yang sama maupun kamar berbeda.
- [ ] Pemindahan menolak bed yang sudah ditempati dan menolak bed yang belum siap dipakai.
- [ ] Setelah pemindahan, riwayat perpindahan menampilkan kamar asal, kamar tujuan, dan waktunya.
- [ ] Ringkasan jumlah bed per status dan BOR diperbarui setelah setiap perubahan.
- [ ] Perubahan master kamar tercermin pada pilihan bed di wizard pendaftaran.
- [ ] Setiap perubahan kamar dan bed tercatat di audit log.
