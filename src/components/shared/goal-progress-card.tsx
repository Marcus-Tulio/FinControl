import { Progress } from "@/components/ui/progress";
import { DynamicIcon } from "@/components/dynamic-icon";
import { formatCurrency } from "@/lib/format";
import { goalProgressPercent } from "@/lib/finance";

export function GoalProgressCard({
  name,
  icon,
  color,
  targetAmount,
  currentAmount,
}: {
  name: string;
  icon: string;
  color: string;
  targetAmount: number;
  currentAmount: number;
}) {
  const percent = goalProgressPercent(targetAmount, currentAmount);
  const remaining = Math.max(targetAmount - currentAmount, 0);

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}1a`, color }}
        >
          <DynamicIcon name={icon} className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(currentAmount)} de {formatCurrency(targetAmount)}
          </p>
        </div>
      </div>
      <Progress value={percent * 100} className="mt-3 h-2" />
      <p className="mt-1.5 text-xs text-muted-foreground">
        {Math.round(percent * 100)}% · faltam {formatCurrency(remaining)}
      </p>
    </div>
  );
}
