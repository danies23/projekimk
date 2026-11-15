import { describe, expect, it } from "vitest";
import { PENGGUNA_UJI, stateDenganAdmisi } from "./test-utils";

const denganAdmisi = stateDenganAdmisi;

describe("dispatch: rekam medis", () => {
  it("mencatat visite dokter dengan isi, diagnosa, dan rencana", () => {
    const { store, admisiId } = denganAdmisi();
    const hasil = store.dispatch({
      type: "catatan/ditulis",
      olehId: PENGGUNA_UJI.dokter,
      admisiId,
      jenis: "visite",
      isi: "Pasien membaik, demam turun.",
      diagnosa: "Demam berdarah",
      rencana: "Lanjut cairan, cek trombosit besok.",
      tandaVital: null,
    });

    expect(hasil.ok).toBe(true);
    expect(store.getState().catatanKlinis[0]).toMatchObject({
      admisiId,
      penulisId: PENGGUNA_UJI.dokter,
      jenis: "visite",
      isi: "Pasien membaik, demam turun.",
      diagnosa: "Demam berdarah",
      koreksiUntukId: null,
      dikoreksiOlehId: null,
    });
  });

  it("mencatat tanda vital perawat", () => {
    const { store, admisiId } = denganAdmisi();
    store.dispatch({
      type: "catatan/ditulis",
      olehId: PENGGUNA_UJI.perawat,
      admisiId,
      jenis: "tanda_vital",
      isi: "Pemantauan pagi",
      diagnosa: null,
      rencana: null,
      tandaVital: { tekananDarah: "120/80", suhu: 37.2, nadi: 82, pernapasan: 18, saturasi: 98 },
    });

    expect(store.getState().catatanKlinis[0]!.tandaVital).toEqual({
      tekananDarah: "120/80",
      suhu: 37.2,
      nadi: 82,
      pernapasan: 18,
      saturasi: 98,
    });
  });

  it("menolak catatan tanda vital tanpa nilai", () => {
    const { store, admisiId } = denganAdmisi();
    const hasil = store.dispatch({
      type: "catatan/ditulis",
      olehId: PENGGUNA_UJI.perawat,
      admisiId,
      jenis: "tanda_vital",
      isi: "Pemantauan pagi",
      diagnosa: null,
      rencana: null,
      tandaVital: null,
    });

    expect(hasil).toEqual({ ok: false, alasan: expect.stringContaining("Tanda vital") });
    expect(store.getState().catatanKlinis).toHaveLength(0);
  });

  it("menolak nilai tanda vital di luar rentang wajar", () => {
    const { store, admisiId } = denganAdmisi();
    const hasil = store.dispatch({
      type: "catatan/ditulis",
      olehId: PENGGUNA_UJI.perawat,
      admisiId,
      jenis: "tanda_vital",
      isi: "Pemantauan pagi",
      diagnosa: null,
      rencana: null,
      tandaVital: { tekananDarah: "120-80", suhu: 47, nadi: 82, pernapasan: 18, saturasi: 98 },
    });

    expect(hasil.ok).toBe(false);
    expect(store.getState().catatanKlinis).toHaveLength(0);
  });

  it("tidak menyediakan aksi untuk menghapus catatan", () => {
    const aksi: string[] = ["catatan/dihapus", "catatan/hapus", "rekam_medis/dihapus"];
    const { store, admisiId } = denganAdmisi();
    store.dispatch({
      type: "catatan/ditulis",
      olehId: PENGGUNA_UJI.dokter,
      admisiId,
      jenis: "visite",
      isi: "Catatan asli",
      diagnosa: null,
      rencana: null,
      tandaVital: null,
    });

    for (const type of aksi) {
      const hasil = store.dispatch({ type, olehId: PENGGUNA_UJI.dokter, catatanId: "x" } as never);
      expect(hasil.ok, `aksi ${type} seharusnya tidak dikenal`).toBe(false);
    }
    expect(store.getState().catatanKlinis).toHaveLength(1);
  });

  it("koreksi membuat entri baru yang menautkan catatan asli dan menandainya terkoreksi", () => {
    const { store, admisiId } = denganAdmisi();
    const asli = store.dispatch({
      type: "catatan/ditulis",
      olehId: PENGGUNA_UJI.dokter,
      admisiId,
      jenis: "visite",
      isi: "Suhu 39 derajat",
      diagnosa: null,
      rencana: null,
      tandaVital: null,
    });
    if (!asli.ok) throw new Error("setup gagal");

    const hasil = store.dispatch({
      type: "catatan/dikoreksi",
      olehId: PENGGUNA_UJI.dokter,
      catatanId: asli.id,
      isi: "Koreksi: suhu 38 derajat",
    });

    expect(hasil.ok).toBe(true);
    const [catatanAsli, koreksi] = store.getState().catatanKlinis;
    expect(catatanAsli!.dikoreksiOlehId).toBe(koreksi!.id);
    expect(koreksi).toMatchObject({ koreksiUntukId: asli.id, jenis: "visite", isi: "Koreksi: suhu 38 derajat" });
    expect(store.getState().catatanKlinis).toHaveLength(2);
  });

  it("menolak mengoreksi catatan yang sudah dikoreksi", () => {
    const { store, admisiId } = denganAdmisi();
    const asli = store.dispatch({
      type: "catatan/ditulis",
      olehId: PENGGUNA_UJI.dokter,
      admisiId,
      jenis: "visite",
      isi: "Catatan",
      diagnosa: null,
      rencana: null,
      tandaVital: null,
    });
    if (!asli.ok) throw new Error("setup gagal");
    store.dispatch({ type: "catatan/dikoreksi", olehId: PENGGUNA_UJI.dokter, catatanId: asli.id, isi: "Koreksi 1" });

    const hasil = store.dispatch({ type: "catatan/dikoreksi", olehId: PENGGUNA_UJI.dokter, catatanId: asli.id, isi: "Koreksi 2" });

    expect(hasil).toEqual({ ok: false, alasan: expect.stringContaining("sudah dikoreksi") });
  });

  it("menolak mengoreksi entri koreksi, agar satu catatan hanya punya satu koreksi", () => {
    const { store, admisiId } = denganAdmisi();
    const asli = store.dispatch({
      type: "catatan/ditulis",
      olehId: PENGGUNA_UJI.dokter,
      admisiId,
      jenis: "visite",
      isi: "Suhu 39 derajat",
      diagnosa: null,
      rencana: null,
      tandaVital: null,
    });
    if (!asli.ok) throw new Error("setup gagal");
    const koreksi = store.dispatch({ type: "catatan/dikoreksi", olehId: PENGGUNA_UJI.dokter, catatanId: asli.id, isi: "Suhu 38 derajat" });
    if (!koreksi.ok) throw new Error(koreksi.alasan);

    const hasil = store.dispatch({ type: "catatan/dikoreksi", olehId: PENGGUNA_UJI.dokter, catatanId: koreksi.id, isi: "Koreksi kedua" });

    expect(hasil).toEqual({ ok: false, alasan: expect.stringContaining("koreksi") });
    expect(store.getState().catatanKlinis).toHaveLength(2);
  });

  it("mencatat penulisan dan koreksi di audit log", () => {
    const { store, admisiId } = denganAdmisi();
    const asli = store.dispatch({
      type: "catatan/ditulis",
      olehId: PENGGUNA_UJI.dokter,
      admisiId,
      jenis: "visite",
      isi: "Catatan",
      diagnosa: null,
      rencana: null,
      tandaVital: null,
    });
    if (!asli.ok) throw new Error("setup gagal");
    store.dispatch({ type: "catatan/dikoreksi", olehId: PENGGUNA_UJI.dokter, catatanId: asli.id, isi: "Koreksi" });

    const aksi = store.getState().audit.map((a) => a.aksi);
    expect(aksi).toContain("rekam_medis.ditulis");
    expect(aksi).toContain("rekam_medis.dikoreksi");
  });
});

describe("instruksi dokter dijalankan perawat", () => {
  /** Visite dokter dengan rencana — rencana itulah instruksi yang harus dijalankan. */
  function visiteDenganRencana(store: ReturnType<typeof stateDenganAdmisi>["store"], admisiId: string) {
    const hasil = store.dispatch({
      type: "catatan/ditulis",
      olehId: PENGGUNA_UJI.dokter,
      admisiId,
      jenis: "visite",
      isi: "Sesak berkurang.",
      diagnosa: "PPOK",
      rencana: "Nebulisasi tiap 8 jam.",
      tandaVital: null,
    });
    if (!hasil.ok) throw new Error(hasil.alasan);
    return hasil.id;
  }

  it("perawat menandai instruksi sebagai sudah dijalankan dan statusnya tersimpan", () => {
    const { store, admisiId } = stateDenganAdmisi();
    const catatanId = visiteDenganRencana(store, admisiId);

    const hasil = store.dispatch({ type: "instruksi/dijalankan", olehId: PENGGUNA_UJI.perawat, catatanId });

    expect(hasil.ok).toBe(true);
    expect(store.getState().instruksiDijalankan).toEqual([
      { id: expect.any(String), catatanId, olehId: PENGGUNA_UJI.perawat, waktu: expect.any(String) },
    ]);
  });

  it("menolak menandai instruksi yang sama dua kali", () => {
    const { store, admisiId } = stateDenganAdmisi();
    const catatanId = visiteDenganRencana(store, admisiId);
    store.dispatch({ type: "instruksi/dijalankan", olehId: PENGGUNA_UJI.perawat, catatanId });

    const hasil = store.dispatch({ type: "instruksi/dijalankan", olehId: PENGGUNA_UJI.perawat, catatanId });

    expect(hasil).toEqual({ ok: false, alasan: expect.stringContaining("sudah ditandai") });
    expect(store.getState().instruksiDijalankan).toHaveLength(1);
  });

  it("menolak menandai catatan yang tidak memuat instruksi", () => {
    const { store, admisiId } = stateDenganAdmisi();
    const tanpaRencana = store.dispatch({
      type: "catatan/ditulis",
      olehId: PENGGUNA_UJI.perawat,
      admisiId,
      jenis: "perkembangan",
      isi: "Pasien tidur nyenyak.",
      diagnosa: null,
      rencana: null,
      tandaVital: null,
    });
    if (!tanpaRencana.ok) throw new Error(tanpaRencana.alasan);

    const hasil = store.dispatch({
      type: "instruksi/dijalankan",
      olehId: PENGGUNA_UJI.perawat,
      catatanId: tanpaRencana.id,
    });

    expect(hasil).toEqual({ ok: false, alasan: expect.stringContaining("instruksi") });
  });

  it("menolak menandai instruksi pada admisi yang sudah selesai", () => {
    const { store, admisiId } = stateDenganAdmisi();
    const catatanId = visiteDenganRencana(store, admisiId);
    const keluar = store.dispatch({ type: "checkout", olehId: PENGGUNA_UJI.admin, admisiId, override: { alasan: "Rujukan" } });
    if (!keluar.ok) throw new Error(keluar.alasan);

    const hasil = store.dispatch({ type: "instruksi/dijalankan", olehId: PENGGUNA_UJI.perawat, catatanId });

    expect(hasil).toEqual({ ok: false, alasan: "Admisi ini sudah selesai." });
    expect(store.getState().instruksiDijalankan).toHaveLength(0);
  });

  it("mencatat penandaan instruksi di audit log", () => {
    const { store, admisiId } = stateDenganAdmisi();
    const catatanId = visiteDenganRencana(store, admisiId);

    store.dispatch({ type: "instruksi/dijalankan", olehId: PENGGUNA_UJI.perawat, catatanId });

    expect(store.getState().audit.some((a) => a.aksi === "instruksi.dijalankan")).toBe(true);
  });
});

describe("admisi selesai tidak menerima biaya baru", () => {
  /** Admisi aktif, dibayar lunas, lalu di-checkout — tagihannya terkunci. */
  function admisiSelesai() {
    const { store, admisiId } = stateDenganAdmisi();
    const tagihanId = store.getState().tagihan[0]!.id;
    store.dispatch({
      type: "pembayaran/dicatat",
      olehId: PENGGUNA_UJI.kasir,
      tagihanId,
      jumlah: 1_500_000,
      metode: "tunai",
    });
    const keluar = store.dispatch({ type: "checkout", olehId: PENGGUNA_UJI.kasir, admisiId, override: null });
    if (!keluar.ok) throw new Error(keluar.alasan);
    return { store, admisiId };
  }

  it("menolak tindakan baru dan tidak mengubah tagihan", () => {
    const { store, admisiId } = admisiSelesai();
    const sebelum = structuredClone(store.getState().tindakanAdmisi);

    const hasil = store.dispatch({
      type: "tindakan/ditambahkan",
      olehId: PENGGUNA_UJI.dokter,
      admisiId,
      tindakanId: "tindakan-1",
    });

    expect(hasil).toEqual({ ok: false, alasan: "Admisi ini sudah selesai." });
    expect(store.getState().tindakanAdmisi).toEqual(sebelum);
  });

  it("menolak resep baru pada admisi selesai", () => {
    const { store, admisiId } = admisiSelesai();

    const hasil = store.dispatch({
      type: "resep/dibuat",
      olehId: PENGGUNA_UJI.dokter,
      admisiId,
      items: [{ obatId: "obat-1", jumlah: 1, aturanPakai: "1×1" }],
    });

    expect(hasil).toEqual({ ok: false, alasan: "Admisi ini sudah selesai." });
    expect(store.getState().resep).toHaveLength(0);
  });

  it("menolak catatan baru pada admisi selesai", () => {
    const { store, admisiId } = admisiSelesai();

    const hasil = store.dispatch({
      type: "catatan/ditulis",
      olehId: PENGGUNA_UJI.dokter,
      admisiId,
      jenis: "visite",
      isi: "Catatan setelah pulang.",
      diagnosa: null,
      rencana: null,
      tandaVital: null,
    });

    expect(hasil).toEqual({ ok: false, alasan: "Admisi ini sudah selesai." });
    expect(store.getState().catatanKlinis.some((c) => c.isi === "Catatan setelah pulang.")).toBe(false);
  });

  it("menolak resep tanpa aturan pakai", () => {
    const { store, admisiId } = denganAdmisi();

    const hasil = store.dispatch({
      type: "resep/dibuat",
      olehId: PENGGUNA_UJI.dokter,
      admisiId,
      items: [{ obatId: "obat-1", jumlah: 1, aturanPakai: "  " }],
    });

    expect(hasil).toEqual({ ok: false, alasan: expect.stringContaining("Aturan pakai") });
    expect(store.getState().resep).toHaveLength(0);
  });
});
