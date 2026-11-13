import { describe, expect, it } from "vitest";
import { buatDataDemo } from "./data-demo";
import {
  admisiAktif,
  alasanBedTidakTersedia,
  cariPasien,
  daftarAdmisiAktif,
  denahBed,
  dokterAktif,
  infoAdmisi,
  ringkasanBed,
} from "./selectors";
import { IDENTITAS_PASIEN, PENGGUNA_UJI, stateDasar, stateDenganAdmisi } from "./test-utils";

describe("selector pasien", () => {
  it("mencari pasien berdasarkan nama tanpa membedakan huruf besar-kecil", () => {
    const { store } = stateDenganAdmisi();
    expect(cariPasien(store.getState(), "siti")).toHaveLength(1);
    expect(cariPasien(store.getState(), "SITI RAHMAWATI")[0]!.nama).toBe(IDENTITAS_PASIEN.nama);
  });

  it("mencari pasien berdasarkan NIK dan Nomor Rekam Medis", () => {
    const { store } = stateDenganAdmisi();
    expect(cariPasien(store.getState(), IDENTITAS_PASIEN.nik)).toHaveLength(1);
    expect(cariPasien(store.getState(), "RM-2026-1")).toHaveLength(1);
  });

  it("mengembalikan daftar kosong untuk kata kunci tanpa hasil", () => {
    const { store } = stateDenganAdmisi();
    expect(cariPasien(store.getState(), "tidak-ada-siapa")).toEqual([]);
  });

  it("mengembalikan daftar kosong untuk kata kunci kosong, bukan seluruh pasien", () => {
    const { store } = stateDenganAdmisi();
    expect(cariPasien(store.getState(), "   ")).toEqual([]);
  });
});

describe("selector bed", () => {
  it("menghitung jumlah bed per status dan BOR", () => {
    const { store } = stateDenganAdmisi();
    const ringkasan = ringkasanBed(store.getState());

    expect(ringkasan).toMatchObject({ total: 2, terisi: 1, kosong: 1, dibersihkan: 0 });
    expect(ringkasan.bor).toBe(50);
  });

  it("BOR pada data demo berada di kisaran 60–70 persen", () => {
    const ringkasan = ringkasanBed(buatDataDemo("2026-03-15"));

    expect(ringkasan.total).toBe(16);
    expect(ringkasan.bor).toBeGreaterThanOrEqual(60);
    expect(ringkasan.bor).toBeLessThanOrEqual(70);
  });

  it("BOR bernilai nol ketika belum ada bed, bukan NaN", () => {
    const kosong = { ...buatDataDemo("2026-03-15"), bed: [], admisi: [] };
    expect(ringkasanBed(kosong)).toMatchObject({ total: 0, terisi: 0, bor: 0 });
  });

  it("tidak menghitung bed di kamar nonaktif", () => {
    const state = stateDasar();
    state.kamar.push({ id: "kamar-lama", nama: "Kamar Lama", kelas: "II", tarifHarian: 300_000, aktif: false });
    state.bed.push({ id: "bed-lama", kamarId: "kamar-lama", kode: "A", status: "terisi" });

    expect(ringkasanBed(state)).toMatchObject({ total: 2, terisi: 0, bor: 0 });
  });
});

describe("selector dokter", () => {
  it("hanya mengembalikan dokter yang aktif", () => {
    const state = stateDasar();
    state.pengguna.push({ id: "u-dokter-nonaktif", nama: "dr. Lama", peran: "dokter", aktif: false });

    const dokter = dokterAktif(state);

    expect(dokter.map((d) => d.nama)).toEqual(["dr. Ayu"]);
  });

  it("tidak mengembalikan peran selain dokter", () => {
    const dokter = dokterAktif(stateDasar());

    expect(dokter.every((d) => d.peran === "dokter")).toBe(true);
  });
});

describe("selector denah bed", () => {
  it("mengelompokkan bed per kamar dengan kelas dan tarif harian", () => {
    const state = stateDasar();
    state.kamar.push({ id: "kamar-2", nama: "Anggrek", kelas: "VIP", tarifHarian: 900_000, aktif: true });
    state.bed.push({ id: "bed-3", kamarId: "kamar-2", kode: "A", status: "kosong" });

    const denah = denahBed(state);

    expect(denah).toHaveLength(2);
    expect(denah[0]).toMatchObject({ nama: "Melati 1", kelas: "I", tarifHarian: 500_000 });
    expect(denah[0]!.bed.map((b) => b.kode)).toEqual(["A", "B"]);
    expect(denah[1]!.bed.map((b) => b.id)).toEqual(["bed-3"]);
  });

  it("tidak menampilkan kamar tidak aktif maupun bed-nya", () => {
    const state = stateDasar();
    state.kamar[0]!.aktif = false;

    expect(denahBed(state)).toEqual([]);
  });

  it("memuat status bed apa adanya, termasuk dibersihkan", () => {
    const state = stateDasar();
    state.bed[1]!.status = "dibersihkan";

    const bed = denahBed(state)[0]!.bed;

    expect(bed.map((b) => b.status)).toEqual(["kosong", "dibersihkan"]);
  });
});

describe("alasan bed tidak tersedia", () => {
  it("mengembalikan null untuk bed kosong", () => {
    expect(alasanBedTidakTersedia(stateDasar(), "bed-1")).toBeNull();
  });

  it("menyebut bed baru saja terisi bila statusnya terisi", () => {
    const state = stateDasar();
    state.bed[0]!.status = "terisi";

    expect(alasanBedTidakTersedia(state, "bed-1")).toContain("baru saja terisi");
  });

  it("menjelaskan bed belum siap dipakai bila masih dibersihkan", () => {
    const state = stateDasar();
    state.bed[0]!.status = "dibersihkan";

    expect(alasanBedTidakTersedia(state, "bed-1")).toContain("belum siap dipakai");
  });

  it("mengembalikan alasan bila bed tidak ditemukan", () => {
    expect(alasanBedTidakTersedia(stateDasar(), "bed-hantu")).toBe("Bed tidak ditemukan.");
  });

  it("memberi pesan yang sama dengan store saat admisi ditolak", () => {
    const { store } = stateDenganAdmisi();
    const bed = store.getState().bed[0]!;

    expect(alasanBedTidakTersedia(store.getState(), bed.id)).toContain("baru saja terisi");
  });
});

describe("selector admisi", () => {
  it("hanya mengembalikan admisi aktif", () => {
    const { store, admisiId } = stateDenganAdmisi();
    expect(admisiAktif(store.getState()).map((a) => a.id)).toEqual([admisiId]);
  });

  it("info admisi menggabungkan pasien, dokter, kamar, dan bed", () => {
    const { store, admisiId } = stateDenganAdmisi();

    const info = infoAdmisi(store.getState(), admisiId);

    expect(info).toMatchObject({
      pasien: { nama: IDENTITAS_PASIEN.nama, nomorRM: "RM-2026-1" },
      dokter: { nama: "dr. Ayu" },
      kamar: { nama: "Melati 1", kelas: "I", tarifHarian: 500_000 },
      bed: { kode: "A" },
      tanggalMasuk: "2026-03-01",
    });
  });

  it("info admisi null untuk id yang tidak ada", () => {
    const { store } = stateDenganAdmisi();
    expect(infoAdmisi(store.getState(), "admisi-hantu")).toBeNull();
  });

  it("daftar admisi aktif memuat pasien, bed, dokter, dan tanggal masuk, terbaru dulu", () => {
    const { store, admisiId } = stateDenganAdmisi();
    const kedua = store.dispatch({
      type: "pasien/dibuat",
      olehId: PENGGUNA_UJI.pendaftaran,
      input: { ...IDENTITAS_PASIEN, nama: "Pasien Baru", nik: "3201015501900099" },
    });
    if (!kedua.ok) throw new Error("setup gagal");
    const masuk = store.dispatch({
      type: "admisi/dibuat",
      olehId: PENGGUNA_UJI.pendaftaran,
      pasienId: kedua.id,
      dokterId: PENGGUNA_UJI.dokter,
      bedId: "bed-2",
      tanggalMasuk: "2026-02-25",
      diagnosaAwal: "Observasi",
    });
    if (!masuk.ok) throw new Error("setup gagal");

    const daftar = daftarAdmisiAktif(store.getState());

    expect(daftar.map((a) => a.admisiId)).toEqual([admisiId, masuk.id]);
    expect(daftar[1]).toMatchObject({
      pasien: { nama: "Pasien Baru" },
      bed: { kode: "B" },
      dokter: { nama: "dr. Ayu" },
      tanggalMasuk: "2026-02-25",
    });
  });

  it("daftar admisi aktif tidak memuat admisi selesai", () => {
    const { store, admisiId } = stateDenganAdmisi();
    const tagihan = store.getState().tagihan.find((t) => t.admisiId === admisiId)!;
    store.dispatch({ type: "pembayaran/dicatat", olehId: PENGGUNA_UJI.kasir, tagihanId: tagihan.id, jumlah: 9_000_000, metode: "tunai" });
    store.dispatch({ type: "checkout", olehId: PENGGUNA_UJI.kasir, admisiId, override: null });

    expect(daftarAdmisiAktif(store.getState())).toEqual([]);
  });
});
