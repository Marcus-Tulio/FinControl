"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export type CategoryTree = { id: string; name: string; subcategories: { id: string; name: string }[] };

function resolveInitial(categories: CategoryTree[], categoryId?: string | null) {
  if (!categoryId) return { topId: "", subId: "" };
  if (categories.some((c) => c.id === categoryId)) return { topId: categoryId, subId: "" };
  for (const top of categories) {
    if (top.subcategories.some((s) => s.id === categoryId)) return { topId: top.id, subId: categoryId };
  }
  return { topId: "", subId: "" };
}

/** Seletor em duas etapas: escolhe a categoria principal, depois (se houver) a subcategoria. */
export function CategoryPicker({
  categories,
  defaultCategoryId,
  name = "categoryId",
  allowSubcategory = true,
  subcategoryPlaceholder = "Selecione",
  disabled = false,
}: {
  categories: CategoryTree[];
  defaultCategoryId?: string | null;
  name?: string;
  allowSubcategory?: boolean;
  subcategoryPlaceholder?: string;
  disabled?: boolean;
}) {
  const initial = resolveInitial(categories, defaultCategoryId);
  const [topId, setTopId] = useState(initial.topId);
  const [subId, setSubId] = useState(initial.subId);

  const selectedTop = categories.find((c) => c.id === topId);
  const subcategories = selectedTop?.subcategories ?? [];

  if (!allowSubcategory) {
    return (
      <div className="space-y-1.5">
        <Label>Categoria</Label>
        <Select
          items={Object.fromEntries(categories.map((c) => [c.id, c.name]))}
          value={topId}
          onValueChange={(v) => setTopId(v ?? "")}
          disabled={disabled}
        >
          <SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name={name} value={topId} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <Label>Categoria</Label>
        <Select
          items={Object.fromEntries(categories.map((c) => [c.id, c.name]))}
          value={topId}
          onValueChange={(v) => {
            setTopId(v ?? "");
            setSubId("");
          }}
          disabled={disabled}
        >
          <SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Subcategoria (opcional)</Label>
        <Select
          key={topId}
          items={Object.fromEntries(subcategories.map((s) => [s.id, s.name]))}
          value={subId}
          onValueChange={(v) => setSubId(v ?? "")}
          disabled={disabled || subcategories.length === 0}
        >
          <SelectTrigger className="w-full"><SelectValue placeholder={subcategories.length ? subcategoryPlaceholder : "—"} /></SelectTrigger>
          <SelectContent>
            {subcategories.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <input type="hidden" name={name} value={subId || topId} />
    </div>
  );
}
