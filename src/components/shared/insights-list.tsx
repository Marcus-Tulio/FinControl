import { DynamicIcon } from "@/components/dynamic-icon";
import type { Insight } from "@/server/queries/insights";
import { cn } from "@/lib/utils";

const TONE_STYLES: Record<Insight["tone"], string> = {
  positive: "bg-[var(--status-good)]/10 text-[var(--status-good)]",
  negative: "bg-destructive/10 text-destructive",
  neutral: "bg-primary/10 text-primary",
};

export function InsightsList({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) {
    return <p className="text-sm text-muted-foreground">Continue registrando suas transações para receber insights personalizados.</p>;
  }

  return (
    <div className="space-y-3">
      {insights.map((insight, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", TONE_STYLES[insight.tone])}>
            <DynamicIcon name={insight.icon} className="h-4 w-4" />
          </div>
          <p className="pt-1.5 text-sm leading-snug text-foreground/90">{insight.text}</p>
        </div>
      ))}
    </div>
  );
}
