import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { logomark } from "@/components/brand/logomark-geometry";
import { semanticColors } from "@/lib/design-tokens";

/**
 * The favicon is a static file the browser fetches before any CSS exists, so
 * it cannot use custom properties. It duplicates the geometry and two palette
 * colours by necessity; these checks make that duplication safe.
 */
describe("favicon", () => {
  const svg = readFileSync(path.resolve(import.meta.dirname, "../../app/icon.svg"), "utf8");

  it("draws the same mark as the wordmark component", () => {
    expect(svg).toContain(`d="${logomark.pulsePath}"`);
    expect(svg).toContain(`viewBox="${logomark.viewBox}"`);
    expect(svg).toContain(`rx="${logomark.radius}"`);
    expect(svg).toContain(`stroke-width="${logomark.strokeWidth}"`);
  });

  it("uses palette colours rather than drifting values", () => {
    expect(svg).toContain(`fill="${semanticColors.primary}"`);
    expect(svg).toContain(`stroke="${semanticColors.onPrimary}"`);
  });
});
