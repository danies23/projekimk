# 07: Manajemen kamar dan bed

**What to build:** Admin mengelola master kamar, perawat menandai bed siap dipakai dan memindahkan pasien antar bed, dan semua orang melihat ketersediaan yang selalu mencerminkan keadaan sebenarnya.

**Blocked by:** 06 (Penyelesaian pendaftaran, admisi, dan bukti pendaftaran)

**Status:** done

- [x] Admin dapat menambah, mengubah, dan menonaktifkan kamar beserta kelas, tarif harian, dan kapasitasnya.
- [x] Perawat dapat menandai bed berstatus `dibersihkan` menjadi `kosong` melalui aksi eksplisit.
- [x] Perawat dapat memindahkan pasien ke bed lain, baik dalam kamar yang sama maupun kamar berbeda.
- [x] Pemindahan menolak bed yang sudah ditempati dan menolak bed yang belum siap dipakai.
- [x] Setelah pemindahan, riwayat perpindahan menampilkan kamar asal, kamar tujuan, dan waktunya.
- [x] Ringkasan jumlah bed per status dan BOR diperbarui setelah setiap perubahan.
- [x] Perubahan master kamar tercermin pada pilihan bed di wizard pendaftaran.
- [x] Setiap perubahan kamar dan bed tercatat di audit log.

## Comments

- **2026-11-13 — selesai.** Store mendapat aksi `kamar/dibuat` dan `kamar/diubah` (nama, kelas, tarif, kapasitas, aktif) dengan penjagaan `master.kamar`; bed dibuat/dihapus mengikuti kapasitas. Pemindahan dan penandaan siap memakai aksi yang sudah ada. Riwayat diturunkan dari `segmenBed`, bukan daftar terpisah.
- **Tarif disalin ke segmen.** `SegmenBed.tarifHarian` ditambahkan supaya mengubah tarif kamar tidak menagih ulang masa inap yang sudah berjalan — aturan yang sama dengan tarif tindakan dan harga obat. Snapshot lama tanpa field ini jatuh ke tarif kamar saat ini.
- **Kapasitas tidak dapat dikurangi** bila bed yang akan dihapus masih terisi atau pernah muncul di riwayat perpindahan.
- **Perpindahan terikat ke bed.** Dialog memindahkan penghuni bed yang tombolnya ditekan; tidak ada pemilih pasien bebas.
- **Riwayat masih global** (semua admisi), bukan per pasien seperti user story 35. Tampilan per pasien lebih tepat berada di modul Klinis (ticket 08/09) yang sudah membuka konteks satu admisi.
- **Duplikasi UI** dengan wizard pendaftaran (`labelStatus`, tabel ringkasan bed/BOR, `Bidang`) sengaja dibiarkan sampai ada layar ketiga yang memakainya.
