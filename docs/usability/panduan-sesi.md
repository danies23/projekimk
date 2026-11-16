# Panduan Menjalankan Sesi

**Dani Medical Center — Sistem Administrasi Rawat Inap**

Panduan operasional untuk moderator dan notulis: menyiapkan aplikasi, menjaga data demo sama
untuk setiap responden, dan mencatat waktu tugas. Naskah yang dibacakan ada di
`script-moderator.md`; panduan ini tidak mengulanginya.

---

## 1. Persiapan aplikasi

Aplikasi berjalan sebagai prototipe statis di peramban (ADR-0001). Tidak ada database yang perlu
disiapkan. Server aplikasi tetap perlu berjalan, karena Next.js merender halaman dari situ.

**Sebelum hari pelaksanaan:**

```bash
npm install
npm run build      # memastikan versi yang diuji sama dengan versi yang dijalankan
npm run start      # melayani hasil build di http://localhost:3000
```

Catat **commit hash** yang dipakai (`git rev-parse --short HEAD`) pada laporan §1. Bila sesi
memakai URL Vercel, catat URL dan waktu deploy-nya.

**Pagi hari pelaksanaan:**

1. Buka aplikasi di peramban yang sudah diperbarui. Gunakan **satu peramban** untuk semua
   responden agar kondisi penyimpanan sama.
2. Pastikan halaman login tampil dengan daftar akun demo dan sandi `demo123`.
3. Periksa tabel ini terisi sesuai data demo:

| Yang diperiksa | Kondisi awal yang diharapkan |
|---|---|
| Akun demo di halaman login | 9 akun, tujuh peran |
| Bed: terisi / kosong / dibersihkan | 10 / 4 / 2 (BOR 62,5%) |
| Resep menunggu / disiapkan / diserahkan | 2 / 2 / 2 |
| Tagihan belum bayar / sebagian / lunas | tersedia ketiganya |
| Stok di bawah minimum | Amoxicillin 500 mg, Furosemide 40 mg, Salbutamol Inhaler |
| Pergantian peran di header | tombol **Ganti peran** berlabel "Demo" |

4. Matikan notifikasi peramban, perkecil zoom ke 100%, dan tutup tab lain.
5. Siapkan stopwatch dan lembar catat moderator tercetak.

---

## 2. Data demo dan reset antar responden

**Prinsip:** setiap responden mulai dari kondisi awal yang sama persis, sehingga waktu dan
kesalahan mereka dapat dibandingkan. Data demo disimpan per peramban (`localStorage`), bukan di
server; tidak ada responden yang dapat merusak data responden lain.

**Kapan reset dilakukan:**

| Saat | Reset? |
|---|---|
| Sebelum responden pertama | Ya |
| Antar responden | **Ya, selalu** |
| Di tengah skenario yang sedang diukur | **Tidak** |
| Setelah percobaan bebas responden sebelum skenario berikutnya | Ya, dan catat |
| Setelah sesi terakhir | Tidak perlu |

**Cara reset:**

1. Pastikan aplikasi dalam keadaan sudah masuk (peran apa pun).
2. Tekan **Reset data demo** di header, sebelah tombol **Ganti peran**.
3. Dialog konfirmasi muncul dengan penjelasan bahwa seluruh perubahan akan hilang. Tekan
   **Ya, reset data demo**.
4. Data kembali ke kondisi awal. **Peran aktif tidak berubah** — perpindahan peran tetap lewat
   **Ganti peran**.
5. Setelah reset, verifikasi cepat: buka **Kamar & Bed** dan pastikan hitungan bed kembali
   `10 terisi / 4 kosong / 2 dibersihkan`. Bila tidak, reset sekali lagi dan catat kejadiannya.

**Bila tombol tidak ditemukan:** periksa apakah halaman sedang menampilkan layar **Akses ditolak**.
Tombol reset ada di header dan hanya tampil saat pengguna sudah masuk. Muat ulang halaman lalu
masuk kembali dengan akun demo.

**Salah tekan:** tombol ini baru mengubah data setelah **Ya, reset data demo** ditekan. **Batal**
hanya menutup dialog dan tidak menyentuh data, jadi reset yang tidak disengaja tidak mungkin
terjadi. Bila reset sudah terlanjur ditekan di tengah skenario, hentikan skenario itu, catat
kejadiannya, lalu ulangi skenario dari awal — jangan melanjutkan dengan waktu yang sudah terlanjur
diukur.

**Data yang tidak boleh dimasukkan:** prototipe memakai data demo fiktif. Responden tidak boleh
mengetikkan nama, NIK, atau nomor telepon orang sungguhan. Bila responden mencoba memakai data
nyata, arahkan ke data fiktif dan catat bila ia tampak membutuhkannya untuk bekerja.

---

## 3. Mencatat waktu tugas

**Alat:** stopwatch (ponsel), satu per sesi. Satu orang memegang stopwatch; notulis mencatat.

**Mulai:** tepat setelah moderator selesai membacakan tujuan tugas dan responden mulai bergerak
(klik, ketik, atau menunjuk dengan jelas). Jangan mulai saat moderator masih membacakan.

**Berhenti** pada salah satu kejadian berikut, mana yang lebih dulu:

| Kejadian | Yang dicatat |
|---|---|
| Kriteria keberhasilan terakhir terpenuhi | Waktu selesai; tulis **Selesai** |
| Responden menyatakan menyerah | Waktu saat menyatakan; tulis **Menyerah** |
| Batas acuan skenario terlewati tetapi responden terus berjalan | Lanjutkan mengukur sampai ia berhenti; tulis **Melewati acuan** |
| Moderator memberi bantuan yang memuat jawaban | Jangan hentikan; catat waktu bantuan dan lanjutkan mengukur |
| Sesi dihentikan karena alasan lain | waktu, dan alasannya |

**Jeda:** hentikan stopwatch bila responden berhenti karena keperluan pribadi, atau bila
moderator harus meninggalkan ruangan. Catat durasi jeda.

**Bantuan:** catat setiap bantuan pada urutan tangga di `script-moderator.md` §3, beserta waktu.
Bantuan yang diberikan **tidak** mengurangi waktu secara otomatis; kolom **Selesai tanpa bantuan?**
yang menandainya.

**Aturan pencatatan:**

- Tulis waktu dalam `mm:ss`.
- Kutipan verbatim ditulis di dalam tanda kutip; parafrase tidak memakai tanda kutip.
- Jangan menilai pada saat mencatat ("sepertinya kesulitan"); tulis apa yang terlihat
  ("membuka menu Kasir dua kali, kembali ke dashboard, lalu membuka lagi").
- Lengkapi lembar catat dalam 30 menit setelah sesi, sebelum menonton rekaman responden
  berikutnya.

---

## 4. Urutan satu sesi

| Tahap | Durasi acuan | Yang dilakukan |
|---|---|---|
| Penyambutan dan lembar persetujuan | 5 menit | Bacakan `script-moderator.md` §2, tanda tangan, mulai rekaman |
| Pemanasan | 3 menit | Minta responden membuka aplikasi dan masuk tanpa dipandu; catat kesan pertama |
| Skenario 1 | 10 menit | Bacakan tujuan, catat waktu |
| Skenario 2 | 10 menit | Ganti peran bila perlu, catat waktu. Skenario K bisa memakan 15 menit karena dua bagian |
| Skenario E (penanganan kesalahan) | 7 menit | Wajib. Dijalankan pada peran Kasir lalu Admin, bukan peran asli responden. Butuh tagihan yang belum lunas; reset data demo bila responden sudah melunasi semuanya |
| Pertanyaan penutup | 10 menit | Bacakan `script-moderator.md` §5, hentikan rekaman |
| Pasca-sesi | 10 menit | Lengkapi lembar catat, reset, siapkan responden berikutnya |

Total sekitar 55 menit per responden. Sesi lima responden membutuhkan dua hari kerja atau satu
hari penuh dengan jeda.

---

## 5. Bila ada yang tidak berjalan

| Gejala | Tindakan |
|---|---|
| Layar kosong atau tidak merespons | Muat ulang halaman. Data demo bertahan, jadi sesi dapat dilanjutkan. Catat kejadiannya. |
| Data terlihat aneh atau tidak konsisten dengan data demo | Reset data demo, ulangi skenario dari awal, catat bahwa reset dilakukan. |
| Responden memakai peramban lain | Hentikan dan kembali ke peramban yang ditetapkan; data demo tidak berpindah antar peramban. |
| Rekaman gagal | Hentikan skenario, perbaiki rekaman, dan mulai skenario dari awal dari kondisi awal. Bila tetap gagal, lanjutkan tanpa rekaman dan andalkan lembar catat — catat pada laporan. |
| Responden ingin berhenti | Ikuti `lembar-persetujuan.md` Bagian 5. Hentikan rekaman, tanyakan apakah datanya boleh dipakai, lalu tindak lanjuti permintaannya. |
| Halaman meminta masuk ulang | Penyimpanan sesi peramban dibersihkan (mis. data situs dihapus). Masuk kembali dengan akun peran yang sama; data demo tidak hilang. |

---

## 6. Daftar periksa akhir hari

- [ ] Semua lembar catat moderator terisi dan terbaca.
- [ ] Semua rekaman tersimpan dengan nama berpola `R<n>-rekaman.*`.
- [ ] Lembar persetujuan bertanda tangan disimpan di tempat terkunci.
- [ ] Temuan awal sudah ditulis untuk setiap responden pada `template-laporan-temuan.md`.
- [ ] Data demo direset sebelum sesi berikutnya.
- [ ] Commit hash dan URL yang diuji dicatat pada laporan §1.
- [ ] Tidak ada nama responden atau data pribadi yang tertinggal di perangkat bersama.
