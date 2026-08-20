"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCategory, updateCategory, type CategoryFormState } from "@/server/actions/categories";
import type { CategoryKind } from "@prisma/client";

const KIND_LABELS: Record<CategoryKind, string> = { INCOME: "Receita", EXPENSE: "Despesa", INVESTMENT: "Investimento" };
const ICON_OPTIONS = ["shapes", "home", "utensils", "car", "heart-pulse", "graduation-cap", "clapperboard", "shopping-bag", "plane", "repeat", "receipt", "wallet", "laptop", "gift", "trending-up", "coins", "building-2", "line-chart", "key", "zap", "droplet", "flame", "building", "wifi"];
const COLOR_OPTIONS = ["#2e9484", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#4a3aa7", "#e34948", "#2a78d6", "#64748b"];

type Category = { id: string; name: string; kind: CategoryKind; icon: string; color: string; parentId: string | null };

const emptyState: CategoryFormState = {};

export function CategoryFormDialog({
  parents,
  category,
  defaultKind,
}: {
  parents: { id: string; name: string; kind: CategoryKind }[];
  category?: Category;
  defaultKind?: CategoryKind;
}) {
  const isEdit = Boolean(category);
  const action = isEdit ? updateCategory.bind(null, category!.id) : createCategory;
  const [state, formAction, isPending] = useActionState(action, emptyState);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<CategoryKind>(category?.kind ?? defaultKind ?? "EXPENSE");
  const [icon, setIcon] = useState(category?.icon ?? "shapes");
  const [color, setColor] = useState(category?.color ?? "#2e9484");

  useEffect(() => {
    if (state.success) {
      toast.success(isEdit ? "Categoria atualizada" : "Categoria criada");
      setOpen(false);
    }
  }, [state.success]);

  const availableParents = parents.filter((p) => p.kind === kind && p.id !== category?.id);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          category ? (
            <Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="h-3.5 w-3.5" /></Button>
          ) : (
            <Button size="sm"><Plus className="h-4 w-4" /> Nova categoria</Button>
          )
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar categoria" : "Nova categoria"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="icon" value={icon} />
          <input type="hidden" name="color" value={color} />

          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input name="name" required defaultValue={category?.name} />
          </div>

          {!isEdit && (
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select items={KIND_LABELS} value={kind} onValueChange={(v) => v && setKind(v as CategoryKind)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(KIND_LABELS) as CategoryKind[]).map((k) => (
                    <SelectItem key={k} value={k}>{KIND_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Categoria pai (opcional)</Label>
            <Select
              items={{ none: "Nenhuma (categoria principal)", ...Object.fromEntries(availableParents.map((p) => [p.id, p.name])) }}
              name="parentId"
              defaultValue={category?.parentId ?? "none"}
            >
              <SelectTrigger className="w-full"><SelectValue placeholder="Nenhuma" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma (categoria principal)</SelectItem>
                {availableParents.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className="h-7 w-7 rounded-full ring-offset-2 ring-offset-background transition-all"
                  style={{ backgroundColor: c, outline: color === c ? `2px solid ${c}` : "none", outlineOffset: 2 }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Ícone</Label>
            <div className="grid grid-cols-8 gap-1.5">
              {ICON_OPTIONS.map((i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setIcon(i)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm ${icon === i ? "border-primary bg-primary/10" : "border-border"}`}
                >
                  <span className="text-xs">{i.slice(0, 2)}</span>
                </button>
              ))}
            </div>
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
