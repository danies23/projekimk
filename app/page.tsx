import { redirect } from "next/navigation";

/**
 * Akar aplikasi hanya mengantar ke dashboard. `redirect` dipakai saat render,
 * bukan `useRouter` di dalam efek, sehingga tidak ada kedipan layar kosong
 * sebelum pengalihan terjadi.
 */
export default function HalamanAkar() {
  redirect("/dashboard");
}
