"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatPercent } from "@/lib/format";

function PercentTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md">
      <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-xs font-medium tabular-nums text-foreground">{formatPercent(payload[0].value)}</p>
    </div>
  );
}

export function PercentAreaChart({ data, dataKey = "value" }: { data: Record<string, string | number>[]; dataKey?: string }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="percentFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--series-3)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--series-3)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 3" />
        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--chart-muted)", fontSize: 12 }} />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--chart-muted)", fontSize: 12 }}
          tickFormatter={(v) => formatPercent(v)}
          width={56}
        />
        <Tooltip content={<PercentTooltip />} cursor={{ stroke: "var(--chart-axis)", strokeWidth: 1 }} />
        <Area type="monotone" dataKey={dataKey} stroke="var(--series-3)" strokeWidth={2} fill="url(#percentFill)" activeDot={{ r: 4 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
