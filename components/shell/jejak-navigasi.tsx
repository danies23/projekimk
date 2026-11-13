"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { jejakNavigasi } from "@/lib/navigasi";

/** Breadcrumb menunjukkan posisi pengguna dalam struktur aplikasi. */
export function JejakNavigasi() {
  const pathname = usePathname();
  const jejak = jejakNavigasi(pathname);
  if (jejak.length === 0) return null;

  return (
    <nav aria-label="Jejak navigasi" className="text-small text-text-muted no-print">
      <ol className="flex flex-wrap items-center gap-1.5">
        {jejak.map((modul, index) => {
          const terakhir = index === jejak.length - 1;
          return (
            <li key={modul.resource} className="flex items-center gap-1.5">
              {terakhir ? (
                <span aria-current="page" className="font-medium text-text">
                  {modul.label}
                </span>
              ) : (
                <>
                  <Link href={modul.href} className="rounded-sm hover:text-primary hover:underline">
                    {modul.label}
                  </Link>
                  <span aria-hidden="true">/</span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
