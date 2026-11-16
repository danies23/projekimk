# Kit Evaluasi Usability

**Dani Medical Center — Sistem Administrasi Rawat Inap**

Perangkat untuk menjalankan usability testing bersama lima responden dan melaporkan hasilnya.
Seluruh dokumen berbahasa Indonesia dan dapat dilampirkan pada laporan akhir.

| Dokumen | Isi | Dipakai kapan |
|---|---|---|
| [`panduan-sesi.md`](panduan-sesi.md) | Persiapan aplikasi, reset antar responden, pencatatan waktu | Sebelum dan selama pelaksanaan |
| [`skenario-tugas.md`](skenario-tugas.md) | Skenario A–K: tujuan, langkah awal, kriteria keberhasilan | Saat membacakan tugas |
| [`script-moderator.md`](script-moderator.md) | Script pembuka dan penutup, tangga bantuan, perpindahan skenario | Saat sesi berlangsung |
| [`lembar-persetujuan.md`](lembar-persetujuan.md) | Persetujuan responden, penggunaan rekaman, hak berhenti | Sebelum sesi dimulai |
| [`template-laporan-temuan.md`](template-laporan-temuan.md) | Kolom tugas, temuan, severity, heuristic, rekomendasi | Saat menganalisis dan menulis laporan |
| [`rasional-desain.md`](rasional-desain.md) | Mengapa arah visual, navigasi, wizard, dan penanganan kesalahan diputuskan demikian | Lampiran laporan akhir |

## Alur pemakaian

1. Baca `panduan-sesi.md` dan siapkan aplikasi serta data demo.
2. Cetak `lembar-persetujuan.md` (dua rangkap) dan `skenario-tugas.md`.
3. Jalankan sesi memakai `script-moderator.md`, dengan `skenario-tugas.md` sebagai daftar tugas.
4. Catat waktu dan bantuan pada lembar catat di akhir `skenario-tugas.md`.
5. Pindahkan catatan ke `template-laporan-temuan.md`; pilih 3–5 temuan utama.
6. Lampirkan `rasional-desain.md` pada laporan akhir.

## Rujukan yang dipakai kit ini

- **`GLOSSARY.md`** — istilah domain. Semua dokumen di sini memakai istilah tersebut dan
  menghindari sinonim yang glossary-nya larang.
- **`docs/adr/`** — keputusan yang sulit dibalik. `rasional-desain.md` merujuknya, bukan
  mengulangnya.
- **`.scratch/administrasi-rawat-inap/spec.md`** — kebutuhan dan kriteria penerimaan per nomor
  user story. Skenario menyebut nomor ini agar dapat dilacak.

## Kelima responden

| Responden | Peran | Skenario |
|---|---|---|
| R1 | Petugas Pendaftaran | A, B, E |
| R2 | Dokter | C, I, E |
| R3 | Perawat | F, J, E |
| R4 | Apoteker dan Kasir | D, K, E |
| R5 | Pimpinan dan Admin | G, H, E |

Skenario E (penanganan kesalahan) wajib untuk semua responden, dan selalu dijalankan pada peran
**Kasir** lalu **Admin** — bukan pada peran asli responden. Pembagian lengkap ada di
`skenario-tugas.md` §1.

## Urutan jalur emas

```
A  Daftarkan pasien baru → Nomor Rekam Medis
B  Pilih dokter & bed    → bukti pendaftaran
C  Visite, tindakan, resep
D  Serah obat → tagih → bayar → checkout
```

## Data demo

Reset ke kondisi awal lewat tombol **Reset data demo** di header, sebelum setiap responden. Data
disimpan per peramban, jadi tidak ada responden yang dapat merusak data responden lain. Peran
aktif tidak berubah saat reset.
