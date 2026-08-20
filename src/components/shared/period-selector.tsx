"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { PERIOD_LABELS, type PeriodKey } from "@/lib/period";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function PeriodSelector({ current }: { current: PeriodKey }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(period: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", period);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Tabs value={current} onValueChange={handleChange}>
      <TabsList>
        {(Object.keys(PERIOD_LABELS) as PeriodKey[]).map((key) => (
          <TabsTrigger key={key} value={key}>
            {PERIOD_LABELS[key]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
