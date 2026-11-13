# 10: Farmasi

**What to build:** Apoteker memproses resep dari antrean sampai obat diserahkan, dengan stok yang berkurang pada saat penyerahan dan tidak pernah menjadi negatif — melengkapi jalur klinis sampai biaya obat masuk ke tagihan.

**Blocked by:** 08 (Klinis — dokter)

**Status:** ready-for-agent

- [ ] Apoteker melihat antrean resep yang dikelompokkan berdasarkan status `menunggu`, `disiapkan`, dan `diserahkan`.
- [ ] Rincian resep menampilkan pasien, dokter, daftar obat, jumlah, dan aturan pakai.
- [ ] Apoteker dapat mengubah status resep dari `menunggu` menjadi `disiapkan`.
- [ ] Apoteker dapat menyerahkan obat, dan stok berkurang pada saat itu juga.
- [ ] Penyerahan ditolak dengan pesan jelas bila stok tidak mencukupi; stok dan status resep tidak berubah.
- [ ] Biaya obat yang diserahkan otomatis masuk ke rincian tagihan pasien.
- [ ] Daftar obat menampilkan satuan, harga, stok, dan stok minimum.
- [ ] Obat yang stoknya di bawah minimum diberi penanda peringatan yang terbaca tanpa mengandalkan warna.
- [ ] Apoteker dapat menambah stok (barang masuk) dan perubahannya tercatat.
- [ ] Apoteker dapat menambah obat baru ke master.
- [ ] Riwayat pergerakan stok suatu obat dapat dilihat.
- [ ] Setiap perubahan status resep, penyerahan obat, penambahan stok, dan perubahan master obat tercatat di audit log.
- [ ] E2E: dokter membuat resep, apoteker menyerahkan obat, dan tagihan pasien memuat biaya obat.
