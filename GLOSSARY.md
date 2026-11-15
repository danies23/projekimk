# Dani Medical Center — Administrasi Rawat Inap

Sistem administrasi rawat inap untuk Dani Medical Center. Cakupan MVP: pendaftaran pasien rawat inap sampai checkout, termasuk alokasi bed, pelayanan medis, farmasi, tagihan, dan pelaporan.

## Language

### Organisasi & Pengguna

**Dani Medical Center**:
Rumah sakit tempat sistem ini dipakai.
_Avoid_: RS, rumah sakit (di dokumen produk; sebutan generik boleh di percakapan informal)

**Petugas Pendaftaran**:
Pengguna yang menginput data pasien dan membuat admisi rawat inap.
_Avoid_: Resepsionis, admin pendaftaran, front desk

**Pimpinan**:
Pengguna dengan akses laporan dan dashboard, tanpa hak mengubah data.
_Avoid_: Manajer, direktur, owner (kecuali merujuk jabatan yang memang berbeda)

### Pasien & Admisi

**Pasien**:
Orang yang menerima layanan rawat inap. Pada MVP tidak login; datanya diinput petugas.
_Avoid_: Klien, customer, user

**Nomor Rekam Medis**:
Identitas tetap pasien di sistem, berformat `RM-<tahun>-<urut>`, urut per tahun, dan tidak pernah berubah.
_Avoid_: No. RM, MRN, patient ID, nomor pasien

**Admisi**:
Satu episode rawat inap: satu pasien masuk, menempati bed, lalu keluar. Satu pasien bisa punya banyak admisi sepanjang hidupnya.
_Avoid_: Pendaftaran, registration, kunjungan, episode, encounter

**Checkout**:
Tindakan menutup admisi: pasien pulang dan bed-nya kembali tersedia.
_Avoid_: Discharge, keluar, pulang (sebagai nama aksi di sistem)

**Lama Inap**:
Jumlah hari kalender admisi, dihitung **inklusif**: hari masuk dan hari pulang sama-sama dihitung. Masuk 1 Januari dan pulang 3 Januari = 3 hari; masuk dan pulang di hari yang sama = 1 hari.
_Avoid_: Hari rawat, length of stay, LOS

### Kamar & Bed

**Kamar**:
Ruangan rawat inap dengan kelas (VIP/I/II/III) dan tarif harian.
_Avoid_: Ruang, ward, bangsal

**Bed**:
Tempat tidur individual di dalam kamar; unit terkecil yang dialokasikan ke satu admisi.
_Avoid_: Tempat tidur, ranjang, bed number (sebagai konsep; `code` boleh sebagai nama kolom)

**Alokasi Bed**:
Penetapan satu bed ke satu admisi aktif. Bed yang sama tidak boleh dialokasikan ke dua admisi aktif sekaligus.
_Avoid_: Assign, booking, reservasi

**Bentrok Alokasi**:
Kondisi ketika dua petugas memilih bed yang sama. Tanggapannya: tolak pilihan kedua dengan pesan jelas; petugas memilih ulang.
_Avoid_: Race condition, konflik (sebagai istilah domain)

**Status Bed**:
Salah satu dari `terisi`, `kosong`, atau `dibersihkan`. Bed yang baru ditinggal pasien berstatus `dibersihkan` dan baru menjadi `kosong` setelah petugas menandainya siap dipakai.
_Avoid_: Status kamar, dirty, cleaning (sebagai istilah domain)

### Klinis

**Rekam Medis**:
Catatan klinis yang ditulis penulisnya (dokter/perawat), bersifat *append-only*: tidak bisa dihapus, koreksi dilakukan dengan entri baru yang meneruskan jejak audit.
_Avoid_: Medical record (sebagai nama konsep di percakapan; nama tabel boleh), EMR, riwayat pasien

**Visite**:
Kunjungan dokter ke pasien rawat inap yang menghasilkan catatan klinis.
_Avoid_: Ronda, round

**Tindakan**:
Prosedur medis berbayar yang dikerjakan pada pasien dan punya tarif.
_Avoid_: Prosedur, action, layanan

**Instruksi**:
Rencana pada catatan visite dokter yang harus dijalankan perawat. Perawat menandainya sudah dijalankan sebagai entri terpisah, bukan dengan mengubah catatan dokter.
_Avoid_: Order, task, perintah, to-do

**Resep**:
Perintah obat dari dokter untuk satu admisi, diteruskan ke Farmasi.
_Avoid_: Prescription (di percakapan), order obat

### Farmasi

**Obat**:
Item farmasi dengan satuan, harga, stok, dan stok minimum.
_Avoid_: Barang, medicine (di percakapan), drug

**Penyerahan Obat**:
Aksi apoteker menyerahkan obat atas sebuah resep; stok berkurang pada saat ini.
_Avoid_: Dispense, dispensing (di percakapan), pengeluaran obat

### Keuangan

**Tagihan**:
Total kewajiban bayar satu admisi, gabungan biaya kamar, tindakan, dan obat.
_Avoid_: Invoice (di percakapan), bill, nota

**Rincian Tagihan**:
Baris-baris penyusun tagihan (kamar / tindakan / obat) beserta kuantitas dan subtotal.
_Avoid_: Invoice item (di percakapan), item tagihan

**Pembayaran**:
Uang yang diterima kasir atas sebuah tagihan. Boleh sebagian.
_Avoid_: Payment (di percakapan), cicilan, angsuran

**Status Tagihan**:
Salah satu dari `belum bayar`, `sebagian`, atau `lunas`. Lunas berarti total pembayaran ≥ total tagihan.
_Avoid_: Status pembayaran, paid/unpaid

**Override Checkout**:
Pembukaan blokir checkout oleh Admin ketika tagihan belum lunas. Wajib disertai alasan dan tercatat di audit log.
_Avoid_: Bypass, pengecualian, force discharge

### Dokumen & Antarmuka

**Pratinjau Cetak**:
Tampilan dokumen (bukti pendaftaran, kuitansi, rincian tagihan) dalam tata letak halaman yang siap dicetak; tombol "Cetak" memanggil dialog cetak peramban. Dokumen bukan berkas PDF terpisah.
_Avoid_: PDF, unduhan, export

**Audit Log**:
Catatan append-only berisi waktu, pengguna, aksi, dan entitas yang berubah. Dapat dilihat Admin pada satu layar khusus.
_Avoid_: Log sistem, activity log, history

**Data Demo**:
Data awal contoh yang dimuat ke penyimpanan lokal peramban (localStorage) dan dapat dikembalikan ke kondisi awal lewat tombol "Reset data demo".
_Avoid_: Seed, fixture, dummy data (di percakapan produk)
