import { describe, expect, it } from "vitest";
import { IZIN, MODUL, boleh, bolehAkses, menuUntuk, type Tindakan } from "./izin";
import { URUTAN_PERAN } from "../label-peran";
import { modulUntuk } from "../navigasi";
import type { Peran } from "./types";

/**
 * Ticket 03 meminta satu deklarasi pusat yang dibaca sidebar, penjagaan
 * tombol, dan penjagaan rute. Test ini menjaga ketiga pembaca tetap setia
 * pada `IZIN`/`MODUL` — kalau salah satu mulai punya daftar sendiri,
 * hasilnya tidak lagi konsisten dan test ini gagal.
 */
describe("satu deklarasi pusat untuk tiga pembaca", () => {
  it("setiap modul di sidebar adalah modul yang boleh diakses peran itu", () => {
    for (const peran of URUTAN_PERAN) {
      for (const modul of menuUntuk(peran)) {
        expect(bolehAkses(peran, modul.resource), `${peran} → ${modul.href}`).toBe(true);
      }
    }
  });

  it("penjagaan rute dan sidebar memberi jawaban yang sama untuk setiap rute", () => {
    for (const peran of URUTAN_PERAN) {
      for (const modul of MODUL) {
        const diMenu = menuUntuk(peran).some((m) => m.href === modul.href);
        const diizinkan = bolehAkses(peran, modul.resource);
        expect(diMenu, `${peran} → ${modul.href}`).toBe(diizinkan);
      }
    }
  });

  it("rute yang dikenal navigasi selalu bisa dipetakan ke resource yang dijaga", () => {
    for (const modul of MODUL) {
      const cocok = modulUntuk(modul.href);
      expect(cocok?.resource, modul.href).toBe(modul.resource);
      expect(MODUL.some((m) => m.resource === cocok!.resource)).toBe(true);
    }
  });

  it("izin tindakan di matriks dan jawaban boleh() tidak pernah berbeda", () => {
    for (const peran of URUTAN_PERAN) {
      for (const tindakan of Object.keys(TINDAKAN_YANG_DIUJI) as Tindakan[]) {
        expect(boleh(peran, tindakan)).toBe(IZIN[peran].tindakan.includes(tindakan));
      }
    }
  });

  it("tidak ada peran yang kehilangan dashboard", () => {
    for (const peran of URUTAN_PERAN) {
      expect(menuUntuk(peran).some((m) => m.resource === "dashboard"), peran).toBe(true);
    }
  });

  it("admin boleh override checkout, peran lain tidak", () => {
    for (const peran of URUTAN_PERAN) {
      expect(boleh(peran, "checkout.override"), peran).toBe(peran === "admin");
    }
  });

  it("hanya apoteker dan admin yang boleh menyentuh master obat", () => {
    // Spec, user story 96: master obat dipelihara apoteker bersama admin.
    const pemegang = URUTAN_PERAN.filter((peran) => boleh(peran, "obat.buat"));
    expect(pemegang).toEqual(["apoteker", "admin"]);
  });

  it("setiap resource yang dideklarasikan setidaknya menjadi hak satu peran", () => {
    // Resource tanpa pemilik membuat rute yang memakainya menolak semua orang,
    // termasuk peran yang seharusnya berhak.
    for (const modul of MODUL) {
      const pemilik = URUTAN_PERAN.filter((peran) => bolehAkses(peran, modul.resource));
      expect(pemilik.length, `tidak ada peran yang berhak atas ${modul.resource}`).toBeGreaterThan(0);
    }
  });
});

/** Tindakan contoh dengan peran pemiliknya, dipakai untuk memeriksa konsistensi. */
const TINDAKAN_YANG_DIUJI: Record<string, Peran> = {
  "pasien.buat": "pendaftaran",
  "admisi.buat": "pendaftaran",
  "bed.pindah": "perawat",
  "bed.siap": "perawat",
  "catatan.tulis": "dokter",
  "catatan.koreksi": "dokter",
  "tindakan.tambah": "dokter",
  "resep.buat": "dokter",
  "resep.siapkan": "apoteker",
  "obat.serahkan": "apoteker",
  "pembayaran.catat": "kasir",
  "checkout.lakukan": "kasir",
  "checkout.override": "admin",
  "laporan.lihat": "pimpinan",
  "master.kamar": "admin",
  "pengguna.kelola": "admin",
  "audit.lihat": "admin",
};
