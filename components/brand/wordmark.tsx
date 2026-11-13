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
      viewBox="0 0 32 32"
      role="img"
      aria-label="Logo Dani Medical Center"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="32" height="32" rx="9" fill="var(--color-primary)" />
      <path
        d="M7 19.5h4.2l2.1-5.4 3.1 9 2.6-6.6 1.6 3h4.4"
        stroke="var(--color-on-primary)"
        strokeWidth="2.1"
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
      <span className="font-serif text-[1.0625rem] font-semibold tracking-tight text-text">
        Dani Medical Center
      </span>
    </span>
  );
}
