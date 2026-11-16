# 12: Checkout, override, dan audit log

**What to build:** Admisi ditutup hanya setelah tagihan lunas, Admin dapat membuka blokir itu dengan alasan yang tercatat, bed bekas pasien masuk status `dibersihkan`, dan semua tindakan penting dapat ditelusuri lewat layar audit log.

**Blocked by:** 11 (Kasir — tagihan dan pembayaran)

**Status:** done

- [x] Checkout ditolak ketika tagihan belum `lunas`, dengan penjelasan yang menyebutkan langkah berikutnya.
- [x] Admin dapat melakukan override checkout dengan menuliskan alasan; alasan wajib diisi.
- [x] Override hanya tersedia bagi Admin; peran lain tidak melihat atau tidak dapat menggunakannya.
- [x] Setelah checkout berhasil, admisi tidak lagi muncul di daftar admisi aktif dan statusnya menjadi selesai.
- [x] Bed bekas pasien checkout berubah menjadi `dibersihkan`.
- [x] Riwayat admisi menampilkan apakah checkout dilakukan lewat override beserta alasannya.
- [x] Admin membuka layar audit log berisi waktu, pengguna, aksi, entitas, dan ringkasan perubahan.
- [x] Audit log dapat difilter berdasarkan pengguna dan jenis aksi.
- [x] Entri audit log mencakup seluruh aksi penting: pembuatan pasien, pembuatan admisi, alokasi dan pindah bed, checkout, override checkout, penulisan rekam medis dan koreksi, pembuatan resep, perubahan status resep, penyerahan obat, penambahan stok, pembayaran, dan perubahan master.
- [x] E2E: checkout ditolak saat tagihan belum lunas, Admin melakukan override dengan alasan, dan entri override muncul di audit log.

## Comments

- **2026-11-16 — selesai.** Aturan checkout dan override sudah ada di store sejak ticket 02 (`lib/domain/store.ts` handler `checkout`, izin `checkout.override` hanya untuk Admin, audit `checkout` dan `checkout.override`). Ticket ini menambah lapisan baca dan layar, tanpa aturan bisnis baru di komponen.
- **Selector baru `daftarAudit`** (`lib/domain/selectors.ts`) mengurutkan entri terbaru dulu dan menyaring per pengguna dan/atau jenis aksi. Entri milik pengguna yang tidak dikenal tetap tampil dengan `pengguna: null`, bukan hilang dari daftar.
- **Panel checkout memakai `rincian.admisiId`** yang sudah dimiliki `RincianTagihan`; `BarisTagihan` tidak ditambah field baru agar tidak ada dua sumber `admisiId` yang bisa berbeda.
- **Layar Kasir** menambahkan panel "Checkout pasien": tombol checkout nonaktif selama tagihan belum lunas beserta penjelasan langkah berikutnya; Admin melihat tombol "Override checkout" yang membuka kolom alasan wajib. Peran lain tidak melihat tombol override sama sekali (bukan sekadar dinonaktifkan). Setelah checkout, panel menampilkan status admisi dan — bila lewat override — nama Admin beserta alasannya.
- **Pesan penolakan store tidak diduplikasi.** Alasan "wajib disertai alasan" dan "Hanya Admin …" tetap milik store; layar hanya menampilkannya pada `role="alert"` di panel checkout. Tombol checkout dinonaktifkan sebagai pencegahan, bukan pengganti aturan.
- **Layar Audit Log** (`app/(app)/administrasi/audit/page.tsx`) menampilkan waktu, pengguna, aksi (label Indonesia), entitas, dan ringkasan, dengan penyaring pengguna dan jenis aksi serta jumlah entri yang sedang tampil. Kondisi kosong membedakan "tidak cocok dengan penyaring" dari "belum ada aktivitas".
- **Test:** unit `lib/domain/selectors-audit.test.ts` (urutan, dua penyaring, gabungan, pengguna tak dikenal) dan E2E `tests/e2e/checkout.spec.ts` (blokir → override Admin dengan alasan → entri muncul di audit log; serta checkout normal setelah lunas).
- **Risiko:** daftar audit tidak dipaginasi. Volume seed masih kecil dan penyaring tersedia; bila audit tumbuh besar, tambahkan pemotongan halaman di layar, bukan mengubah selector.
- **Risiko:** panel checkout dirender di setiap tagihan, termasuk admisi selesai. Untuk admisi selesai tombolnya tidak dirender dan hanya riwayat yang tampil, jadi tidak ada aksi ganda.

