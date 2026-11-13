import { describe, expect, it } from "vitest";
import { AKUN_DEMO } from "./domain/demo-accounts";
import { LABEL_PERAN, URUTAN_PERAN, labelPeran } from "./label-peran";
import type { Peran } from "./domain/types";

describe("label peran", () => {
  it("menyediakan label untuk setiap peran dan tidak menyisakan yang kosong", () => {
    for (const peran of URUTAN_PERAN) {
      expect(labelPeran(peran)).toBeTruthy();
    }
    expect(new Set(URUTAN_PERAN).size).toBe(7);
    expect(Object.keys(LABEL_PERAN)).toHaveLength(7);
  });

  it("memberi label yang sama dengan yang tampil di daftar akun demo", () => {
    for (const akun of AKUN_DEMO) {
      expect(LABEL_PERAN[akun.peran], `akun ${akun.nama}`).toBe(akun.label);
    }
  });

  it("memakai istilah glossary untuk peran pendaftaran", () => {
    expect(labelPeran("pendaftaran")).toBe("Petugas Pendaftaran");
    expect(labelPeran(null)).toBe("—");
  });
});
