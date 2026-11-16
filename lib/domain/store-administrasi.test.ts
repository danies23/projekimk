import { describe, expect, it } from "vitest";
import { dokterAktif } from "./selectors";
import { PENGGUNA_UJI, depsUji, stateDasar, stateDenganAdmisi, storeUji } from "./test-utils";

function storeAdmin() {
  return storeUji(depsUji(), stateDasar());
}

describe("dispatch: pengelolaan pengguna", () => {
  it("admin menonaktifkan pengguna dan mencatatnya di audit log", () => {
    const store = storeAdmin();

    const hasil = store.dispatch({
      type: "pengguna/diubah",
      olehId: PENGGUNA_UJI.admin,
      penggunaId: PENGGUNA_UJI.kasir,
      perubahan: { aktif: false },
    });

    expect(hasil.ok).toBe(true);
    expect(store.getState().pengguna.find((p) => p.id === PENGGUNA_UJI.kasir)!.aktif).toBe(false);
    expect(store.getState().audit.at(-1)).toMatchObject({
      aksi: "pengguna.diubah",
      penggunaId: PENGGUNA_UJI.admin,
      entitas: "pengguna",
      entitasId: PENGGUNA_UJI.kasir,
    });
  });

  it("admin mengaktifkan kembali pengguna yang dinonaktifkan", () => {
    const store = storeAdmin();
    store.dispatch({
      type: "pengguna/diubah",
      olehId: PENGGUNA_UJI.admin,
      penggunaId: PENGGUNA_UJI.kasir,
      perubahan: { aktif: false },
    });

    const hasil = store.dispatch({
      type: "pengguna/diubah",
      olehId: PENGGUNA_UJI.admin,
      penggunaId: PENGGUNA_UJI.kasir,
      perubahan: { aktif: true },
    });

    expect(hasil.ok).toBe(true);
    expect(store.getState().pengguna.find((p) => p.id === PENGGUNA_UJI.kasir)!.aktif).toBe(true);
  });

  it("admin mengubah peran pengguna", () => {
    const store = storeAdmin();

    const hasil = store.dispatch({
      type: "pengguna/diubah",
      olehId: PENGGUNA_UJI.admin,
      penggunaId: PENGGUNA_UJI.perawat,
      perubahan: { peran: "kasir" },
    });

    expect(hasil.ok).toBe(true);
    expect(store.getState().pengguna.find((p) => p.id === PENGGUNA_UJI.perawat)!.peran).toBe("kasir");
  });

  it("menolak perubahan pengguna dari peran selain admin tanpa mengubah state", () => {
    const store = storeAdmin();
    const sebelum = structuredClone(store.getState().pengguna);

    const hasil = store.dispatch({
      type: "pengguna/diubah",
      olehId: PENGGUNA_UJI.dokter,
      penggunaId: PENGGUNA_UJI.kasir,
      perubahan: { aktif: false },
    });

    expect(hasil).toEqual({ ok: false, alasan: expect.stringContaining("tidak berhak") });
    expect(store.getState().pengguna).toEqual(sebelum);
  });

  it("menolak admin menonaktifkan akun sendiri atau mengubah perannya", () => {
    const store = storeAdmin();

    for (const perubahan of [{ aktif: false }, { peran: "kasir" as const }]) {
      const hasil = store.dispatch({
        type: "pengguna/diubah",
        olehId: PENGGUNA_UJI.admin,
        penggunaId: PENGGUNA_UJI.admin,
        perubahan,
      });
      expect(hasil, JSON.stringify(perubahan)).toEqual({
        ok: false,
        alasan: expect.stringContaining("sendiri"),
      });
    }    expect(store.getState().pengguna.find((p) => p.id === PENGGUNA_UJI.admin)).toMatchObject({
      peran: "admin",
      aktif: true,
    });
  });

  it("menolak nama pengguna kosong dan nama yang hanya berisi spasi", () => {
    const store = storeAdmin();

    for (const nama of ["", "   "]) {
      const hasil = store.dispatch({
        type: "pengguna/diubah",
        olehId: PENGGUNA_UJI.admin,
        penggunaId: PENGGUNA_UJI.kasir,
        perubahan: { nama },
      });
      expect(hasil.ok, `nama "${nama}" seharusnya ditolak`).toBe(false);
    }
    expect(store.getState().pengguna.find((p) => p.id === PENGGUNA_UJI.kasir)!.nama).toBe("Joko");
  });

  it("menolak pengguna baru tanpa nama atau dengan id yang sudah dipakai", () => {
    const store = storeAdmin();

    for (const input of [
      { nama: "  ", peran: "kasir" as const },
      { id: PENGGUNA_UJI.kasir, nama: "Kasir Baru", peran: "kasir" as const },
    ]) {
      const hasil = store.dispatch({ type: "pengguna/dibuat", olehId: PENGGUNA_UJI.admin, input });
      expect(hasil.ok, JSON.stringify(input)).toBe(false);
    }
    expect(store.getState().pengguna.filter((p) => p.peran === "kasir")).toHaveLength(1);
  });

  it("pengguna baru langsung aktif dan tercatat di audit log", () => {
    const store = storeAdmin();

    const hasil = store.dispatch({
      type: "pengguna/dibuat",
      olehId: PENGGUNA_UJI.admin,
      input: { nama: "Rudi Hartono", peran: "perawat" },
    });

    expect(hasil.ok).toBe(true);
    expect(store.getState().pengguna.find((p) => p.nama === "Rudi Hartono")).toMatchObject({
      peran: "perawat",
      aktif: true,
    });
    expect(store.getState().audit.at(-1)).toMatchObject({
      aksi: "pengguna.dibuat",
      penggunaId: PENGGUNA_UJI.admin,
      entitas: "pengguna",
    });
  });

  it("dokter yang dinonaktifkan hilang dari pilihan dokter dan ditolak saat membuat admisi", () => {
    const store = storeAdmin();
    store.dispatch({
      type: "pengguna/diubah",
      olehId: PENGGUNA_UJI.admin,
      penggunaId: PENGGUNA_UJI.dokter,
      perubahan: { aktif: false },
    });
    const pasien = store.dispatch({ type: "pasien/dibuat", olehId: PENGGUNA_UJI.pendaftaran, input: {
      nama: "Siti Rahmawati",
      nik: "3201015501900001",
      tanggalLahir: "1990-01-15",
      jenisKelamin: "P",
      alamat: "Jl. Merdeka 12, Bandung",
      telepon: "081234567890",
      penanggungJawab: { nama: "Budi", hubungan: "Suami", telepon: "081298765432" },
    } });
    if (!pasien.ok) throw new Error(pasien.alasan);

    expect(dokterAktif(store.getState())).toEqual([]);
    const admisi = store.dispatch({
      type: "admisi/dibuat",
      olehId: PENGGUNA_UJI.pendaftaran,
      pasienId: pasien.id,
      dokterId: PENGGUNA_UJI.dokter,
      bedId: "bed-1",
      tanggalMasuk: "2026-03-01",
      diagnosaAwal: "Observasi",
    });
    expect(admisi).toEqual({ ok: false, alasan: expect.stringContaining("aktif") });
    expect(store.getState().admisi).toEqual([]);
  });
});

describe("dispatch: master tindakan", () => {
  it("admin menambah tindakan baru beserta tarifnya dan mencatatnya di audit log", () => {
    const store = storeAdmin();

    const hasil = store.dispatch({
      type: "tindakan-master/dibuat",
      olehId: PENGGUNA_UJI.admin,
      input: { nama: "Pemeriksaan mata", tarif: 80_000 },
    });

    expect(hasil.ok).toBe(true);
    expect(store.getState().tindakanMaster.find((t) => t.id === (hasil.ok && hasil.id))).toMatchObject({
      nama: "Pemeriksaan mata",
      tarif: 80_000,
      aktif: true,
    });
    expect(store.getState().audit.at(-1)).toMatchObject({
      aksi: "tindakan_master.dibuat",
      penggunaId: PENGGUNA_UJI.admin,
      entitas: "tindakan_master",
    });
  });

  it("menolak tindakan dengan nama kosong, nama ganda, atau tarif tidak masuk akal", () => {
    const store = storeAdmin();

    for (const input of [
      { nama: "  ", tarif: 100_000 },
      { nama: "pemasangan INFUS", tarif: 100_000 },
      { nama: "Tindakan Baru", tarif: 0 },
      { nama: "Tindakan Baru", tarif: 1_500.5 },
    ]) {
      const hasil = store.dispatch({ type: "tindakan-master/dibuat", olehId: PENGGUNA_UJI.admin, input });
      expect(hasil.ok, JSON.stringify(input)).toBe(false);
    }
    expect(store.getState().tindakanMaster).toHaveLength(2);
  });

  it("menonaktifkan tindakan membuatnya tidak dapat dipilih dokter", () => {
    const store = storeAdmin();

    const hasil = store.dispatch({
      type: "tindakan-master/diubah",
      olehId: PENGGUNA_UJI.admin,
      tindakanId: "tindakan-1",
      perubahan: { aktif: false },
    });

    expect(hasil.ok).toBe(true);
    expect(store.getState().tindakanMaster.find((t) => t.id === "tindakan-1")!.aktif).toBe(false);
    expect(store.getState().audit.at(-1)).toMatchObject({ aksi: "tindakan_master.diubah" });
  });

  it("menolak mengubah tindakan menjadi tanpa nama, nama ganda, atau tarif tidak masuk akal", () => {
    const store = storeAdmin();

    for (const perubahan of [
      { nama: "   " },
      { nama: "EKG" },
      { tarif: 0 },
      { tarif: 2_500.5 },
    ]) {
      const hasil = store.dispatch({
        type: "tindakan-master/diubah",
        olehId: PENGGUNA_UJI.admin,
        tindakanId: "tindakan-1",
        perubahan,
      });
      expect(hasil.ok, JSON.stringify(perubahan)).toBe(false);
    }
    expect(store.getState().tindakanMaster[0]).toMatchObject({ nama: "Pemasangan infus", tarif: 150_000 });
  });

  it("menonaktifkan tindakan yang sudah tercatat tetap berhasil walau namanya kini ganda", () => {
    // Data lama bisa memuat nama ganda atau tarif yang tidak lagi sah; aturan
    // validasi hanya berlaku untuk kolom yang benar-benar diubah, supaya
    // tindakan seperti itu tetap dapat dinonaktifkan.
    const state = stateDasar();
    state.tindakanMaster.push({ id: "tindakan-lama", nama: "pemasangan INFUS", tarif: 150_000, aktif: true });
    const store = storeUji(depsUji(), state);

    const hasil = store.dispatch({
      type: "tindakan-master/diubah",
      olehId: PENGGUNA_UJI.admin,
      tindakanId: "tindakan-lama",
      perubahan: { aktif: false },
    });

    expect(hasil.ok).toBe(true);
    expect(store.getState().tindakanMaster.find((t) => t.id === "tindakan-lama")!.aktif).toBe(false);
  });

  it("tindakan yang sudah tercatat pada admisi tetap utuh setelah master dinonaktifkan", () => {
    const { store, admisiId } = stateDenganAdmisi(depsUji());
    store.dispatch({ type: "tindakan/ditambahkan", olehId: PENGGUNA_UJI.dokter, admisiId, tindakanId: "tindakan-1" });

    store.dispatch({
      type: "tindakan-master/diubah",
      olehId: PENGGUNA_UJI.admin,
      tindakanId: "tindakan-1",
      perubahan: { nama: "Pemasangan infus (lama)", tarif: 999_000, aktif: false },
    });

    expect(store.getState().tindakanAdmisi[0]).toMatchObject({
      admisiId,
      nama: "Pemasangan infus",
      tarif: 150_000,
    });
  });
});
