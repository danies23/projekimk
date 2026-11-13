"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { menuUntuk } from "@/lib/domain/izin";
import { ruteDiModul } from "@/lib/navigasi";
import { useSesi } from "./sesi-provider";

/** Sidebar hanya memuat modul yang menjadi hak peran aktif (matriks izin). */
export function Sidebar() {
  const { pengguna } = useSesi();
  const pathname = usePathname();
  const menu = menuUntuk(pengguna?.peran);

  return (
    <nav aria-label="Navigasi utama" className="border-b border-border bg-surface lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r">
      <ul className="flex gap-1 overflow-x-auto px-3 py-2 lg:flex-col lg:py-4">
        {menu.map((m) => {
          const aktif = ruteDiModul(pathname, m.href);
          return (
            <li key={m.resource}>
              <Link
                href={m.href}
                aria-current={aktif ? "page" : undefined}
                className={`inline-flex min-h-11 w-full items-center whitespace-nowrap rounded-md px-3 text-small font-medium transition-colors ${
                  aktif ? "bg-primary-soft text-primary" : "text-text hover:bg-surface-muted"
                }`}
              >
                {m.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
