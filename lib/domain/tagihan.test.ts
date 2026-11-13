import { describe, expect, it } from "vitest";
import { buatStateKosong } from "./state";
import { IDENTITAS_PASIEN, PENGGUNA_UJI, depsUji, stateDasar, storeUji } from "./test-utils";
import { nilaiTagihan, rincianTagihan } from "./tagihan";
import type { Bed, Kamar, Pengguna, State } from "./types";

function master(tarifA = 500_000, tarifB = 800_000) {
  const kamarA: Kamar = { id: "kamar-a", nama: "Melati 1", kelas: "I", tarifHarian: tarifA, aktif: true };
  const kamarB: Kamar = { id: "kamar-b", nama: "Anggrek VIP", kelas: "VIP", tarifHarian: tarifB, aktif: true };
  const bedA: Bed = { id: "bed-a", kamarId: kamarA.id, kode: "A", status: "kosong" };
  const bedB: Bed = { id: "bed-b", kamarId: kamarB.id, kode: "B", status: "kosong" };
  const pengguna: Pengguna[] = [
    { id: PENGGUNA_UJI.dokter, nama: "dr. Ayu", peran: "dokter", aktif: true },
    { id: PENGGUNA_UJI.pendaftaran, nama: "Rina", peran: "pendaftaran", aktif: true },
    { id: PENGGUNA_UJI.perawat, nama: "Ns. Dwi", peran: "perawat", aktif: true },
    { id: PENGGUNA_UJI.kasir, nama: "Joko", peran: "kasir", aktif: true },
  ];
  const state: State = { ...buatStateKosong(), kamar: [kamarA, kamarB], bed: [bedA, bedB], pengguna };
  return { state };
}

/** Menyiapkan admisi lewat store publik, bukan dengan menulis state langsung. */
function siapkanAdmisi(mulai: string) {
  const { state } = master();
  let hari = mulai;
  const deps = depsUji({ hariIni: () => hari, sekarang: () => `${hari}T09:00:00.000Z` });
  const store = storeUji(deps, state);
  const pasien = store.dispatch({ type: "pasien/dibuat", olehId: PENGGUNA_UJI.pendaftaran, input: IDENTITAS_PASIEN });
  if (!pasien.ok) throw new Error("setup gagal");
  const admisi = store.dispatch({
    type: "admisi/dibuat",
    olehId: PENGGUNA_UJI.pendaftaran,
    pasienId: pasien.id,
    dokterId: PENGGUNA_UJI.dokter,
    bedId: "bed-a",
    tanggalMasuk: mulai,
    diagnosaAwal: "Observasi",
  });
  if (!admisi.ok) throw new Error("setup gagal");
  return {
    store,
    admisiId: admisi.id,
    pasienId: pasien.id,
    majuKe: (tanggal: string) => {
      hari = tanggal;
    },
    rincian: () => {
      const s = store.getState();
      const tagihan = s.tagihan.find((t) => t.admisiId === admisi.id)!;
      return rincianTagihan(s, tagihan.id, hari)!;
    },
  };
}

describe("rincian tagihan", () => {
  it("menghitung biaya kamar dengan tarif tunggal secara inklusif", () => {
    const { majuKe, rincian } = siapkanAdmisi("2026-03-01");
    majuKe("2026-03-03");

    const hasil = rincian();

    expect(hasil.kamar).toHaveLength(1);
    expect(hasil.kamar[0]).toMatchObject({ lamaHari: 3, tarifHarian: 500_000, subtotal: 1_500_000 });
  });

  it("menghitung tiap segmen dengan tarif kamarnya sendiri setelah pindah kamar", () => {
    const { store, admisiId, majuKe, rincian } = siapkanAdmisi("2026-03-01");
    majuKe("2026-03-03");
    const pindah = store.dispatch({
      type: "admisi/pindah-bed",
      olehId: PENGGUNA_UJI.perawat,
      admisiId,
      bedId: "bed-b",
    });
    expect(pindah.ok).toBe(true);
    majuKe("2026-03-05");

    const hasil = rincian();

    expect(hasil.kamar).toHaveLength(2);
    expect(hasil.kamar[0]).toMatchObject({ namaKamar: "Melati 1", lamaHari: 2, tarifHarian: 500_000, subtotal: 1_000_000 });
    expect(hasil.kamar[1]).toMatchObject({ namaKamar: "Anggrek VIP", lamaHari: 3, tarifHarian: 800_000, subtotal: 2_400_000 });
    expect(hasil.subtotalKamar).toBe(3_400_000);
    expect(hasil.kamar.reduce((n, b) => n + b.lamaHari, 0)).toBe(hasil.lamaInap);
  });

  it("tidak memakai tarif kamar terakhir untuk seluruh masa inap", () => {
    const { store, admisiId, majuKe, rincian } = siapkanAdmisi("2026-03-01");
    majuKe("2026-03-03");
    store.dispatch({ type: "admisi/pindah-bed", olehId: PENGGUNA_UJI.perawat, admisiId, bedId: "bed-b" });
    majuKe("2026-03-05");

    // 5 hari × 800.000 akan menghasilkan 4.000.000 bila tarif terakhir dipakai untuk semuanya.
    expect(rincian().subtotalKamar).not.toBe(4_000_000);
  });

  it("memakai hari ini sebagai tanggal pulang untuk admisi yang masih aktif", () => {
    const { majuKe, rincian } = siapkanAdmisi("2026-02-27");
    majuKe("2026-03-01");

    const hasil = rincian();

    expect(hasil.kamar[0]).toMatchObject({ lamaHari: 3, subtotal: 1_500_000 });
    expect(hasil.lamaInap).toBe(3);
  });

  it("menjumlahkan kamar, tindakan, dan obat yang diserahkan sebagai total", () => {
    const { store, admisiId, majuKe, rincian } = siapkanAdmisi("2026-03-01");
    majuKe("2026-03-02");
    // Tindakan dan obat disiapkan di level state karena aksinya dibangun di ticket berikutnya.
    const state = store.getState();
    const denganRincian: State = {
      ...state,
      tindakanMaster: [{ id: "t-1", nama: "Infus", tarif: 150_000, aktif: true }],
      tindakanAdmisi: [
        {
          id: "ta-1",
          admisiId,
          tindakanId: "t-1",
          nama: "Infus",
          tarif: 150_000,
          waktu: "2026-03-02T03:00:00.000Z",
          olehId: PENGGUNA_UJI.dokter,
        },
      ],
      obat: [{ id: "o-1", nama: "Paracetamol", satuan: "tablet", harga: 2_000, stok: 100, stokMinimum: 10 }],
      resep: [
        {
          id: "r-1",
          admisiId,
          dokterId: PENGGUNA_UJI.dokter,
          waktu: "2026-03-02T04:00:00.000Z",
          status: "diserahkan",
          items: [{ obatId: "o-1", nama: "Paracetamol", jumlah: 10, aturanPakai: "3×1", harga: 2_000 }],
        },
      ],
    };
    const tagihanId = state.tagihan[0]!.id;

    const hasil = rincianTagihan(denganRincian, tagihanId, "2026-03-02")!;

    expect(hasil.subtotalTindakan).toBe(150_000);
    expect(hasil.subtotalObat).toBe(20_000);
    expect(hasil.total).toBe(hasil.subtotalKamar + 150_000 + 20_000);
  });

  it("tidak menagih obat dari resep yang belum diserahkan", () => {
    const { store, admisiId, rincian } = siapkanAdmisi("2026-03-01");
    const state = store.getState();
    const denganResep: State = {
      ...state,
      resep: [
        {
          id: "r-1",
          admisiId,
          dokterId: PENGGUNA_UJI.dokter,
          waktu: "2026-03-02T04:00:00.000Z",
          status: "disiapkan",
          items: [{ obatId: "o-1", nama: "Paracetamol", jumlah: 10, aturanPakai: "3×1", harga: 2_000 }],
        },
      ],
    };
    const tagihanId = state.tagihan[0]!.id;

    const hasil = rincianTagihan(denganResep, tagihanId, "2026-03-01")!;

    expect(hasil.obat).toHaveLength(0);
    expect(hasil.subtotalObat).toBe(0);
    expect(rincian()).toBeDefined();
  });
});

describe("rincian tagihan setelah checkout", () => {
  it("tidak berubah ketika admisi ditutup pada hari yang sama", () => {
    const deps = depsUji({ hariIni: () => "2026-03-03", sekarang: () => "2026-03-03T10:00:00.000Z" });
    const store = storeUji(deps, stateDasar());
    const pasien = store.dispatch({ type: "pasien/dibuat", olehId: PENGGUNA_UJI.pendaftaran, input: IDENTITAS_PASIEN });
    if (!pasien.ok) throw new Error(pasien.alasan);
    const admisi = store.dispatch({
      type: "admisi/dibuat",
      olehId: PENGGUNA_UJI.pendaftaran,
      pasienId: pasien.id,
      dokterId: PENGGUNA_UJI.dokter,
      bedId: "bed-1",
      tanggalMasuk: "2026-03-01",
      diagnosaAwal: "Observasi",
    });
    if (!admisi.ok) throw new Error(admisi.alasan);
    const tagihanId = store.getState().tagihan[0]!.id;
    const sebelum = nilaiTagihan(store.getState(), tagihanId, "2026-03-03");
    expect(sebelum.total).toBe(1_500_000);

    store.dispatch({
      type: "pembayaran/dicatat",
      olehId: PENGGUNA_UJI.kasir,
      tagihanId,
      jumlah: sebelum.total,
      metode: "tunai",
    });
    const keluar = store.dispatch({ type: "checkout", olehId: PENGGUNA_UJI.kasir, admisiId: admisi.id, override: null });
    expect(keluar.ok).toBe(true);

    const sesudah = nilaiTagihan(store.getState(), tagihanId, "2026-03-03");
    expect(sesudah.total).toBe(sebelum.total);
    expect(sesudah.dibayar).toBe(sebelum.total);
    expect(sesudah.status).toBe("lunas");
  });
});
