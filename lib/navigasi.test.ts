import { describe, expect, it } from "vitest";
import { jejakNavigasi, modulUntuk } from "./navigasi";

describe("navigasi per modul", () => {
  it("mencocokkan rute modul dengan deklarasinya di matriks izin", () => {
    expect(modulUntuk("/dashboard")?.resource).toBe("dashboard");
    expect(modulUntuk("/kamar")?.resource).toBe("kamar");
    expect(modulUntuk("/administrasi/audit")?.resource).toBe("audit");
  });

  it("mencocokkan sub-rute ke modul induknya", () => {
    expect(modulUntuk("/kamar/bed-1")?.resource).toBe("kamar");
    expect(modulUntuk("/pendaftaran/baru")?.resource).toBe("pendaftaran");
  });

  it("mengembalikan null untuk rute yang tidak dikenal", () => {
    expect(modulUntuk("/")).toBeNull();
    expect(modulUntuk("/tidak-ada")).toBeNull();
  });

  it("audit log tetap milik modulnya sendiri, bukan modul administrasi", () => {
    expect(modulUntuk("/administrasi")?.resource).toBe("administrasi");
    expect(modulUntuk("/administrasi/pengguna")?.resource).toBe("administrasi");
  });

  it("menyusun jejak navigasi bertingkat untuk modul dengan anak", () => {
    const jejak = jejakNavigasi("/administrasi/audit");

    expect(jejak.map((m) => m.resource)).toEqual(["administrasi", "audit"]);
    expect(jejak.map((m) => m.label)).toEqual(["Administrasi", "Audit Log"]);
  });

  it("menyusun jejak satu tingkat untuk modul daun", () => {
    expect(jejakNavigasi("/farmasi").map((m) => m.resource)).toEqual(["farmasi"]);
  });

  it("tidak mengarang jejak untuk rute yang tidak dikenal", () => {
    expect(jejakNavigasi("/tidak-ada")).toEqual([]);
  });
});
