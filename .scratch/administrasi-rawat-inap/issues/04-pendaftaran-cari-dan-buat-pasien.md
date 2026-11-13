# 04: Pendaftaran langkah 1 — cari dan buat pasien

**What to build:** Petugas pendaftaran dapat menemukan pasien yang sudah ada atau membuat pasien baru, dan langsung menerima Nomor Rekam Medis yang unik — langkah pertama wizard pendaftaran.

**Blocked by:** 03 (Login demo, RBAC, dan shell per peran)

**Status:** ready-for-human

- [x] Pencarian pasien menerima nama, NIK, atau Nomor Rekam Medis dan menampilkan hasil yang memuat identitas pembeda yang cukup (nama, Nomor Rekam Medis, tanggal lahir, NIK).
- [x] Hasil pencarian kosong menampilkan penjelasan yang mengarahkan petugas untuk membuat pasien baru.
- [x] Form pasien baru memuat identitas, kontak, dan penanggung jawab, dengan label eksplisit dan pesan kesalahan di dekat kolom yang salah.
- [x] Menyimpan pasien baru menghasilkan Nomor Rekam Medis berformat `RM-<tahun>-<urut>` yang langsung ditampilkan.
- [x] Data pasien yang baru dibuat tersimpan dan tetap ada setelah halaman dimuat ulang.
- [x] Petugas diberi peringatan ketika NIK yang dimasukkan sudah terdaftar, sehingga duplikasi dapat dicegah sejak awal.
- [x] Memilih pasien dari hasil pencarian membawa petugas ke langkah berikutnya dengan konteks pasien tetap terbawa.
- [x] Seluruh isian tetap ada bila petugas kembali ke langkah ini dari langkah berikutnya.

## Comments

Langkah 1 wizard pendaftaran selesai. Verifikasi: `npx vitest run` (23 berkas, 175 test),
`npx playwright test` (21 skenario), `npx tsc --noEmit`, `npx eslint .`, dan `npx next build` hijau.

Catatan implementasi:
- Halaman `/pendaftaran` kini memuat pencarian (nama/NIK/Nomor Rekam Medis) dan formulir pasien baru
  dengan label eksplisit, `aria-invalid`/`aria-describedby`, serta pesan kesalahan per kolom.
- Langkah 2 masih berupa layar penanda yang membawa konteks pasien; dokter dan bed menyusul di ticket 05.
- Isian lives di state halaman, bukan store, sehingga kembali dari langkah 2 tidak kehilangan apa pun.
- Pasien baru yang baru disimpan tidak diperingatkan sebagai duplikat dirinya sendiri.
- Audit repo menemukan dua bug tagihan yang ikut diperbaiki di luar lingkup ticket:
  batas segmen biaya kamar memakai potongan UTC (pindah bed dinihari WIB menagih tarif kamar yang salah),
  dan tindakan/resep masih bisa ditambahkan ke admisi yang sudah checkout sehingga tagihan lunas
  berubah lagi. Keduanya kini dijaga test.
- `formatTanggal` diberi test unit dengan `TZ=Asia/Jakarta` yang dipatok di `vitest.config.mts`.

