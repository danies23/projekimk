"use client";

import { Shell } from "@/components/shell/shell";

/** Rute bertata letak aplikasi; tanpa sesi, shell mengalihkan ke halaman login. */
export default function LayoutAplikasi({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}
