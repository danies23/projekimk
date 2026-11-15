"use client";

import { useState } from "react";
import { useSelector } from "@/components/shell/store-provider";
import type { Action } from "@/lib/domain/actions";
import { riwayatKlinis, type ItemRiwayat } from "@/lib/domain/selectors";
import type { CatatanKlinis, Id, InstruksiDijalankan, StatusResep } from "@/lib/domain/types";
import { formatRupiah, formatTanggalWaktu } from "@/lib/format";

export const LABEL_RESEP: Record<StatusResep, string> = {
  menunggu: "Menunggu",
  disiapkan: "Disiapkan",
  diserahkan: "Diserahkan",
};

/** Warna status melengkapi teks, bukan menggantikannya (WCAG 1.4.1). */
export const WARNA_RESEP: Record<StatusResep, string> = {
  menunggu: "text-warning",
  disiapkan: "text-info",
  diserahkan: "text-success",
};

const LABEL_JENIS_CATATAN = {
  visite: "Visite dokter",
  perkembangan: "Catatan perkembangan",
  tanda_vital: "Tanda vital",
} as const;

/** Kutipan singkat supaya penunjuk koreksi muat satu baris. */
function potong(teks: string): string {
  return teks.length > 80 ? `${teks.slice(0, 80)}…` : teks;
}

/**
 * Riwayat klinis satu pasien lintas admisi, dipakai dokter dan perawat supaya
 * keduanya membaca garis waktu yang sama: catatan, tindakan, resep, penanda
 * koreksi, dan penanda instruksi yang sudah dijalankan.
 */
export function RiwayatKlinis({
  pasienId,
  penggunaId,
  onAksi,
}: {
  pasienId: Id;
  penggunaId: Id;
  onAksi: (aksi: Action, sukses: string) => boolean;
}) {
  const state = useSelector((s) => s);
  const riwayat = riwayatKlinis(state, pasienId);
  const catatanById = new Map(state.catatanKlinis.map((c) => [c.id, c]));
  const dijalankan = new Map(state.instruksiDijalankan.map((i) => [i.catatanId, i]));
  const [koreksiId, setKoreksiId] = useState<Id | null>(null);
  const [isiKoreksi, setIsiKoreksi] = useState("");
  const [galatKoreksi, setGalatKoreksi] = useState<string | null>(null);

  function mulaiKoreksi(item: Extract<ItemRiwayat, { jenis: "catatan" }>) {
    setKoreksiId(item.catatan.id);
    setIsiKoreksi(item.catatan.isi);
    setGalatKoreksi(null);
  }

  function simpanKoreksi(e: React.FormEvent) {
    e.preventDefault();
    if (!koreksiId) return;
    if (!isiKoreksi.trim()) {
      setGalatKoreksi("Isi koreksi wajib diisi.");
      return;
    }
    setGalatKoreksi(null);
    const berhasil = onAksi(
      { type: "catatan/dikoreksi", olehId: penggunaId, catatanId: koreksiId, isi: isiKoreksi },
      "Koreksi tersimpan; catatan asli tetap tersimpan dan ditandai telah dikoreksi.",
    );
    if (berhasil) {
      setKoreksiId(null);
      setIsiKoreksi("");
    }
  }

  return (
    <section aria-labelledby="judul-riwayat" className="rounded-lg border border-border bg-surface p-6 shadow-sm">
      <h2 id="judul-riwayat" className="text-title">
        Riwayat klinis pasien
      </h2>
      <p className="mt-1 text-small text-text-muted">
        Seluruh catatan, tindakan, dan resep lintas admisi, terbaru lebih dahulu. Catatan tidak dapat
        dihapus.
      </p>

      {riwayat.length === 0 ? (
        <p className="mt-3 rounded-md border border-border bg-surface-muted p-3 text-small text-text-muted">
          Belum ada riwayat klinis untuk pasien ini. Riwayat terisi setelah catatan visite, tindakan,
          resep, atau catatan perawat ditambahkan.
        </p>
      ) : (
        <ol className="mt-4 space-y-4">
          {riwayat.map((item) => {
            const kunci = item.jenis === "catatan" ? item.catatan.id : item.jenis === "tindakan" ? item.tindakan.id : item.resep.id;
            return (
              <li key={kunci} className="border-b border-border pb-4 last:border-b-0 last:pb-0">
                <p className="text-caption text-text-muted">
                  <time dateTime={item.waktu}>{formatTanggalWaktu(item.waktu)}</time>
                </p>
                {item.jenis === "catatan" ? (
                  <IsiCatatan
                    item={item}
                    asal={item.catatan.koreksiUntukId ? catatanById.get(item.catatan.koreksiUntukId) ?? null : null}
                    koreksi={item.catatan.dikoreksiOlehId ? catatanById.get(item.catatan.dikoreksiOlehId) ?? null : null}
                    penandaInstruksi={dijalankan.get(item.catatan.id) ?? null}
                    koreksiId={koreksiId}
                    isiKoreksi={isiKoreksi}
                    galatKoreksi={galatKoreksi}
                    onMulaiKoreksi={() => mulaiKoreksi(item)}
                    onBatalKoreksi={() => {
                      setKoreksiId(null);
                      setGalatKoreksi(null);
                    }}
                    onUbahKoreksi={setIsiKoreksi}
                    onSimpanKoreksi={simpanKoreksi}
                  />
                ) : item.jenis === "tindakan" ? (
                  <>
                    <p className="text-small font-semibold text-text">
                      Tindakan: {item.tindakan.nama}
                      <span className="ml-2 font-normal text-text-muted">{formatRupiah(item.tindakan.tarif)}</span>
                    </p>
                    <p className="text-caption text-text-muted">Dicatat oleh {item.oleh?.nama ?? "—"}</p>
                  </>
                ) : (
                  <>
                    <p className="text-small font-semibold text-text">
                      Resep
                      <span className={`ml-2 font-semibold ${WARNA_RESEP[item.resep.status]}`}>
                        {LABEL_RESEP[item.resep.status]}
                      </span>
                    </p>
                    <ul role="list" className="mt-1 space-y-1 text-small text-text">
                      {item.resep.items.map((resepItem, index) => (
                        <li key={`${item.resep.id}-${index}`}>
                          {resepItem.nama} — {resepItem.jumlah} · {resepItem.aturanPakai}
                        </li>
                      ))}
                    </ul>
                    <p className="text-caption text-text-muted">Diresepkan oleh {item.dokter?.nama ?? "—"}</p>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function IsiCatatan({
  item,
  asal,
  koreksi,
  penandaInstruksi,
  koreksiId,
  isiKoreksi,
  galatKoreksi,
  onMulaiKoreksi,
  onBatalKoreksi,
  onUbahKoreksi,
  onSimpanKoreksi,
}: {
  item: Extract<ItemRiwayat, { jenis: "catatan" }>;
  /** Catatan asli bila entri ini koreksi. */
  asal: CatatanKlinis | null;
  /** Entri koreksi bila catatan ini sudah dikoreksi. */
  koreksi: CatatanKlinis | null;
  /** Penanda perawat bahwa instruksi catatan ini sudah dijalankan, bila ada. */
  penandaInstruksi: InstruksiDijalankan | null;
  koreksiId: Id | null;
  isiKoreksi: string;
  galatKoreksi: string | null;
  onMulaiKoreksi: () => void;
  onBatalKoreksi: () => void;
  onUbahKoreksi: (isi: string) => void;
  onSimpanKoreksi: (e: React.FormEvent) => void;
}) {
  const { catatan, penulis } = item;
  const sedangDikoreksi = koreksiId === catatan.id;
  return (
    <>
      <p className="text-small font-semibold text-text">
        {LABEL_JENIS_CATATAN[catatan.jenis]}
        {catatan.koreksiUntukId ? (
          <span className="ml-2 rounded-sm bg-info/10 px-1.5 py-0.5 text-caption font-semibold text-info">Koreksi</span>
        ) : null}
        {catatan.dikoreksiOlehId ? (
          <span className="ml-2 rounded-sm bg-warning/10 px-1.5 py-0.5 text-caption font-semibold text-warning">
            Telah dikoreksi
          </span>
        ) : null}
      </p>
      {/* Penunjuk dua arah: pembaca catatan asli tahu ke mana koreksinya, dan
          pembaca koreksi tahu catatan mana yang digantikannya. */}
      {catatan.koreksiUntukId && asal ? (
        <p className="mt-1 text-caption text-info">
          Mengoreksi catatan: &ldquo;{potong(asal.isi)}&rdquo;
        </p>
      ) : null}
      {catatan.dikoreksiOlehId && koreksi ? (
        <p className="mt-1 text-caption text-warning">
          Dikoreksi oleh catatan: &ldquo;{potong(koreksi.isi)}&rdquo;
        </p>
      ) : null}
      <p className="mt-1 whitespace-pre-line text-body text-text">{catatan.isi}</p>
      {catatan.diagnosa ? (
        <p className="mt-1 text-small text-text">
          <span className="text-text-muted">Diagnosa: </span>
          {catatan.diagnosa}
        </p>
      ) : null}
      {catatan.rencana ? (
        <p className="mt-1 text-small text-text">
          <span className="text-text-muted">Rencana: </span>
          {catatan.rencana}
          {penandaInstruksi ? (
            <span className="ml-2 rounded-sm bg-success/10 px-1.5 py-0.5 text-caption font-semibold text-success">
              Sudah dijalankan
            </span>
          ) : null}
        </p>
      ) : null}
      {catatan.tandaVital ? (
        <p className="mt-1 text-small text-text">
          <span className="text-text-muted">Tanda vital: </span>
          TD {catatan.tandaVital.tekananDarah} · Suhu {catatan.tandaVital.suhu} °C · Nadi {catatan.tandaVital.nadi} ·
          RR {catatan.tandaVital.pernapasan} · SpO₂ {catatan.tandaVital.saturasi}%
        </p>
      ) : null}
      <p className="mt-1 text-caption text-text-muted">Ditulis oleh {penulis?.nama ?? "—"}</p>

      {/* Koreksi tidak dapat dikoreksi; tombolnya hanya untuk catatan asli. */}
      {!catatan.dikoreksiOlehId && !catatan.koreksiUntukId && !sedangDikoreksi ? (
        <button type="button" onClick={onMulaiKoreksi} className={`mt-2 ${tombolSekunderKecil}`}>
          Koreksi catatan
          {/* Nama tombol sama di setiap entri; waktu membedakannya bagi pembaca layar. */}
          <span className="sr-only"> {LABEL_JENIS_CATATAN[catatan.jenis]} {formatTanggalWaktu(catatan.waktu)}</span>
        </button>
      ) : null}

      {sedangDikoreksi ? (
        <form onSubmit={onSimpanKoreksi} className="mt-3 rounded-md border border-border bg-surface-muted p-3">
          <label htmlFor={`koreksi-${catatan.id}`} className="block text-small font-medium text-text">
            Isi koreksi
          </label>
          <textarea
            id={`koreksi-${catatan.id}`}
            rows={3}
            value={isiKoreksi}
            onChange={(e) => onUbahKoreksi(e.target.value)}
            aria-invalid={galatKoreksi ? true : undefined}
            aria-describedby={galatKoreksi ? `koreksi-${catatan.id}-galat` : undefined}
            className="mt-1 w-full rounded-md border border-border bg-canvas px-3 py-2 text-body text-text"
          />
          {galatKoreksi ? (
            <p id={`koreksi-${catatan.id}-galat`} role="alert" className="mt-1 text-caption text-danger">
              {galatKoreksi}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="submit" className={tombolUtama}>
              Simpan koreksi
            </button>
            <button type="button" onClick={onBatalKoreksi} className={tombolSekunderKecil}>
              Batal
            </button>
          </div>
        </form>
      ) : null}
    </>
  );
}

const tombolUtama =
  "inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-small font-semibold text-on-primary transition-colors hover:bg-primary-hover";
const tombolSekunderKecil =
  "inline-flex min-h-11 items-center rounded-md px-2 text-small font-semibold text-primary hover:underline";
