# 03: Login demo, RBAC, dan shell per peran

**What to build:** Pengguna dapat masuk sebagai salah satu dari tujuh peran demo, melihat menu yang hanya berisi modul yang menjadi haknya, berpindah peran tanpa keluar, dan dikembalikan ke halaman login bila sesi demo kosong.

**Blocked by:** 02 (Store domain, persistensi, dan data demo)

**Status:** ready-for-agent

- [ ] Halaman login menampilkan tujuh akun demo yang dapat diklik untuk mengisi kredensial otomatis.
- [ ] Login berhasil mengarahkan ke dashboard dengan peran aktif terlihat.
- [ ] Menu sidebar hanya memuat modul yang diizinkan untuk peran aktif.
- [ ] Pengalih peran cepat di header memungkinkan pergantian peran tanpa keluar, dan ditandai jelas sebagai fitur demo.
- [ ] Satu deklarasi pusat memetakan peran ke izin resource/tindakan; sidebar, penjagaan tombol, dan penjagaan rute membaca dari sumber yang sama.
- [ ] Membuka rute yang tidak diizinkan menampilkan layar penolakan yang menjelaskan peran tidak memiliki akses, bukan halaman kosong.
- [ ] Dashboard ringkas per peran menampilkan angka dasar yang relevan bagi peran tersebut.
- [ ] Sesi demo kosong mengembalikan pengguna ke halaman login.
- [ ] E2E: peralihan peran mengubah menu, dan rute terlarang menampilkan layar penolakan.
