"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type Account = { id: string; name: string };
type Category = { id: string; name: string };

export function TransactionsFilterBar({
  accounts,
  categories,
  showKindFilter = true,
}: {
  accounts: Account[];
  categories: Category[];
  showKindFilter?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (search !== (searchParams.get("search") ?? "")) updateParam("search", search || null);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const hasFilters = Array.from(searchParams.keys()).some((k) => k !== "period");

  const accountItems = { all: "Todas as contas", ...Object.fromEntries(accounts.map((a) => [a.id, a.name])) };
  const categoryItems = { all: "Todas as categorias", ...Object.fromEntries(categories.map((c) => [c.id, c.name])) };
  const kindItems = {
    all: "Todos os tipos",
    INCOME: "Receitas",
    EXPENSE: "Despesas",
    INVESTMENT: "Investimentos",
    TRANSFER: "Transferências",
    ADJUSTMENT: "Ajustes",
  };

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar transações..."
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Select items={accountItems} value={searchParams.get("accountId") ?? "all"} onValueChange={(v) => updateParam("accountId", v === "all" ? null : v)}>
        <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as contas</SelectItem>
          {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select items={categoryItems} value={searchParams.get("categoryId") ?? "all"} onValueChange={(v) => updateParam("categoryId", v === "all" ? null : v)}>
        <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as categorias</SelectItem>
          {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
        </SelectContent>
      </Select>

      {showKindFilter && (
        <Select items={kindItems} value={searchParams.get("kind") ?? "all"} onValueChange={(v) => updateParam("kind", v === "all" ? null : v)}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="INCOME">Receitas</SelectItem>
            <SelectItem value="EXPENSE">Despesas</SelectItem>
            <SelectItem value="INVESTMENT">Investimentos</SelectItem>
            <SelectItem value="TRANSFER">Transferências</SelectItem>
            <SelectItem value="ADJUSTMENT">Ajustes</SelectItem>
          </SelectContent>
        </Select>
      )}

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearch("");
            router.push(pathname);
          }}
        >
          <X className="h-3.5 w-3.5" /> Limpar
        </Button>
      )}
    </div>
  );
}
