# 02: Store domain, persistensi, dan data demo

**What to build:** Sumber kebenaran tunggal untuk seluruh data prototipe — pasien, kamar, bed, admisi, rekam medis, tindakan, obat, resep, tagihan, pembayaran, pengguna, dan audit log — beserta aturan bisnis yang menjaga angkanya benar. Ticket ini belum menampilkan layar apa pun; hasilnya diverifikasi lewat test dan menjadi fondasi semua modul.

**Blocked by:** 01 (Fondasi proyek, token desain, dan harness test)

**Status:** ready-for-agent

- [x] Store domain murni (tanpa React) mengekspos `dispatch(action)` dan selector; seluruh mutasi melewati store.
- [x] Aturan lama inap dihitung per hari kalender inklusif: masuk dan pulang di hari yang sama = 1 hari; selisih 2 hari = 3 hari; admisi aktif memakai hari ini sebagai tanggal pulang.
- [x] Biaya kamar dihitung per segmen masa inap; pindah kamar menghasilkan segmen terpisah dengan tarif masing-masing kamar.
- [x] Nomor Rekam Medis dibuat otomatis dengan format `RM-<tahun>-<urut>`, urut per tahun, dan urutannya berlanjut benar setelah tahun berganti.
- [x] Alokasi bed menolak bed yang sudah ditempati admisi aktif; alokasi berhasil mengubah status bed menjadi `terisi`.
- [x] Pindah bed membebaskan bed lama menjadi `dibersihkan` dan menempati bed baru; riwayat perpindahan tercatat.
- [x] Checkout mengubah status bed menjadi `dibersihkan`; aksi tandai siap mengubahnya menjadi `kosong`.
- [x] Rekam medis bersifat append-only; tidak ada aksi hapus; koreksi menautkan catatan asli dan menandainya terkoreksi.
- [x] Penyerahan obat mengurangi stok; penyerahan melebihi stok ditolak tanpa mengubah stok maupun status resep.
- [x] Resep hanya bergerak maju: `menunggu` → `disiapkan` → `diserahkan`.
- [x] Status tagihan diturunkan dari total pembayaran (0 = `belum bayar`, sebagian = `sebagian`, ≥ total = `lunas`); pembayaran tidak dapat ditambahkan ke tagihan yang sudah lunas.
- [x] Rincian tagihan terkumpul otomatis dari biaya kamar per segmen, tindakan yang ditambahkan, dan obat yang diserahkan.
- [x] Override checkout hanya berhasil untuk peran Admin dan wajib disertai alasan.
- [x] Setiap mutasi pada daftar aksi penting menghasilkan entri audit log berisi waktu, pengguna, aksi, entitas, dan ringkasan perubahan.
- [x] Adapter penyimpanan `localStorage` dan memori tersedia; snapshot dapat disimpan dan dimuat kembali; kegagalan akses penyimpanan jatuh ke memori tanpa membuat aplikasi gagal.
- [x] Data demo deterministik terisi: sekitar 40 pasien dengan nama Indonesia realistis, 6 kamar (total 12–16 bed) dengan okupansi awal 60–70%, 15 obat dengan minimal dua di bawah stok minimum, 10 tindakan, resep pada ketiga status, tagihan pada ketiga status, dan minimal satu admisi dengan riwayat pindah kamar.
- [x] Tanggal data demo dibangkitkan relatif terhadap hari ini sehingga tren 30 hari selalu berisi data.
- [x] Reset data demo mengembalikan seluruh state ke kondisi seed.
- [x] Seluruh aturan di atas tercakup test Vitest yang hijau.

## Comments

Implementasi selesai di commit `0a2afac`. Seluruh aturan pada ticket ditutup 113 test Vitest
(`npx vitest run`), dengan `tsc --noEmit`, `eslint .`, dan `git diff --check` bersih.

Dua bug ditemukan saat review dan diperbaiki sebelum commit:
- Biaya kamar kehilangan satu hari ketika admisi ditutup pada hari yang sama dengan checkout,
  karena segmen terakhir memakai jam checkout alih-alih tanggal pulang.
- Penyerahan obat dengan dua baris berisi obat yang sama lolos pemeriksaan stok sehingga stok
  menjadi negatif; baris kini dijumlahkan per obat sebelum diperiksa.
