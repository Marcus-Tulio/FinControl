"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartTooltip } from "./chart-tooltip";
import { formatCompactCurrency } from "@/lib/format";

export function IncomeExpenseChart({ data }: { data: { month: string; receitas: number; despesas: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--series-3)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--series-3)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--series-8)" stopOpacity={0.22} />
            <stop offset="100%" stopColor="var(--series-8)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 3" />
        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--chart-muted)", fontSize: 12 }} />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--chart-muted)", fontSize: 12 }}
          tickFormatter={(v) => formatCompactCurrency(v)}
          width={64}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--chart-axis)", strokeDasharray: "3 3" }} />
        <Legend wrapperStyle={{ fontSize: 12, color: "var(--chart-muted)" }} iconType="circle" iconSize={8} />
        <Area
          type="monotone"
          dataKey="receitas"
          name="Receitas"
          stroke="var(--series-3)"
          strokeWidth={2}
          fill="url(#incomeGradient)"
        />
        <Area
          type="monotone"
          dataKey="despesas"
          name="Despesas"
          stroke="var(--series-8)"
          strokeWidth={2}
          fill="url(#expenseGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
