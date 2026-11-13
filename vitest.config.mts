import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules/**", ".next/**", "tests/e2e/**"],
    // Tanggal kalender dibaca di zona pengguna; tanpa zona tetap, test biaya
    // kamar lulus atau gagal tergantung mesin yang menjalankannya.
    env: { TZ: "Asia/Jakarta" },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "."),
    },
  },
});
