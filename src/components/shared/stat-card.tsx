import { cn } from "@/lib/utils";
import { DynamicIcon } from "@/components/dynamic-icon";

export function StatCard({
  label,
  value,
  icon,
  tone = "neutral",
  change,
  changeLabel,
  className,
}: {
  label: string;
  value: string;
  icon?: string;
  tone?: "neutral" | "positive" | "negative";
  change?: number | null;
  changeLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5 shadow-xs", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <DynamicIcon name={icon} className="h-4 w-4" />
          </div>
        )}
      </div>
      <p
        className={cn(
          "mt-2 text-2xl font-semibold tracking-tight tabular-nums",
          tone === "positive" && "text-[var(--status-good)]",
          tone === "negative" && "text-destructive"
        )}
      >
        {value}
      </p>
      {change !== undefined && change !== null && (
        <p className={cn("mt-1.5 text-xs font-medium", change >= 0 ? "text-[var(--status-good)]" : "text-destructive")}>
          {change >= 0 ? "+" : ""}
          {Math.round(change * 100)}% {changeLabel}
        </p>
      )}
    </div>
  );
}
