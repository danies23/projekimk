# 02: Store domain, persistensi, dan data demo

**What to build:** Sumber kebenaran tunggal untuk seluruh data prototipe — pasien, kamar, bed, admisi, rekam medis, tindakan, obat, resep, tagihan, pembayaran, pengguna, dan audit log — beserta aturan bisnis yang menjaga angkanya benar. Ticket ini belum menampilkan layar apa pun; hasilnya diverifikasi lewat test dan menjadi fondasi semua modul.

**Blocked by:** 01 (Fondasi proyek, token desain, dan harness test)

**Status:** ready-for-agent

- [ ] Store domain murni (tanpa React) mengekspos `dispatch(action)` dan selector; seluruh mutasi melewati store.
- [ ] Aturan lama inap dihitung per hari kalender inklusif: masuk dan pulang di hari yang sama = 1 hari; selisih 2 hari = 3 hari; admisi aktif memakai hari ini sebagai tanggal pulang.
- [ ] Biaya kamar dihitung per segmen masa inap; pindah kamar menghasilkan segmen terpisah dengan tarif masing-masing kamar.
- [ ] Nomor Rekam Medis dibuat otomatis dengan format `RM-<tahun>-<urut>`, urut per tahun, dan urutannya berlanjut benar setelah tahun berganti.
- [ ] Alokasi bed menolak bed yang sudah ditempati admisi aktif; alokasi berhasil mengubah status bed menjadi `terisi`.
- [ ] Pindah bed membebaskan bed lama menjadi `dibersihkan` dan menempati bed baru; riwayat perpindahan tercatat.
- [ ] Checkout mengubah status bed menjadi `dibersihkan`; aksi tandai siap mengubahnya menjadi `kosong`.
- [ ] Rekam medis bersifat append-only; tidak ada aksi hapus; koreksi menautkan catatan asli dan menandainya terkoreksi.
- [ ] Penyerahan obat mengurangi stok; penyerahan melebihi stok ditolak tanpa mengubah stok maupun status resep.
- [ ] Resep hanya bergerak maju: `menunggu` → `disiapkan` → `diserahkan`.
- [ ] Status tagihan diturunkan dari total pembayaran (0 = `belum bayar`, sebagian = `sebagian`, ≥ total = `lunas`); pembayaran tidak dapat ditambahkan ke tagihan yang sudah lunas.
- [ ] Rincian tagihan terkumpul otomatis dari biaya kamar per segmen, tindakan yang ditambahkan, dan obat yang diserahkan.
- [ ] Override checkout hanya berhasil untuk peran Admin dan wajib disertai alasan.
- [ ] Setiap mutasi pada daftar aksi penting menghasilkan entri audit log berisi waktu, pengguna, aksi, entitas, dan ringkasan perubahan.
- [ ] Adapter penyimpanan `localStorage` dan memori tersedia; snapshot dapat disimpan dan dimuat kembali; kegagalan akses penyimpanan jatuh ke memori tanpa membuat aplikasi gagal.
- [ ] Data demo deterministik terisi: sekitar 40 pasien dengan nama Indonesia realistis, 6 kamar (total 12–16 bed) dengan okupansi awal 60–70%, 15 obat dengan minimal dua di bawah stok minimum, 10 tindakan, resep pada ketiga status, tagihan pada ketiga status, dan minimal satu admisi dengan riwayat pindah kamar.
- [ ] Tanggal data demo dibangkitkan relatif terhadap hari ini sehingga tren 30 hari selalu berisi data.
- [ ] Reset data demo mengembalikan seluruh state ke kondisi seed.
- [ ] Seluruh aturan di atas tercakup test Vitest yang hijau.
