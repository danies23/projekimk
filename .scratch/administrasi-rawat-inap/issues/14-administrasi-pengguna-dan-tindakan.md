# 14: Administrasi — pengguna dan master tindakan

**What to build:** Admin mengelola akun pengguna beserta perannya dan memelihara master tindakan yang dipakai dokter saat menambahkan tindakan ke admisi.

**Blocked by:** 03 (Login demo, RBAC, dan shell per peran)

**Status:** ready-for-agent

- [ ] Admin melihat daftar pengguna beserta nama, peran, dan status aktifnya.
- [ ] Admin dapat membuat pengguna baru dengan peran yang dipilih.
- [ ] Admin dapat menonaktifkan dan mengaktifkan kembali pengguna.
- [ ] Admin dapat mengubah peran seorang pengguna.
- [ ] Pengguna nonaktif tidak muncul sebagai pilihan pada alur yang membutuhkan pengguna aktif, termasuk pemilihan dokter penanggung jawab.
- [ ] Admin melihat master tindakan berisi nama dan tarif.
- [ ] Admin dapat menambah, mengubah, dan menonaktifkan tindakan.
- [ ] Tindakan yang dinonaktifkan tidak lagi muncul pada pilihan dokter, tetapi tindakan yang sudah tercatat pada admisi lama tetap utuh beserta tarifnya.
- [ ] Setiap perubahan pengguna dan tindakan tercatat di audit log.
