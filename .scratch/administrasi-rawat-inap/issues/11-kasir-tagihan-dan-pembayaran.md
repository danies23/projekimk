# 11: Kasir — tagihan dan pembayaran

**What to build:** Kasir melihat tagihan lengkap seorang pasien yang tersusun dari biaya kamar, tindakan, dan obat, mencatat pembayaran sebagian maupun penuh, dan mencetak kuitansi — menutup jalur uang dari admisi sampai bukti bayar.

**Blocked by:** 10 (Farmasi)

**Status:** done

- [x] Kasir melihat daftar admisi beserta status tagihannya.
- [x] Rincian tagihan memisahkan biaya kamar, tindakan, dan obat, masing-masing dengan kuantitas dan subtotal.
- [x] Rincian menampilkan lama inap dan tarif kamar yang dipakai dalam perhitungan.
- [x] Biaya kamar dihitung per segmen bila pasien pernah pindah kamar, dan setiap segmen terlihat jelas.
- [x] Subtotal per jenis biaya dan total keseluruhan ditampilkan.
- [x] Kasir dapat mencatat pembayaran dengan metode tunai, transfer, atau debit.
- [x] Pembayaran sebagian diterima, dan sisa tagihan ditampilkan setelah setiap pembayaran.
- [x] Status tagihan berubah otomatis menjadi `sebagian` atau `lunas` tanpa diisi manual.
- [x] Riwayat pembayaran menampilkan waktu, jumlah, metode, dan nama kasir.
- [x] Pembayaran yang melebihi sisa tagihan memunculkan peringatan namun tetap dapat dilanjutkan bila kasir memastikan.
- [x] Pembayaran tambahan pada tagihan yang sudah lunas ditolak dengan pesan yang jelas.
- [x] Kuitansi pembayaran dan rincian tagihan dapat dibuka sebagai pratinjau halaman cetak dengan tombol Cetak.
- [x] Kasir melihat ringkasan pendapatan pada sesi demo berjalan.
- [x] Setiap pembayaran tercatat di audit log.
- [x] E2E: kasir mencatat pembayaran sebagian, status berubah menjadi `sebagian`, membayar sisa, status menjadi `lunas`, dan kuitansi tampil.

## Comments

- **2026-11-16 — selesai.** Aturan uang sudah ada di store sejak ticket 02 (`pembayaran/dicatat`, `rincianTagihan`, `nilaiTagihan`, audit `pembayaran.dicatat`). Ticket ini menambah tiga selector baca-saja di `lib/domain/tagihan.ts` — `daftarTagihan`, `riwayatPembayaran`, `ringkasanKasir` — dan seluruh layar Kasir.
- **Tidak ada aturan bisnis baru di layar.** Status `sebagian`/`lunas`, penolakan tagihan lunas, dan perhitungan kamar per segmen tetap milik store dan `nilaiTagihan`; layar hanya membaca. Karena itu test E2E memeriksa angka dari seed, bukan menyalin rumus.
- **Peringatan kelebihan bayar bersifat pencegahan, bukan penolakan.** Store sengaja menerima pembayaran melebihi sisa (status `lunas` diturunkan dari `dibayar >= total`). Layar menampilkan selisih kelebihan dan mengubah label tombol menjadi "Catat pembayaran dengan kelebihan" supaya kelebihan tidak terjadi tanpa disadari.
- **Kuitansi dibuat per pembayaran**, dibuka dari baris riwayat, sehingga pembayaran sebagian tetap punya bukti masing-masing. Rincian tagihan punya pratinjau sendiri dari tombol di detail.
- **Lama inap pada dokumen cetak memakai tanggal pulang/hari ini lewat `rincianTagihan`**, jadi tagihan admisi selesai tidak bertambah setiap hari setelah checkout.
- **Pembayaran hanya untuk peran yang memegang `pembayaran.catat`**; peran lain yang boleh membuka modul Kasir (Admin) melihat rincian tanpa formulir, dengan penjelasan alih-alih tombol yang akan ditolak.
- **Jumlah dibaca dengan pemisah ribuan Indonesia.** Kasir menyalin angka seperti yang ditampilkan (`Rp1.500.000`); `Number("1.500.000")` adalah NaN dan `Number("500.000")` adalah 500, jadi layar membuang semua non-digit sebelum menyerahkan angkanya ke store. Test E2E mengetik format ber-"Rp" dan titik.
- **Kuitansi mencatat sisa setelah pembayaran itu**, bukan sisa hari ini. Tanpa ini, membuka ulang kuitansi pembayaran pertama setelah pelunasan mencetak "lunas, sisa Rp0" pada bukti lama. Sisa dihitung dari pembayaran bertanggal ≤ pembayaran tersebut.
- **Kamar, tindakan, dan obat masing-masing punya kuantitas dan subtotal** (GLOSSARY "Rincian Tagihan"). Tindakan selalu berkuantitas 1 karena dicatat per baris.
- **Validasi pembayaran tidak diduplikasi di layar.** Layar hanya menampilkan alasan penolakan store pada kolom jumlah, sehingga pesan "bilangan bulat lebih dari nol" tidak ditulis di dua tempat.
- **Risiko:** kuitansi memakai total tagihan saat ini, karena store tidak menyimpan total per pembayaran. Bila tindakan/obat ditambahkan setelah pembayaran, total di kuitansi lama ikut berubah (sisa setelah pembayaran tetap benar). Perbaikan sebenarnya adalah menyimpan snapshot total pada `Pembayaran` — di luar cakupan ticket ini.
- **Risiko:** daftar tagihan memuat seluruh admisi (termasuk yang sudah selesai) tanpa penyaring atau pencarian. Pada volume demo ini masih terbaca; bila data bertambah, tambahkan filter status di daftar (bukan mengubah selector).
- **Ringkasan "shift" tidak punya batas shift.** Store tidak mencatat shift; ringkasan memuat seluruh pembayaran atas nama kasir aktif (termasuk data demo) dan menambahkan angka "hari ini" sebagai pengganti pencocokan kas harian.

