# Template Laporan Temuan

**Dani Medical Center — Evaluasi Rancangan Sistem Administrasi Rawat Inap**

Template ini menghasilkan laporan ringkas: **3–5 temuan utama** beserta severity dan rekomendasi,
dengan lampiran per responden. Salin kerangka di §3 ke berkas laporan akhir, isi §1 dan §2 lebih
dulu, lalu pilih temuan.

Severity memakai skala Nielsen (0–4). *Heuristic* merujuk pada sepuluh heuristik usability Nielsen;
tulis nama heuristiknya, bukan hanya nomornya, agar pembaca yang tidak hafal tetap paham.

---

## 1. Ringkasan pelaksanaan

| Butir | Isi |
|---|---|
| Tanggal pelaksanaan | |
| Tempat dan perangkat | |
| Jumlah responden | 5 |
| Peran yang diuji | Petugas Pendaftaran, Dokter, Perawat, Apoteker/Kasir, Pimpinan/Admin |
| Moderator | |
| Perekam/notulis | |
| Skenario yang dijalankan | A–K (lihat `skenario-tugas.md`) |
| Versi prototipe | commit `……………` / URL demo |
| Rekaman disimpan di | |

---

## 2. Ringkasan hasil

| Metrik | Hasil |
|---|---|
| Tugas selesai tanpa bantuan | … / 15 |
| Tugas selesai dengan bantuan | … / 15 |
| Tugas tidak selesai | … / 15 |
| Rata-rata waktu Skenario A (pendaftaran) | … menit (acuan ≤3 menit) |
| Rata-rata waktu Skenario D (serah obat → checkout) | … menit |
| Temuan severity 4 (catastrophe) | … |
| Temuan severity 3 (major) | … |
| Temuan severity 2 (minor) | … |
| Temuan severity 1 (cosmetic) | … |

**Tiga kalimat ringkas:** *[apa yang paling lancar, apa yang paling menghambat, dan apa
rekomendasi utamanya.]*

---

## 3. Kerangka laporan temuan

Isi satu blok per temuan, urut dari severity tertinggi. Laporan akhir memuat **3–5 blok**;
temuan sisanya masuk lampiran.

### Temuan T-01 — *[judul singkat, mis. "Tombol checkout tidak terlihat setelah pembayaran"]*

| Kolom | Isi |
|---|---|
| **Tugas** | Skenario *[A/B/C/D/E/F/G/H]* — *[nama tugas]* |
| **Temuan** | Apa yang terjadi, ditulis sebagai perilaku yang dapat diamati. Sertakan kutipan responden bila ada. |
| **Bukti** | Responden yang mengalami (R1–R5), waktu kejadian pada rekaman, dan jumlah kejadian dari lima sesi. |
| **Dampak** | Apa yang jadi lebih lambat, lebih rawan salah, atau tidak selesai. |
| **Severity** | 4 / 3 / 2 / 1 — *[alasan satu kalimat]* |
| **Heuristic** | Nama heuristik yang dilanggar — *[mis. "Visibilitas status sistem"]* |
| **Rekomendasi** | Perubahan konkret yang dapat dikerjakan: apa yang dipindah, ditambahkan, dihapus, atau diubah kata-katanya. Bukan "perbaiki desain". |
| **Status** | Belum diperbaiki / Sudah diperbaiki / Di luar lingkup |

**Skala severity:**

| Nilai | Nama | Arti dalam konteks prototipe ini |
|---|---|---|
| 4 | Catastrophe | Tugas mustahil diselesaikan; pengguna salah menagih, salah memberi obat, atau pasien tidak bisa pulang. |
| 3 | Major | Tugas selesai tetapi hanya dengan bantuan atau dengan satu kesalahan yang harus diperbaiki. |
| 2 | Minor | Responden ragu atau mengulang langkah, tetapi selesai tanpa bantuan. |
| 1 | Cosmetic | Mengganggu secara visual atau kebahasaan; tidak memengaruhi penyelesaian tugas. |

**Sepuluh heuristik yang dipakai:**

1. Visibilitas status sistem
2. Kesesuaian sistem dengan dunia nyata
3. Kendali dan kebebasan pengguna
4. Konsistensi dan standar
5. Pencegahan kesalahan
6. Pengenalan daripada mengingat
7. Fleksibilitas dan efisiensi penggunaan
8. Desain estetis dan minimalis
9. Membantu pengguna mengenali, mendiagnosis, dan memulihkan kesalahan
10. Bantuan dan dokumentasi

Hubungkan temuan dengan kriteria keberhasilan pada `skenario-tugas.md` §5 (umpan balik, pencegahan
kesalahan, pemulihan, status bukan warna, navigasi, fokus keyboard) agar alasan severity dapat
dilacak ke observasi.

---

## 4. Contoh blok terisi

*Contoh ilustratif. Ganti dengan data sesi yang sebenarnya.*

### Temuan T-01 — Pesan blokir checkout tidak menyebut langkah berikutnya

| Kolom | Isi |
|---|---|
| **Tugas** | Skenario E — checkout diblokir dan override |
| **Temuan** | Dua dari lima responden menekan **Checkout pasien** yang nonaktif berulang kali. Satu responden berkata "kenapa tidak bisa, tidak ada tulisan apa-apa". Pesan blokir terbaca, tetapi tidak menyebut siapa yang berwenang membuka blokirnya, sehingga responden mencari di menu lain. |
| **Bukti** | R1 dan R4, menit 00:12 dan 00:19 pada rekaman; dua dari lima sesi. |
| **Dampak** | Sekitar 90 detik terbuang per kejadian; berpotensi membuat pasien menunggu lebih lama. |
| **Severity** | 3 — tugas selesai, tetapi hanya setelah moderator mengarahkan ke peran Admin. |
| **Heuristic** | Membantu pengguna mengenali, mendiagnosis, dan memulihkan kesalahan; Kendali dan kebebasan pengguna |
| **Rekomendasi** | Tambahkan satu baris pada pesan: siapa yang dapat melakukan override dan di mana ia ditemukan. Pertimbangkan menyebutkan tombolnya langsung ketika peran aktif adalah Admin. |
| **Status** | Belum diperbaiki |

---

## 5. Lampiran per responden

Isi satu tabel per responden. Sumbernya lembar catat moderator dan rekaman.

### Responden R1 — Petugas Pendaftaran

| | |
|---|---|
| Waktu sesi | |
| Peran yang diuji | Petugas Pendaftaran (Rina Kartika) |
| Skenario | A, B, E |
| Rekaman | `R1-rekaman.mp4`, mulai *[hh:mm]* |

| Skenario | Selesai? | Waktu | Bantuan | Kutipan verbatim |
|---|---|---|---|---|
| A | | | | |
| B | | | | |
| E | | | | |

**Observasi lain:** *[perilaku yang tidak masuk kriteria, mis. memakai tombol peramban alih-alih
navigasi aplikasi.]*

**Pendapat penutup (ringkas):** *[jawaban pertanyaan §5 script moderator, tanpa merangkum berlebihan.]*

### Responden R2 — Dokter

*[salin struktur R1]*

### Responden R3 — Perawat

*[salin struktur R1]*

### Responden R4 — Apoteker dan Kasir

*[salin struktur R1]*

### Responden R5 — Pimpinan dan Admin

*[salin struktur R1]*

---

## 6. Lampiran temuan minor

Temuan severity 1–2 yang tidak masuk laporan utama. Kolom sama dengan §3, dipadatkan.

| No | Tugas | Temuan | Severity | Heuristic | Rekomendasi |
|---|---|---|---|---|---|
| | | | | | |

---

## 7. Daftar periksa sebelum menyerahkan laporan

- [ ] Ringkasan pelaksanaan (§1) terisi lengkap, termasuk versi prototipe yang diuji.
- [ ] Metrik (§2) dihitung dari lembar catat, bukan ditaksir.
- [ ] Ada **3–5 temuan utama**, urut severity.
- [ ] Setiap temuan menyebut tugas, temuan, bukti, severity, heuristic, dan rekomendasi.
- [ ] Setiap temuan menyebut jumlah responden yang mengalami, bukan hanya satu kutipan.
- [ ] Rekomendasi berupa perubahan konkret, bukan "perbaiki desain".
- [ ] Setiap responden punya lampiran (§5).
- [ ] Tidak ada nama responden yang tercantum tanpa persetujuan tertulis.
- [ ] Kutipan yang dipakai sudah diperiksa tidak memuat data pribadi.
- [ ] Laporan menyebut apa yang **berhasil**, bukan hanya kekurangan.
- [ ] Istilah mengikuti `GLOSSARY.md`; istilah yang dihindari glossary tidak dipakai.
