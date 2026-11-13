# 13: Laporan dan dashboard Pimpinan penuh

**What to build:** Pimpinan membuka satu layar untuk mengetahui kondisi rumah sakit dan empat laporan per periode, semuanya dihitung dari data yang sama yang dipakai modul lain.

**Blocked by:** 11 (Kasir — tagihan dan pembayaran), 12 (Checkout, override, dan audit log)

**Status:** ready-for-agent

- [ ] Dashboard Pimpinan menampilkan empat KPI: pasien yang sedang dirawat, BOR, pendapatan hari ini, dan pendapatan bulan ini.
- [ ] Dashboard menampilkan grafik tren pendapatan 30 hari terakhir.
- [ ] Dashboard menampilkan grafik okupansi per kelas kamar.
- [ ] Dashboard menampilkan tabel ringkas pasien terbaru.
- [ ] Grafik menyertakan label sumbu dan nilai yang dapat dibaca, bukan hanya bentuk visual.
- [ ] Laporan pasien menampilkan pasien masuk, keluar, dan sedang dirawat untuk periode yang dipilih.
- [ ] Laporan keuangan menampilkan total tagihan, total terbayar, dan sisa piutang untuk periode yang dipilih.
- [ ] Laporan okupansi kamar menampilkan pemanfaatan per kelas.
- [ ] Laporan pemakaian obat menampilkan pemakaian dan posisi stok akhir.
- [ ] Semua laporan dapat difilter dengan rentang tanggal.
- [ ] Setiap laporan menampilkan tanggal transaksi terakhir yang masuk perhitungan.
- [ ] Periode tanpa data menampilkan kondisi kosong yang menjelaskan penyebabnya.
- [ ] Kasir dapat membuka laporan keuangan; Pimpinan dan Apoteker dapat membuka laporan obat; laporan lain hanya untuk Pimpinan.
- [ ] Angka dashboard dan laporan konsisten dengan data pada modul asalnya.
