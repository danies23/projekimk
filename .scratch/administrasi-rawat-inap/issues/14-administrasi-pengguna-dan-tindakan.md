# 14: Administrasi — pengguna dan master tindakan

**What to build:** Admin mengelola akun pengguna beserta perannya dan memelihara master tindakan yang dipakai dokter saat menambahkan tindakan ke admisi.

**Blocked by:** 03 (Login demo, RBAC, dan shell per peran)

**Status:** done

- [x] Admin melihat daftar pengguna beserta nama, peran, dan status aktifnya.
- [x] Admin dapat membuat pengguna baru dengan peran yang dipilih.
- [x] Admin dapat menonaktifkan dan mengaktifkan kembali pengguna.
- [x] Admin dapat mengubah peran seorang pengguna.
- [x] Pengguna nonaktif tidak muncul sebagai pilihan pada alur yang membutuhkan pengguna aktif, termasuk pemilihan dokter penanggung jawab.
- [x] Admin melihat master tindakan berisi nama dan tarif.
- [x] Admin dapat menambah, mengubah, dan menonaktifkan tindakan.
- [x] Tindakan yang dinonaktifkan tidak lagi muncul pada pilihan dokter, tetapi tindakan yang sudah tercatat pada admisi lama tetap utuh beserta tarifnya.
- [x] Setiap perubahan pengguna dan tindakan tercatat di audit log.

## Comments

- **2026-11-16 — selesai.** Dua aksi store baru: `pengguna/diubah` (nama, peran, aktif) dan `tindakan-master/dibuat`. Validasi tinggal di store: nama wajib, nama tindakan unik tanpa membedakan huruf besar-kecil, tarif bilangan bulat > 0, dan Admin tidak dapat mengubah akunnya sendiri (mencegah ia mengunci diri dari layar ini).
- **Validasi hanya pada kolom yang diubah.** Saat menonaktifkan tindakan lama, nama dan tarif warisan tidak divalidasi ulang; tanpa ini tindakan dengan nama ganda dari data lama tidak akan pernah bisa dinonaktifkan. Ada test khusus untuk kasus itu.
- **Layar `/administrasi`** menggantikan placeholder: tabel pengguna (nama, peran, status, aksi nonaktifkan/aktifkan/ubah peran) dan tabel master tindakan (nama, tarif, status, aksi tambah/ubah/nonaktifkan). Tiap bagian membaca izinnya sendiri dari matriks (`pengguna.kelola`, `master.tindakan`), bukan satu gerbang di tingkat halaman.
- **Pesan penolakan tampil di dalam form yang memicunya** (`GalatForm`), bukan `role="alert"` di puncak halaman. Store mengembalikan satu pesan tanpa penanda kolom, jadi pesan tidak dipasangkan ke kolom tertentu agar tidak salah alamat.
- **Pengalih peran demo** kini menyaring akun nonaktif; tanpa ini menonaktifkan dokter membuat moderator terlempar ke halaman login saat memilihnya.
- **Pengguna baru tidak dapat login.** `lib/masuk.ts` hanya mencocokkan `AKUN_DEMO` karena kredensial tidak disimpan di store (ADR-0001). Akun baru tetap dipakai sebagai pilihan dokter aktif dan tercatat di audit — batas prototipe, bukan bug.
- **Test:** `lib/domain/store-administrasi.test.ts` (15 test store) dan `tests/e2e/administrasi.spec.ts` (5 alur: tambah pengguna, nonaktifkan dokter → hilang dari pilihan dokter, tambah/nonaktifkan tindakan → pilihan dokter menyusut, pesan penolakan di dalam form, audit memuat entitas yang berubah).
- **Risiko:** daftar pengguna dan tindakan tidak dipaginasi; volume demo kecil dan tabel dapat digulir horizontal pada tablet.
