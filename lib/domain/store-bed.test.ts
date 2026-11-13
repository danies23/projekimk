import { describe, expect, it } from "vitest";
import { IDENTITAS_PASIEN, PENGGUNA_UJI, depsUji, stateDasar as stateUjiDasar, storeUji } from "./test-utils";

function stateDasar() {
  const state = stateUjiDasar();
  return { state, kamar: state.kamar[0]!, bed: state.bed[0]!, bed2: state.bed[1]! };
}

function denganPasien(deps = depsUji()) {
  const { state, kamar, bed, bed2 } = stateDasar();
  const store = storeUji(deps, state);
  const dibuat = store.dispatch({
    type: "pasien/dibuat",
    olehId: PENGGUNA_UJI.pendaftaran,
    input: IDENTITAS_PASIEN,
  });
  if (!dibuat.ok) throw new Error("setup gagal");
  return { store, pasienId: dibuat.id, kamar, bed, bed2 };
}

const ADMISI = {
  type: "admisi/dibuat" as const,
  olehId: PENGGUNA_UJI.pendaftaran,
  dokterId: PENGGUNA_UJI.dokter,
  tanggalMasuk: "2026-02-27",
  diagnosaAwal: "Demam berdarah",
};

describe("dispatch: alokasi bed saat admisi dibuat", () => {
  it("mengubah status bed menjadi terisi", () => {
    const { store, pasienId, bed } = denganPasien();
    const hasil = store.dispatch({ ...ADMISI, pasienId, bedId: bed.id });

    expect(hasil.ok).toBe(true);
    expect(store.getState().bed.find((b) => b.id === bed.id)!.status).toBe("terisi");
  });

  it("membuat admisi aktif dan tagihan awal", () => {
    const { store, pasienId, bed } = denganPasien();
    const hasil = store.dispatch({ ...ADMISI, pasienId, bedId: bed.id });

    expect(hasil.ok).toBe(true);
    const admisi = store.getState().admisi[0]!;
    expect(admisi.status).toBe("aktif");
    expect(store.getState().tagihan.find((t) => t.admisiId === admisi.id)).toBeDefined();
  });

  it("menolak bed yang sudah ditempati admisi aktif", () => {
    const { store, pasienId, bed } = denganPasien();
    store.dispatch({ ...ADMISI, pasienId, bedId: bed.id });
    const hasil = store.dispatch({ ...ADMISI, pasienId, bedId: bed.id });

    expect(hasil).toEqual({ ok: false, alasan: expect.stringContaining("baru saja terisi") });
    expect(store.getState().admisi).toHaveLength(1);
  });

  it("menolak bed yang masih berstatus dibersihkan", () => {
    const { store, pasienId, bed2 } = denganPasien();
    const state = store.getState();
    const siap = { ...state, bed: state.bed.map((b) => (b.id === bed2.id ? { ...b, status: "dibersihkan" as const } : b)) };
    const store2 = storeUji(depsUji(), siap);

    const hasil = store2.dispatch({ ...ADMISI, pasienId, bedId: bed2.id });

    expect(hasil.ok).toBe(false);
    expect(store2.getState().admisi).toHaveLength(0);
  });

  it("mencatat segmen bed pertama pada admisi", () => {
    const { store, pasienId, bed, kamar } = denganPasien();
    store.dispatch({ ...ADMISI, pasienId, bedId: bed.id });

    expect(store.getState().admisi[0]!.segmenBed).toEqual([
      { bedId: bed.id, kamarId: kamar.id, dari: "2026-03-01T09:00:00.000Z", sampai: null },
    ]);
  });

  it("mencatat pembuatan admisi dan alokasi bed di audit log", () => {
    const { store, pasienId, bed } = denganPasien();
    store.dispatch({ ...ADMISI, pasienId, bedId: bed.id });

    const aksi = store.getState().audit.map((a) => a.aksi);
    expect(aksi).toContain("admisi.dibuat");
    expect(aksi).toContain("bed.dialokasikan");
  });
});

describe("dispatch: pindah bed", () => {
  function denganAdmisi() {
    const ctx = denganPasien();
    const hasil = ctx.store.dispatch({ ...ADMISI, pasienId: ctx.pasienId, bedId: ctx.bed.id });
    if (!hasil.ok) throw new Error("setup gagal");
    return { ...ctx, admisiId: hasil.id };
  }

  it("membebaskan bed lama menjadi dibersihkan dan menempati bed baru", () => {
    const { store, admisiId, bed, bed2 } = denganAdmisi();
    const hasil = store.dispatch({ type: "admisi/pindah-bed", olehId: PENGGUNA_UJI.perawat, admisiId, bedId: bed2.id });

    expect(hasil.ok).toBe(true);
    expect(store.getState().bed.find((b) => b.id === bed.id)!.status).toBe("dibersihkan");
    expect(store.getState().bed.find((b) => b.id === bed2.id)!.status).toBe("terisi");
  });

  it("menutup segmen lama dan membuka segmen baru", () => {
    const { store, admisiId, bed, bed2 } = denganAdmisi();
    store.dispatch({ type: "admisi/pindah-bed", olehId: PENGGUNA_UJI.perawat, admisiId, bedId: bed2.id });

    const segmen = store.getState().admisi[0]!.segmenBed;
    expect(segmen).toHaveLength(2);
    expect(segmen[0]).toMatchObject({ bedId: bed.id, sampai: "2026-03-01T09:00:00.000Z" });
    expect(segmen[1]).toMatchObject({ bedId: bed2.id, sampai: null });
  });

  it("menolak pindah ke bed yang ditempati admisi lain", () => {
    const { store, admisiId, bed2, pasienId } = denganAdmisi();
    const lain = store.dispatch({ ...ADMISI, pasienId, bedId: bed2.id });
    expect(lain.ok).toBe(true);

    const hasil = store.dispatch({ type: "admisi/pindah-bed", olehId: PENGGUNA_UJI.perawat, admisiId, bedId: bed2.id });

    expect(hasil).toEqual({ ok: false, alasan: expect.stringContaining("baru saja terisi") });
    expect(store.getState().bed.find((b) => b.id === bed2.id)!.status).toBe("terisi");
  });

  it("menolak pindah ke bed yang belum siap dipakai", () => {
    const { store, admisiId, bed } = denganAdmisi();
    const state = store.getState();
    const siap = { ...state, bed: state.bed.map((b) => (b.id === "bed-2" ? { ...b, status: "dibersihkan" as const } : b)) };
    const store2 = storeUji(depsUji(), siap);

    const hasil = store2.dispatch({ type: "admisi/pindah-bed", olehId: PENGGUNA_UJI.perawat, admisiId, bedId: bed.id });

    expect(hasil.ok).toBe(false);
  });

  it("mencatat perpindahan di audit log", () => {
    const { store, admisiId, bed2 } = denganAdmisi();
    store.dispatch({ type: "admisi/pindah-bed", olehId: PENGGUNA_UJI.perawat, admisiId, bedId: bed2.id });

    expect(store.getState().audit.some((a) => a.aksi === "bed.dipindah")).toBe(true);
  });
});

describe("dispatch: status bed dan checkout", () => {
  it("menandai bed dibersihkan menjadi kosong", () => {
    const { state, bed } = stateDasar();
    const store = storeUji(depsUji(), {
      ...state,
      bed: state.bed.map((b) => (b.id === bed.id ? { ...b, status: "dibersihkan" as const } : b)),
    });

    const hasil = store.dispatch({ type: "bed/siap", olehId: PENGGUNA_UJI.perawat, bedId: bed.id });

    expect(hasil.ok).toBe(true);
    expect(store.getState().bed.find((b) => b.id === bed.id)!.status).toBe("kosong");
  });

  it("checkout mengubah status bed menjadi dibersihkan", () => {
    const { state } = stateDasar();
    const store = storeUji(depsUji(), state);
    const pasien = store.dispatch({ type: "pasien/dibuat", olehId: PENGGUNA_UJI.pendaftaran, input: IDENTITAS_PASIEN });
    if (!pasien.ok) throw new Error("setup gagal");
    const admisi = store.dispatch({ ...ADMISI, pasienId: pasien.id, bedId: "bed-1" });
    if (!admisi.ok) throw new Error("setup gagal");
    const tagihan = store.getState().tagihan.find((t) => t.admisiId === admisi.id)!;
    store.dispatch({
      type: "pembayaran/dicatat",
      olehId: PENGGUNA_UJI.kasir,
      tagihanId: tagihan.id,
      jumlah: 1_500_000,
      metode: "tunai",
    });

    const hasil = store.dispatch({ type: "checkout", olehId: PENGGUNA_UJI.kasir, admisiId: admisi.id, override: null });

    expect(hasil.ok).toBe(true);
    expect(store.getState().bed.find((b) => b.id === "bed-1")!.status).toBe("dibersihkan");
  });
});
