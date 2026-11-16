# 13: Laporan dan dashboard Pimpinan penuh

**What to build:** Pimpinan membuka satu layar untuk mengetahui kondisi rumah sakit dan empat laporan per periode, semuanya dihitung dari data yang sama yang dipakai modul lain.

**Blocked by:** 11 (Kasir — tagihan dan pembayaran), 12 (Checkout, override, dan audit log)

**Status:** done

- [x] Dashboard Pimpinan menampilkan empat KPI: pasien yang sedang dirawat, BOR, pendapatan hari ini, dan pendapatan bulan ini.
- [x] Dashboard menampilkan grafik tren pendapatan 30 hari terakhir.
- [x] Dashboard menampilkan grafik okupansi per kelas kamar.
- [x] Dashboard menampilkan tabel ringkas pasien terbaru.
- [x] Grafik menyertakan label sumbu dan nilai yang dapat dibaca, bukan hanya bentuk visual.
- [x] Laporan pasien menampilkan pasien masuk, keluar, dan sedang dirawat untuk periode yang dipilih.
- [x] Laporan keuangan menampilkan total tagihan, total terbayar, dan sisa piutang untuk periode yang dipilih.
- [x] Laporan okupansi kamar menampilkan pemanfaatan per kelas.
- [x] Laporan pemakaian obat menampilkan pemakaian dan posisi stok akhir.
- [x] Semua laporan dapat difilter dengan rentang tanggal.
- [x] Setiap laporan menampilkan tanggal transaksi terakhir yang masuk perhitungan.
- [x] Periode tanpa data menampilkan kondisi kosong yang menjelaskan penyebabnya.
- [x] Kasir dapat membuka laporan keuangan; Pimpinan dan Apoteker dapat membuka laporan obat; laporan lain hanya untuk Pimpinan.
- [x] Angka dashboard dan laporan konsisten dengan data pada modul asalnya.

## Comments

- 2026-11-16: Selesai. Selector domain di `lib/domain/laporan.ts`; dashboard
  Pimpinan dan `/laporan` membaca angka yang sama dengan modul asalnya.
  Catatan: admin memegang `SEMUA_LAPORAN` di matriks izin, jadi admin juga
  dapat membuka keempat laporan — perilaku matriks yang sudah ada, bukan
  perubahan ticket ini.
