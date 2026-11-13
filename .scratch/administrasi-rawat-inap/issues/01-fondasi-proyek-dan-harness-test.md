# 01: Fondasi proyek, token desain, dan harness test

**What to build:** Kerangka aplikasi yang bisa dijalankan dan di-deploy, dengan identitas visual Dani Medical Center sudah terpasang dan jalan pengujian otomatis sudah hijau — sehingga semua ticket berikutnya punya pijakan yang sama dan tidak perlu memutuskan ulang warna, tipografi, atau cara menjalankan test.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Repositori git diinisialisasi dengan `.gitignore` yang tepat, dan aplikasi Next.js (App Router, TypeScript) berjalan di mesin lokal.
- [ ] Tailwind dan primitif Radix terpasang; tidak ada tema pihak ketiga yang diimpor.
- [ ] Token desain terdefinisi untuk warna (palet biru/teal lembut), tipografi humanis, skala jarak, radius, dan bayangan; komponen membaca token, bukan nilai mentah.
- [ ] Logomark sederhana dan wordmark "Dani Medical Center" tersedia sebagai komponen yang dipakai konsisten, termasuk favicon.
- [ ] Halaman contoh menampilkan token dan komponen dasar untuk pemeriksaan visual manual.
- [ ] Vitest berjalan dan memuat setidaknya satu smoke test yang hijau.
- [ ] Playwright berjalan dan memuat setidaknya satu skenario yang membuka aplikasi di peramban dan hijau.
- [ ] Perintah `test`, `test:e2e`, `lint`, dan `build` terdokumentasi dan berhasil tanpa error.
- [ ] Aplikasi ter-deploy ke Vercel dan dapat dibuka dari perangkat lain.

> Deploy: https://dani-medical-center.vercel.app — terverifikasi HTTP 200 tanpa autentikasi.
