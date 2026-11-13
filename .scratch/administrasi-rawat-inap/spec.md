# Spec: Prototipe Administrasi Rawat Inap Dani Medical Center

Status: ready-for-agent
Type: feature
Tanggal: 13 November 2026
Sumber: PRD v1.0 + sesi `/grill-with-docs` (13 Nov 2026)

## Problem Statement

Dani Medical Center menjalankan administrasi rawat inap secara manual: komputer hanya dipakai sebagai pengganti mesin tik dan alat hitung. Petugas pendaftaran mencatat identitas pasien di berkas, alokasi kamar ditebak dari papan tulis, tagihan dihitung ulang dengan kalkulator, dan laporan bulanan direkap tangan dari tumpukan kertas. Akibatnya pelayanan lambat, angka tagihan sering keliru, kamar ganda sulit dicegah, dan pimpinan tidak punya angka terkini saat membutuhkannya.

Namun proyek ini adalah tugas mata kuliah **Interaksi Manusia dan Komputer**. Yang dinilai bukan sistem produksi, melainkan **kualitas UI dan UX**: apakah alur kerja terasa masuk akal bagi tujuh peran pengguna, apakah informasi penting terlihat pada saat dibutuhkan, apakah kesalahan bisa dicegah dan dipulihkan, dan apakah desainnya bisa dievaluasi secara formal bersama pengguna nyata.

**Masalah yang diselesaikan, dari sudut pandang pengguna:** calon pengguna sistem ini — petugas pendaftaran, dokter, perawat, apoteker, kasir, pimpinan, dan admin — belum memiliki apa pun yang bisa dicoba, dinilai, atau dievaluasi. Tidak ada cara untuk mengetahui apakah rancangan alur administrasi rawat inap benar-benar membantu pekerjaan mereka sebelum sistem sungguhan dibangun.

## Solution

Sebuah **prototipe interaktif berbasis kode** untuk administrasi rawat inap Dani Medical Center yang dapat dibuka di peramban, dijalankan di perangkat dosen, dan diuji oleh responden usability testing.

Prototipe ini:

- Menjalankan **satu alur utuh lintas tujuh peran** — pasien masuk, alokasi bed, visite dan tindakan, resep, penyerahan obat, tagihan otomatis, pembayaran, checkout, dan laporan.
- Memakai **data demo realistis** (≈40 pasien, 6 kamar, 15 obat, 10 tindakan) yang bertahan di `localStorage` selama sesi demo, dengan tombol **Reset data demo** untuk kembali ke kondisi awal.
- Menyediakan **login demo tujuh akun** dengan pengalih peran cepat di header, sehingga moderator usability testing dapat berpindah peran tanpa keluar-masuk berulang.
- Menerapkan **aturan bisnis yang benar** pada semua angka yang tampil — lama inap, total tagihan, ketersediaan bed, dan stok obat — sehingga hasilnya bukan sekadar gambar yang menyerupai aplikasi.
- Mengikuti **WCAG 2.1 AA** agar dapat dipakai evaluasi aksesibilitas.
- Disertai **kit evaluasi usability** (skenario tugas, script moderator, lembar persetujuan, template laporan temuan) dan **laporan tertulis** berisi rasional desain, tangkapan layar, dan 3–5 temuan utama.

Hasil akhirnya adalah tiga hal yang bisa dikumpulkan: sebuah **URL yang bisa dibuka dosen**, sebuah **zip proyek**, dan sebuah **laporan**.

## User Stories

### Autentikasi dan Peran

1. Sebagai petugas pendaftaran, saya ingin masuk dengan akun demo saya, sehingga saya dapat mulai mendaftarkan pasien tanpa konfigurasi apa pun.
2. Sebagai pengguna mana pun, saya ingin melihat daftar akun demo di halaman login, sehingga saya dapat mencoba peran lain tanpa menghafal kredensial.
3. Sebagai pengguna mana pun, saya ingin berpindah peran lewat pengalih cepat di header, sehingga saya dapat mendemonstrasikan alur lintas peran saat usability testing tanpa keluar-masuk berulang.
4. Sebagai pengguna, saya ingin melihat peran aktif saya, sehingga saya selalu tahu hak akses apa yang sedang berlaku.
5. Sebagai pengguna, saya ingin menu yang tidak menjadi hak saya tidak muncul, sehingga saya tidak tergoda mengklik sesuatu yang akan ditolak.
6. Sebagai admin, saya ingin melihat daftar pengguna dan mengubah status aktifnya, sehingga saya dapat mendemonstrasikan pengelolaan akun.
7. Sebagai pengguna, saya ingin dikembalikan ke halaman login bila sesi demo dikosongkan, sehingga prototipe tidak memperlihatkan layar internal tanpa identitas.

### Dashboard dan Navigasi

8. Sebagai pimpinan, saya ingin melihat jumlah pasien yang sedang dirawat, BOR, pendapatan hari ini, dan pendapatan bulan ini dalam satu layar, sehingga saya tahu kondisi rumah sakit tanpa membaca laporan.
9. Sebagai pimpinan, saya ingin melihat grafik tren pendapatan 30 hari terakhir, sehingga saya dapat menilai arah keuangan.
10. Sebagai pimpinan, saya ingin melihat grafik okupansi per kelas kamar, sehingga saya tahu kelas mana yang paling padat.
11. Sebagai pengguna mana pun, saya ingin dashboard saya disesuaikan dengan peran, sehingga saya tidak melihat ringkasan yang tidak relevan dengan pekerjaan saya.
12. Sebagai pengguna, saya ingin melihat menu sesuai peran di sidebar yang selalu terlihat, sehingga saya dapat berpindah modul dari mana saja.
13. Sebagai pengguna, saya ingin melihat breadcrumb di area konten, sehingga saya tahu posisi saya dalam struktur aplikasi.
14. Sebagai petugas pendaftaran, saya ingin melihat pintasan "Daftarkan Pasien" di dashboard saya, sehingga alur tersibuk bisa dimulai dalam satu klik.

### Pendaftaran Pasien

15. Sebagai petugas pendaftaran, saya ingin mencari pasien lama berdasarkan nama, NIK, atau Nomor Rekam Medis, sehingga saya tidak membuat pasien ganda.
16. Sebagai petugas pendaftaran, saya ingin melihat hasil pencarian dengan nama, Nomor Rekam Medis, tanggal lahir, dan NIK, sehingga saya dapat memastikan pasien yang benar sebelum memilihnya.
17. Sebagai petugas pendaftaran, saya ingin diberi tahu dengan jelas ketika pencarian tidak menemukan siapa pun, sehingga saya yakin perlu membuat pasien baru.
18. Sebagai petugas pendaftaran, saya ingin membuat pasien baru dengan identitas, kontak, dan penanggung jawab, sehingga pasien tersebut punya rekam jejak di rumah sakit.
19. Sebagai petugas pendaftaran, saya ingin Nomor Rekam Medis dibuat otomatis dengan format `RM-<tahun>-<urut>`, sehingga saya tidak perlu menentukan nomor sendiri dan tidak ada nomor ganda.
20. Sebagai petugas pendaftaran, saya ingin melihat Nomor Rekam Medis yang baru dibuat segera setelah pasien disimpan, sehingga saya dapat memberikannya kepada pasien.
21. Sebagai petugas pendaftaran, saya ingin memilih dokter penanggung jawab dari daftar dokter aktif, sehingga admisi tercatat pada dokter yang benar.
22. Sebagai petugas pendaftaran, saya ingin mengisi tanggal masuk dan diagnosa awal, sehingga admisi memiliki konteks klinis sejak awal.
23. Sebagai petugas pendaftaran, saya ingin melihat bed yang tersedia dikelompokkan per kamar dan kelas beserta tarif hariannya, sehingga saya dapat menawarkan pilihan kepada pasien.
24. Sebagai petugas pendaftaran, saya ingin melihat langkah wizard yang sedang aktif dan berapa langkah tersisa, sehingga saya tahu seberapa jauh prosesnya dan bisa menyelesaikannya dalam ≤3 menit.
25. Sebagai petugas pendaftaran, saya ingin kembali ke langkah sebelumnya tanpa kehilangan isian, sehingga saya dapat mengoreksi pilihan pasien atau kamar.
26. Sebagai petugas pendaftaran, saya ingin melihat ringkasan konfirmasi berisi pasien, dokter, kamar, bed, tarif, dan tanggal masuk sebelum menyimpan, sehingga saya dapat menangkap kesalahan sebelum admisi dibuat.
27. Sebagai petugas pendaftaran, saya ingin mendapat pesan yang jelas bila bed yang saya pilih ternyata sudah terisi, sehingga saya dapat memilih bed lain tanpa mengulang seluruh proses.
28. Sebagai petugas pendaftaran, saya ingin melihat dan mencetak bukti pendaftaran berisi identitas pasien, Nomor Rekam Medis, dokter, kamar, bed, dan tanggal masuk, sehingga pasien membawa bukti yang sah.
29. Sebagai petugas pendaftaran, saya ingin bukti pendaftaran tampil sebagai pratinjau halaman cetak, sehingga saya tahu persis bagaimana hasil cetaknya.
30. Sebagai petugas pendaftaran, saya ingin melihat daftar admisi aktif beserta bed dan dokternya, sehingga saya dapat menjawab pertanyaan "pasien ini dirawat di mana".

### Kamar dan Bed

31. Sebagai petugas pendaftaran, saya ingin melihat denah bed per kamar dengan warna status yang berbeda, sehingga saya dapat menilai ketersediaan secara sekilas.
32. Sebagai petugas pendaftaran, saya ingin membedakan bed `terisi`, `kosong`, dan `dibersihkan` lewat label teks selain warna, sehingga informasi tetap terbaca oleh pengguna dengan buta warna.
33. Sebagai perawat, saya ingin menandai bed yang sudah dibersihkan menjadi `kosong`, sehingga bed tersebut dapat dialokasikan ke pasien berikutnya.
34. Sebagai perawat, saya ingin memindahkan pasien ke bed lain dalam kamar atau kelas berbeda, sehingga kebutuhan klinis pasien dapat dipenuhi.
35. Sebagai perawat, saya ingin melihat riwayat perpindahan bed seorang pasien, sehingga saya dapat menelusuri di mana pasien pernah dirawat.
36. Sebagai petugas pendaftaran, saya ingin melihat ringkasan jumlah bed per status dan BOR terkini, sehingga saya dapat melaporkan ketersediaan kepada pimpinan.
37. Sebagai admin, saya ingin menambah, mengubah, dan menonaktifkan kamar beserta kelas, tarif, dan kapasitasnya, sehingga data kamar mengikuti kondisi nyata.
38. Sebagai petugas pendaftaran, saya ingin bed yang sedang dipakai dua admisi aktif tidak pernah muncul sebagai pilihan, sehingga bentrok alokasi tidak mungkin terjadi lewat antarmuka.
39. Sebagai admin, saya ingin melakukan checkout atas nama pasien yang pulang, sehingga admisi tertutup dan bed-nya masuk status `dibersihkan`.

### Klinis — Dokter dan Perawat

40. Sebagai dokter, saya ingin melihat daftar pasien yang menjadi tanggung jawab saya, sehingga saya tahu siapa yang harus divisite.
41. Sebagai dokter, saya ingin membuka satu admisi dan melihat identitas pasien, bed, tanggal masuk, dan diagnosa awal, sehingga saya punya konteks sebelum menulis catatan.
42. Sebagai dokter, saya ingin menulis catatan visite berisi isi visite, diagnosa, dan rencana, sehingga perkembangan pasien terdokumentasi.
43. Sebagai dokter, saya ingin menambahkan tindakan dari master tindakan berisi tarif, sehingga biaya tindakan otomatis masuk ke tagihan.
44. Sebagai dokter, saya ingin melihat total biaya tindakan yang saya tambahkan pada admisi ini, sehingga saya tahu dampaknya terhadap tagihan pasien.
45. Sebagai dokter, saya ingin membuat resep berisi beberapa obat dengan jumlah dan aturan pakai, sehingga farmasi dapat menyiapkannya.
46. Sebagai dokter, saya ingin melihat status resep yang saya buat (menunggu, disiapkan, diserahkan), sehingga saya tahu apakah obat sudah diterima pasien.
47. Sebagai dokter, saya ingin melihat seluruh riwayat klinis pasien dalam urutan waktu, sehingga saya dapat menelusuri perjalanan penyakitnya.
48. Sebagai perawat, saya ingin mencatat tanda vital (tekanan darah, suhu, nadi, pernapasan, saturasi) untuk pasien yang saya rawat, sehingga pemantauan harian terdokumentasi.
49. Sebagai perawat, saya ingin melihat instruksi dokter pada admisi yang saya tangani, sehingga saya dapat menjalankannya.
50. Sebagai perawat, saya ingin menandai instruksi dokter sebagai sudah dijalankan, sehingga tim tahu instruksi mana yang belum dikerjakan.
51. Sebagai perawat, saya ingin menulis catatan perkembangan harian, sehingga kondisi pasien dari sudut pandang keperawatan tercatat.
52. Sebagai dokter dan perawat, saya ingin catatan klinis tidak bisa dihapus, sehingga rekam medis tetap utuh sebagai bukti.
53. Sebagai dokter, saya ingin mengoreksi catatan yang salah dengan menambahkan catatan koreksi yang menunjuk catatan aslinya, sehingga kesalahan dapat diperbaiki tanpa menghapus sejarah.
54. Sebagai dokter dan perawat, saya ingin melihat penanda bahwa suatu catatan telah dikoreksi, sehingga saya tidak salah membaca informasi lama.
55. Sebagai dokter dan perawat, saya ingin melihat hasil tanda vital terakhir dalam bentuk yang mudah dipindai, sehingga saya dapat menilai tren tanpa membuka setiap catatan.

### Farmasi

56. Sebagai apoteker, saya ingin melihat antrean resep masuk yang dikelompokkan per status, sehingga saya tahu mana yang harus dikerjakan lebih dulu.
57. Sebagai apoteker, saya ingin melihat rincian resep berisi pasien, dokter, daftar obat, jumlah, dan aturan pakai, sehingga saya dapat menyiapkannya dengan benar.
58. Sebagai apoteker, saya ingin mengubah status resep dari menunggu menjadi disiapkan, sehingga dokter dan perawat tahu obat sedang disiapkan.
59. Sebagai apoteker, saya ingin menyerahkan obat dan melihat stok berkurang saat itu juga, sehingga catatan stok sesuai kenyataan.
60. Sebagai apoteker, saya ingin ditolak dengan pesan jelas bila stok obat tidak mencukupi, sehingga saya tidak bisa menyerahkan obat yang tidak ada.
61. Sebagai apoteker, saya ingin melihat daftar obat dengan stok, satuan, harga, dan stok minimum, sehingga saya dapat memantau ketersediaan.
62. Sebagai apoteker, saya ingin melihat peringatan pada obat yang stoknya di bawah minimum, sehingga saya dapat mengajukan pengadaan lebih awal.
63. Sebagai apoteker, saya ingin menambah stok obat (barang masuk), sehingga penerimaan barang tercatat.
64. Sebagai apoteker, saya ingin menambah obat baru ke master, sehingga item farmasi baru dapat diresepkan.
65. Sebagai apoteker, saya ingin melihat riwayat pergerakan stok suatu obat, sehingga saya dapat menelusuri ke mana stoknya pergi.

### Tagihan dan Pembayaran

66. Sebagai kasir, saya ingin melihat daftar admisi beserta status tagihannya, sehingga saya tahu siapa yang perlu membayar.
67. Sebagai kasir, saya ingin membuka rincian tagihan seorang pasien yang memuat biaya kamar, tindakan, dan obat secara terpisah, sehingga saya dapat menjelaskan setiap baris kepada pasien.
68. Sebagai kasir, saya ingin melihat lama inap dan tarif kamar yang dipakai dalam perhitungan, sehingga angka kamar dapat dipertanggungjawabkan.
69. Sebagai kasir, saya ingin melihat subtotal per jenis biaya dan total keseluruhan, sehingga saya dapat memeriksa kewajaran tagihan.
70. Sebagai kasir, saya ingin mencatat pembayaran dengan metode tunai, transfer, atau debit, sehingga setiap uang masuk terdokumentasi metodenya.
71. Sebagai kasir, saya ingin mencatat pembayaran sebagian, sehingga pasien yang membayar bertahap tetap terlayani.
72. Sebagai kasir, saya ingin melihat sisa tagihan setelah setiap pembayaran, sehingga saya tahu berapa yang masih harus dibayar.
73. Sebagai kasir, saya ingin melihat status tagihan berubah otomatis menjadi `sebagian` atau `lunas`, sehingga saya tidak perlu menandainya manual.
74. Sebagai kasir, saya ingin melihat riwayat pembayaran suatu tagihan beserta waktu dan nama kasir, sehingga tidak ada pembayaran yang hilang.
75. Sebagai kasir, saya ingin mencetak kuitansi pembayaran sebagai pratinjau cetak, sehingga pasien membawa bukti bayar.
76. Sebagai kasir, saya ingin mencetak rincian tagihan sebagai pratinjau cetak, sehingga pasien dapat memeriksanya di rumah.
77. Sebagai kasir, saya ingin diperingatkan tetapi tetap bisa melanjutkan bila jumlah pembayaran melebihi sisa tagihan, sehingga kelebihan bayar tidak terjadi tanpa disadari.
78. Sebagai kasir, saya ingin ditolak dengan pesan jelas bila tagihan sudah lunas dan saya mencoba menambah pembayaran, sehingga tidak ada pembayaran ganda.
79. Sebagai kasir, saya ingin melihat ringkasan pendapatan shift saya, sehingga saya dapat mencocokkan uang fisik dengan catatan.

### Checkout

80. Sebagai kasir, saya ingin melakukan checkout hanya ketika tagihan lunas, sehingga rumah sakit tidak kehilangan pendapatan.
81. Sebagai kasir, saya ingin melihat alasan yang jelas ketika checkout diblokir karena tagihan belum lunas, sehingga saya tahu langkah berikutnya.
82. Sebagai admin, saya ingin melakukan override checkout dengan menuliskan alasan, sehingga pasien dalam kondisi mendesak tetap bisa pulang.
83. Sebagai admin, saya ingin melihat konfirmasi bahwa override tercatat di audit log, sehingga saya yakin tindakan itu dapat ditelusuri.
84. Sebagai petugas mana pun yang berhak, saya ingin melihat status admisi berubah menjadi selesai setelah checkout, sehingga admisi tersebut tidak lagi muncul di daftar aktif.
85. Sebagai perawat, saya ingin melihat bed bekas pasien checkout berubah menjadi `dibersihkan`, sehingga semua orang tahu bed belum siap dipakai ulang.

### Laporan

86. Sebagai pimpinan, saya ingin melihat laporan pasien masuk, keluar, dan sedang dirawat untuk periode yang saya pilih, sehingga saya dapat memantau arus pasien.
87. Sebagai pimpinan, saya ingin memfilter laporan dengan rentang tanggal, sehingga saya dapat melihat periode tertentu.
88. Sebagai pimpinan, saya ingin melihat laporan keuangan per periode berisi total tagihan, total terbayar, dan sisa piutang, sehingga saya tahu posisi keuangan.
89. Sebagai pimpinan, saya ingin melihat laporan okupansi kamar per kelas, sehingga saya dapat menilai pemanfaatan kapasitas.
90. Sebagai apoteker dan pimpinan, saya ingin melihat laporan pemakaian obat dan posisi stok akhir, sehingga saya dapat merencanakan pengadaan.
91. Sebagai pimpinan, saya ingin melihat tanggal transaksi terakhir pada laporan, sehingga saya tahu kesegaran datanya.
92. Sebagai pimpinan, saya ingin melihat kondisi kosong yang jelas ketika periode tidak memiliki data, sehingga saya tidak mengira aplikasinya rusak.
93. Sebagai kasir, saya ingin melihat laporan keuangan, sehingga saya dapat menutup kas harian.

### Master Data dan Administrasi

94. Sebagai admin, saya ingin mengelola daftar pengguna beserta perannya, sehingga akses sesuai struktur organisasi.
95. Sebagai admin, saya ingin mengelola master tindakan beserta tarifnya, sehingga dokter dapat memilih tindakan yang benar.
96. Sebagai admin, saya ingin mengelola master obat bersama apoteker, sehingga satu sumber data dipakai bersama.
97. Sebagai admin, saya ingin melihat audit log berisi waktu, pengguna, aksi, dan entitas yang berubah, sehingga setiap perubahan penting dapat ditelusuri.
98. Sebagai admin, saya ingin memfilter audit log berdasarkan pengguna dan jenis aksi, sehingga saya dapat menyelidiki kejadian tertentu.

### Kualitas Antarmuka dan Aksesibilitas

99. Sebagai pengguna, saya ingin setiap status dibedakan dengan teks atau ikon selain warna, sehingga saya tidak bergantung pada persepsi warna.
100. Sebagai pengguna keyboard, saya ingin dapat menyelesaikan alur pendaftaran tanpa mouse, sehingga saya tidak terhalang oleh komponen yang hanya bisa diklik.
101. Sebagai pengguna pembaca layar, saya ingin setiap kolom formulir memiliki label yang terhubung, sehingga saya tahu apa yang harus diisi.
102. Sebagai pengguna, saya ingin fokus berpindah secara logis saat dialog terbuka dan kembali ke pemicunya saat ditutup, sehingga saya tidak kehilangan tempat.
103. Sebagai pengguna, saya ingin setiap aksi yang berjalan lama menampilkan indikator, sehingga saya tidak mengklik dua kali.
104. Sebagai pengguna, saya ingin pesan kesalahan muncul di dekat kolom yang salah dan menjelaskan cara memperbaikinya, sehingga saya tidak menebak.
105. Sebagai pengguna, saya ingin konfirmasi sebelum tindakan yang sulit dibatalkan, sehingga salah klik tidak berakibat fatal.
106. Sebagai pengguna, saya ingin melihat kondisi kosong yang menjelaskan apa yang harus dilakukan, sehingga layar kosong terasa mengundang, bukan rusak.
107. Sebagai pengguna tablet, saya ingin tata letak tetap terbaca pada orientasi lanskap, sehingga perawat dapat membawa perangkat keliling.
108. Sebagai pengguna, saya ingin semua teks antarmuka dalam bahasa Indonesia, sehingga tidak ada istilah asing yang membingungkan staf.
109. Sebagai pengguna, saya ingin melihat nama Dani Medical Center dan logomark yang konsisten di header dan halaman login, sehingga aplikasi terasa sebagai produk rumah sakit ini.

### Data Demo dan Reset

110. Sebagai pengguna demo, saya ingin data awal sudah terisi ketika pertama membuka aplikasi, sehingga tidak ada layar kosong yang membingungkan.
111. Sebagai pengguna demo, saya ingin perubahan saya bertahan saat halaman dimuat ulang, sehingga alur demo tidak terputus.
112. Sebagai pengguna demo, saya ingin tombol Reset data demo yang meminta konfirmasi, sehingga saya dapat mengulang skenario dari kondisi bersih.
113. Sebagai pengguna demo, saya ingin data demo mencakup pasien yang sedang dirawat dan yang sudah pulang, sehingga laporan dan okupansi terlihat realistis.
114. Sebagai pengguna demo, saya ingin resep pada berbagai status sudah tersedia, sehingga alur farmasi bisa didemokan tanpa menunggu.
115. Sebagai pengguna demo, saya ingin tagihan dengan status `belum bayar`, `sebagian`, dan `lunas` sudah ada, sehingga alur kasir bisa dicoba dari ketiga kondisi.
116. Sebagai pengguna demo, saya ingin kebocoran data demo tidak pernah terjadi pada penyimpanan peramban yang tidak tersedia, sehingga aplikasi tetap berjalan meskipun `localStorage` diblokir.

## Implementation Decisions

### Bentuk sistem

- Prototipe ini adalah **aplikasi Next.js App Router berbahasa TypeScript** yang dirender sepenuhnya di sisi klien setelah muatan awal. Tidak ada database, tidak ada API, tidak ada autentikasi sungguhan (ADR-0001).
- Semua status aplikasi disimpan di **`localStorage`** dengan adapter yang dapat diganti penyimpanan dalam memori saat pengujian. Kegagalan akses penyimpanan (mode privat, kuota penuh) ditangani dengan fallback ke memori dan tidak boleh menyebabkan aplikasi gagal render.
- **Tidak ada panggilan jaringan saat runtime** selain aset statis.

### Arsitektur state

- Satu **domain store** murni (tanpa React) menjadi sumber kebenaran seluruh data: pasien, kamar, bed, admisi, rekam medis, tindakan, obat, resep, tagihan, pembayaran, pengguna, dan audit log.
- Store diekspos sebagai `dispatch(action)` + selector murni. Semua aturan bisnis hidup di dalam store atau fungsi domain murni yang dipanggilnya — **bukan di komponen**.
- Semua mutasi melewati store sehingga aturan yang sama berlaku dari layar mana pun; tidak ada komponen yang menulis langsung ke penyimpanan.
- Store memancarkan **audit log** untuk setiap mutasi penting (lihat daftar di bagian Testing Decisions) tanpa campur tangan komponen.

### Aturan domain yang dikunci

- **Lama inap** = jumlah hari kalender inklusif antara tanggal masuk dan tanggal pulang; tanggal masuk dan pulang sama-sama dihitung (ADR-0002). Untuk admisi aktif, tanggal pulang diganti tanggal hari ini.
- **Biaya kamar** = lama inap × tarif kamar harian. Jika pasien pindah kamar, biaya kamar dihitung **per segmen** masa inap di masing-masing kamar, bukan tarif terakhir dikali seluruh hari.
- **Nomor Rekam Medis** = `RM-<tahun masuk>-<urut>`, urut per tahun, dibuat otomatis saat pasien baru disimpan.
- **Satu bed hanya boleh menempati satu admisi aktif.** Antarmuka hanya menampilkan bed `kosong` sebagai pilihan, dan store menolak alokasi ke bed yang sudah terisi. Penolakan menghasilkan pesan "Bed … baru saja terisi, pilih bed lain."
- **Status bed** adalah `terisi`, `kosong`, atau `dibersihkan`. Checkout mengubah bed menjadi `dibersihkan`; perawat menandainya `kosong` melalui aksi eksplisit.
- **Rekam medis bersifat append-only.** Tidak ada aksi hapus. Koreksi dibuat sebagai catatan baru bertipe koreksi yang menunjuk catatan aslinya; catatan asli ditandai telah dikoreksi.
- **Stok obat tidak boleh negatif.** Penyerahan obat mengurangi stok pada saat penyerahan; bila stok kurang, penyerahan ditolak dan resep tetap pada statusnya.
- **Status tagihan** diturunkan dari perbandingan total pembayaran dengan total tagihan: `belum bayar` (0), `sebagian` (0 < dibayar < total), `lunas` (dibayar ≥ total). Status tidak pernah diisi manual.
- **Checkout diblokir** bila tagihan belum `lunas`. Admin dapat melakukan override dengan alasan wajib; override tercatat di audit log dan ditampilkan pada riwayat admisi.
- **Tagihan dibuat otomatis** saat admisi dibuat, lalu rincian bertambah seiring tindakan ditambahkan dan obat diserahkan. Kasir tidak membuat tagihan secara manual.
- **Resep** bergerak satu arah: `menunggu` → `disiapkan` → `diserahkan`. Status tidak bisa mundur.

### Batas modul

- **Store domain** — aturan bisnis dan status. Satu-satunya tempat mutasi.
- **Adapter penyimpanan** — persist dan muat snapshot store; implementasi `localStorage` dan memori.
- **Seed data demo** — generator data awal yang deterministik (tanggal relatif terhadap hari ini), tidak diacak saat runtime.
- **Lapisan akses peran** — satu deklarasi pusat yang memetakan peran ke izin resource/tindakan; sidebar, penjagaan tombol, dan rute membacanya dari sumber yang sama.
- **Komponen UI** — primitif Radix dengan lapisan visual custom (ADR-0003); tidak ada tema pihak ketiga.
- **Halaman per modul** — komposisi komponen dan pembacaan store; tidak mengandung aturan bisnis.

### Desain interaksi

- **Wizard pendaftaran tiga langkah**: (1) cari atau buat pasien, (2) pilih dokter, tanggal masuk, diagnosa awal, dan bed, (3) konfirmasi dan simpan. Kembali antar langkah mempertahankan isian; langkah 2 tidak memuat bed yang kini sudah terisi ulang saat masuk kembali ke langkah tersebut.
- **Grid denah bed** sebagai pemilih utama, dilengkapi tabel ringkasan jumlah bed per status dan BOR. Setiap bed menampilkan label status berupa teks, bukan hanya warna.
- **Pengalih peran cepat di header** hanya untuk lingkungan demo, ditandai jelas agar tidak disalahartikan sebagai fitur produksi.
- **Dokumen** (bukti pendaftaran, kuitansi, rincian tagihan) dirender sebagai halaman pratinjau cetak dengan gaya cetak, dan tombol "Cetak" memanggil dialog cetak peramban. Tidak ada berkas PDF terpisah.
- **Arah visual**: bersih dan tenang, palet biru/teal lembut, tipografi humanis, ruang kosong lega, sudut membulat halus. Logomark sederhana + wordmark Dani Medical Center dipakai di header, login, dan favicon.
- **Target aksesibilitas**: WCAG 2.1 AA — kontras teks ≥4.5:1, target sentuh ≥44×44 px, navigasi keyboard penuh termasuk dialog, label formulir eksplisit dan terhubung, status tidak dibedakan warna saja, serta pengumuman perubahan penting lewat wilayah live bila relevan.
- **Desktop-first** dengan breakpoint tablet lanskap; tata letak harus tetap terbaca tanpa scroll horizontal pada lebar tablet.
- **Bahasa antarmuka seluruhnya Indonesia**; istilah mengikuti `GLOSSARY.md`.

### Data demo

- Sekitar **40 pasien** dengan nama Indonesia realistis, variasi usia dan gender, NIK dan nomor telepon berpola valid, sebagian memiliki lebih dari satu riwayat admisi.
- **6 kamar** dengan kelas VIP, I, II, dan III, kapasitas beragam, total 12–16 bed; okupansi awal sekitar 60–70%, sebagaimana terlihat dari BOR.
- **15 obat** dengan satuan, harga, stok, dan stok minimum; minimal dua obat berada di bawah stok minimum agar peringatan stok menipis terlihat.
- **10 tindakan** beserta tarif.
- Resep pada ketiga status, tagihan pada ketiga status, audit log terisi beberapa entri awal, dan minimal satu admisi memiliki riwayat pindah kamar.
- Tanggal data dibangkitkan **relatif terhadap hari ini** sehingga tren 30 hari dan laporan periode selalu berisi data.

### Struktur navigasi

- Sidebar persisten berisi modul yang boleh diakses peran aktif; aksi spesifik muncul di dalam halaman sesuai konteks (mis. "Serahkan obat" hanya pada detail resep).
- Rute per modul mengikuti proses: dashboard, pendaftaran, kamar, klinis, farmasi, kasir, laporan, dan administrasi (master data, pengguna, audit log).
- Akses langsung ke rute di luar izin peran menampilkan layar penolakan yang jelas, bukan halaman kosong.

## Testing Decisions

**Prinsip**: uji perilaku yang terlihat oleh pengguna dan kontrak yang dijaga store, bukan detail implementasi. Test tidak boleh bergantung pada kelas CSS, nama komponen internal, atau struktur markup tertentu. Sebuah test yang baik membaca input, menjalankan alur, lalu memeriksa hasil yang bisa diamati pengguna — angka pada layar, status yang ditampilkan, atau pesan kesalahan.

### Seam yang dipakai

1. **Domain store (Vitest, unit/integration)** — seam tertinggi untuk logika bisnis. Store diuji lewat `dispatch` + selector publiknya, dengan adapter penyimpanan memori. Ini menutup seluruh aturan yang bisa salah hitung.
2. **Alur emas end-to-end (Playwright)** — 3–5 skenario melalui antarmuka nyata di peramban, memakai data demo yang di-reset sebelum tiap skenario.

Tidak ada seam lain yang ditambahkan. Test snapshot markup dan test komponen visual tidak dipakai.

### Cakupan store (Vitest)

- **Lama inap**: masuk dan pulang hari sama = 1 hari; selisih 2 hari = 3 hari; admisi aktif memakai hari ini.
- **Biaya kamar**: tarif tunggal; pindah kamar menghasilkan dua segmen dengan tarif berbeda; perhitungan tidak memakai tarif terakhir untuk seluruh masa inap.
- **Tagihan**: total = kamar + tindakan + obat; status diturunkan dengan benar pada 0, sebagian, dan lebih dari total; pembayaran melebihi total ditolak setelah lunas.
- **Nomor Rekam Medis**: format benar; urutan berlanjut; reset urutan saat tahun berganti.
- **Alokasi bed**: bed terisi ditolak; bed `dibersihkan` tidak dapat dipilih sebagai bed baru; alokasi sukses mengubah status bed menjadi `terisi`; pindah bed membebaskan bed lama ke `dibersihkan`.
- **Status bed**: checkout menghasilkan `dibersihkan`; aksi "tandai siap" menghasilkan `kosong`.
- **Stok obat**: penyerahan mengurangi stok; penyerahan melebihi stok ditolak dan stok tidak berubah; resep tidak berpindah status saat ditolak.
- **Rekam medis**: tidak ada aksi yang menghapus; koreksi menautkan catatan asli dan menandainya terkoreksi.
- **Checkout**: diblokir saat tagihan belum lunas; override hanya berhasil untuk peran Admin dan wajib disertai alasan.
- **RBAC**: matriks peran menolak aksi yang tidak diizinkan; penolakan tidak mengubah status apa pun.
- **Audit log**: setiap mutasi pada daftar aksi penting menghasilkan entri berisi pengguna, aksi, entitas, dan waktu. Daftar minimal: pembuatan pasien, pembuatan admisi, alokasi dan pindah bed, checkout, override checkout, penulisan rekam medis dan koreksi, pembuatan resep, perubahan status resep, penyerahan obat, penambahan stok, pembayaran, dan perubahan master.
- **Penyimpanan**: snapshot dapat disimpan dan dimuat kembali; penyimpanan tidak tersedia tidak menyebabkan kegagalan; reset mengembalikan state ke kondisi seed.

### Cakupan E2E (Playwright)

1. **Pasien baru sampai admisi**: login sebagai petugas pendaftaran → buat pasien → Nomor Rekam Medis muncul → pilih dokter dan bed → konfirmasi → bukti pendaftaran dapat dibuka.
2. **Alur klinis sampai tagihan**: login sebagai dokter → tulis visite dan tindakan → buat resep → login sebagai apoteker → serahkan obat → tagihan memuat kamar, tindakan, dan obat dengan total benar.
3. **Pembayaran sebagian sampai lunas**: kasir mencatat pembayaran sebagian → status menjadi `sebagian` → membayar sisa → status `lunas` → kuitansi tampil.
4. **Blokir dan override checkout**: checkout ditolak saat tagihan belum lunas → Admin melakukan override dengan alasan → audit log memuat entri override.
5. **Peralihan peran dan penjagaan akses**: pengalih peran mengganti menu sesuai peran; membuka rute terlarang menampilkan layar penolakan.

### Kondisi awal test

- Setiap skenario E2E melakukan reset data demo lebih dulu lewat mekanisme aplikasi agar test tidak bergantung pada urutan.
- Data seed deterministik sehingga angka BOR dan total tagihan dapat diuji dengan nilai yang pasti.

## Out of Scope

- Database, API, dan server sungguhan; Prisma/PostgreSQL/Auth.js (ADR-0001).
- Autentikasi produksi: hash password, sesi, timeout, rate limit, proteksi CSRF.
- Integrasi BPJS, asuransi, laboratorium, radiologi, dan payment gateway.
- Rawat jalan, IGD, dan portal pasien.
- Pembuatan berkas PDF sungguhan dan ekspor Excel; digantikan pratinjau cetak.
- Notifikasi email/SMS/WhatsApp.
- Fitur P2: diskon dan penyesuaian tagihan.
- Multi-rumah-sakit, multi-cabang, dan multi-bahasa.
- Optimasi performa untuk 100 ribu data; volume demo cukup.
- Pengujian aksesibilitas otomatis dengan alat khusus; kepatuhan AA diverifikasi manual dan lewat pemeriksaan kontras.
- Hosting produksi, CI/CD, monitoring, dan backup.
- Usability testing itu sendiri (pelaksanaan); spec ini hanya mencakup kit dan template laporannya.

## Further Notes

- **Evaluasi usability** memakai 5 responden dan kit lengkap: skenario tugas per peran, script pembuka dan penutup moderator, lembar persetujuan, dan template laporan temuan. Laporan akhir bersifat ringkas: 3–5 temuan utama beserta severity dan rekomendasi, dengan lampiran per responden.
- **Riwayat iterasi desain** adalah bukti proses yang biasanya diminta; commit git dibuat bertahap sepanjang pengerjaan.
- **Deliverable akhir**: URL Vercel, zip proyek, dan laporan tertulis berisi rasional desain, tangkapan layar, dan temuan usability.
- **Yang sengaja tidak dilindungi test otomatis**: pemilihan warna, kesan visual, dan kualitas estetika — itu dinilai lewat usability testing dan review dosen, bukan assertion.
- **Risiko utama**: cakupan 22–25 layar mudah membengkak. Prioritas bila waktu menipis: (1) alur pendaftaran → kamar, (2) klinis dan farmasi, (3) kasir dan checkout, (4) laporan dan dashboard, (5) administrasi dan audit log.
- Istilah domain mengikuti `GLOSSARY.md`; keputusan yang tidak boleh dibalik tanpa alasan tercatat di `docs/adr/`.
