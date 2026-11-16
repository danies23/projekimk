import { describe, expect, it } from "vitest";
import { PENGGUNA_UJI, depsUji, stateDasar, stateDenganAdmisi } from "./test-utils";
import { daftarTagihan, ringkasanKasir, riwayatPembayaran } from "./tagihan";

/** Jam berbeda tiap dispatch agar urutan riwayat dapat diuji dari waktunya. */
function depsBerjam() {
  let jam = 8;
  return depsUji({
    hariIni: () => "2026-03-03",
    sekarang: () => `2026-03-03T${String(jam++).padStart(2, "0")}:00:00.000Z`,
  });
}

function tagihanPertama(store: ReturnType<typeof stateDenganAdmisi>["store"]) {
  return store.getState().tagihan[0]!.id;
}

describe("selector daftar tagihan kasir", () => {
  it("memuat pasien, bed, dan status tagihan setiap admisi", () => {
    const { store } = stateDenganAdmisi(depsBerjam());

    const daftar = daftarTagihan(store.getState(), "2026-03-03");

    expect(daftar).toHaveLength(1);
    expect(daftar[0]).toMatchObject({
      pasien: { nama: "Siti Rahmawati", nomorRM: "RM-2026-1" },
      kodeBed: "A",
      namaKamar: "Melati 1",
      statusAdmisi: "aktif",
      nilai: { total: 1_500_000, dibayar: 0, sisa: 1_500_000, status: "belum bayar" },
    });
  });

  it("memperbarui status dan sisa setelah pembayaran sebagian", () => {
    const { store } = stateDenganAdmisi(depsBerjam());
    store.dispatch({
      type: "pembayaran/dicatat",
      olehId: PENGGUNA_UJI.kasir,
      tagihanId: tagihanPertama(store),
      jumlah: 500_000,
      metode: "tunai",
    });

    const [baris] = daftarTagihan(store.getState(), "2026-03-03");

    expect(baris!.nilai).toMatchObject({ dibayar: 500_000, sisa: 1_000_000, status: "sebagian" });
  });

  it("menaruh tagihan yang belum lunas di atas, lalu yang terbaru lebih dulu", () => {
    const deps = depsBerjam();
    const { store, admisiId } = stateDenganAdmisi(deps);
    // Admisi kedua masuk lebih baru dan langsung dilunasi.
    const pasien = store.dispatch({
      type: "pasien/dibuat",
      olehId: PENGGUNA_UJI.pendaftaran,
      input: { nama: "Pasien Baru", nik: "3201015501900099", tanggalLahir: "1990-01-15", jenisKelamin: "P", alamat: "Jl. A", telepon: "0812", penanggungJawab: { nama: "B", hubungan: "Anak", telepon: "0813" } },
    });
    if (!pasien.ok) throw new Error(pasien.alasan);
    const admisi = store.dispatch({
      type: "admisi/dibuat",
      olehId: PENGGUNA_UJI.pendaftaran,
      pasienId: pasien.id,
      dokterId: PENGGUNA_UJI.dokter,
      bedId: "bed-2",
      tanggalMasuk: "2026-03-03",
      diagnosaAwal: "Observasi",
    });
    if (!admisi.ok) throw new Error(admisi.alasan);
    const tagihanBaru = store.getState().tagihan.find((t) => t.admisiId === admisi.id)!;
    // Admisi pertama (masuk 1 Maret, hari ini 3 Maret → 3 hari × Rp500.000) dilunasi.
    const lama = store.getState().tagihan.find((t) => t.admisiId === admisiId)!;
    store.dispatch({ type: "pembayaran/dicatat", olehId: PENGGUNA_UJI.kasir, tagihanId: lama.id, jumlah: 1_500_000, metode: "tunai" });

    const daftar = daftarTagihan(store.getState(), "2026-03-03");

    expect(daftar.map((b) => b.tagihanId)).toEqual([tagihanBaru.id, lama.id]);
    expect(daftar.map((b) => b.nilai.status)).toEqual(["belum bayar", "lunas"]);
  });
});

describe("selector riwayat pembayaran", () => {
  it("menampilkan waktu, jumlah, metode, dan nama kasir, terbaru dulu", () => {
    let waktu = "2026-03-03T08:00:00.000Z";
    const { store } = stateDenganAdmisi(depsUji({ hariIni: () => "2026-03-03", sekarang: () => waktu }));
    const tagihanId = tagihanPertama(store);
    store.dispatch({ type: "pembayaran/dicatat", olehId: PENGGUNA_UJI.kasir, tagihanId, jumlah: 100_000, metode: "tunai" });
    waktu = "2026-03-03T09:00:00.000Z";
    store.dispatch({ type: "pembayaran/dicatat", olehId: PENGGUNA_UJI.kasir, tagihanId, jumlah: 50_000, metode: "debit" });

    const riwayat = riwayatPembayaran(store.getState(), tagihanId);

    expect(riwayat.map((r) => r.pembayaran.jumlah)).toEqual([50_000, 100_000]);
    expect(riwayat[0]).toMatchObject({
      pembayaran: { metode: "debit", waktu: "2026-03-03T09:00:00.000Z" },
      kasir: { nama: "Joko" },
    });
  });

  it("mengembalikan daftar kosong untuk tagihan tanpa pembayaran", () => {
    const { store } = stateDenganAdmisi(depsBerjam());

    expect(riwayatPembayaran(store.getState(), tagihanPertama(store))).toEqual([]);
  });
});

describe("ringkasan kasir", () => {
  it("menghitung pembayaran kasir ini saja dan memisahkan yang terjadi hari ini", () => {
    const state = stateDasar();
    state.pengguna.push({ id: "u-kasir-2", nama: "Kasir Dua", peran: "kasir", aktif: true });
    let waktu = "2026-03-02T08:00:00.000Z";
    const deps = depsUji({ hariIni: () => "2026-03-03", sekarang: () => waktu });
    const { store } = stateDenganAdmisi(deps, state);
    const tagihanId = tagihanPertama(store);

    // Kemarin, oleh kasir ini; hari ini oleh kasir ini dan kasir lain.
    store.dispatch({ type: "pembayaran/dicatat", olehId: PENGGUNA_UJI.kasir, tagihanId, jumlah: 50_000, metode: "tunai" });
    waktu = "2026-03-03T08:00:00.000Z";
    store.dispatch({ type: "pembayaran/dicatat", olehId: PENGGUNA_UJI.kasir, tagihanId, jumlah: 100_000, metode: "tunai" });
    store.dispatch({ type: "pembayaran/dicatat", olehId: "u-kasir-2", tagihanId, jumlah: 25_000, metode: "tunai" });

    const ringkasan = ringkasanKasir(store.getState(), PENGGUNA_UJI.kasir, "2026-03-03");

    expect(ringkasan).toEqual({ total: 150_000, transaksi: 2, hariIni: 100_000 });
  });
});
