# 10: Farmasi

**What to build:** Apoteker memproses resep dari antrean sampai obat diserahkan, dengan stok yang berkurang pada saat penyerahan dan tidak pernah menjadi negatif — melengkapi jalur klinis sampai biaya obat masuk ke tagihan.

**Blocked by:** 08 (Klinis — dokter)

**Status:** done

- [x] Apoteker melihat antrean resep yang dikelompokkan berdasarkan status `menunggu`, `disiapkan`, dan `diserahkan`.
- [x] Rincian resep menampilkan pasien, dokter, daftar obat, jumlah, dan aturan pakai.
- [x] Apoteker dapat mengubah status resep dari `menunggu` menjadi `disiapkan`.
- [x] Apoteker dapat menyerahkan obat, dan stok berkurang pada saat itu juga.
- [x] Penyerahan ditolak dengan pesan jelas bila stok tidak mencukupi; stok dan status resep tidak berubah.
- [x] Biaya obat yang diserahkan otomatis masuk ke rincian tagihan pasien.
- [x] Daftar obat menampilkan satuan, harga, stok, dan stok minimum.
- [x] Obat yang stoknya di bawah minimum diberi penanda peringatan yang terbaca tanpa mengandalkan warna.
- [x] Apoteker dapat menambah stok (barang masuk) dan perubahannya tercatat.
- [x] Apoteker dapat menambah obat baru ke master.
- [x] Riwayat pergerakan stok suatu obat dapat dilihat.
- [x] Setiap perubahan status resep, penyerahan obat, penambahan stok, dan perubahan master obat tercatat di audit log.
- [x] E2E: dokter membuat resep, apoteker menyerahkan obat, dan tagihan pasien memuat biaya obat.

## Comments

- **2026-11-16 — selesai.** Sebagian besar aturan farmasi sudah ada di store sejak ticket 02/08 (`resep/dibuat`, `resep/siapkan`, `resep/serahkan`, `obat/stok-masuk`, penagihan obat hanya pada resep `diserahkan`). Ticket ini menutup sisanya: aksi `obat/dibuat` (satu-satunya nilai `AksiAudit` yang belum punya handler), selector `antreanFarmasi`/`obatStokMenipis`/`kebutuhanObat`, dan seluruh layar Farmasi.
- **Satu aturan stok, bukan dua.** `kebutuhanObat(resep)` menjumlahkan baris berisi obat yang sama dan dipakai store *dan* layar. Tanpa itu label "stok kurang" di UI membandingkan per baris, sementara store menjumlahkan — dua baris 80 tablet terhadap stok 100 akan tampil aman padahal penyerahannya ditolak.
- **Stok awal obat baru tercatat** sebagai mutasi `masuk` berketerangan "Stok awal", supaya riwayat pergerakan tidak bolong di awal.
- **Kelompok `diserahkan` tetap terlihat** agar apoteker dapat menelusuri pekerjaan yang selesai; antrean tidak menyembunyikan riwayat.
- **Tidak ada aksi sunting obat.** Ticket hanya meminta penambahan obat baru; mengubah harga/stok minimum obat yang sudah ada belum ada aksinya (`obat.diubah` masih belum dipakai). Risiko: harga master tidak dapat dikoreksi lewat UI.
- **Resep tidak menyimpan jam perubahan status**, jadi layar tidak dapat menampilkan "sudah menunggu berapa lama". Antrean diurutkan dari resep terlama sebagai gantinya.
- **Admisi selesai mengunci farmasi.** `resep/siapkan` dan `resep/serahkan` kini menolak resep yang admisinya sudah checkout. Sebelumnya resep yang tertinggal bisa diserahkan setelah tagihan ditutup, sehingga baris baru masuk ke tagihan yang sudah dibayar dan statusnya bisa berubah dari `lunas` menjadi `sebagian`. Baris antrean membawa penanda `admisiSelesai`, dan detail resep menjelaskan sebabnya alih-alih menampilkan tombol yang akan ditolak.
- **Penyerahan dikonfirmasi lebih dulu.** Stok dan tagihan berubah seketika dan status resep tidak bisa mundur, jadi tombol "Serahkan obat" membuka dialog konfirmasi (Radix, ADR-0003); dialog hanya tertutup bila store menerima.
- **Galat tampil di dekat kolomnya.** Form tambah obat dan barang masuk memakai `aria-invalid` + `aria-describedby` menuju pesan di bawah kolom; pesan di atas halaman tidak lagi menduplikasinya.
- **Label "stok kurang" tidak muncul pada resep yang sudah diserahkan** — setelah penyerahan, stok memang sudah berkurang oleh resep itu sendiri.
