# Radix primitives dengan lapisan visual custom

Komponen interaktif memakai Radix UI sebagai primitif (manajemen fokus dialog, navigasi keyboard, ARIA) tetapi seluruh lapisan visual — warna, tipografi, radius, kepadatan, jarak — dirancang sendiri di atas Tailwind, bukan memakai tema shadcn/ui apa adanya.

**Alasan**: yang dinilai adalah kualitas UI/UX, sehingga tampilan default shadcn (yang mudah dikenali sebagai template) justru merugikan. Sebaliknya, menulis ulang manajemen fokus dan ARIA dari nol membuang waktu pada hal yang tidak dinilai.

**Konsekuensi**: setiap komponen memiliki dua lapis yang harus dijaga terpisah — perilaku dari Radix, tampilan dari lapisan kita. Komponen baru tidak boleh mengimpor tema pihak ketiga.
