import { DynamicIcon } from "@/components/dynamic-icon";
import { formatCurrency } from "@/lib/format";
import { budgetStatus } from "@/lib/finance";
import type { Numberish } from "@/lib/format";

const STATUS_COLOR = {
  ok: "var(--status-good)",
  warning: "var(--status-warning)",
  danger: "var(--status-critical)",
};

export function BudgetRow({
  category,
  limitAmount,
  spent,
  action,
  compact = false,
}: {
  category: { name: string; color: string; icon: string; parent?: { name: string } | null };
  limitAmount: Numberish;
  spent: number;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  const status = budgetStatus(limitAmount, spent);
  // Orçamento específico de subcategoria: mostra "Categoria · Subcategoria" para deixar claro que está dentro do geral da categoria.
  const label = category.parent ? `${category.parent.name} · ${category.name}` : category.name;

  return (
    <div className={compact ? "" : "rounded-xl border border-border p-4"}>
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${category.color}1a`, color: category.color }}
        >
          <DynamicIcon name={category.icon} className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(status.spent)} de {formatCurrency(status.limit)} · disponível {formatCurrency(status.available)}
          </p>
        </div>
        <span className="shrink-0 text-sm font-semibold tabular-nums" style={{ color: STATUS_COLOR[status.level] }}>
          {Math.round(status.percentUsed * 100)}%
        </span>
        {action}
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(status.percentUsed * 100, 100)}%`, backgroundColor: STATUS_COLOR[status.level] }}
        />
      </div>
      {status.level === "danger" && <p className="mt-2 text-xs font-medium text-destructive">Orçamento ultrapassado!</p>}
      {status.level === "warning" && (
        <p className="mt-2 text-xs font-medium" style={{ color: STATUS_COLOR.warning }}>
          Atenção: você está perto do limite.
        </p>
      )}
    </div>
  );
}
