# 08: Klinis — dokter

**What to build:** Dokter melihat pasien yang menjadi tanggung jawabnya, menulis catatan visite, menambahkan tindakan berbayar, membuat resep, dan menelusuri riwayat klinis pasien — dengan rekam medis yang tidak dapat dihapus.

**Blocked by:** 06 (Penyelesaian pendaftaran, admisi, dan bukti pendaftaran)

**Status:** ready-for-agent

- [ ] Dokter melihat daftar pasien yang dirawat di bawah tanggung jawabnya.
- [ ] Detail admisi menampilkan identitas pasien, bed, tanggal masuk, dan diagnosa awal sebagai konteks sebelum menulis.
- [ ] Dokter dapat menulis catatan visite berisi isi visite, diagnosa, dan rencana.
- [ ] Dokter dapat menambahkan tindakan dari master tindakan, dan tarif tindakan tersebut langsung masuk ke rincian tagihan admisi.
- [ ] Dokter dapat melihat total biaya tindakan yang telah ia tambahkan pada admisi tersebut.
- [ ] Dokter dapat membuat resep berisi beberapa obat dengan jumlah dan aturan pakai; resep masuk ke antrean farmasi dengan status `menunggu`.
- [ ] Dokter dapat melihat status setiap resep yang ia buat.
- [ ] Riwayat klinis pasien ditampilkan dalam urutan waktu dan memuat catatan visite, tindakan, resep, serta catatan perawat.
- [ ] Tidak ada aksi yang menghapus catatan klinis.
- [ ] Koreksi dibuat sebagai catatan baru yang menunjuk catatan asli, dan catatan asli ditandai telah dikoreksi.
- [ ] Penulisan catatan, penambahan tindakan, pembuatan resep, dan koreksi tercatat di audit log.
