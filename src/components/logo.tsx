import { cn } from "@/lib/utils";

export function LogoMark({ className, variant = "default" }: { className?: string; variant?: "default" | "sidebar" }) {
  const markA = variant === "sidebar" ? "var(--sidebar-mark-a)" : "var(--brand-mark-a)";
  const markB = variant === "sidebar" ? "var(--sidebar-mark-b)" : "var(--brand-mark-b)";
  const dot = variant === "sidebar" ? "var(--sidebar-mark-dot)" : "var(--brand-dot)";
  return (
    <svg viewBox="0 0 48 48" fill="none" className={cn("h-8 w-8", className)} aria-hidden>
      <line x1="10" y1="38" x2="30" y2="10" stroke={markA} strokeWidth="8.5" strokeLinecap="round" />
      <line x1="19" y1="38" x2="35" y2="16" stroke={markB} strokeWidth="8.5" strokeLinecap="round" />
      <circle cx="37.5" cy="34.5" r="3.4" fill={dot} />
    </svg>
  );
}

export function Logo({
  className,
  textClassName,
  variant = "default",
}: {
  className?: string;
  textClassName?: string;
  variant?: "default" | "sidebar";
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark variant={variant} />
      <span
        className={cn(
          "text-lg font-semibold tracking-tight",
          variant === "sidebar" ? "text-sidebar-foreground" : "text-foreground",
          textClassName
        )}
      >
        FinControl
      </span>
    </div>
  );
}
