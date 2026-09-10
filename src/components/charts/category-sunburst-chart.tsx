"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { ChartTooltip } from "./chart-tooltip";
import { formatCurrency, formatPercent } from "@/lib/format";

type OuterSlice = { categoryId: string; name: string; value: number; color: string };
type InnerSlice = OuterSlice & { familyId: string };

/**
 * Sunburst: anel interno = categorias (cor-base fixa da família), anel externo = subcategorias
 * (tonalidade fixa dentro da mesma família) — ambos com ângulo proporcional ao valor gasto.
 */
export function CategorySunburstChart({ data }: { data: { inner: InnerSlice[]; outer: OuterSlice[] } }) {
  const { inner, outer } = data;
  const total = outer.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Sem gastos no período.</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative mx-auto h-[220px] w-[220px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {/* Anel interno: categorias */}
            <Pie
              data={outer}
              dataKey="value"
              nameKey="name"
              innerRadius={40}
              outerRadius={64}
              paddingAngle={2}
              strokeWidth={2}
              stroke="var(--chart-surface)"
            >
              {outer.map((entry) => (
                <Cell key={entry.categoryId} fill={entry.color} />
              ))}
            </Pie>
            {/* Anel externo: subcategorias */}
            <Pie
              data={inner}
              dataKey="value"
              nameKey="name"
              innerRadius={68}
              outerRadius={100}
              paddingAngle={1}
              strokeWidth={1.5}
              stroke="var(--chart-surface)"
            >
              {inner.map((entry) => (
                <Cell key={entry.categoryId} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute top-1/2 left-1/2 flex w-20 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center text-center">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total R$</span>
          <span className="text-sm leading-tight font-semibold tabular-nums">
            {total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
      <div className="flex-1 space-y-3">
        {outer.map((cat) => {
          const subs = inner.filter((s) => s.familyId === cat.categoryId);
          return (
            <div key={cat.categoryId}>
              <div className="flex items-center justify-between gap-2 text-sm font-medium">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="truncate" title={cat.name}>{cat.name}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2 tabular-nums">
                  <span>{formatCurrency(cat.value)}</span>
                  <span className="w-10 text-right text-xs text-muted-foreground">{formatPercent(cat.value / total)}</span>
                </div>
              </div>
              {subs.length > 1 && (
                <div className="mt-1 space-y-1 pl-4">
                  {subs.map((s) => (
                    <div key={s.categoryId} className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="truncate">{s.name}</span>
                      </div>
                      <span className="shrink-0 tabular-nums">{formatCurrency(s.value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
