import { describe, expect, it } from "vitest";
import { IDENTITAS_PASIEN, PENGGUNA_UJI, depsUji, stateDasar, stateDenganAdmisi, storeUji } from "./test-utils";
import { buatDataDemo } from "./data-demo";
import type { AksiAudit, Hasil, State } from "./types";



/**
 * Daftar aksi penting dari ticket 02. Setiap aksi harus meninggalkan entri
 * audit berisi waktu, pengguna, aksi, entitas, dan ringkasan.
 */
const AKSI_PENTING: AksiAudit[] = [
  "pasien.dibuat",
  "admisi.dibuat",
  "bed.dialokasikan",
  "bed.dipindah",
  "bed.siap",
  "checkout",
  "checkout.override",
  "rekam_medis.ditulis",
  "rekam_medis.dikoreksi",
  "resep.dibuat",
  "resep.status",
  "obat.diserahkan",
  "obat.stok_masuk",
  "tindakan.ditambahkan",
  "pembayaran.dicatat",
];

function aksiTercatat(store: { getState(): Readonly<State> }): AksiAudit[] {
  return store.getState().audit.map((a) => a.aksi);
}

/**
 * Menjalankan satu alur yang menyentuh seluruh aksi penting: pasien baru,
 * admisi, pindah bed (membebaskan bed lama), tandai siap, catatan + koreksi,
 * resep, serah obat, stok masuk, tindakan, pembayaran lunas, checkout, dan
 * satu override oleh Admin.
 */
function jalankanAlurLengkap() {
  const { store, admisiId } = stateDenganAdmisi(depsUji({ sekarang: () => "2026-03-01T09:00:00.000Z" }));

  // Pasien kedua dan bed kedua supaya pindah bed punya tujuan sah.
  store.dispatch({
    type: "pasien/dibuat",
    olehId: PENGGUNA_UJI.pendaftaran,
    input: { ...IDENTITAS_PASIEN, nik: "3201015501900002", nama: "Pasien Lain" },
  });
  const bedKedua = store.getState().bed[1]!;
  store.dispatch({ type: "admisi/pindah-bed", olehId: PENGGUNA_UJI.perawat, admisiId, bedId: bedKedua.id });
  store.dispatch({ type: "bed/siap", olehId: PENGGUNA_UJI.perawat, bedId: "bed-1" });

  const catatan = store.dispatch({
    type: "catatan/ditulis",
    olehId: PENGGUNA_UJI.dokter,
    admisiId,
    jenis: "visite",
    isi: "Catatan awal",
    diagnosa: null,
    rencana: null,
    tandaVital: null,
  });
  if (!catatan.ok) throw new Error(catatan.alasan);
  store.dispatch({ type: "catatan/dikoreksi", olehId: PENGGUNA_UJI.dokter, catatanId: catatan.id, isi: "Koreksi" });

  const resep = store.dispatch({
    type: "resep/dibuat",
    olehId: PENGGUNA_UJI.dokter,
    admisiId,
    items: [{ obatId: "obat-1", jumlah: 5, aturanPakai: "3×1" }],
  });
  if (!resep.ok) throw new Error(resep.alasan);
  store.dispatch({ type: "resep/siapkan", olehId: PENGGUNA_UJI.apoteker, resepId: resep.id });
  store.dispatch({ type: "resep/serahkan", olehId: PENGGUNA_UJI.apoteker, resepId: resep.id });
  store.dispatch({ type: "obat/stok-masuk", olehId: PENGGUNA_UJI.apoteker, obatId: "obat-1", jumlah: 20, keterangan: "Restock" });
  store.dispatch({ type: "tindakan/ditambahkan", olehId: PENGGUNA_UJI.dokter, admisiId, tindakanId: "tindakan-1" });

  // Override oleh Admin menutup admisi meski tagihan belum lunas.
  const override = store.dispatch({
    type: "checkout",
    olehId: PENGGUNA_UJI.admin,
    admisiId,
    override: { alasan: "Rujukan mendesak" },
  });
  if (!override.ok) throw new Error(override.alasan);

  // Pembayaran dan checkout normal pada admisi kedua.
  const tagihan = store.getState().tagihan.find((t) => t.admisiId === admisiId)!;
  store.dispatch({ type: "pembayaran/dicatat", olehId: PENGGUNA_UJI.kasir, tagihanId: tagihan.id, jumlah: 50_000, metode: "tunai" });
  return store;
}

describe("audit log", () => {
  it("mencatat setiap aksi penting dengan pengguna, waktu, entitas, dan ringkasan", () => {
    const alur = jalankanAlurLengkap();

    const tercatat = new Set(aksiTercatat(alur));
    const belum = AKSI_PENTING.filter((a) => !tercatat.has(a));
    expect(belum).toEqual([]);
  });

  it("mengisi seluruh kolom wajib pada setiap entri", () => {
    const store = jalankanAlurLengkap();
    for (const entri of store.getState().audit) {
      expect(entri.waktu).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(entri.penggunaId).not.toBe("");
      expect(entri.aksi).not.toBe("");
      expect(entri.entitas).not.toBe("");
      expect(entri.entitasId).not.toBe("");
      expect(entri.ringkasan.length).toBeGreaterThan(3);
    }
  });

  it("tidak mencatat apa pun untuk aksi yang ditolak", () => {
    const store = storeUji(depsUji(), stateDasar());
    store.dispatch({ type: "pasien/dibuat", olehId: PENGGUNA_UJI.pendaftaran, input: IDENTITAS_PASIEN });
    const sebelum = store.getState().audit.length;

    // NIK ganda ditolak, sehingga tidak boleh menambah entri audit.
    const hasil: Hasil = store.dispatch({
      type: "pasien/dibuat",
      olehId: PENGGUNA_UJI.pendaftaran,
      input: { ...IDENTITAS_PASIEN, nama: "Nama Lain" },
    });
    if (hasil.ok) throw new Error("seharusnya ditolak");
    expect(store.getState().audit.length).toBe(sebelum);
  });

  it("data demo sudah berisi audit log dengan beragam aksi", () => {
    const state = buatDataDemo("2026-03-15");
    const jenisAksi = new Set(state.audit.map((a) => a.aksi));
    expect(jenisAksi.size).toBeGreaterThanOrEqual(6);
    expect(jenisAksi.has("pasien.dibuat")).toBe(true);
    expect(jenisAksi.has("checkout")).toBe(true);
  });
});
