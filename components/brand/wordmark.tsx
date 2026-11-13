import { logomark } from "./logomark-geometry";

/**
 * Logomark Dani Medical Center: a rounded tile carrying a calm pulse line.
 * The pulse reads as clinical without borrowing a literal red cross, which
 * would imply an emergency service.
 */
export function Logomark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={logomark.viewBox}
      role="img"
      aria-label="Logo Dani Medical Center"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="32" height="32" rx={logomark.radius} fill="var(--color-primary)" />
      <path
        d={logomark.pulsePath}
        stroke="var(--color-on-primary)"
        strokeWidth={logomark.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <Logomark size={30} />
      <span className="font-serif text-lead font-semibold tracking-tight text-text">
        Dani Medical Center
      </span>
    </span>
  );
}
