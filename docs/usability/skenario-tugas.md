# Skenario Tugas Usability Testing

**Dani Medical Center — Sistem Administrasi Rawat Inap**

Dokumen ini memuat skenario tugas yang dibacakan moderator kepada responden. Setiap skenario
menyebutkan peran awal, tujuan yang dibacakan, langkah awal yang dipilihkan moderator, dan
kriteria keberhasilan yang dapat diamati. Semua langkah mengacu pada aplikasi apa adanya; satu
skenario (F) memerlukan persiapan data singkat yang dilakukan moderator, dan persiapan itu
ditulis pada skenarionya.

- Lima responden diuji dengan pembagian peran pada tabel §1.
- Setiap sesi memakai **tiga skenario**: dua skenario sesuai perannya, ditambah **Skenario E**
  sebagai penanganan kesalahan yang wajib untuk semua responden.
- Jalur emas pasien masuk sampai pulang diuji sebagai **Skenario A → B → C → D**. Keempat langkah
  itu tidak dijalankan oleh satu responden; R1 menguji A+B, R2 menguji C, R3 menguji F, dan R4
  menguji D, sehingga seluruh lintasan tercakup oleh kelima sesi. Setiap responden tetap memakai
  peran yang berhak atas skenarionya — tidak ada responden yang diminta membuka modul di luar
  izinnya.

## Daftar isi

1. Pembagian peran per responden
2. Jalur emas: pasien masuk sampai pulang
3. Skenario penanganan kesalahan
4. Skenario per peran (dokter, perawat, apoteker)
5. Skenario cadangan (pimpinan, admin)
6. Kriteria keberhasilan yang dipakai berulang
7. Lembar catat moderator

---

## 1. Pembagian peran per responden

| Responden | Peran yang diuji | Akun demo | Skenario |
|---|---|---|---|
| R1 | Petugas Pendaftaran | Rina Kartika | A, B, E |
| R2 | Dokter | dr. Ayu Prameswari, Sp.PD | C, I, E |
| R3 | Perawat | Ns. Dwi Lestari | F, J, E |
| R4 | Apoteker dan Kasir | Nadia Rahmania, S.Farm · Joko Susilo | D, K, E |
| R5 | Pimpinan dan Admin | Hendra Wijaya · Sari Dewanti | G, H, E |

Setiap skenario menyebut peran yang **berhak** membukanya; moderator tidak meminta responden
membuka modul di luar izinnya. R2–R5 masing-masing menguji dua skenario peran utamanya, sedangkan
Skenario E dijalankan pada peran Kasir/Admin untuk semua responden (lihat catatan pada Skenario E).

Responden tidak perlu memahami seluruh aplikasi. Moderator yang mengganti peran lewat tombol
**Ganti peran** di header, lalu menyerahkan kontrol kembali kepada responden. Karena perpindahan
peran **tidak** berpindah halaman, moderator membuka modul yang dituju lebih dulu, baru menyerahkan
kontrol.

---

## 2. Jalur emas: pasien masuk sampai pulang

### Skenario A — Mendaftarkan pasien baru sampai mendapat Nomor Rekam Medis

**Peran awal:** Petugas Pendaftaran (Rina Kartika)
**Tujuan (dibacakan):** *"Anda menerima pasien baru bernama Sari Wulandari yang belum pernah
berobat di sini. Daftarkan ia sebagai pasien rawat inap, lalu tunjukkan Nomor Rekam Medisnya
kepada pasien."*

**Langkah awal moderator:** Masuk sebagai Rina Kartika, lalu buka menu **Pendaftaran**.

**Kriteria keberhasilan (dapat diamati):**

- [ ] Responden mulai dari kolom **Kata kunci pencarian** atau langsung ke formulir **Pasien baru**.
- [ ] Nomor Rekam Medis berformat `RM-<tahun>-<urut>` muncul setelah pasien disimpan.
- [ ] Responden membaca nomor itu kembali kepada "pasien", bukan hanya menutup layar.
- [ ] Responden sampai ke **Langkah 2 dari 3** tanpa dibantu.

**Batas waktu acuan:** tombol Nomor Rekam Medis dan sisa langkah wizard tampil, dan seluruh wizard
selesai dalam ≤3 menit (spec, user story 24).
**Batas waktu skenario** (dihitung sejak moderator selesai membacakan tujuan): 5 menit.

**Catat:** jumlah salah ketik pada NIK dan telepon; apakah responden memakai tombol **Buat pasien
baru** dari kondisi kosong hasil pencarian.

---

### Skenario B — Memilih dokter, tanggal masuk, dan bed, lalu menyimpan admisi

**Peran awal:** Petugas Pendaftaran, melanjutkan Skenario A
**Tujuan (dibacakan):** *"Pasien ini akan dirawat di kelas I. Pilih dokter penanggung jawab,
isi diagnosa awal, lalu pilih bed yang tersedia dan selesaikan pendaftaran."*

**Langkah awal moderator:** Responden berada di langkah 2 wizard, atau buka kembali wizard
pendaftaran bila Skenario A diuji terpisah.

**Kriteria keberhasilan (dapat diamati):**

- [ ] Responden menemukan daftar bed tanpa bertanya di mana letaknya.
- [ ] Hanya bed berstatus **kosong** yang dapat dipilih; status setiap bed terbaca sebagai teks.
- [ ] Responden menekan **Kembali ke langkah 1** dan yakin isian pasien tidak hilang.
- [ ] Ringkasan konfirmasi memuat pasien, dokter, kamar, bed, tarif, dan tanggal masuk.
- [ ] Setelah **Simpan admisi**, **Bukti pendaftaran** tampil dan tombol **Cetak bukti pendaftaran** terlihat.

**Batas waktu acuan:** 2 menit dari langkah 2 sampai bukti pendaftaran.
**Batas waktu skenario** (dihitung sejak moderator selesai membacakan tujuan): 5 menit.

**Catat:** apakah responden membaca tarif sebelum memilih bed; apakah ada keraguan antara
**Lanjut ke langkah 3** dan **Simpan admisi**.

---

### Skenario C — Menulis visite, menambah tindakan, dan membuat resep

**Peran awal:** Dokter (dr. Ayu Prameswari, Sp.PD)
**Tujuan (dibacakan):** *"Anda akan memvisite pasien yang baru masuk. Tulis catatan visite lengkap,
tambahkan satu tindakan, lalu buat resep berisi dua obat."*

**Langkah awal moderator:** Ganti peran ke dokter, buka menu **Klinis**, lalu tunjukkan daftar
**Pasien saya** tanpa memilih pasien.

**Kriteria keberhasilan (dapat diamati):**

- [ ] Responden membuka pasien dari daftar, dan judul detail berpindah dengan fokus yang benar.
- [ ] Tiga kolom catatan visite (**Isi visite**, **Diagnosa**, **Rencana**) terisi sebelum disimpan.
- [ ] Tindakan dipilih dari master dan tarifnya terlihat sebelum ditambahkan.
- [ ] Total tindakan yang ditambahkan tampil dan dapat dibaca responden.
- [ ] Resep dibuat dengan dua obat, masing-masing berjumlah dan beralasan pakai.
- [ ] Setelah disimpan, status resep terbaca **menunggu**.

**Catat:** apakah responden menemukan kolom **Aturan pakai** tanpa dipandu; apakah ia memahami
bahwa biaya obat **belum** masuk tagihan sebelum diserahkan.

---

### Skenario D — Menyerahkan obat, menagih, membayar, lalu checkout

**Peran awal:** Apoteker (Nadia Rahmania, S.Farm), lalu Kasir (Joko Susilo)
**Tujuan (dibacakan):** *"Resep pasien ini sudah siap. Serahkan obatnya, lalu sebagai kasir,
tagih pasien, catat pembayaran sampai lunas, dan tutup admisinya."*

**Langkah awal moderator:** Ganti peran ke apoteker, buka **Farmasi**. Setelah obat diserahkan,
ganti peran ke kasir dan buka **Kasir**.

**Kriteria keberhasilan (dapat diamati):**

- [ ] Responden menemukan resep berstatus **disiapkan** pada antrean dan menekan **Serahkan obat**.
- [ ] Dialog konfirmasi menyebutkan akibatnya (stok berkurang, biaya masuk tagihan) **sebelum** dikonfirmasi.
- [ ] Setelah penyerahan, stok obat berkurang dan status resep menjadi **diserahkan**.
- [ ] Kasir membuka tagihan pasien dan menemukan biaya kamar, tindakan, dan obat sebagai baris terpisah.
- [ ] Pembayaran sebagian mengubah status menjadi **sebagian**, pelunasan mengubahnya menjadi **lunas**.
- [ ] **Kuitansi** dapat dibuka setelah pembayaran.
- [ ] **Checkout pasien** berhasil setelah tagihan lunas, dan bed bekas pasien berstatus **dibersihkan**.

**Catat:** berapa waktu yang dibutuhkan untuk menemukan tagihan pasien yang benar di daftar;
apakah responden mencoba checkout sebelum lunas (lihat Skenario E).

---

## 3. Skenario penanganan kesalahan

### Skenario E — Checkout diblokir dan override oleh Admin

Skenario ini dipakai **semua responden**, tetapi selalu dijalankan pada peran **Kasir** lalu
**Admin** — bukan pada peran asli responden. Moderator mengganti peran lebih dulu dan membuka
**Kasir**; tidak ada responden yang diminta membuka modul di luar izin perannya sendiri.

**Peran awal:** Kasir (Joko Susilo)
**Tujuan (dibacakan):** *"Pasien ini ingin pulang sekarang, tetapi keluarganya belum melunasi
tagihan. Coba tutup admisinya."*

**Langkah awal moderator:** Masuk sebagai Kasir, buka **Kasir**, lalu pilih tagihan pasien dengan
status **belum bayar** atau **sebagian** (mis. Hesti Purwanti).

**Kriteria keberhasilan (dapat diamati):**

- [ ] Pesan *"Checkout diblokir karena tagihan belum lunas"* terbaca jelas di dekat tombol checkout.
- [ ] Tombol **Checkout pasien** nonaktif, dan responden dapat menjelaskan mengapa.
- [ ] Tombol **Override checkout** tidak terlihat bagi kasir.
- [ ] Setelah peran diganti ke Admin, tombol override muncul.
- [ ] Override tanpa alasan ditolak dengan pesan yang menyebut alasan wajib.
- [ ] Override dengan alasan berhasil, dan responden dapat menemukan alasannya kembali pada
      riwayat admisi atau **Audit Log**.

**Catat:** apakah responden mencoba menekan tombol yang nonaktif berulang kali; apakah ia mencari
cara lain untuk "memaksa" checkout.

---

## 4. Skenario per peran

Urutan berikut mengikuti pembagian pada §1. Setiap skenario memakai peran yang berhak atas
modulnya.

### Skenario F — Mencatat tanda vital dan menjalankan instruksi dokter

**Peran awal:** Perawat (Ns. Dwi Lestari)
**Tujuan (dibacakan):** *"Pasien ini baru selesai divisite dokter. Catat tanda vitalnya, lalu
tandai instruksi dokter yang sudah Anda jalankan."*

**Langkah awal moderator:** Ganti peran ke Ns. Dwi Lestari, buka **Klinis**, lalu tunjukkan daftar
**Pasien yang perlu dipantau** tanpa memilih pasien.

**Kriteria keberhasilan (dapat diamati):**

- [ ] Responden membuka pasien dan menemukan panel **Tanda vital terakhir**.
- [ ] Lima kolom terisi: **Tekanan darah (mmHg)**, **Suhu (°C)**, **Nadi (x/menit)**,
      **Pernapasan (x/menit)**, **Saturasi (%)**.
- [ ] Setelah **Simpan tanda vital**, angka terbaru tampil pada panel tanda vital terakhir.
- [ ] Responden menemukan bagian **Instruksi dokter** dan menekan **Tandai sudah dijalankan**.
- [ ] Instruksi yang ditandai hilang dari daftar yang menunggu.

**Catat:** apakah responden memahami bahwa menandai instruksi tidak mengubah catatan dokter
(penanda dibuat sebagai entri terpisah).

### Skenario I — Dokter mengoreksi catatan yang salah

**Peran awal:** Dokter (dr. Ayu Prameswari, Sp.PD)
**Tujuan (dibacakan):** *"Anda menemukan satu catatan visite yang isinya keliru. Perbaiki tanpa
menghapus catatan aslinya."*

**Langkah awal moderator:** Ganti peran ke dokter, buka **Klinis**, pilih pasien, lalu gulir ke
**Riwayat klinis pasien** pada catatan yang sudah ada.

**Kriteria keberhasilan (dapat diamati):**

- [ ] Responden menemukan aksi koreksi pada satu catatan, bukan mencari tombol hapus.
- [ ] Setelah koreksi disimpan, catatan asli tetap tampil dengan penanda **Telah dikoreksi**.
- [ ] Entri baru berlabel **Koreksi** dan menunjuk catatan yang dikoreksinya.
- [ ] Responden dapat menjelaskan mengapa catatan asli tidak dihapus.

**Catat:** apakah responden sempat mencari tombol hapus; berapa lama ia mencari.

### Skenario J — Perawat menandai bed siap dan memindahkan pasien

**Peran awal:** Perawat (Ns. Dwi Lestari)
**Tujuan (dibacakan):** *"Sebuah bed baru saja ditinggal pasien yang pulang. Siapkan bed itu, lalu
pindahkan seorang pasien ke bed lain karena kebutuhan klinis."*

**Langkah awal moderator:** Ganti peran ke Ns. Dwi Lestari, buka **Kamar & Bed**.

**Kriteria keberhasilan (dapat diamati):**

- [ ] Responden menemukan bed berstatus **dibersihkan** dan menekan **Tandai siap dipakai**.
- [ ] Status bed berubah menjadi **kosong** dan ringkasan ketersediaan ikut berubah.
- [ ] Responden membuka **Pindahkan pasien** pada bed **terisi**, dan dialog menyebut pasien serta
      bed asalnya.
- [ ] Hanya bed **kosong** yang ditawarkan sebagai tujuan.
- [ ] Setelah **Pindahkan pasien**, dialog menutup, bed asal menjadi **dibersihkan**, dan
      **Riwayat perpindahan bed** mencatat asal, tujuan, dan waktu.

**Catat:** apakah responden memperhatikan tarif kelas tujuan saat memilih bed.

### Skenario K — Apoteker menyerahkan obat dan menangani stok tidak cukup

**Peran awal:** Apoteker (Nadia Rahmania, S.Farm)

Bagian pertama memakai resep yang sudah berstatus **disiapkan** pada data demo; bagian kedua
memerlukan persiapan moderator satu menit.

**Tujuan bagian 1 (dibacakan):** *"Resep pasien ini sudah disiapkan. Serahkan obatnya."*

**Langkah awal bagian 1:** Ganti peran ke apoteker, buka **Farmasi**, pilih resep berstatus
**disiapkan**.

**Kriteria bagian 1:**

- [ ] Responden menekan **Serahkan obat** dan membaca dialog konfirmasi sebelum menyetujuinya.
- [ ] Setelah **Ya, serahkan obat**, status resep menjadi **diserahkan** dan stok obat berkurang.
- [ ] Responden dapat menyebutkan bahwa biaya obat baru masuk tagihan pada saat penyerahan.

**Tujuan bagian 2 (dibacakan):** *"Resep ini jumlahnya melebihi stok yang ada. Coba serahkan
obatnya. Perhatikan apa yang terjadi."*

**Persiapan moderator untuk bagian 2** (sebelum responden masuk, bukan oleh responden):

1. Masuk sebagai Dokter, buka **Klinis**, pilih satu pasien aktif.
2. Pada bagian **Resep**, pilih **Amoxicillin 500 mg** (stok 60) dengan **Jumlah** `100`, isi
   **Aturan pakai** (mis. `3×1 sesudah makan`), tekan **Tambahkan ke resep** lalu **Buat resep**.
3. Ganti peran ke Apoteker, buka **Farmasi**, lalu serahkan kontrol kepada responden.
   **Jangan** menekan **Mulai siapkan** — biarkan responden melakukannya.

**Kriteria bagian 2:**

- [ ] Responden menekan **Mulai siapkan**, lalu **Serahkan obat**.
- [ ] Tabel resep menandai **Stok kurang** untuk Amoxicillin sebelum penyerahan dicoba.
- [ ] Penyerahan ditolak dengan pesan yang menyebut nama obat, stok tersedia (`60`), dan jumlah
      dibutuhkan (`100`).
- [ ] Status resep tetap **disiapkan** dan stok Amoxicillin tetap `60` setelah penolakan.
- [ ] Responden dapat menyebutkan langkah berikutnya (tambah stok lewat **Tambah stok**).

**Catat:** apakah responden membaca penanda **Stok kurang** sebelum mencoba, atau baru menyadarinya
setelah ditolak.

---

## 5. Skenario cadangan

Dipakai bila waktu sesi tersisa atau responden menyelesaikan skenario perannya lebih cepat.

### Skenario G — Laporan periode dan kondisi kosong

**Peran awal:** Pimpinan (Hendra Wijaya)
**Tujuan (dibacakan):** *"Anda ingin melihat laporan keuangan bulan ini, lalu memastikan
bagaimana tampilannya bila tidak ada data."*

**Kriteria keberhasilan:**

- [ ] Responden memilih jenis laporan dari tombol pilihan yang tersedia, lalu mengatur
      **Dari tanggal** / **Sampai tanggal**.
- [ ] Total tagihan, total terbayar, dan sisa piutang terbaca pada satu layar.
- [ ] Tanggal transaksi terakhir terlihat sebagai penanda kesegaran data.
- [ ] Periode tanpa data menampilkan penjelasan, bukan tabel kosong atau layar rusak.

### Skenario H — Menonaktifkan pengguna dan menelusuri audit log

**Peran awal:** Admin (Sari Dewanti)
**Tujuan (dibacakan):** *"Nonaktifkan satu akun pegawai, lalu buktikan bahwa tindakan itu tercatat."*

**Kriteria keberhasilan:**

- [ ] Responden membuka **Administrasi**, memilih pengguna, lalu menekan **Nonaktifkan pengguna**.
- [ ] Akun tersebut hilang dari daftar akun yang dapat dipilih pada pengalih peran.
- [ ] Entri perubahan pengguna ditemukan di **Audit Log** dengan waktu, pelaku, dan ringkasan.
- [ ] Penyaring **Pengguna** dan **Jenis aksi** mempersempit daftar seperti yang diharapkan.

---

## 6. Kriteria keberhasilan yang dipakai berulang

Catat setiap kali muncul; ini bahan temuan lintas skenario.

| Kriteria | Cara mengamati |
|---|---|
| Umpan balik setelah aksi | Pesan sukses/penolakan muncul tanpa responden mencari |
| Pencegahan kesalahan | Kolom wajib ditandai sebelum disimpan, bukan setelah gagal |
| Pemulihan kesalahan | Responden dapat memperbaiki isian tanpa mengulang langkah lain |
| Status tidak bergantung warna | Responden membaca status dari teks, bukan hanya warna |
| Navigasi | Responden kembali ke dashboard tanpa memakai tombol peramban |
| Fokus keyboard | Fokus berpindah ke judul setelah panel berganti |

---

## 7. Lembar catat moderator

Isi satu baris per skenario per responden. Waktu dihitung dengan stopwatch dari akhir pembacaan
tujuan sampai kriteria terakhir terpenuhi.

| Responden | Skenario | Waktu | Selesai tanpa bantuan? | Bantuan yang diberikan | Kutipan/observasi |
|---|---|---|---|---|---|
| R1 | A |  |  |  |  |
| R1 | B |  |  |  |  |
| R1 | E |  |  |  |  |
| R2 | C |  |  |  |  |
| R2 | I |  |  |  |  |
| R2 | E |  |  |  |  |
| R3 | F |  |  |  |  |
| R3 | J |  |  |  |  |
| R3 | E |  |  |  |  |
| R4 | D |  |  |  |  |
| R4 | K |  |  |  |  |
| R4 | E |  |  |  |  |
| R5 | G |  |  |  |  |
| R5 | H |  |  |  |  |
| R5 | E |  |  |  |  |

**Aturan pencatatan:**

- Bantuan dihitung bila moderator menyebut nama tombol, mengarahkan pandangan, atau menjawab
  pertanyaan yang memuat jawabannya. Memberi semangat tidak dihitung.
- Kutipan ditulis apa adanya, tanpa dirangkum, agar tidak kehilangan nada kejengkelan atau
  kebingungan.
- Waktu yang terlewat batas acuan dicatat, tetapi sesi **tidak** dihentikan.
