import { describe, expect, it } from "vitest";
import { buatDataDemo } from "./data-demo";
import { lamaInap, geserTanggal, selisihHari } from "./lama-inap";
import { nilaiTagihan } from "./tagihan";
import type { State } from "./types";

const HARI_INI = "2026-03-15";
const state: State = buatDataDemo(HARI_INI);

function tagihanStatus(s: State, admisiId: string) {
  const tagihan = s.tagihan.find((t) => t.admisiId === admisiId);
  return tagihan ? nilaiTagihan(s, tagihan.id, HARI_INI).status : null;
}

describe("data demo", () => {
  it("memuat sekitar 40 pasien dengan Nomor Rekam Medis unik dan berformat benar", () => {
    expect(state.pasien.length).toBeGreaterThanOrEqual(36);
    expect(state.pasien.length).toBeLessThanOrEqual(44);
    const nomor = state.pasien.map((p) => p.nomorRM);
    expect(new Set(nomor).size).toBe(nomor.length);
    for (const n of nomor) {
      expect(n).toMatch(/^RM-\d{4}-\d+$/);
    }
  });

  it("menyediakan enam kamar dengan total 12–16 bed", () => {
    expect(state.kamar).toHaveLength(6);
    expect(state.bed.length).toBeGreaterThanOrEqual(12);
    expect(state.bed.length).toBeLessThanOrEqual(16);
    expect(state.kamar.every((k) => k.aktif)).toBe(true);
  });

  it("memulai dengan okupansi bed 60–70 persen", () => {
    const terisi = state.bed.filter((b) => b.status === "terisi").length;
    const rasio = terisi / state.bed.length;

    expect(rasio).toBeGreaterThanOrEqual(0.6);
    expect(rasio).toBeLessThanOrEqual(0.7);
    expect(state.admisi.filter((a) => a.status === "aktif")).toHaveLength(terisi);
  });

  it("memakai setiap bed terisi oleh tepat satu admisi aktif", () => {
    const terisi = state.bed.filter((b) => b.status === "terisi");
    for (const bed of terisi) {
      const aktif = state.admisi.filter((a) => a.status === "aktif" && a.bedId === bed.id);
      expect(aktif, `bed ${bed.kode} harus ditempati tepat satu admisi`).toHaveLength(1);
    }
  });

  it("memuat 15 obat dengan minimal dua di bawah stok minimum", () => {
    expect(state.obat).toHaveLength(15);
    const menipis = state.obat.filter((o) => o.stok < o.stokMinimum);
    expect(menipis.length).toBeGreaterThanOrEqual(2);
    expect(state.obat.every((o) => o.stok >= 0)).toBe(true);
  });

  it("memuat sepuluh tindakan pada master", () => {
    expect(state.tindakanMaster).toHaveLength(10);
    expect(state.tindakanMaster.every((t) => t.aktif)).toBe(true);
  });

  it("mengisi resep pada ketiga status", () => {
    const status = new Set(state.resep.map((r) => r.status));
    expect(status).toEqual(new Set(["menunggu", "disiapkan", "diserahkan"]));
  });

  it("mengisi tagihan pada ketiga status", () => {
    const status = new Set(state.admisi.map((a) => tagihanStatus(state, a.id)));
    expect(status).toEqual(new Set(["belum bayar", "sebagian", "lunas"]));
  });

  it("memuat minimal satu admisi dengan riwayat pindah kamar", () => {
    expect(state.admisi.some((a) => a.segmenBed.length >= 2)).toBe(true);
  });

  it("menghasilkan data dalam 30 hari terakhir sehingga tren selalu berisi", () => {
    const sejak = "2026-02-15";
    expect(selisihHari(sejak, HARI_INI)).toBe(28);
    const masukBaru = state.admisi.filter((a) => a.tanggalMasuk >= sejak);
    expect(masukBaru.length).toBeGreaterThan(0);
    const pembayaranBaru = state.pembayaran.filter((p) => p.waktu.slice(0, 10) >= sejak);
    expect(pembayaranBaru.length).toBeGreaterThan(0);
    // Tren 30 hari butuh sebaran, bukan satu titik.
    const hariBerbayar = new Set(pembayaranBaru.map((p) => p.waktu.slice(0, 10)));
    expect(hariBerbayar.size).toBeGreaterThanOrEqual(5);
  });

  it("menghasilkan state yang sama persis untuk hari yang sama", () => {
    expect(buatDataDemo(HARI_INI)).toEqual(state);
  });

  it("menggeser seluruh tanggal ketika hari ini berubah", () => {
    const lain = buatDataDemo("2027-01-10");
    const masuk = lain.admisi.map((a) => a.tanggalMasuk).sort();
    const geser = selisihHari(HARI_INI, "2027-01-10");

    // Setiap tanggal bergeser sejauh pergeseran hari ini, bukan diacak ulang.
    const asli = state.admisi.map((a) => a.tanggalMasuk).sort();
    expect(masuk).toEqual(asli.map((t) => geserTanggal(t, geser)));
    expect(masuk.at(-1)).toBe(geserTanggal(state.admisi.map((a) => a.tanggalMasuk).sort().at(-1)!, geser));
  });

  it("menjaga lama inap admisi aktif tetap konsisten dengan hari ini", () => {
    for (const admisi of state.admisi.filter((a) => a.status === "aktif")) {
      expect(lamaInap(admisi.tanggalMasuk, null, HARI_INI)).toBeGreaterThanOrEqual(1);
      expect(admisi.tanggalMasuk <= HARI_INI).toBe(true);
    }
  });

  it("menyediakan tujuh akun demo, satu per peran", () => {
    const peran = new Set(state.pengguna.map((p) => p.peran));
    expect(peran).toEqual(new Set(["pendaftaran", "dokter", "perawat", "apoteker", "kasir", "pimpinan", "admin"]));
    expect(state.pengguna.filter((p) => p.aktif).length).toBeGreaterThanOrEqual(7);
  });

  it("mengisi audit log dengan entri awal", () => {
    expect(state.audit.length).toBeGreaterThan(0);
  });
});

describe("kualitas data demo", () => {
  it("memberi setiap bed kode unik agar pesan penolakan tidak ambigu", () => {
    const kode = state.bed.map((b) => b.kode);
    expect(new Set(kode).size).toBe(kode.length);
  });

  it("memindahkan satu admisi ke kamar yang benar-benar berbeda", () => {
    const pindah = state.admisi.filter((a) => a.segmenBed.length >= 2);
    expect(pindah.length).toBeGreaterThanOrEqual(1);
    const segmen = pindah[0]!.segmenBed;
    expect(new Set(segmen.map((s) => s.kamarId)).size).toBeGreaterThanOrEqual(2);

    // Tarif kamar berbeda, jadi biaya per segmen terlihat di tagihan demo.
    const tarif = new Set(
      segmen.map((s) => state.kamar.find((k) => k.id === s.kamarId)!.tarifHarian),
    );
    expect(tarif.size).toBeGreaterThanOrEqual(2);
  });

  it("menyertakan pasien dengan lebih dari satu riwayat admisi", () => {
    const perPasien = new Map<string, number>();
    for (const a of state.admisi) perPasien.set(a.pasienId, (perPasien.get(a.pasienId) ?? 0) + 1);

    expect([...perPasien.values()].filter((n) => n > 1).length).toBeGreaterThanOrEqual(1);
  });
});
