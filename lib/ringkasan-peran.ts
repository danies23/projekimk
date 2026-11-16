import { admisiAktif, obatStokMenipis, ringkasanBed } from "./domain/selectors";
import { tanggalLokal } from "./domain/store-demo";
import { nilaiTagihan } from "./domain/tagihan";
import type { SatuanAngka } from "./format";
import type { Id, Pengguna, State, Tanggal } from "./domain/types";

/**
 * Angka ringkas dashboard per peran. Setiap angka berasal dari selector domain
 * yang sama dengan modul asalnya, sehingga dashboard tidak pernah menghitung
 * ulang dengan rumus sendiri.
 */
export interface KartuRingkasan {
  label: string;
  nilai: number;
  satuan: SatuanAngka;
  href: string;
}

function kartu(label: string, nilai: number, href: string, satuan: SatuanAngka = "jumlah"): KartuRingkasan {
  return { label, nilai, href, satuan };
}

/**
 * Waktu kejadian disimpan sebagai instan UTC, sedangkan `hariIni` adalah
 * tanggal kalender lokal. Membandingkan potongan string membuat transaksi
 * dini hari (mis. 22:00 UTC = 05:00 WIB) terhitung di hari sebelumnya, jadi
 * setiap stempel waktu dikonversi ke tanggal lokal lebih dulu.
 */
function padaHari(waktu: string, hari: string): boolean {
  return tanggalLokal(new Date(waktu)) === hari;
}

function padaBulan(waktu: string, bulan: string): boolean {
  return tanggalLokal(new Date(waktu)).slice(0, 7) === bulan;
}

function pendapatan(state: State, predikat: (waktu: string) => boolean): number {
  return state.pembayaran.filter((p) => predikat(p.waktu)).reduce((n, p) => n + p.jumlah, 0);
}

/** Tagihan dianggap belum lunas selama statusnya bukan `lunas`. */
function tagihanBelumLunas(state: State, hariIni: Tanggal): number {
  return state.tagihan.filter((t) => nilaiTagihan(state, t.id, hariIni).status !== "lunas").length;
}

export function ringkasanPeran(state: State, pengguna: Pengguna, hariIni: Tanggal): KartuRingkasan[] {
  const bed = ringkasanBed(state);
  const aktif = admisiAktif(state);
  const pendapatanHariIni = pendapatan(state, (w) => padaHari(w, hariIni));
  const pendapatanBulanIni = pendapatan(state, (w) => padaBulan(w, hariIni.slice(0, 7)));

  switch (pengguna.peran) {
    case "pendaftaran":
      return [
        kartu("Pasien dirawat", aktif.length, "/kamar"),
        kartu("Bed kosong", bed.kosong, "/kamar"),
        kartu("Bed menunggu dibersihkan", bed.dibersihkan, "/kamar"),
      ];
    case "dokter":
      return [
        kartu("Pasien saya", aktif.filter((a) => a.dokterId === pengguna.id).length, "/klinis"),
        kartu(
          "Resep belum diserahkan",
          state.resep.filter((r) => r.dokterId === pengguna.id && r.status !== "diserahkan").length,
          "/klinis",
        ),
      ];
    case "perawat":
      return [
        kartu("Pasien dirawat", aktif.length, "/klinis"),
        kartu("Bed perlu disiapkan", bed.dibersihkan, "/kamar"),
      ];
    case "apoteker":
      return [
        kartu("Resep menunggu", state.resep.filter((r) => r.status === "menunggu").length, "/farmasi"),
        kartu("Resep disiapkan", state.resep.filter((r) => r.status === "disiapkan").length, "/farmasi"),
        kartu("Obat stok menipis", obatStokMenipis(state).length, "/farmasi"),
      ];
    case "kasir":
      return [
        kartu("Tagihan belum lunas", tagihanBelumLunas(state, hariIni), "/kasir"),
        kartu("Pendapatan hari ini", pendapatanHariIni, "/kasir", "rupiah"),
      ];
    case "pimpinan":
      return [
        kartu("Pasien dirawat", aktif.length, "/laporan"),
        kartu("BOR (%)", bed.bor, "/laporan", "persen"),
        kartu("Pendapatan hari ini", pendapatanHariIni, "/laporan", "rupiah"),
        kartu("Pendapatan bulan ini", pendapatanBulanIni, "/laporan", "rupiah"),
      ];
    case "admin":
      return [
        kartu("Pengguna aktif", state.pengguna.filter((p) => p.aktif).length, "/administrasi"),
        kartu("Bed kosong", bed.kosong, "/kamar"),
        kartu("Aktivitas hari ini", state.audit.filter((a) => padaHari(a.waktu, hariIni)).length, "/administrasi/audit"),
      ];
  }
}
