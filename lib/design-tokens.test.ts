import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { contrastPairs, radiusScale, semanticColors, shadowScale, typeScale } from "./design-tokens";

const HEX = /^#[0-9a-f]{6}$/i;

// WCAG 2.1 relative luminance and contrast ratio, implemented here as the
// independent oracle. It is anchored below against the published black/white
// value so a broken formula cannot make every pair pass.
function channel(value: number): number {
  const s = value / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const r = channel(parseInt(hex.slice(1, 3), 16));
  const g = channel(parseInt(hex.slice(3, 5), 16));
  const b = channel(parseInt(hex.slice(5, 7), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Every `--color-*` declaration in globals.css. */
function readColourTheme(): Map<string, string> {
  const css = readFileSync(path.resolve(import.meta.dirname, "../app/globals.css"), "utf8");
  const values = new Map<string, string>();
  for (const match of css.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-f]{6})\s*;/gi)) {
    values.set(match[1]!, match[2]!.toLowerCase());
  }
  return values;
}

/** Every `--<prefix><name>: <value>;` declaration inside the @theme block. */
function readThemeValues(prefix: string): Map<string, string> {
  const css = readFileSync(path.resolve(import.meta.dirname, "../app/globals.css"), "utf8");
  const values = new Map<string, string>();
  const pattern = new RegExp(`--${prefix}([a-z0-9-]+):\\s*([^;]+);`, "gi");
  for (const match of css.matchAll(pattern)) {
    // Skip the line-height companion keys (`--text-small--line-height`).
    if (match[1]!.includes("--")) continue;
    values.set(match[1]!, match[2]!.trim());
  }
  return values;
}

describe("design tokens", () => {
  it("defines every semantic colour as a valid hex value", () => {
    const entries = Object.entries(semanticColors);
    expect(entries.length).toBeGreaterThan(0);
    for (const [name, value] of entries) {
      expect(value, `${name} must be a 6-digit hex colour`).toMatch(HEX);
    }
  });

  it("computes contrast the way WCAG defines it", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 1);
    expect(contrast("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
  });

  it("meets WCAG AA for every declared text-on-surface pair", () => {
    expect(contrastPairs.length).toBeGreaterThan(0);
    for (const pair of contrastPairs) {
      const ratio = contrast(pair.foreground, pair.background);
      expect(ratio, `${pair.name} is ${ratio.toFixed(2)}:1, needs ${pair.minimum}:1`).toBeGreaterThanOrEqual(
        pair.minimum,
      );
    }
  });

  it("keeps the CSS theme in step with the semantic palette", () => {
    const theme = readColourTheme();
    for (const [name, value] of Object.entries(semanticColors)) {
      const cssName = name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
      expect(theme.get(cssName), `--color-${cssName} missing from globals.css`).toBe(value.toLowerCase());
    }
  });

  it("mirrors every type-scale step into Tailwind's --text-* namespace", () => {
    const theme = readThemeValues("text-");
    for (const [name, value] of Object.entries(typeScale)) {
      expect(theme.get(name), `--text-${name} missing from globals.css, so .text-${name} is dead`).toBe(value);
    }
  });

  it("mirrors every radius step into Tailwind's --radius-* namespace", () => {
    const theme = readThemeValues("radius-");
    for (const [name, value] of Object.entries(radiusScale)) {
      expect(theme.get(name), `--radius-${name} missing from globals.css`).toBe(value);
    }
  });

  it("mirrors every shadow step into Tailwind's --shadow-* namespace", () => {
    const theme = readThemeValues("shadow-");
    for (const [name, value] of Object.entries(shadowScale)) {
      expect(theme.get(name), `--shadow-${name} missing from globals.css`).toBe(value);
    }
  });

  it("defines a spacing base that the spacing scale is built from", () => {
    const css = readFileSync(path.resolve(import.meta.dirname, "../app/globals.css"), "utf8");
    const hasGuessedSpacingValue = /--spacing-([a-z0-9-]+):/i.test(css);
    expect(hasGuessedSpacingValue, "use --spacing (base) not --spacing-<name>; Tailwind derives steps by multiplication").toBe(false);
  });
});
