/**
 * Geometry of the Dani Medical Center pulse mark, shared by the React
 * component and the static favicon so the two cannot drift apart.
 *
 * The favicon is a plain SVG file served by the browser before any CSS runs,
 * so it cannot reference design-token custom properties. Its colours are
 * therefore literal, and a test keeps them equal to the palette.
 */
export const logomark = {
  viewBox: "0 0 32 32",
  radius: 9,
  pulsePath: "M7 19.5h4.2l2.1-5.4 3.1 9 2.6-6.6 1.6 3h4.4",
  strokeWidth: 2.1,
} as const;
