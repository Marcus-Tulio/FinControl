import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function LogoMark({
  className,
  variant = "default",
  isBusiness = false,
}: {
  className?: string;
  variant?: "default" | "sidebar";
  isBusiness?: boolean;
}) {
  const markA = isBusiness ? "#3b82f6" : variant === "sidebar" ? "var(--sidebar-mark-a)" : "var(--brand-mark-a)";
  const markB = isBusiness ? "#1d4ed8" : variant === "sidebar" ? "var(--sidebar-mark-b)" : "var(--brand-mark-b)";
  const dot = isBusiness ? "#ffffff" : variant === "sidebar" ? "var(--sidebar-mark-dot)" : "var(--brand-dot)";
  return (
    <span className={cn("relative inline-flex h-8 w-8 shrink-0", className)}>
      <svg viewBox="0 0 48 48" fill="none" className="h-8 w-8" aria-hidden>
        <line x1="10" y1="38" x2="30" y2="10" stroke={markA} strokeWidth="8.5" strokeLinecap="round" />
        <line x1="19" y1="38" x2="35" y2="16" stroke={markB} strokeWidth="8.5" strokeLinecap="round" />
        <circle cx="37.5" cy="34.5" r="3.4" fill={dot} />
      </svg>
      {isBusiness && (
        <span className="absolute -bottom-1 -right-1 flex h-[15px] w-[15px] items-center justify-center rounded-full bg-white">
          <Building2 className="h-2.5 w-2.5 text-[#1d4ed8]" strokeWidth={2.5} />
        </span>
      )}
    </span>
  );
}

export function Logo({
  className,
  textClassName,
  variant = "default",
  isBusiness = false,
}: {
  className?: string;
  textClassName?: string;
  variant?: "default" | "sidebar";
  isBusiness?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark variant={variant} isBusiness={isBusiness} />
      <div className="relative flex flex-col items-end leading-none">
        <span
          className={cn(
            "text-lg font-semibold tracking-tight",
            variant === "sidebar" ? "text-sidebar-foreground" : "text-foreground",
            textClassName
          )}
        >
          FinControl
        </span>
        {isBusiness && (
          <span className="absolute top-full right-0 -mt-0.5 text-[10px] font-semibold tracking-widest text-[#3b82f6] uppercase">
            Empresas
          </span>
        )}
      </div>
    </div>
  );
}
