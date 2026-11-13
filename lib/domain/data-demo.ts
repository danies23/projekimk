import { AKUN_DEMO, ID } from "./demo-accounts";
import { geserTanggal } from "./lama-inap";
import { buatStateKosong } from "./state";
import { createStore } from "./store";
import { nilaiTagihan } from "./tagihan";
import type { Bed, Kamar, State, Tanggal } from "./types";

/**
 * Data demo deterministik. Tanggal selalu dibangkitkan relatif terhadap
 * `hariIni`, sehingga tren 30 hari dan laporan periode tidak pernah kosong.
 * Seluruh data dibentuk lewat aksi store yang sama dengan yang dipakai
 * aplikasi, jadi aturan seperti Nomor Rekam Medis, stok, dan tagihan tidak
 * diduplikasi di sini.
 */

const NAMA_PASIEN: Array<{ nama: string; jk: "L" | "P"; lahir: string }> = [
  { nama: "Ahmad Fauzi", jk: "L", lahir: "1968-04-12" },
  { nama: "Siti Rahmawati", jk: "P", lahir: "1972-09-03" },
  { nama: "Bambang Sutrisno", jk: "L", lahir: "1959-12-21" },
  { nama: "Dewi Anggraini", jk: "P", lahir: "1985-06-17" },
  { nama: "Eko Prasetyo", jk: "L", lahir: "1990-02-08" },
  { nama: "Fitri Handayani", jk: "P", lahir: "1978-11-30" },
  { nama: "Gunawan Hidayat", jk: "L", lahir: "1965-07-14" },
  { nama: "Hesti Purwanti", jk: "P", lahir: "1993-03-25" },
  { nama: "Irfan Maulana", jk: "L", lahir: "1988-10-05" },
  { nama: "Juni Astuti", jk: "P", lahir: "1970-01-19" },
  { nama: "Kurniawan Adi", jk: "L", lahir: "1995-08-22" },
  { nama: "Lestari Ningsih", jk: "P", lahir: "1962-05-09" },
  { nama: "Muhammad Rizki", jk: "L", lahir: "1999-12-02" },
  { nama: "Nur Aisyah", jk: "P", lahir: "1983-04-27" },
  { nama: "Oki Setiawan", jk: "L", lahir: "1976-09-15" },
  { nama: "Putri Wulandari", jk: "P", lahir: "1991-07-07" },
  { nama: "Qomarudin Yusuf", jk: "L", lahir: "1957-02-11" },
  { nama: "Ratna Sari", jk: "P", lahir: "1980-10-30" },
  { nama: "Slamet Riyadi", jk: "L", lahir: "1949-06-06" },
  { nama: "Tri Wahyuni", jk: "P", lahir: "1987-01-23" },
  { nama: "Umar Said", jk: "L", lahir: "1973-03-18" },
  { nama: "Vina Marlina", jk: "P", lahir: "2001-11-29" },
  { nama: "Wahyu Setiadi", jk: "L", lahir: "1966-08-08" },
  { nama: "Yanti Susanti", jk: "P", lahir: "1979-05-16" },
  { nama: "Zainal Abidin", jk: "L", lahir: "1954-12-24" },
  { nama: "Anisa Fitriani", jk: "P", lahir: "1997-02-14" },
  { nama: "Bayu Kurniawan", jk: "L", lahir: "1992-09-09" },
  { nama: "Citra Lestari", jk: "P", lahir: "1984-06-21" },
  { nama: "Doni Saputra", jk: "L", lahir: "1981-04-03" },
  { nama: "Elis Nurhayati", jk: "P", lahir: "1958-10-12" },
  { nama: "Fajar Ramadhan", jk: "L", lahir: "2000-07-19" },
  { nama: "Gita Permata", jk: "P", lahir: "1994-12-07" },
  { nama: "Haryanto Wibowo", jk: "L", lahir: "1971-08-26" },
  { nama: "Indah Permatasari", jk: "P", lahir: "1989-01-31" },
  { nama: "Jajang Supriatna", jk: "L", lahir: "1963-03-13" },
  { nama: "Kartini Wulandari", jk: "P", lahir: "1998-05-04" },
  { nama: "Lukman Hakim", jk: "L", lahir: "1975-11-10" },
  { nama: "Maya Sari", jk: "P", lahir: "1986-09-28" },
  { nama: "Nanda Pratama", jk: "L", lahir: "2002-02-20" },
  { nama: "Oktavia Nur", jk: "P", lahir: "1996-06-01" },
];

const KAMAR_DAN_BED: Array<{ kamar: Omit<Kamar, "id"> & { id: string }; bedIds: string[] }> = [
  { kamar: { id: "kamar-anggrek", nama: "Anggrek VIP-1", kelas: "VIP", tarifHarian: 900_000, aktif: true }, bedIds: ["bed-anggrek-1", "bed-anggrek-2"] },
  { kamar: { id: "kamar-melati-1", nama: "Melati I-1", kelas: "I", tarifHarian: 600_000, aktif: true }, bedIds: ["bed-melati1-1", "bed-melati1-2"] },
  { kamar: { id: "kamar-melati-2", nama: "Melati I-2", kelas: "I", tarifHarian: 600_000, aktif: true }, bedIds: ["bed-melati2-1", "bed-melati2-2"] },
  { kamar: { id: "kamar-mawar-1", nama: "Mawar II-1", kelas: "II", tarifHarian: 400_000, aktif: true }, bedIds: ["bed-mawar1-1", "bed-mawar1-2", "bed-mawar1-3"] },
  { kamar: { id: "kamar-mawar-2", nama: "Mawar II-2", kelas: "II", tarifHarian: 400_000, aktif: true }, bedIds: ["bed-mawar2-1", "bed-mawar2-2", "bed-mawar2-3"] },
  { kamar: { id: "kamar-dahlia", nama: "Dahlia III-1", kelas: "III", tarifHarian: 250_000, aktif: true }, bedIds: ["bed-dahlia-1", "bed-dahlia-2", "bed-dahlia-3", "bed-dahlia-4"] },
];

const OBAT_DEMO: Array<{ id: string; nama: string; satuan: string; harga: number; stok: number; stokMinimum: number }> = [
  { id: "obat-paracetamol", nama: "Paracetamol 500 mg", satuan: "tablet", harga: 2_000, stok: 420, stokMinimum: 100 },
  { id: "obat-amoxicillin", nama: "Amoxicillin 500 mg", satuan: "kapsul", harga: 5_000, stok: 60, stokMinimum: 80 },
  { id: "obat-ceftriaxone", nama: "CeFtriaXone 1 g", satuan: "vial", harga: 85_000, stok: 24, stokMinimum: 10 },
  { id: "obat-ranitidin", nama: "Ranitidin 150 mg", satuan: "tablet", harga: 3_500, stok: 150, stokMinimum: 50 },
  { id: "obat-omeprazole", nama: "Omeprazole 20 mg", satuan: "kapsul", harga: 7_500, stok: 90, stokMinimum: 40 },
  { id: "obat-metformin", nama: "Metformin 500 mg", satuan: "tablet", harga: 1_500, stok: 300, stokMinimum: 100 },
  { id: "obat-amlodipine", nama: "Amlodipine 10 mg", satuan: "tablet", harga: 2_500, stok: 240, stokMinimum: 80 },
  { id: "obat-furosemide", nama: "Furosemide 40 mg", satuan: "tablet", harga: 1_800, stok: 45, stokMinimum: 60 },
  { id: "obat-ketorolac", nama: "Ketorolac 30 mg", satuan: "ampul", harga: 12_000, stok: 70, stokMinimum: 25 },
  { id: "obat-ondansetron", nama: "Ondansetron 4 mg", satuan: "ampul", harga: 15_000, stok: 55, stokMinimum: 20 },
  { id: "obat-iv-ringer", nama: "Cairan Ringer Laktat 500 ml", satuan: "kantong", harga: 18_000, stok: 120, stokMinimum: 40 },
  { id: "obat-iv-nacl", nama: "NaCl 0,9% 500 ml", satuan: "kantong", harga: 16_000, stok: 110, stokMinimum: 40 },
  { id: "obat-insulin", nama: "Insulin Rapid 100 IU", satuan: "vial", harga: 120_000, stok: 18, stokMinimum: 8 },
  { id: "obat-salbutamol", nama: "Salbutamol Inhaler", satuan: "unit", harga: 65_000, stok: 14, stokMinimum: 15 },
  { id: "obat-diazepam", nama: "Diazepam 5 mg", satuan: "tablet", harga: 4_000, stok: 35, stokMinimum: 20 },
];

const TINDAKAN_DEMO: Array<{ id: string; nama: string; tarif: number }> = [
  { id: "tindakan-infus", nama: "Pemasangan infus", tarif: 150_000 },
  { id: "tindakan-ekg", nama: "Elektrokardiografi (EKG)", tarif: 200_000 },
  { id: "tindakan-nebulisasi", nama: "Nebulisasi", tarif: 90_000 },
  { id: "tindakan-kateter", nama: "Pemasangan kateter", tarif: 175_000 },
  { id: "tindakan-ngt", nama: "Pemasangan NGT", tarif: 185_000 },
  { id: "tindakan-jahit", nama: "Penjahitan luka", tarif: 250_000 },
  { id: "tindakan-rontgen", nama: "Foto toraks", tarif: 225_000 },
  { id: "tindakan-usg", nama: "Pemeriksaan USG abdomen", tarif: 300_000 },
  { id: "tindakan-gds", nama: "Pemeriksaan gula darah sewaktu", tarif: 60_000 },
  { id: "tindakan-fisioterapi", nama: "Fisioterapi dada", tarif: 120_000 },
];

function nikUntuk(index: number, lahir: string, jk: "L" | "P"): string {
  const [tahun, bulan, tanggal] = lahir.split("-");
  const hari = jk === "P" ? String(Number(tanggal) + 40).padStart(2, "0") : tanggal!.padStart(2, "0");
  return `3271${"01"}${hari}${bulan}${tahun!.slice(2)}${String(1000 + index)}`;
}

function penggunaDemo(): State["pengguna"] {
  return AKUN_DEMO.map((akun) => ({ id: akun.id, nama: akun.nama, peran: akun.peran, aktif: true }));
}

/** Jam kerja yang wajar agar waktu kejadian tidak menumpuk di tengah malam. */
const JAM = ["08:15", "09:40", "11:05", "13:30", "15:20", "16:45"];

export function buatDataDemo(hariIni: Tanggal): State {
  const kamar: Kamar[] = KAMAR_DAN_BED.map((k) => k.kamar);
  const bed: Bed[] = KAMAR_DAN_BED.flatMap((k) =>
    k.bedIds.map((id, i) => ({ id, kamarId: k.kamar.id, kode: `${k.kamar.nama.split(" ")[0]}-${i + 1}`, status: "kosong" as const })),
  );

  let tanggal = hariIni;
  let jamKe = 0;
  let urutId = 0;
  const deps = {
    hariIni: () => tanggal,
    sekarang: () => `${tanggal}T${JAM[jamKe++ % JAM.length]}:00.000Z`,
    id: (prefix: string) => `${prefix}-demo-${++urutId}`,
  };

  const awal: State = {
    ...buatStateKosong(),
    pengguna: penggunaDemo(),
    kamar,
    bed,
    tindakanMaster: TINDAKAN_DEMO.map((t) => ({ ...t, aktif: true })),
    obat: OBAT_DEMO.map((o) => ({ ...o })),
  };
  const store = createStore(awal, deps);

  const pada = (offset: number) => {
    tanggal = geserTanggal(hariIni, offset);
  };

  // Pasien didaftarkan berpencar sepanjang tahun lalu agar Nomor Rekam Medis
  // mencakup lebih dari satu tahun anggaran.
  const pasienIds: string[] = [];
  for (let i = 0; i < NAMA_PASIEN.length; i++) {
    const orang = NAMA_PASIEN[i]!;
    pada(-420 + i * 10);
    const hasil = store.dispatch({
      type: "pasien/dibuat",
      olehId: ID.pendaftaran,
      input: {
        nama: orang.nama,
        nik: nikUntuk(i, orang.lahir, orang.jk),
        tanggalLahir: orang.lahir,
        jenisKelamin: orang.jk,
        alamat: `Jl. ${["Merdeka", "Sudirman", "Gatot Subroto", "Cendrawasih", "Kartini", "Diponegoro"][i % 6]} No. ${10 + i}, Bandung`,
        telepon: `0812${String(34560000 + i * 137)}`,
        penanggungJawab: {
          nama: `${["Budi", "Sri", "Agus", "Rina", "Hadi", "Wati"][i % 6]} ${orang.nama.split(" ").at(-1)}`,
          hubungan: i % 3 === 0 ? "Pasangan" : i % 3 === 1 ? "Anak" : "Orang tua",
          telepon: `0813${String(76540000 + i * 211)}`,
        },
      },
    });
    if (!hasil.ok) throw new Error(`data demo pasien gagal: ${hasil.alasan}`);
    pasienIds.push(hasil.id);
  }

  function buatAdmisi(pasienId: string, bedId: string, olehId: string, dokterId: string) {
    const hasil = store.dispatch({
      type: "admisi/dibuat",
      olehId,
      pasienId,
      dokterId,
      bedId,
      tanggalMasuk: tanggal,
      diagnosaAwal: ["Observasi demam", "Nyeri dada", "Sesak napas", "Diabetes tidak terkontrol", "Pascabedah"][urutId % 5]!,
    });
    if (!hasil.ok) throw new Error(`data demo admisi gagal: ${hasil.alasan}`);
    return hasil.id;
  }

  /**
   * Admisi yang sudah selesai: admisi → tindakan → bayar → checkout,
   * lalu bed ditandai siap dipakai lagi. Satu bed dibiarkan `dibersihkan`
   * pada admisi terakhir agar status itu terlihat di demo.
   */
  const bedSiklus = ["bed-mawar2-2", "bed-mawar2-3", "bed-dahlia-3", "bed-dahlia-4"];
  for (let i = 0; i < 17; i++) {
    const mulai = -62 + i * 3 + (i % 2);
    const lama = 2 + (i % 3);
    pada(mulai);
    const pasienId = pasienIds[(i + 12) % pasienIds.length]!;
    const bedId = bedSiklus[i % bedSiklus.length]!;
    const dokterId = i % 2 === 0 ? ID.dokter : ID.dokter2;

    // Bila bed masih berstatus dibersihkan dari admisi sebelumnya, siapkan dulu.
    const bedSekarang = store.getState().bed.find((b) => b.id === bedId)!;
    if (bedSekarang.status === "dibersihkan") {
      const siap = store.dispatch({ type: "bed/siap", olehId: ID.perawat, bedId });
      if (!siap.ok) throw new Error(`data demo bed siap gagal: ${siap.alasan}`);
    }

    const admisiId = buatAdmisi(pasienId, bedId, ID.pendaftaran, dokterId);
    pada(mulai + 1);
    const tindakan = store.dispatch({
      type: "tindakan/ditambahkan",
      olehId: dokterId,
      admisiId,
      tindakanId: TINDAKAN_DEMO[(i * 3) % TINDAKAN_DEMO.length]!.id,
    });
    if (!tindakan.ok) throw new Error(`data demo tindakan gagal: ${tindakan.alasan}`);

    pada(mulai + lama);
    const tagihan = store.getState().tagihan.find((t) => t.admisiId === admisiId)!;
    const total = nilaiTagihan(store.getState(), tagihan.id, tanggal).total;
    const dibayar = store.dispatch({
      type: "pembayaran/dicatat",
      olehId: ID.kasir,
      tagihanId: tagihan.id,
      jumlah: total,
      metode: i % 3 === 0 ? "tunai" : i % 3 === 1 ? "transfer" : "debit",
    });
    if (!dibayar.ok) throw new Error(`data demo pembayaran gagal: ${dibayar.alasan}`);
    const keluar = store.dispatch({ type: "checkout", olehId: ID.kasir, admisiId, override: null });
    if (!keluar.ok) throw new Error(`data demo checkout gagal: ${keluar.alasan}`);
    store.dispatch({ type: "bed/siap", olehId: ID.perawat, bedId });
  }

  // Admisi terakhir yang baru keluar kemarin: bed-nya tertinggal `dibersihkan`.
  {
    pada(-4);
    const admisiId = buatAdmisi(pasienIds[30]!, "bed-mawar1-3", ID.pendaftaran, ID.dokter);
    pada(-1);
    const tagihan = store.getState().tagihan.find((t) => t.admisiId === admisiId)!;
    const total = nilaiTagihan(store.getState(), tagihan.id, tanggal).total;
    store.dispatch({ type: "pembayaran/dicatat", olehId: ID.kasir, tagihanId: tagihan.id, jumlah: total, metode: "tunai" });
    store.dispatch({ type: "checkout", olehId: ID.kasir, admisiId, override: null });
  }

  // Admisi yang masih aktif — 10 dari 16 bed terisi (62,5%).
  const admisiAktif: Array<{ admisiId: string; bedId: string; dokterId: string; pasienId: string }> = [];
  const rencanaAktif: Array<{ pasien: number; bedId: string; masuk: number; dokterId: string }> = [
    { pasien: 0, bedId: "bed-anggrek-1", masuk: -11, dokterId: ID.dokter2 },
    { pasien: 1, bedId: "bed-anggrek-2", masuk: -8, dokterId: ID.dokter },
    { pasien: 2, bedId: "bed-melati1-1", masuk: -12, dokterId: ID.dokter },
    { pasien: 3, bedId: "bed-melati1-2", masuk: -6, dokterId: ID.dokter2 },
    { pasien: 4, bedId: "bed-melati2-2", masuk: -9, dokterId: ID.dokter },
    { pasien: 5, bedId: "bed-mawar1-1", masuk: -7, dokterId: ID.dokter2 },
    { pasien: 6, bedId: "bed-mawar1-2", masuk: -5, dokterId: ID.dokter },
    { pasien: 7, bedId: "bed-mawar2-1", masuk: -10, dokterId: ID.dokter2 },
    { pasien: 8, bedId: "bed-dahlia-1", masuk: -4, dokterId: ID.dokter },
    { pasien: 9, bedId: "bed-dahlia-2", masuk: -3, dokterId: ID.dokter2 },
  ];

  for (const rencana of rencanaAktif) {
    pada(rencana.masuk);
    const admisiId = buatAdmisi(pasienIds[rencana.pasien]!, rencana.bedId, ID.pendaftaran, rencana.dokterId);
    admisiAktif.push({ admisiId, bedId: rencana.bedId, dokterId: rencana.dokterId, pasienId: pasienIds[rencana.pasien]! });
  }

  // Satu pasien dipindahkan ke kamar lain agar riwayat perpindahan dan biaya
  // per segmen terlihat di tagihan.
  {
    const pindah = admisiAktif[4]!;
    pada(-4);
    const hasil = store.dispatch({ type: "admisi/pindah-bed", olehId: ID.perawat, admisiId: pindah.admisiId, bedId: "bed-melati2-1" });
    if (!hasil.ok) throw new Error(`data demo pindah bed gagal: ${hasil.alasan}`);
    pindah.bedId = "bed-melati2-1";
  }

  // Catatan klinis, instruksi, dan tanda vital.
  const catatanContoh: Array<[number, number, string, string, string]> = [
    [0, -10, "Pasien mengeluh nyeri dada kiri menjalar ke lengan.", "Angina pektoris stabil", "EKG ulang pagi, lanjut antiplatelet."],
    [0, -6, "Nyeri berkurang, tidak ada sesak.", "Angina pektoris stabil", "Mulai mobilisasi bertahap."],
    [1, -7, "Demam turun, nafsu makan membaik.", "Demam tifoid", "Lanjut antibiotik intravena."],
    [2, -11, "Sesak berkurang setelah nebulisasi.", "PPOK eksaserbasi akut", "Lanjut bronkodilator, evaluasi spirometri."],
    [3, -5, "Luka operasi kering, tidak ada tanda infeksi.", "Pascabedah apendektomi", "Ganti verban, mobilisasi."],
    [5, -4, "Kadar gula darah masih tinggi.", "Diabetes melitus tipe 2", "Titrasi insulin, edukasi diet."],
    [7, -3, "Pasien cemas, tidur kurang.", "Observasi aritmia", "Konsultasi psikiatri bila perlu."],
  ];
  for (const [index, offset, isi, diagnosa, rencana] of catatanContoh) {
    const admisi = admisiAktif[index]!;
    pada(offset);
    const hasil = store.dispatch({
      type: "catatan/ditulis",
      olehId: admisi.dokterId,
      admisiId: admisi.admisiId,
      jenis: "visite",
      isi,
      diagnosa,
      rencana,
      tandaVital: null,
    });
    if (!hasil.ok) throw new Error(`data demo catatan gagal: ${hasil.alasan}`);
  }

  {
    const admisi = admisiAktif[1]!;
    pada(-2);
    const hasil = store.dispatch({
      type: "catatan/ditulis",
      olehId: ID.perawat,
      admisiId: admisi.admisiId,
      jenis: "perkembangan",
      isi: "Pasien tidur nyenyak, intake cairan cukup, mobilisasi dibantu.",
      diagnosa: null,
      rencana: null,
      tandaVital: null,
    });
    if (!hasil.ok) throw new Error(`data demo catatan gagal: ${hasil.alasan}`);
  }

  const vital: Array<[number, number, { tekananDarah: string; suhu: number; nadi: number; pernapasan: number; saturasi: number }]> = [
    [0, -2, { tekananDarah: "138/86", suhu: 36.8, nadi: 84, pernapasan: 18, saturasi: 97 }],
    [1, -2, { tekananDarah: "112/72", suhu: 37.9, nadi: 96, pernapasan: 20, saturasi: 96 }],
    [3, -1, { tekananDarah: "124/78", suhu: 36.6, nadi: 78, pernapasan: 16, saturasi: 98 }],
    [5, -1, { tekananDarah: "146/92", suhu: 36.9, nadi: 88, pernapasan: 18, saturasi: 97 }],
    [8, -1, { tekananDarah: "118/76", suhu: 37.1, nadi: 82, pernapasan: 18, saturasi: 98 }],
  ];
  for (const [index, offset, tandaVital] of vital) {
    const admisi = admisiAktif[index]!;
    pada(offset);
    const hasil = store.dispatch({
      type: "catatan/ditulis",
      olehId: ID.perawat,
      admisiId: admisi.admisiId,
      jenis: "tanda_vital",
      isi: "Pemantauan tanda vital rutin.",
      diagnosa: null,
      rencana: null,
      tandaVital,
    });
    if (!hasil.ok) throw new Error(`data demo tanda vital gagal: ${hasil.alasan}`);
  }

  // Satu catatan dikoreksi agar penanda "telah dikoreksi" terlihat di demo.
  {
    const catatan = store.getState().catatanKlinis.find((c) => c.jenis === "visite" && c.admisiId === admisiAktif[1]!.admisiId);
    if (catatan) {
      pada(-1);
      store.dispatch({
        type: "catatan/dikoreksi",
        olehId: admisiAktif[1]!.dokterId,
        catatanId: catatan.id,
        isi: "Koreksi: demam turun sejak kemarin, nafsu makan belum membaik.",
      });
    }
  }

  // Resep pada ketiga status.
  const resepRencana: Array<{ index: number; obatId: string; jumlah: number; aturan: string; status: "menunggu" | "disiapkan" | "diserahkan" }> = [
    { index: 0, obatId: "obat-amlodipine", jumlah: 30, aturan: "1×1 pagi", status: "menunggu" },
    { index: 2, obatId: "obat-ranitidin", jumlah: 20, aturan: "2×1 sebelum makan", status: "menunggu" },
    { index: 1, obatId: "obat-ceftriaxone", jumlah: 4, aturan: "2×1 intravena", status: "disiapkan" },
    { index: 3, obatId: "obat-ketorolac", jumlah: 3, aturan: "3×1 intravena", status: "disiapkan" },
    { index: 5, obatId: "obat-metformin", jumlah: 30, aturan: "2×1 sesudah makan", status: "diserahkan" },
    { index: 7, obatId: "obat-furosemide", jumlah: 10, aturan: "1×1 pagi", status: "diserahkan" },
  ];
  for (const rencana of resepRencana) {
    const admisi = admisiAktif[rencana.index]!;
    pada(-2);
    const dibuat = store.dispatch({
      type: "resep/dibuat",
      olehId: admisi.dokterId,
      admisiId: admisi.admisiId,
      items: [{ obatId: rencana.obatId, jumlah: rencana.jumlah, aturanPakai: rencana.aturan }],
    });
    if (!dibuat.ok) throw new Error(`data demo resep gagal: ${dibuat.alasan}`);
    if (rencana.status !== "menunggu") {
      store.dispatch({ type: "resep/siapkan", olehId: ID.apoteker, resepId: dibuat.id });
    }
    if (rencana.status === "diserahkan") {
      pada(-1);
      const serah = store.dispatch({ type: "resep/serahkan", olehId: ID.apoteker, resepId: dibuat.id });
      if (!serah.ok) throw new Error(`data demo serah obat gagal: ${serah.alasan}`);
    }
  }

  // Sebagian tagihan admisi aktif sudah dibayar sebagian agar status
  // `sebagian` terlihat tanpa harus menyelesaikan seluruh alur dulu.
  for (const index of [0, 4, 6]) {
    const admisi = admisiAktif[index]!;
    pada(-1);
    const tagihan = store.getState().tagihan.find((t) => t.admisiId === admisi.admisiId)!;
    store.dispatch({
      type: "pembayaran/dicatat",
      olehId: ID.kasir,
      tagihanId: tagihan.id,
      jumlah: 750_000,
      metode: index === 0 ? "transfer" : "tunai",
    });
  }

  // Tambahan tindakan pada beberapa admisi aktif.
  for (const index of [0, 1, 4, 8]) {
    const admisi = admisiAktif[index]!;
    pada(-2);
    store.dispatch({
      type: "tindakan/ditambahkan",
      olehId: admisi.dokterId,
      admisiId: admisi.admisiId,
      tindakanId: TINDAKAN_DEMO[(index * 2) % TINDAKAN_DEMO.length]!.id,
    });
  }

  // Kembalikan jam ke hari ini agar seluruh pembacaan "hari ini" konsisten.
  tanggal = hariIni;
  return store.getState();
}
