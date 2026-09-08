import { DynamicIcon } from "@/components/dynamic-icon";

export function StatCardHero({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: string;
}) {
  return (
    <div className="rounded-2xl bg-sidebar p-5 text-sidebar-foreground shadow-[0_2px_6px_rgba(0,0,0,0.07),0_20px_40px_-20px_rgba(0,0,0,0.35)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-sidebar-foreground/70">{label}</p>
        {icon && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-primary">
            <DynamicIcon name={icon} className="h-4 w-4" />
          </div>
        )}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {hint && <p className="mt-1.5 text-xs font-medium text-sidebar-foreground/60">{hint}</p>}
    </div>
  );
}
