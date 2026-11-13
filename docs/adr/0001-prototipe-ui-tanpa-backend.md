# Prototipe UI tanpa backend

Proyek ini adalah tugas mata kuliah Interaksi Manusia dan Komputer: yang dinilai adalah desain dan pengalaman pengguna, bukan implementasi server. Karena itu prototipe dibuat sebagai aplikasi Next.js statis dengan data demo di berkas TypeScript dan localStorage — tanpa database, tanpa autentikasi sungguhan, tanpa API. Login dilayani dengan akun demo yang bisa diklik; perubahan data bertahan antar-refresh agar demo dan usability testing terasa nyata, dan tombol "Reset data demo" mengembalikan kondisi awal.

**Konsekuensi**: PRD §10 (skema 14 tabel), §11 (ketersediaan, backup), dan §12 (Prisma, PostgreSQL, Auth.js, PDF) tidak diterapkan. Struktur data tetap mengikuti model PRD agar hasil desain bisa dipindahkan ke implementasi sungguhan tanpa merancang ulang.
