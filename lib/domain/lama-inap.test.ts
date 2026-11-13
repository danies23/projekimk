import { describe, expect, it } from "vitest";
import { lamaInap } from "./lama-inap";

describe("lama inap", () => {
  it("menghitung masuk dan pulang di hari yang sama sebagai 1 hari", () => {
    expect(lamaInap("2026-01-01", "2026-01-01", "2026-01-10")).toBe(1);
  });

  it("menghitung masuk 1 Januari dan pulang 3 Januari sebagai 3 hari", () => {
    expect(lamaInap("2026-01-01", "2026-01-03", "2026-01-10")).toBe(3);
  });

  it("menghitung inap sebulan penuh secara inklusif", () => {
    expect(lamaInap("2026-01-31", "2026-02-02", "2026-03-01")).toBe(3);
  });

  it("memakai hari ini sebagai tanggal pulang untuk admisi yang masih aktif", () => {
    expect(lamaInap("2026-03-01", null, "2026-03-05")).toBe(5);
  });

  it("admisi aktif yang baru masuk hari ini dihitung 1 hari", () => {
    expect(lamaInap("2026-03-05", null, "2026-03-05")).toBe(1);
  });
});
