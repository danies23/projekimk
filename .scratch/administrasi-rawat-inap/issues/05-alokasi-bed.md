# 05: Alokasi bed — langkah 2 pendaftaran

**What to build:** Petugas pendaftaran melihat ketersediaan bed secara sekilas, memilih dokter penanggung jawab, tanggal masuk, diagnosa awal, dan sebuah bed — dengan bed yang sudah terisi atau belum siap dipakai tidak pernah muncul sebagai pilihan.

**Blocked by:** 04 (Pendaftaran langkah 1 — cari dan buat pasien)

**Status:** ready-for-human

- [x] Grid denah bed menampilkan bed per kamar dengan kelas dan tarif harian kamar.
- [x] Setiap bed menampilkan status `terisi`, `kosong`, atau `dibersihkan` sebagai teks, bukan hanya warna.
- [x] Tabel ringkasan menampilkan jumlah bed per status dan BOR terkini.
- [x] Hanya bed berstatus `kosong` yang dapat dipilih; bed `terisi` dan `dibersihkan` tidak dapat dipilih.
- [x] Petugas dapat memilih dokter penanggung jawab dari daftar dokter aktif.
- [x] Petugas dapat mengisi tanggal masuk dan diagnosa awal.
- [x] Bila bed yang dipilih ternyata sudah terisi sebelum langkah diselesaikan, sistem menampilkan pesan bahwa bed tersebut baru saja terisi dan meminta petugas memilih bed lain.
- [x] Pilihan dokter, tanggal, diagnosa, dan bed tetap tersimpan saat petugas bergerak antar langkah.
- [x] Daftar bed diperbarui saat petugas kembali ke langkah ini, sehingga bed yang terisi di sela waktu tidak lagi ditawarkan.

## Comments

Langkah 2 wizard pendaftaran selesai. Verifikasi: `npx vitest run` (23 berkas, 186 test),
`npx playwright test` (27 skenario), `npx tsc --noEmit`, `npx eslint .`, dan `npx next build` hijau.

Catatan implementasi:
- Denah bed, ringkasan per status, dan BOR dibaca dari store pada tiap render; `denahBed`,
  `dokterAktif`, dan `ringkasanBed` adalah selector murni di `lib/domain/selectors.ts`.
- Pesan "bed … baru saja terisi" dipindahkan ke `alasanBedTidakTersedia` agar pemilih bed dan
  penolakan store memakai kalimat yang sama; kini hanya ada satu sumber aturan itu.
- Bed non-`kosong` dirender `disabled` dengan status sebagai teks berwarna; warna melengkapi teks,
  bukan menggantikannya (WCAG 1.4.1). Status `dibersihkan` memakai peringatan, `terisi` bahaya.
- Pilihan dokter, tanggal, diagnosa, dan bed bertahan saat kembali ke langkah 1 atau maju ke
  langkah 3 yang masih berupa penanda; ticket 06 mengisi konfirmasi dan penyimpanan admisi.
- Pesan bed basi muncul bila bed pilihan hilang dari denah (mis. kamarnya dinonaktifkan) maupun
  bila statusnya berubah; keduanya memblokir lanjut ke langkah 3.
- `ringkasanBed` kini mengabaikan bed di kamar nonaktif, sejalan dengan denah yang juga tidak
  menampilkannya; sebelumnya BOR bisa menghitung bed yang tak pernah ditawarkan.
- Catatan untuk ticket 06: pesan bed basi belum bisa dipicu dari UI saat ini karena belum ada
  layar lain yang mengubah status bed; jalur itu baru tercakup saat admisi disimpan/demonstrated
  lewat dua tab. Unit test selectors menutup aturannya.

Temuan review yang sengaja tidak diambil:
- `<select>` dokter tetap kontrol native, mengikuti pola langkah 1; Radix Select baru bernilai
  bila ada kebutuhan filter atau grup. ADR-0003 menyebut primitif Radix untuk komponen yang
  memang butuh ARIA kompleks.
- Tiga `<h1>/<p>Langkah N dari 3` dirapikan menjadi komponen `KepalaWizard`, termasuk wilayah
  live `role="status"` yang sebelumnya hanya ada di langkah 1.
