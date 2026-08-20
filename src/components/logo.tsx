import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={cn("h-8 w-8", className)} aria-hidden>
      <line
        x1="10" y1="38" x2="30" y2="10"
        stroke="var(--brand-mark-a)" strokeWidth="8.5" strokeLinecap="round"
      />
      <line
        x1="19" y1="38" x2="35" y2="16"
        stroke="var(--brand-mark-b)" strokeWidth="8.5" strokeLinecap="round"
      />
      <circle cx="37.5" cy="34.5" r="3.4" fill="var(--brand-dot)" />
    </svg>
  );
}

export function Logo({ className, textClassName }: { className?: string; textClassName?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className={cn("text-lg font-semibold tracking-tight text-foreground", textClassName)}>FinControl</span>
    </div>
  );
}
