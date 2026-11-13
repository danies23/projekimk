# 04: Pendaftaran langkah 1 — cari dan buat pasien

**What to build:** Petugas pendaftaran dapat menemukan pasien yang sudah ada atau membuat pasien baru, dan langsung menerima Nomor Rekam Medis yang unik — langkah pertama wizard pendaftaran.

**Blocked by:** 03 (Login demo, RBAC, dan shell per peran)

**Status:** ready-for-agent

- [ ] Pencarian pasien menerima nama, NIK, atau Nomor Rekam Medis dan menampilkan hasil yang memuat identitas pembeda yang cukup (nama, Nomor Rekam Medis, tanggal lahir, NIK).
- [ ] Hasil pencarian kosong menampilkan penjelasan yang mengarahkan petugas untuk membuat pasien baru.
- [ ] Form pasien baru memuat identitas, kontak, dan penanggung jawab, dengan label eksplisit dan pesan kesalahan di dekat kolom yang salah.
- [ ] Menyimpan pasien baru menghasilkan Nomor Rekam Medis berformat `RM-<tahun>-<urut>` yang langsung ditampilkan.
- [ ] Data pasien yang baru dibuat tersimpan dan tetap ada setelah halaman dimuat ulang.
- [ ] Petugas diberi peringatan ketika NIK yang dimasukkan sudah terdaftar, sehingga duplikasi dapat dicegah sejak awal.
- [ ] Memilih pasien dari hasil pencarian membawa petugas ke langkah berikutnya dengan konteks pasien tetap terbawa.
- [ ] Seluruh isian tetap ada bila petugas kembali ke langkah ini dari langkah berikutnya.
