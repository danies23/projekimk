# 12: Checkout, override, dan audit log

**What to build:** Admisi ditutup hanya setelah tagihan lunas, Admin dapat membuka blokir itu dengan alasan yang tercatat, bed bekas pasien masuk status `dibersihkan`, dan semua tindakan penting dapat ditelusuri lewat layar audit log.

**Blocked by:** 11 (Kasir — tagihan dan pembayaran)

**Status:** ready-for-agent

- [ ] Checkout ditolak ketika tagihan belum `lunas`, dengan penjelasan yang menyebutkan langkah berikutnya.
- [ ] Admin dapat melakukan override checkout dengan menuliskan alasan; alasan wajib diisi.
- [ ] Override hanya tersedia bagi Admin; peran lain tidak melihat atau tidak dapat menggunakannya.
- [ ] Setelah checkout berhasil, admisi tidak lagi muncul di daftar admisi aktif dan statusnya menjadi selesai.
- [ ] Bed bekas pasien checkout berubah menjadi `dibersihkan`.
- [ ] Riwayat admisi menampilkan apakah checkout dilakukan lewat override beserta alasannya.
- [ ] Admin membuka layar audit log berisi waktu, pengguna, aksi, entitas, dan ringkasan perubahan.
- [ ] Audit log dapat difilter berdasarkan pengguna dan jenis aksi.
- [ ] Entri audit log mencakup seluruh aksi penting: pembuatan pasien, pembuatan admisi, alokasi dan pindah bed, checkout, override checkout, penulisan rekam medis dan koreksi, pembuatan resep, perubahan status resep, penyerahan obat, penambahan stok, pembayaran, dan perubahan master.
- [ ] E2E: checkout ditolak saat tagihan belum lunas, Admin melakukan override dengan alasan, dan entri override muncul di audit log.
