"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { ChartTooltip } from "./chart-tooltip";
import { SERIES_COLORS } from "@/lib/chart-colors";
import { formatCurrency, formatPercent } from "@/lib/format";

type CategorySlice = { name: string; value: number; color?: string };

function prepareData(data: CategorySlice[], maxSlices = 7) {
  if (data.length <= maxSlices) return data;
  const top = data.slice(0, maxSlices);
  const rest = data.slice(maxSlices);
  const othersTotal = rest.reduce((s, d) => s + d.value, 0);
  return [...top, { name: "Outros", value: othersTotal }];
}

export function CategoryDonutChart({ data }: { data: CategorySlice[] }) {
  const prepared = prepareData(data);
  const total = prepared.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Sem gastos no período.</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="mx-auto h-[200px] w-[200px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={prepared}
              dataKey="value"
              nameKey="name"
              innerRadius={62}
              outerRadius={90}
              paddingAngle={2}
              strokeWidth={2}
              stroke="var(--chart-surface)"
            >
              {prepared.map((entry, i) => (
                <Cell key={entry.name} fill={SERIES_COLORS[i % SERIES_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-2">
        {prepared.map((entry, i) => (
          <div key={entry.name} className="flex items-center justify-between gap-2 text-sm">
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: SERIES_COLORS[i % SERIES_COLORS.length] }} />
              <span className="truncate text-foreground/80" title={entry.name}>{entry.name}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2 tabular-nums">
              <span className="font-medium">{formatCurrency(entry.value)}</span>
              <span className="w-10 text-right text-xs text-muted-foreground">{formatPercent(entry.value / total)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
