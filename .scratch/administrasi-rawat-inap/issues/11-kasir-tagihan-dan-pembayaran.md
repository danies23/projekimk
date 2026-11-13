# 11: Kasir — tagihan dan pembayaran

**What to build:** Kasir melihat tagihan lengkap seorang pasien yang tersusun dari biaya kamar, tindakan, dan obat, mencatat pembayaran sebagian maupun penuh, dan mencetak kuitansi — menutup jalur uang dari admisi sampai bukti bayar.

**Blocked by:** 10 (Farmasi)

**Status:** ready-for-agent

- [ ] Kasir melihat daftar admisi beserta status tagihannya.
- [ ] Rincian tagihan memisahkan biaya kamar, tindakan, dan obat, masing-masing dengan kuantitas dan subtotal.
- [ ] Rincian menampilkan lama inap dan tarif kamar yang dipakai dalam perhitungan.
- [ ] Biaya kamar dihitung per segmen bila pasien pernah pindah kamar, dan setiap segmen terlihat jelas.
- [ ] Subtotal per jenis biaya dan total keseluruhan ditampilkan.
- [ ] Kasir dapat mencatat pembayaran dengan metode tunai, transfer, atau debit.
- [ ] Pembayaran sebagian diterima, dan sisa tagihan ditampilkan setelah setiap pembayaran.
- [ ] Status tagihan berubah otomatis menjadi `sebagian` atau `lunas` tanpa diisi manual.
- [ ] Riwayat pembayaran menampilkan waktu, jumlah, metode, dan nama kasir.
- [ ] Pembayaran yang melebihi sisa tagihan memunculkan peringatan namun tetap dapat dilanjutkan bila kasir memastikan.
- [ ] Pembayaran tambahan pada tagihan yang sudah lunas ditolak dengan pesan yang jelas.
- [ ] Kuitansi pembayaran dan rincian tagihan dapat dibuka sebagai pratinjau halaman cetak dengan tombol Cetak.
- [ ] Kasir melihat ringkasan pendapatan pada sesi demo berjalan.
- [ ] Setiap pembayaran tercatat di audit log.
- [ ] E2E: kasir mencatat pembayaran sebagian, status berubah menjadi `sebagian`, membayar sisa, status menjadi `lunas`, dan kuitansi tampil.
