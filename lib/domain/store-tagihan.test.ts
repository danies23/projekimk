import { describe, expect, it } from "vitest";
import { IDENTITAS_PASIEN, PENGGUNA_UJI, depsUji, stateDasar, storeUji } from "./test-utils";
import { nilaiTagihan } from "./tagihan";

/** Admisi masuk 1 Maret, hari ini 3 Maret → biaya kamar 3 × 500.000 = 1.500.000. */
function denganAdmisi() {
  const deps = depsUji({ hariIni: () => "2026-03-03", sekarang: () => "2026-03-03T10:00:00.000Z" });
  const store = storeUji(deps, stateDasar());
  const pasien = store.dispatch({ type: "pasien/dibuat", olehId: PENGGUNA_UJI.pendaftaran, input: IDENTITAS_PASIEN });
  if (!pasien.ok) throw new Error("setup gagal");
  const admisi = store.dispatch({
    type: "admisi/dibuat",
    olehId: PENGGUNA_UJI.pendaftaran,
    pasienId: pasien.id,
    dokterId: PENGGUNA_UJI.dokter,
    bedId: "bed-1",
    tanggalMasuk: "2026-03-01",
    diagnosaAwal: "Observasi",
  });
  if (!admisi.ok) throw new Error("setup gagal");
  const tagihanId = store.getState().tagihan.find((t) => t.admisiId === admisi.id)!.id;
  return { store, admisiId: admisi.id, tagihanId };
}

function nilai(store: ReturnType<typeof denganAdmisi>["store"], tagihanId: string) {
  return nilaiTagihan(store.getState(), tagihanId, "2026-03-03");
}

describe("dispatch: pembayaran", () => {
  it("mencatat pembayaran sebagian dan menurunkan status sebagian", () => {
    const { store, tagihanId } = denganAdmisi();
    const hasil = store.dispatch({
      type: "pembayaran/dicatat",
      olehId: PENGGUNA_UJI.kasir,
      tagihanId,
      jumlah: 500_000,
      metode: "tunai",
    });

    expect(hasil.ok).toBe(true);
    expect(nilai(store, tagihanId)).toMatchObject({ total: 1_500_000, dibayar: 500_000, sisa: 1_000_000, status: "sebagian" });
  });

  it("menurunkan status lunas ketika pembayaran mencapai total", () => {
    const { store, tagihanId } = denganAdmisi();
    store.dispatch({ type: "pembayaran/dicatat", olehId: PENGGUNA_UJI.kasir, tagihanId, jumlah: 500_000, metode: "tunai" });
    store.dispatch({ type: "pembayaran/dicatat", olehId: PENGGUNA_UJI.kasir, tagihanId, jumlah: 1_000_000, metode: "debit" });

    expect(nilai(store, tagihanId)).toMatchObject({ dibayar: 1_500_000, sisa: 0, status: "lunas" });
  });

  it("menolak pembayaran pada tagihan yang sudah lunas", () => {
    const { store, tagihanId } = denganAdmisi();
    store.dispatch({ type: "pembayaran/dicatat", olehId: PENGGUNA_UJI.kasir, tagihanId, jumlah: 1_500_000, metode: "transfer" });
    const hasil = store.dispatch({
      type: "pembayaran/dicatat",
      olehId: PENGGUNA_UJI.kasir,
      tagihanId,
      jumlah: 10_000,
      metode: "tunai",
    });

    expect(hasil).toEqual({ ok: false, alasan: expect.stringContaining("lunas") });
    expect(store.getState().pembayaran).toHaveLength(1);
  });

  it("mencatat metode dan kasir pada setiap pembayaran, serta audit log", () => {
    const { store, tagihanId } = denganAdmisi();
    store.dispatch({ type: "pembayaran/dicatat", olehId: PENGGUNA_UJI.kasir, tagihanId, jumlah: 250_000, metode: "debit" });

    expect(store.getState().pembayaran[0]).toMatchObject({
      tagihanId,
      jumlah: 250_000,
      metode: "debit",
      kasirId: PENGGUNA_UJI.kasir,
      waktu: "2026-03-03T10:00:00.000Z",
    });
    expect(store.getState().audit.some((a) => a.aksi === "pembayaran.dicatat")).toBe(true);
  });
});

describe("dispatch: checkout dan override", () => {
  it("menolak checkout ketika tagihan belum lunas", () => {
    const { store, admisiId } = denganAdmisi();
    const hasil = store.dispatch({ type: "checkout", olehId: PENGGUNA_UJI.kasir, admisiId, override: null });

    expect(hasil).toEqual({ ok: false, alasan: expect.stringContaining("belum lunas") });
    expect(store.getState().admisi[0]!.status).toBe("aktif");
  });

  it("meloloskan checkout setelah tagihan lunas dan membebaskan bed", () => {
    const { store, admisiId, tagihanId } = denganAdmisi();
    store.dispatch({ type: "pembayaran/dicatat", olehId: PENGGUNA_UJI.kasir, tagihanId, jumlah: 1_500_000, metode: "tunai" });
    const hasil = store.dispatch({ type: "checkout", olehId: PENGGUNA_UJI.kasir, admisiId, override: null });

    expect(hasil.ok).toBe(true);
    expect(store.getState().admisi[0]).toMatchObject({ status: "selesai", tanggalPulang: "2026-03-03" });
    expect(store.getState().bed[0]!.status).toBe("dibersihkan");
  });

  it("menolak override dari peran selain Admin", () => {
    const { store, admisiId } = denganAdmisi();
    const hasil = store.dispatch({
      type: "checkout",
      olehId: PENGGUNA_UJI.kasir,
      admisiId,
      override: { alasan: "Pasien memaksa pulang" },
    });

    expect(hasil).toEqual({ ok: false, alasan: expect.stringContaining("Admin") });
    expect(store.getState().admisi[0]!.status).toBe("aktif");
  });

  it("menuntut alasan pada override Admin", () => {
    const { store, admisiId } = denganAdmisi();
    const hasil = store.dispatch({
      type: "checkout",
      olehId: PENGGUNA_UJI.admin,
      admisiId,
      override: { alasan: "   " },
    });

    expect(hasil).toEqual({ ok: false, alasan: expect.stringContaining("alasan") });
    expect(store.getState().admisi[0]!.status).toBe("aktif");
  });

  it("mengizinkan override Admin dengan alasan dan mencatatnya", () => {
    const { store, admisiId } = denganAdmisi();
    const hasil = store.dispatch({
      type: "checkout",
      olehId: PENGGUNA_UJI.admin,
      admisiId,
      override: { alasan: "Pasien rujukan mendesak" },
    });

    expect(hasil.ok).toBe(true);
    expect(store.getState().admisi[0]).toMatchObject({
      status: "selesai",
      overrideCheckout: { alasan: "Pasien rujukan mendesak", olehId: PENGGUNA_UJI.admin },
    });
    expect(store.getState().audit.some((a) => a.aksi === "checkout.override")).toBe(true);
  });
});
