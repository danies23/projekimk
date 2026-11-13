import type { Action, Store, StoreDeps } from "./actions";
import { cloneState } from "./state";
import { audit } from "./audit";
import { IZIN_AKSI, boleh } from "./izin";
import { alasanBedTidakTersedia, pasienDenganNik } from "./selectors";
import { nilaiTagihan } from "./tagihan";
import type { Admisi, Bed, Hasil, Pasien, State } from "./types";

type Handler<A extends Action> = (draft: State, action: A, deps: StoreDeps) => Hasil;

/** Tanggal kalender harus `YYYY-MM-DD` yang benar-benar ada di kalender. */
function tanggalValid(tanggal: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) return false;
  const [tahun, bulan, hari] = tanggal.split("-").map(Number) as [number, number, number];
  const d = new Date(Date.UTC(tahun, bulan - 1, hari));
  return d.getUTCFullYear() === tahun && d.getUTCMonth() === bulan - 1 && d.getUTCDate() === hari;
}

/** Rupiah dan jumlah obat tidak boleh pecahan; sisa pecahan akan mengacaukan pembulatan tagihan. */
function bulatPositif(nilai: number): boolean {
  return Number.isInteger(nilai) && nilai > 0;
}

/** Nomor Rekam Medis = RM-<tahun>-<urut>, urut per tahun (GLOSSARY.md). */
function nomorRM(state: State, hariIni: string): string {
  const tahun = hariIni.slice(0, 4);
  const urut = (state.urutanRM[tahun] ?? 0) + 1;
  state.urutanRM[tahun] = urut;
  return `RM-${tahun}-${urut}`;
}

function bed(state: State, bedId: string): Bed | undefined {
  return state.bed.find((b) => b.id === bedId);
}

/**
 * Satu bed hanya boleh menempati satu admisi aktif. Pesan penolakan hidup di
 * selector agar pemilih bed menampilkan kalimat yang persis sama.
 */
function bedTersedia(state: State, bedId: string): { ok: true } | { ok: false; alasan: string } {
  const alasan = alasanBedTidakTersedia(state, bedId);
  return alasan ? { ok: false, alasan } : { ok: true };
}

const pasienDibuat: Handler<Extract<Action, { type: "pasien/dibuat" }>> = (draft, action, deps) => {
  const { input } = action;
  if (!input.nama.trim()) return { ok: false, alasan: "Nama pasien wajib diisi." };
  if (pasienDenganNik(draft, input.nik)) {
    return { ok: false, alasan: `NIK ${input.nik} sudah terdaftar. Periksa kembali data pasien.` };
  }
  const pasien: Pasien = {
    id: deps.id("pasien"),
    nomorRM: nomorRM(draft, deps.hariIni()),
    ...input,
  };
  draft.pasien.push(pasien);
  audit(draft, deps, action.olehId, {
    aksi: "pasien.dibuat",
    entitas: "pasien",
    entitasId: pasien.id,
    ringkasan: `Pasien ${pasien.nama} dibuat dengan Nomor Rekam Medis ${pasien.nomorRM}.`,
  });
  return { ok: true, id: pasien.id };
};

const admisiDibuat: Handler<Extract<Action, { type: "admisi/dibuat" }>> = (draft, action, deps) => {
  const pasien = draft.pasien.find((p) => p.id === action.pasienId);
  if (!pasien) return { ok: false, alasan: "Pasien tidak ditemukan." };
  const dokter = draft.pengguna.find((p) => p.id === action.dokterId && p.peran === "dokter" && p.aktif);
  if (!dokter) return { ok: false, alasan: "Pilih dokter penanggung jawab yang masih aktif." };

  if (!tanggalValid(action.tanggalMasuk)) {
    return { ok: false, alasan: "Tanggal masuk harus berupa tanggal kalender yang valid." };
  }
  if (action.tanggalMasuk > deps.hariIni()) {
    return { ok: false, alasan: "Tanggal masuk tidak boleh di masa depan." };
  }

  const tersedia = bedTersedia(draft, action.bedId);
  if (!tersedia.ok) return tersedia;

  const target = bed(draft, action.bedId)!;
  const waktu = deps.sekarang();
  const admisi: Admisi = {
    id: deps.id("admisi"),
    pasienId: pasien.id,
    dokterId: dokter.id,
    bedId: target.id,
    tanggalMasuk: action.tanggalMasuk,
    tanggalPulang: null,
    diagnosaAwal: action.diagnosaAwal,
    status: "aktif",
    segmenBed: [{ bedId: target.id, kamarId: target.kamarId, dari: waktu, sampai: null }],
    overrideCheckout: null,
  };
  draft.admisi.push(admisi);
  target.status = "terisi";
  // Tagihan dibuat otomatis agar kasir tidak pernah membuatnya manual.
  draft.tagihan.push({ id: deps.id("tagihan"), admisiId: admisi.id });

  audit(draft, deps, action.olehId, {
    aksi: "admisi.dibuat",
    entitas: "admisi",
    entitasId: admisi.id,
    ringkasan: `Admisi ${pasien.nama} dibuat dengan dokter ${dokter.nama}.`,
  });
  audit(draft, deps, action.olehId, {
    aksi: "bed.dialokasikan",
    entitas: "bed",
    entitasId: target.id,
    ringkasan: `Bed ${target.kode} dialokasikan untuk ${pasien.nama}.`,
  });
  return { ok: true, id: admisi.id };
};

const pindahBed: Handler<Extract<Action, { type: "admisi/pindah-bed" }>> = (draft, action, deps) => {
  const admisi = draft.admisi.find((a) => a.id === action.admisiId);
  if (!admisi) return { ok: false, alasan: "Admisi tidak ditemukan." };
  if (admisi.status !== "aktif") return { ok: false, alasan: "Admisi ini sudah selesai." };
  if (admisi.bedId === action.bedId) return { ok: false, alasan: "Pasien sudah berada di bed tersebut." };

  const tersedia = bedTersedia(draft, action.bedId);
  if (!tersedia.ok) return tersedia;

  const lama = bed(draft, admisi.bedId)!;
  const baru = bed(draft, action.bedId)!;
  const waktu = deps.sekarang();

  lama.status = "dibersihkan";
  baru.status = "terisi";
  admisi.bedId = baru.id;
  const segmenAkhir = admisi.segmenBed.at(-1);
  if (segmenAkhir) segmenAkhir.sampai = waktu;
  admisi.segmenBed.push({ bedId: baru.id, kamarId: baru.kamarId, dari: waktu, sampai: null });

  const pasien = draft.pasien.find((p) => p.id === admisi.pasienId);
  audit(draft, deps, action.olehId, {
    aksi: "bed.dipindah",
    entitas: "admisi",
    entitasId: admisi.id,
    ringkasan: `${pasien?.nama ?? "Pasien"} dipindahkan dari bed ${lama.kode} ke bed ${baru.kode}.`,
  });
  return { ok: true, id: admisi.id };
};

const bedSiap: Handler<Extract<Action, { type: "bed/siap" }>> = (draft, action, deps) => {
  const target = bed(draft, action.bedId);
  if (!target) return { ok: false, alasan: "Bed tidak ditemukan." };
  if (target.status !== "dibersihkan") {
    return { ok: false, alasan: `Bed ${target.kode} sedang tidak menunggu dibersihkan.` };
  }
  target.status = "kosong";
  audit(draft, deps, action.olehId, {
    aksi: "bed.siap",
    entitas: "bed",
    entitasId: target.id,
    ringkasan: `Bed ${target.kode} siap dipakai kembali.`,
  });
  return { ok: true, id: target.id };
};

const checkout: Handler<Extract<Action, { type: "checkout" }>> = (draft, action, deps) => {
  const admisi = draft.admisi.find((a) => a.id === action.admisiId);
  if (!admisi) return { ok: false, alasan: "Admisi tidak ditemukan." };
  if (admisi.status !== "aktif") return { ok: false, alasan: "Admisi ini sudah selesai." };

  const tagihan = draft.tagihan.find((t) => t.admisiId === admisi.id);
  const belumLunas = tagihan ? nilaiTagihan(draft, tagihan.id, deps.hariIni()).sisa > 0 : false;
  if (belumLunas && !action.override) {
    return {
      ok: false,
      alasan: "Checkout diblokir karena tagihan belum lunas. Selesaikan pembayaran atau minta override Admin.",
    };
  }
  if (belumLunas && action.override) {
    if (!action.override.alasan.trim()) {
      return { ok: false, alasan: "Override checkout wajib disertai alasan." };
    }
    // Aturan override hidup di matriks izin, bukan diulang di sini.
    const pelaku = draft.pengguna.find((p) => p.id === action.olehId);
    if (!pelaku || !boleh(pelaku.peran, "checkout.override")) {
      return { ok: false, alasan: "Hanya Admin yang dapat melakukan override checkout." };
    }
    admisi.overrideCheckout = {
      alasan: action.override.alasan.trim(),
      olehId: action.olehId,
      pada: deps.sekarang(),
    };
    audit(draft, deps, action.olehId, {
      aksi: "checkout.override",
      entitas: "admisi",
      entitasId: admisi.id,
      ringkasan: `Override checkout dengan alasan: ${admisi.overrideCheckout.alasan}`,
    });
  }

  const waktu = deps.sekarang();
  admisi.status = "selesai";
  admisi.tanggalPulang = deps.hariIni();
  const segmenAkhir = admisi.segmenBed.at(-1);
  if (segmenAkhir) segmenAkhir.sampai = waktu;

  const target = bed(draft, admisi.bedId);
  if (target) target.status = "dibersihkan";

  const pasien = draft.pasien.find((p) => p.id === admisi.pasienId);
  audit(draft, deps, action.olehId, {
    aksi: "checkout",
    entitas: "admisi",
    entitasId: admisi.id,
    ringkasan: `Admisi ${pasien?.nama ?? ""} ditutup; bed ${target?.kode ?? ""} menunggu dibersihkan.`,
  });
  return { ok: true, id: admisi.id };
};

const pembayaranDicatat: Handler<Extract<Action, { type: "pembayaran/dicatat" }>> = (draft, action, deps) => {
  const tagihan = draft.tagihan.find((t) => t.id === action.tagihanId);
  if (!tagihan) return { ok: false, alasan: "Tagihan tidak ditemukan." };
  if (!bulatPositif(action.jumlah)) {
    return { ok: false, alasan: "Jumlah pembayaran harus bilangan bulat lebih dari nol." };
  }
  const nilai = nilaiTagihan(draft, tagihan.id, deps.hariIni());
  if (nilai.status === "lunas") {
    return { ok: false, alasan: "Tagihan ini sudah lunas, pembayaran tambahan tidak diperlukan." };
  }

  const pembayaran = {
    id: deps.id("pembayaran"),
    tagihanId: tagihan.id,
    jumlah: action.jumlah,
    metode: action.metode,
    waktu: deps.sekarang(),
    kasirId: action.olehId,
  };
  draft.pembayaran.push(pembayaran);
  audit(draft, deps, action.olehId, {
    aksi: "pembayaran.dicatat",
    entitas: "tagihan",
    entitasId: tagihan.id,
    ringkasan: `Pembayaran Rp${action.jumlah.toLocaleString("id-ID")} dicatat dengan metode ${action.metode}.`,
  });
  return { ok: true, id: pembayaran.id };
};

const penggunaDibuat: Handler<Extract<Action, { type: "pengguna/dibuat" }>> = (draft, action, deps) => {
  const pengguna = {
    id: action.input.id ?? deps.id("pengguna"),
    nama: action.input.nama,
    peran: action.input.peran,
    aktif: action.input.aktif ?? true,
  };
  draft.pengguna.push(pengguna);
  audit(draft, deps, action.olehId, {
    aksi: "pengguna.dibuat",
    entitas: "pengguna",
    entitasId: pengguna.id,
    ringkasan: `Pengguna ${pengguna.nama} (${pengguna.peran}) dibuat.`,
  });
  return { ok: true, id: pengguna.id };
};

const catatanDitulis: Handler<Extract<Action, { type: "catatan/ditulis" }>> = (draft, action, deps) => {
  const admisi = draft.admisi.find((a) => a.id === action.admisiId);
  if (!admisi) return { ok: false, alasan: "Admisi tidak ditemukan." };
  if (!action.isi.trim()) return { ok: false, alasan: "Isi catatan tidak boleh kosong." };

  const catatan = {
    id: deps.id("catatan"),
    admisiId: admisi.id,
    penulisId: action.olehId,
    jenis: action.jenis,
    waktu: deps.sekarang(),
    isi: action.isi.trim(),
    diagnosa: action.diagnosa,
    rencana: action.rencana,
    tandaVital: action.tandaVital,
    koreksiUntukId: null,
    dikoreksiOlehId: null,
  };
  draft.catatanKlinis.push(catatan);
  audit(draft, deps, action.olehId, {
    aksi: "rekam_medis.ditulis",
    entitas: "catatan",
    entitasId: catatan.id,
    ringkasan: `Catatan ${action.jenis} ditambahkan pada admisi ${admisi.id}.`,
  });
  return { ok: true, id: catatan.id };
};

const catatanDikoreksi: Handler<Extract<Action, { type: "catatan/dikoreksi" }>> = (draft, action, deps) => {
  const asli = draft.catatanKlinis.find((c) => c.id === action.catatanId);
  if (!asli) return { ok: false, alasan: "Catatan tidak ditemukan." };
  if (asli.dikoreksiOlehId) return { ok: false, alasan: "Catatan ini sudah dikoreksi." };
  if (!action.isi.trim()) return { ok: false, alasan: "Isi koreksi tidak boleh kosong." };

  const koreksi = {
    ...structuredClone(asli),
    id: deps.id("catatan"),
    penulisId: action.olehId,
    waktu: deps.sekarang(),
    isi: action.isi.trim(),
    koreksiUntukId: asli.id,
    dikoreksiOlehId: null,
  };
  asli.dikoreksiOlehId = koreksi.id;
  draft.catatanKlinis.push(koreksi);
  audit(draft, deps, action.olehId, {
    aksi: "rekam_medis.dikoreksi",
    entitas: "catatan",
    entitasId: koreksi.id,
    ringkasan: `Catatan ${asli.id} dikoreksi; catatan asli tetap tersimpan.`,
  });
  return { ok: true, id: koreksi.id };
};

const resepDibuat: Handler<Extract<Action, { type: "resep/dibuat" }>> = (draft, action, deps) => {
  const admisi = draft.admisi.find((a) => a.id === action.admisiId);
  if (!admisi) return { ok: false, alasan: "Admisi tidak ditemukan." };
  // Resep pada admisi selesai akan mengubah tagihan yang sudah ditutup.
  if (admisi.status !== "aktif") return { ok: false, alasan: "Admisi ini sudah selesai." };
  if (action.items.length === 0) return { ok: false, alasan: "Resep harus memuat minimal satu obat." };

  const items = [];
  for (const item of action.items) {
    const obat = draft.obat.find((o) => o.id === item.obatId);
    if (!obat) return { ok: false, alasan: `Obat ${item.obatId} tidak ditemukan di master obat.` };
    if (!bulatPositif(item.jumlah)) {
      return { ok: false, alasan: `Jumlah ${obat.nama} harus bilangan bulat lebih dari nol.` };
    }
    items.push({ obatId: obat.id, nama: obat.nama, jumlah: item.jumlah, aturanPakai: item.aturanPakai, harga: obat.harga });
  }

  const resep = {
    id: deps.id("resep"),
    admisiId: admisi.id,
    dokterId: action.olehId,
    waktu: deps.sekarang(),
    status: "menunggu" as const,
    items,
  };
  draft.resep.push(resep);
  audit(draft, deps, action.olehId, {
    aksi: "resep.dibuat",
    entitas: "resep",
    entitasId: resep.id,
    ringkasan: `Resep dengan ${items.length} obat dibuat untuk admisi ${admisi.id}.`,
  });
  return { ok: true, id: resep.id };
};

const resepSiapkan: Handler<Extract<Action, { type: "resep/siapkan" }>> = (draft, action, deps) => {
  const resep = draft.resep.find((r) => r.id === action.resepId);
  if (!resep) return { ok: false, alasan: "Resep tidak ditemukan." };
  if (resep.status !== "menunggu") {
    return { ok: false, alasan: `Resep berstatus ${resep.status} tidak dapat disiapkan lagi.` };
  }
  resep.status = "disiapkan";
  audit(draft, deps, action.olehId, {
    aksi: "resep.status",
    entitas: "resep",
    entitasId: resep.id,
    ringkasan: "Resep mulai disiapkan.",
  });
  return { ok: true, id: resep.id };
};

const resepSerahkan: Handler<Extract<Action, { type: "resep/serahkan" }>> = (draft, action, deps) => {
  const resep = draft.resep.find((r) => r.id === action.resepId);
  if (!resep) return { ok: false, alasan: "Resep tidak ditemukan." };
  if (resep.status !== "disiapkan") {
    return { ok: false, alasan: "Siapkan resep terlebih dahulu sebelum menyerahkan obat." };
  }
  // Baris berisi obat yang sama dijumlahkan lebih dulu. Tanpa ini, dua baris
  // 80 tablet masing-masing lolos pemeriksaan terhadap stok 100.
  const kebutuhan = new Map<string, number>();
  for (const item of resep.items) {
    kebutuhan.set(item.obatId, (kebutuhan.get(item.obatId) ?? 0) + item.jumlah);
  }
  for (const [obatId, jumlah] of kebutuhan) {
    const obat = draft.obat.find((o) => o.id === obatId);
    if (!obat) return { ok: false, alasan: "Obat pada resep tidak ditemukan di master obat." };
    if (obat.stok < jumlah) {
      return { ok: false, alasan: `Stok ${obat.nama} tidak mencukupi: tersedia ${obat.stok}, dibutuhkan ${jumlah}.` };
    }
  }

  const waktu = deps.sekarang();
  for (const item of resep.items) {
    const obat = draft.obat.find((o) => o.id === item.obatId)!;
    obat.stok -= item.jumlah;
    draft.mutasiStok.push({
      id: deps.id("mutasi"),
      obatId: obat.id,
      jenis: "keluar",
      jumlah: item.jumlah,
      waktu,
      keterangan: `Penyerahan resep ${resep.id}`,
      olehId: action.olehId,
    });
  }
  resep.status = "diserahkan";
  audit(draft, deps, action.olehId, {
    aksi: "obat.diserahkan",
    entitas: "resep",
    entitasId: resep.id,
    ringkasan: `Obat pada resep ${resep.id} diserahkan dan stok berkurang.`,
  });
  return { ok: true, id: resep.id };
};

const stokMasuk: Handler<Extract<Action, { type: "obat/stok-masuk" }>> = (draft, action, deps) => {
  const obat = draft.obat.find((o) => o.id === action.obatId);
  if (!obat) return { ok: false, alasan: "Obat tidak ditemukan." };
  if (!bulatPositif(action.jumlah)) {
    return { ok: false, alasan: "Jumlah barang masuk harus bilangan bulat lebih dari nol." };
  }
  obat.stok += action.jumlah;
  draft.mutasiStok.push({
    id: deps.id("mutasi"),
    obatId: obat.id,
    jenis: "masuk",
    jumlah: action.jumlah,
    waktu: deps.sekarang(),
    keterangan: action.keterangan,
    olehId: action.olehId,
  });
  audit(draft, deps, action.olehId, {
    aksi: "obat.stok_masuk",
    entitas: "obat",
    entitasId: obat.id,
    ringkasan: `${action.jumlah} ${obat.satuan} ${obat.nama} masuk; stok kini ${obat.stok}.`,
  });
  return { ok: true, id: obat.id };
};

const tindakanDitambahkan: Handler<Extract<Action, { type: "tindakan/ditambahkan" }>> = (draft, action, deps) => {
  const admisi = draft.admisi.find((a) => a.id === action.admisiId);
  if (!admisi) return { ok: false, alasan: "Admisi tidak ditemukan." };
  // Tindakan pada admisi selesai akan mengubah tagihan yang sudah ditutup.
  if (admisi.status !== "aktif") return { ok: false, alasan: "Admisi ini sudah selesai." };
  const master = draft.tindakanMaster.find((t) => t.id === action.tindakanId);
  if (!master || !master.aktif) return { ok: false, alasan: "Tindakan ini tidak tersedia." };

  // Tarif disalin: perubahan master tidak boleh mengubah tagihan yang sudah terjadi.
  const tindakan = {
    id: deps.id("tindakan-admisi"),
    admisiId: admisi.id,
    tindakanId: master.id,
    nama: master.nama,
    tarif: master.tarif,
    waktu: deps.sekarang(),
    olehId: action.olehId,
  };
  draft.tindakanAdmisi.push(tindakan);
  audit(draft, deps, action.olehId, {
    aksi: "tindakan.ditambahkan",
    entitas: "admisi",
    entitasId: admisi.id,
    ringkasan: `Tindakan ${master.nama} ditambahkan dengan tarif Rp${master.tarif.toLocaleString("id-ID")}.`,
  });
  return { ok: true, id: tindakan.id };
};

const tindakanMasterDiubah: Handler<Extract<Action, { type: "tindakan-master/diubah" }>> = (draft, action, deps) => {
  const master = draft.tindakanMaster.find((t) => t.id === action.tindakanId);
  if (!master) return { ok: false, alasan: "Tindakan tidak ditemukan." };
  Object.assign(master, action.perubahan);
  audit(draft, deps, action.olehId, {
    aksi: "tindakan_master.diubah",
    entitas: "tindakan_master",
    entitasId: master.id,
    ringkasan: `Master tindakan ${master.nama} diperbarui.`,
  });
  return { ok: true, id: master.id };
};

const handlers: { [K in Action["type"]]: Handler<Extract<Action, { type: K }>> } = {
  "pasien/dibuat": pasienDibuat,
  "admisi/dibuat": admisiDibuat,
  "admisi/pindah-bed": pindahBed,
  "bed/siap": bedSiap,
  checkout,
  "pembayaran/dicatat": pembayaranDicatat,
  "pengguna/dibuat": penggunaDibuat,
  "catatan/ditulis": catatanDitulis,
  "catatan/dikoreksi": catatanDikoreksi,
  "resep/dibuat": resepDibuat,
  "resep/siapkan": resepSiapkan,
  "resep/serahkan": resepSerahkan,
  "obat/stok-masuk": stokMasuk,
  "tindakan/ditambahkan": tindakanDitambahkan,
  "tindakan-master/diubah": tindakanMasterDiubah,
};

export function createStore(initial: State, deps: StoreDeps): Store {
  let state = initial;
  let awal = initial;
  const listeners = new Set<() => void>();

  return {
    getState: () => state,
    dispatch(action: Action): Hasil {
      const pelaku = state.pengguna.find((p) => p.id === action.olehId);
      if (!pelaku || !pelaku.aktif) {
        return { ok: false, alasan: "Pengguna tidak dikenal atau tidak aktif. Masuk kembali sebagai akun demo." };
      }
      const izin = IZIN_AKSI[action.type];
      if (!boleh(pelaku.peran, izin)) {
        return { ok: false, alasan: `Peran ${pelaku.peran} tidak berhak melakukan aksi ini.` };
      }

      const draft = cloneState(state);
      const hasil = (handlers[action.type] as Handler<Action>)(draft, action, deps);
      if (hasil.ok) {
        state = draft;
        for (const listener of listeners) listener();
      }
      return hasil;
    },
    reset: (stateAwal?: State) => {
      awal = stateAwal ? cloneState(stateAwal) : awal;
      state = cloneState(awal);
      for (const listener of listeners) listener();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
