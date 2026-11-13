/**
 * Design tokens for Dani Medical Center.
 *
 * The values here are the single source of truth for the palette and are
 * mirrored into `app/globals.css` under `@theme`, where Tailwind turns them
 * into utilities. A test keeps the two in step, so a component must read a
 * token rather than a raw hex value.
 */

export const semanticColors = {
  canvas: "#f7fafb",
  surface: "#ffffff",
  surfaceMuted: "#eef4f6",
  border: "#d3e0e5",
  text: "#0f2b33",
  textMuted: "#4a6670",
  primary: "#0f6f7d",
  primaryHover: "#0b5a66",
  primarySoft: "#e4f2f4",
  accent: "#2f8f9d",
  success: "#1c6b4a",
  warning: "#8a5a00",
  danger: "#a32222",
  info: "#1f5f8b",
  onPrimary: "#ffffff",
} as const;

export type SemanticColor = keyof typeof semanticColors;

export interface ContrastPair {
  name: string;
  foreground: string;
  background: string;
  minimum: number;
}

/**
 * Text/background pairings the interface actually renders. Each entry carries
 * the WCAG 2.1 AA threshold it must clear. 4.5:1 covers body text; 3:1 covers
 * large text and meaningful non-text indicators such as a focus ring.
 */
export const contrastPairs: ContrastPair[] = [
  { name: "text on surface", foreground: semanticColors.text, background: semanticColors.surface, minimum: 4.5 },
  { name: "text on canvas", foreground: semanticColors.text, background: semanticColors.canvas, minimum: 4.5 },
  { name: "textMuted on surface", foreground: semanticColors.textMuted, background: semanticColors.surface, minimum: 4.5 },
  { name: "textMuted on canvas", foreground: semanticColors.textMuted, background: semanticColors.canvas, minimum: 4.5 },
  { name: "textMuted on surfaceMuted", foreground: semanticColors.textMuted, background: semanticColors.surfaceMuted, minimum: 4.5 },
  { name: "text on primarySoft", foreground: semanticColors.text, background: semanticColors.primarySoft, minimum: 4.5 },
  { name: "primary on surface", foreground: semanticColors.primary, background: semanticColors.surface, minimum: 4.5 },
  { name: "primary on canvas", foreground: semanticColors.primary, background: semanticColors.canvas, minimum: 4.5 },
  { name: "onPrimary on primary", foreground: semanticColors.onPrimary, background: semanticColors.primary, minimum: 4.5 },
  { name: "onPrimary on primaryHover", foreground: semanticColors.onPrimary, background: semanticColors.primaryHover, minimum: 4.5 },
  { name: "success on surface", foreground: semanticColors.success, background: semanticColors.surface, minimum: 4.5 },
  { name: "warning on surface", foreground: semanticColors.warning, background: semanticColors.surface, minimum: 4.5 },
  { name: "danger on surface", foreground: semanticColors.danger, background: semanticColors.surface, minimum: 4.5 },
  { name: "info on surface", foreground: semanticColors.info, background: semanticColors.surface, minimum: 4.5 },
  { name: "success on surfaceMuted", foreground: semanticColors.success, background: semanticColors.surfaceMuted, minimum: 4.5 },
  { name: "warning on surfaceMuted", foreground: semanticColors.warning, background: semanticColors.surfaceMuted, minimum: 4.5 },
  { name: "danger on surfaceMuted", foreground: semanticColors.danger, background: semanticColors.surfaceMuted, minimum: 4.5 },
  { name: "info on surfaceMuted", foreground: semanticColors.info, background: semanticColors.surfaceMuted, minimum: 4.5 },
  // Status badges: white label on each solid status colour.
  { name: "onPrimary on success badge", foreground: semanticColors.onPrimary, background: semanticColors.success, minimum: 4.5 },
  { name: "onPrimary on warning badge", foreground: semanticColors.onPrimary, background: semanticColors.warning, minimum: 4.5 },
  { name: "onPrimary on danger badge", foreground: semanticColors.onPrimary, background: semanticColors.danger, minimum: 4.5 },
  { name: "onPrimary on info badge", foreground: semanticColors.onPrimary, background: semanticColors.info, minimum: 4.5 },
  // Non-text indicator: the focus ring must be distinguishable from the page.
  { name: "focus ring on canvas", foreground: semanticColors.primary, background: semanticColors.canvas, minimum: 3 },
];

/** Type scale. Sizes are rem so browser zoom is honoured. */
export const typeScale = {
  caption: "0.75rem",
  small: "0.875rem",
  body: "1rem",
  lead: "1.125rem",
  title: "1.375rem",
  heading: "1.75rem",
  display: "2.25rem",
} as const;

/** 4px base spacing scale. */
export const spacingScale = {
  "1": "0.25rem",
  "2": "0.5rem",
  "3": "0.75rem",
  "4": "1rem",
  "5": "1.25rem",
  "6": "1.5rem",
  "8": "2rem",
  "10": "2.5rem",
  "12": "3rem",
  "16": "4rem",
} as const;

export const radiusScale = {
  sm: "0.375rem",
  md: "0.625rem",
  lg: "0.875rem",
  xl: "1.25rem",
  full: "9999px",
} as const;

export const shadowScale = {
  sm: "0 1px 2px 0 rgb(15 43 51 / 0.06)",
  md: "0 4px 12px -2px rgb(15 43 51 / 0.08)",
  lg: "0 16px 40px -12px rgb(15 43 51 / 0.14)",
} as const;
