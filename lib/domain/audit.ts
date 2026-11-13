import type { StoreDeps } from "./actions";
import type { AksiAudit, Id, State } from "./types";

/**
 * Setiap mutasi penting wajib meninggalkan jejak: waktu, pengguna, aksi,
 * entitas, dan ringkasan perubahan. Komponen tidak boleh menulis audit sendiri.
 */
export function audit(
  draft: State,
  deps: StoreDeps,
  penggunaId: Id,
  input: {
    aksi: AksiAudit;
    entitas: string;
    entitasId: Id;
    ringkasan: string;
  },
): void {
  draft.audit.push({ id: deps.id("audit"), waktu: deps.sekarang(), penggunaId, ...input });
}
