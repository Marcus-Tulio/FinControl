"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartTooltip } from "./chart-tooltip";
import { formatCompactCurrency } from "@/lib/format";

export function IncomeExpenseChart({ data }: { data: { month: string; receitas: number; despesas: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={4}>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 3" />
        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--chart-muted)", fontSize: 12 }} />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--chart-muted)", fontSize: 12 }}
          tickFormatter={(v) => formatCompactCurrency(v)}
          width={64}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--accent)" }} />
        <Legend
          wrapperStyle={{ fontSize: 12, color: "var(--chart-muted)" }}
          iconType="circle"
          iconSize={8}
        />
        <Bar dataKey="receitas" name="Receitas" fill="var(--series-3)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Bar dataKey="despesas" name="Despesas" fill="var(--series-8)" radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
