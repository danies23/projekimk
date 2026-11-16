"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { AKUN_DEMO } from "@/lib/domain/demo-accounts";
import { LABEL_PERAN, URUTAN_PERAN } from "@/lib/label-peran";
import { useSesi } from "./sesi-provider";
import { useSelector } from "./store-provider";

/**
 * Pengalih peran cepat, hanya untuk demo. Setiap akun muncul sekali dengan
 * peran sebagai keterangan; saat peran punya dua orang (dokter/perawat), nama
 * membedakan keduanya. Akun nonaktif tidak ditawarkan: sesi yang menunjuknya
 * akan langsung dibersihkan dan pengguna terlempar ke halaman login.
 */
export function PengalihPeran() {
  const { pengguna, masukSebagai } = useSesi();
  // Matriks akun tetap berasal dari AKUN_DEMO (kredensial tidak hidup di
  // store), tetapi status aktifnya dibaca dari store agar konsisten dengan
  // layar Administrasi.
  const daftarPengguna = useSelector((s) => s.pengguna);
  if (!pengguna) return null;
  const akunAktif = AKUN_DEMO.find((a) => a.id === pengguna.id);
  const aktif = (id: string) => daftarPengguna.find((p) => p.id === id)?.aktif ?? true;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-surface px-3 text-small font-medium text-text transition-colors hover:border-primary hover:bg-primary-soft"
        >
          <span className="rounded-full bg-warning px-2 py-0.5 text-caption font-semibold text-on-primary">Demo</span>
          <span>Ganti peran</span>
          <span aria-hidden="true">▾</span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-64 rounded-md border border-border bg-surface p-1 shadow-lg"
        >
          <DropdownMenu.Label className="px-3 py-2 text-caption text-text-muted">
            Lingkungan demo — berpindah peran tanpa keluar
          </DropdownMenu.Label>
          {URUTAN_PERAN.map((peran) => {
            const kandidat = AKUN_DEMO.filter((a) => a.peran === peran && aktif(a.id));
            return kandidat.map((a) => (
              <DropdownMenu.Item
                key={a.id}
                onSelect={() => masukSebagai(a.id)}
                className="flex min-h-11 cursor-pointer flex-col justify-center rounded-sm px-3 py-1.5 text-small outline-none data-[highlighted]:bg-primary-soft"
              >
                <span className="font-medium text-text">{LABEL_PERAN[peran]}</span>
                <span className="text-caption text-text-muted">{a.nama}</span>
              </DropdownMenu.Item>
            ));
          })}
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item disabled className="px-3 py-2 text-caption text-text-muted">
            Peran aktif: {akunAktif?.nama ?? pengguna.nama}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
