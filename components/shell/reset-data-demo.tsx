"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { useStoreDemo } from "./store-provider";

/**
 * "Reset data demo" mengembalikan seluruh snapshot domain ke kondisi awal.
 * Fitur demo, bukan fitur produksi: moderator usability testing memakainya agar
 * setiap responden mulai dari kondisi yang sama persis. Sesi sengaja tidak
 * dikosongkan — pengguna tetap pada perannya (lihat `lib/sesi.ts`).
 */
export function ResetDataDemo() {
  const store = useStoreDemo();
  const [buka, setBuka] = useState(false);
  // Reset mengganti isi hampir setiap layar; tanpa pengumuman, pengguna
  // pembaca layar tidak tahu data berubah sampai ia menavigasi ulang.
  const [pengumuman, setPengumuman] = useState("");

  return (
    <>
      <p role="status" className="sr-only">
        {pengumuman}
      </p>
      <Dialog.Root open={buka} onOpenChange={setBuka}>
        <Dialog.Trigger asChild>
          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-3 text-small font-medium text-text transition-colors hover:border-primary hover:bg-primary-soft"
          >
            Reset data demo
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-text/40" />
          <Dialog.Content className="fixed inset-x-4 top-1/2 z-50 max-h-[90dvh] max-w-lg -translate-y-1/2 overflow-y-auto rounded-lg border border-border bg-surface p-6 shadow-lg sm:left-1/2 sm:right-auto sm:w-[min(32rem,calc(100vw-2rem))] sm:-translate-x-1/2">
            <Dialog.Title className="text-title">Reset data demo?</Dialog.Title>
            <Dialog.Description className="mt-2 text-small text-text-muted">
              Seluruh perubahan yang dibuat selama demo akan hilang dan data kembali ke kondisi awal.
              Peran aktif Anda tidak berubah.
            </Dialog.Description>
            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-small font-semibold text-text transition-colors hover:bg-surface-muted"
                >
                  Batal
                </button>
              </Dialog.Close>
              <button
                type="button"
                onClick={() => {
                  store.reset();
                  setPengumuman("Data demo dikembalikan ke kondisi awal.");
                  setBuka(false);
                }}
                className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-small font-semibold text-on-primary transition-colors hover:bg-primary-hover"
              >
                Ya, reset data demo
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
