# Rasional Desain

**Dani Medical Center — Sistem Administrasi Rawat Inap**

Dokumen ini menjelaskan **mengapa** antarmuka prototipe ini diputuskan seperti sekarang: arah
visual, pola navigasi, wizard pendaftaran, dan penanganan kesalahan. Dokumen ini tidak mengulang
istilah dan keputusan yang sudah dicatat di tempat lain.

- Istilah domain (Admisi, Alokasi Bed, Status Bed, Pratinjau Cetak, dan seterusnya) didefinisikan
  di **`GLOSSARY.md`**. Dokumen ini memakai istilah tersebut tanpa mendefinisikannya ulang.
- Keputusan yang sulit dibalik tercatat di **`docs/adr/`**. Rujukannya disebutkan langsung pada
  bagian yang bersangkutan.
- Kebutuhan yang mendasari setiap layar ada di **`.scratch/administrasi-rawat-inap/spec.md`**
  (spec) dan **`PRD_Sistem_Administrasi_Rawat_Inap.md`** (PRD). Dokumen ini tidak mengulang
  daftar kebutuhan.

Sasaran yang membingkai seluruh pilihan di bawah: aplikasi dinilai sebagai **rancangan**, jadi
yang dioptimalkan adalah kejelasan alur kerja untuk tujuh peran, bukan jumlah fitur. Konsekuensi
arsitekturnya — tanpa backend, tanpa autentikasi sungguhan, data di peramban — dicatat di
ADR-0001 dan tidak diulang di sini.

---

## 1. Arah visual

**Kesan yang dituju: tenang dan bersih.** Staf administrasi rumah sakit bekerja berjam-jam di
depan layar ini; tampilan yang ramai atau "produk SaaS" akan menambah beban, bukan mengurangi.
Yang dicari adalah permukaan yang lapang, hierarki yang jelas, dan satu warna aksen yang dipakai
hemat.

**Palet biru–teal lembut.** Warna primer `#0f6f7d` dipilih karena tiga alasan: ia terbaca sebagai
klinis tanpa meminjam merah palang rumah sakit (yang justru menyiratkan gawat darurat), kontrasnya
terhadap putih dan kanvas melewati ambang WCAG 2.1 AA, dan ia cukup gelap untuk dipakai sebagai
teks tautan pada latar terang. Warna status (`success`, `warning`, `danger`, `info`) dipilih dari
keluarga yang sama gelapnya sehingga lencana teks putih di atasnya tetap lolos 4.5:1. Seluruh
pasangan teks/latar yang benar-benar dirender dicatat sebagai data di `lib/design-tokens.ts` dan
diverifikasi oleh test — bukan diyakini dari ingatan.

**Tipografi humanis.** Source Sans 3 untuk antarmuka dan Source Serif 4 untuk judul. Sans humanis
membaca lebih ramah daripada grotesk geometris pada ukuran kecil di tabel, sedangkan serif pada
judul memberi jeda visual antara "judul halaman" dan "isi tabel" tanpa memerlukan kotak atau
warna tambahan. Keduanya dimuat lewat `next/font` sehingga tidak ada permintaan jaringan saat
runtime (ADR-0001).

**Ruang kosong lega dan sudut membulat halus.** Jarak vertikal antar kelompok kerja dibuat lebar
supaya tabel dan formulir tidak menyatu menjadi satu bidang abu-abu. Radius `0.375–1.25rem`
dipakai konsisten; tidak ada sudut tajam pada permukaan, tetapi juga tidak ada kartu yang
"mengambang" dengan bayangan berat. Skala jarak, radius, dan bayangan ikut di `lib/design-tokens.ts`
dan dicerminkan ke `app/globals.css`; komponen tidak boleh memakai nilai mentah.

**Identitas rumah sakit, bukan template.** Logomark berupa ubin membulat berisi garis denyut
dipilih agar terbaca sebagai klinis tanpa meniru simbol palang merah, dan wordmark "Dani Medical
Center" dipakai pada header, halaman login, dan favicon. Lapisan visual ditulis di atas Radix,
bukan memakai tema pihak ketiga (ADR-0003) — tampilan default pustaka komponen mudah dikenali
sebagai template, dan justru itu yang mengurangi nilai penilaian.

**Token, bukan warna mentah.** Karena yang dinilai adalah kualitas visual, kemungkinan besar
antarmuka akan direvisi setelah usability testing. Token membuat revisi "geser satu nilai di satu
tempat" alih-alih "cari dan ganti di puluhan komponen". Test `lib/design-tokens.test.ts` menjaga
`lib/design-tokens.ts` dan `app/globals.css` tetap sinkron dan menghitung ulang kontras setiap
pasangan, sehingga revisi warna tidak dapat diam-diam merusak aksesibilitas.

---

## 2. Pola navigasi

**Sidebar persisten + breadcrumb + header.** Tiga lapis ini memisahkan tiga pertanyaan berbeda
yang biasanya bercampur:

| Lapis | Menjawab | Isi |
|---|---|---|
| Sidebar | "Modul apa saja yang boleh saya buka?" | Hanya modul yang menjadi hak peran aktif |
| Breadcrumb | "Saya sedang di mana?" | Jejak dari modul teratas sampai modul aktif |
| Header | "Siapa saya sekarang?" | Peran aktif dan nama, plus pengalih peran demo |

**Sidebar membaca matriks izin, bukan daftar sendiri.** Sidebar, penjagaan rute, dan penjagaan
tombol membaca satu deklarasi pusat (`lib/domain/izin.ts`). Ini keputusan yang disengaja: dengan
tiga daftar terpisah, cepat atau lambat tombol akan muncul untuk peran yang tidak berhak
menekannya. Test `lib/domain/izin-konsisten.test.ts` membuktikan ketiganya tidak pernah berbeda
jawaban. Menu yang tidak menjadi hak peran **tidak dirender sama sekali**, bukan dirender lalu
dinonaktifkan — menyembunyikan menu mencegah pengguna tergoda menekan sesuatu yang akan ditolak
(spec, user story 5).

**Aksi spesifik tinggal di dalam halaman, bukan di navigasi.** Sidebar sengaja tidak memuat
tombol aksi. "Serahkan obat" hanya masuk akal pada detail resep, dan menu global yang berisi aksi
kontekstual akan membingungkan. Konsekuensinya, sidebar tetap pendek untuk semua peran — pada
tablet pun ia tidak memakan ruang yang berarti.

**Breadcrumb diturunkan dari rute, bukan ditulis per halaman.** `lib/navigasi.ts` menghitung
modul aktif dari `pathname` dan memilih kecocokan paling spesifik, sehingga `/administrasi/audit`
milik Audit Log, bukan Administrasi. Menulis breadcrumb per halaman berarti setiap penambahan
rute harus ingat memperbarui dua tempat.

**Layar penolakan, bukan halaman kosong.** Akses langsung ke rute di luar izin (mis. tautan lama
yang dikirim antar rekan) menampilkan layar yang menjelaskan peran mana yang tidak berhak, di
mana menu yang menjadi haknya, dan tautan kembali ke dashboard (`components/shell/shell.tsx`).
Alternatifnya — halaman kosong atau pengalihan diam-diam — membuat pengguna mengira aplikasi rusak.
Pola yang sama dipakai untuk modul yang belum ada (`components/shell/modul-tertunda.tsx`), walau
pada keadaan akhir tidak ada lagi modul yang memakainya.

**Pengalih peran ditandai jelas sebagai fitur demo.** Tombol **Ganti peran** memakai lencana
"Demo" dan menu-nya menyebut "Lingkungan demo". Ini bukan sekadar hiasan: tanpa penanda, pengalih
peran mudah disalahartikan sebagai fitur produksi, dan itu mengaburkan penilaian atas alur kerja
sungguhan. Perpindahan peran tidak mengeluarkan pengguna dari aplikasi dan **tidak** memindahkan
halaman: sidebar dan penjagaan akses di halaman yang sedang dibuka langsung mengikuti peran baru,
sehingga moderator dapat mendemonstrasikan alur lintas peran tanpa keluar-masuk.

**Penanda demo juga dipakai tombol reset.** **Reset data demo** diletakkan bersebelahan dengan
pengalih peran supaya kedua kontrol demo itu terbaca sebagai satu kelompok, bukan sebagai fitur
produksi yang terselip di antara keduanya. Keduanya dikonfirmasi singkat: pengalih peran tidak
mengubah data, sedangkan reset menampilkan dialog yang menyebut akibatnya sebelum tombol akhir
ditekan.

**Satu perjalanan per peran, bukan satu menu untuk semua.** Dashboard setiap peran menampilkan
ringkasan yang relevan dengan pekerjaannya, dan Petugas Pendaftaran mendapat pintasan
**Daftarkan Pasien** (spec, user story 14). Prioritas ini mengikuti alur kerja nyata: petugas
pendaftaran membuka aplikasi paling sering dan paling buru-buru.

---

## 3. Wizard pendaftaran

**Tiga langkah, bukan satu formulir panjang.** Pendaftaran adalah alur tersibuk sekaligus paling
padat isian: identitas pasien (9 kolom), dokter, tanggal masuk, diagnosa awal, dan pilihan bed.
Satu formulir panjang menyembunyikan langkah berikutnya dan membuat kesalahan di awal baru
ketahuan di akhir. Tiga langkah memecahnya menurut keputusan yang berbeda:

1. **Pasien** — mencari yang sudah ada atau membuat baru.
2. **Dokter dan bed** — keputusan klinis dan logistik.
3. **Konfirmasi** — membaca ulang sebelum menyimpan.

**Pencarian didahulukan di atas pembuatan.** Langkah 1 menaruh pencarian di kiri dan formulir
pasien baru di kanan, dengan pencarian lebih dulu dalam urutan baca. Tujuannya mencegah rekam
medis ganda (spec, user story 15), yang di rumah sakit merupakan kesalahan yang mahal dan sulit
dibersihkan. Kondisi kosong hasil pencarian menawarkan tombol **Buat pasien baru** yang langsung
memindahkan fokus ke kolom nama — dari "tidak ketemu" ke "buat baru" tanpa mencari sendiri.

**Nomor Rekam Medis ditampilkan sebagai bukti, bukan disimpan diam-diam.** Setelah pasien
disimpan, nomor `RM-<tahun>-<urut>` muncul dalam kotak tersendiri dengan instruksi "berikan nomor
ini kepada pasien". Nomor itu sebenarnya sudah dibuat otomatis oleh store; yang dirancang di sini
adalah **momen** penyampaiannya, karena petugas harus membacakannya kepada pasien saat itu juga.

**Bed dipilih sebagai denah, bukan daftar datar.** Langkah 2 menampilkan bed dikelompokkan per
kamar dan kelas beserta tarif harian, dan hanya bed berstatus `kosong` yang dapat dipilih. Denah
menjawab pertanyaan yang sebenarnya ada di kepala petugas ("kelas apa yang masih punya tempat?"),
sedangkan daftar datar memaksa petugas menggabungkan kamar, kelas, dan status dari baris-baris
terpisah. Status ditulis sebagai teks di samping setiap bed karena warna saja tidak cukup
(WCAG 1.4.1).

**Pilihan bed yang basi ditangani, bukan diasumsikan tidak terjadi.** Bed bisa terisi di sela
waktu — oleh petugas lain, di tab lain, atau oleh data yang dimuat ulang. Karena itu wizard
membaca ulang denah pada tiap render dan menampilkan alasan bila bed pilihan sudah tidak tersedia,
termasuk pesan "Bed … baru saja terisi, pilih bed lain." dari `alasanBedTidakTersedia`. Store tetap
penjaga terakhir lewat pemeriksaan yang sama; pesan formulir hanya membimbing lebih awal (spec:
"Penolakan menghasilkan pesan …").

**Kembali antar langkah mempertahankan isian.** Isian hidup di state halaman, bukan di store,
sehingga mundur ke langkah 1 untuk mengoreksi pasien tidak menghapus dokter dan bed yang sudah
dipilih, dan sebaliknya. Satu pengecualian yang disengaja: daftar bed **dibaca ulang** saat
kembali ke langkah 2, karena isian yang dipertahankan tidak boleh berarti pilihan yang sudah
tidak valid ikut dipertahankan.

**Ringkasan konfirmasi memuat semua yang akan disimpan.** Langkah 3 menampilkan pasien, NIK,
dokter, kamar, bed, tarif, tanggal masuk, dan diagnosa awal sekaligus, dengan kalimat bahwa admisi
baru dibuat setelah tombol ditekan. Ini pencegahan kesalahan yang murah: salah pilih bed atau
dokter baru terlihat di sini, bukan setelah bukti tercetak.

**Bukti pendaftaran adalah pratinjau cetak, bukan PDF.** Setelah tersimpan, bukti dirender sebagai
halaman dengan gaya cetak dan tombol **Cetak bukti pendaftaran** yang memanggil dialog cetak
peramban. Memilih pratinjau cetak alih-alih berkas PDF menghindari pustaka pembuat PDF dan
memberi petugas pratinjau yang persis sama dengan hasil cetak (spec, user story 29; ADR-0001).

**Fokus dipindahkan saat seluruh isi halaman berganti.** Perpindahan langkah dan tampilnya bukti
mengganti isi halaman; tanpa memindahkan fokus ke judul, pengguna keyboard kembali ke awal
dokumen (WCAG 2.4.3). Ini pola yang dipakai juga pada detail pasien di Klinis, detail resep di
Farmasi, dan detail tagihan di Kasir.

---

## 4. Penanganan kesalahan

**Kesalahan dicegah di tempat, ditangkap di store, dan dijelaskan di layar.** Tiga lapis ini
sengaja dipisah:

| Lapis | Perannya | Contoh |
|---|---|---|
| Antarmuka | Mencegah yang sudah pasti salah, membimbing lebih awal | Kolom wajib, tombol nonaktif, hanya bed `kosong` ditawarkan |
| Store domain | Penjaga terakhir aturan bisnis, tanpa peduli layar mana | Stok tidak cukup, bed sudah terisi, checkout belum lunas |
| Pesan | Menjelaskan sebab dan langkah berikutnya di dekat penyebabnya | "Stok Amoxicillin 500 mg tidak mencukupi: tersedia 60, dibutuhkan 100." |

Store adalah satu-satunya tempat aturan bisnis hidup (spec, "Aturan bisnis hidup di dalam store
atau fungsi domain murni"). Konsekuensinya, pesan penolakan tidak ditulis ulang di komponen:
layar menampilkan `hasil.alasan` apa adanya. Ini yang membuat aturan yang sama berlaku dari layar
mana pun, dan membuat test store menjadi test perilaku yang terlihat pengguna.

**Pesan muncul di dekat kolom yang salah, dengan `role="alert"` hanya bila akibat isian.** Pesan
kolom formulir memakai `aria-invalid` dan `aria-describedby` yang menunjuk pesan itu, sehingga
pembaca layar membacakannya saat fokus masuk. `role="alert"` dipakai untuk pesan yang muncul
akibat ketikan responden; pesan yang sudah tampil sejak awal (mis. "Bed pilihan tidak lagi
tersedia") sengaja tidak memakai alert agar tidak mengumumkan ulang setiap render.

**Aksi yang sulit dibatalkan dikonfirmasi lebih dulu.** Penyerahan obat, reset data demo, dan
override checkout semuanya menampilkan konsekuensinya sebelum tombol akhir ditekan — mis. "Stok
obat berkurang saat itu juga dan biaya obat masuk ke tagihan pasien. Status resep tidak dapat
dikembalikan setelah ini." Dialog konfirmasi hanya ditutup setelah store menerima aksi, sehingga
penolakan tidak tampak seperti keberhasilan.

**Kelebihan bayar diperingatkan, bukan dilarang.** Kasir yang mengetik jumlah melebihi sisa
tagihan melihat selisihnya dalam peringatan dan label tombolnya berubah menjadi "Catat pembayaran
dengan kelebihan" (spec, user story 77). Melarangnya sepenuhnya akan menghalangi kasus nyata
(pembulatan, titipan); membiarkannya tanpa peringatan akan membuat kelebihan bayar tidak
disadari.

**Tagihan lunas menolak pembayaran tambahan dengan penjelasan.** Alih-alih menyembunyikan
formulir, layar menampilkan alasan penolakan: "Tagihan ini sudah lunas. Pembayaran tambahan
ditolak agar tidak terjadi pembayaran ganda." Pengguna yang tidak melihat tombol tanpa penjelasan
akan mengira ada yang rusak.

**Checkout yang diblokir menyebut langkah berikutnya.** Bukan hanya "tidak bisa", tetapi
"Catat pelunasan di kolom pembayaran di atas, atau minta Admin melakukan override dengan alasan."
Tombol **Override checkout** hanya dirender untuk pemegang izinnya, sehingga kasir tidak melihat
jalan pintas yang akan ditolak store.

**Rekam medis tidak dapat dihapus; koreksi dibuat sebagai catatan baru.** Ini keputusan domain
(spec, "Rekam medis bersifat append-only"), tetapi antarmukanya juga dirancang: catatan asli tetap
tampil dengan penanda **Telah dikoreksi** dan penunjuk dua arah ke koreksinya, sehingga pembaca
tidak salah membaca informasi lama (spec, user story 54). Kesalahan tidak disembunyikan; ia
diterangkan.

**Kondisi kosong menjelaskan penyebab dan langkah berikutnya.** Setiap daftar dan laporan memiliki
kondisi kosong yang menyebutkan mengapa kosong dan apa yang harus dilakukan — mis. "Belum ada
pasien yang sedang dirawat. Selesaikan pendaftaran untuk mengisi daftar ini." dan untuk laporan
periode tanpa data, "Coba lebarkan rentang tanggal atau pilih bulan lain." Layar kosong tanpa
penjelasan mudah disalahartikan sebagai aplikasi rusak (spec, user story 106).

**Data yang hilang setelah reset dijelaskan, bukan membuat layar rusak.** Panel yang menunjuk
entitas yang sudah tidak ada (mis. bukti pendaftaran setelah data direset) menampilkan penjelasan
beserta jalan keluarnya, bukan melempar galat: "Data admisi tidak lagi tersedia, mungkin karena
data demo direset. Mulai pendaftaran baru." Kalimat yang sama dipakai konsisten di pendaftaran,
klinis, dan kasir.

---

## 5. Hal yang tidak diputuskan di dokumen ini

- **Aturan bisnis** (lama inap, biaya kamar per segmen, status tagihan turunan, urutan status
  resep) bukan keputusan desain antarmuka. Lihat spec, "Aturan domain yang dikunci", dan
  ADR-0002 untuk aturan lama inap.
- **Batas modul dan bentuk sistem** dijelaskan di ADR-0001; dokumen ini hanya merujuknya.
- **Tangkapan layar dan temuan usability** adalah isi laporan akhir, bukan rasional desain.
  Template dan tata caranya ada di `docs/usability/`.

Rasional di atas adalah keadaan pada commit yang diuji. Bila usability testing menghasilkan
temuan yang mengubah keputusan, perbarui bagian yang bersangkutan dan sebutkan commit tempat
perubahan itu terjadi — riwayat iterasi desain adalah bagian dari bukti proses (spec,
"Further Notes").
