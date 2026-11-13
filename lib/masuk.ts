import { AKUN_DEMO, SANDI_DEMO } from "./domain/demo-accounts";
import type { Id, Pengguna, State } from "./domain/types";
import type { Sesi } from "./sesi";

/**
 * Login demo: email + sandi tetap, dicocokkan dengan pengguna aktif di store.
 * Pesan kegagalan sengaja tidak membedakan "email tidak dikenal" dari "sandi
 * salah", tetapi tetap menyebut akun nonaktif agar admin bisa menindaklanjuti.
 */
export type HasilMasuk = { ok: true; penggunaId: Id } | { ok: false; alasan: string };

export function masuk(state: State, email: string, sandi: string): HasilMasuk {
  // Kredensial hidup di daftar akun demo, bukan di entitas pengguna: prototipe
  // tidak menyimpan sandi (ADR-0001).
  const akun = AKUN_DEMO.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
  const pengguna = akun ? state.pengguna.find((p) => p.id === akun.id) : undefined;
  if (!pengguna || sandi !== SANDI_DEMO) {
    return { ok: false, alasan: "Email atau sandi tidak cocok dengan akun demo mana pun." };
  }
  if (!pengguna.aktif) {
    return { ok: false, alasan: `Akun ${pengguna.nama} sedang tidak aktif. Hubungi Admin.` };
  }
  return { ok: true, penggunaId: pengguna.id };
}

/** Sesi hanya sah bila penggunanya masih ada dan aktif; selain itu login diminta lagi. */
export function penggunaSesi(pengguna: Pengguna[], sesi: Sesi | null): Pengguna | null {
  if (!sesi) return null;
  const ditemukan = pengguna.find((p) => p.id === sesi.penggunaId);
  if (!ditemukan || !ditemukan.aktif) return null;
  return ditemukan;
}
