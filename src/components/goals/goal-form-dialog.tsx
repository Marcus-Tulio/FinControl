"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createGoal, updateGoal, type GoalFormState } from "@/server/actions/goals";
import { GOAL_TYPE_LABELS } from "@/lib/constants";
import type { GoalType } from "@prisma/client";

const ICON_BY_TYPE: Record<GoalType, string> = {
  EMERGENCY_FUND: "shield", TRAVEL: "plane", CAR: "car", HOUSE: "home",
  INVESTMENT: "line-chart", DEBT_PAYOFF: "landmark", CUSTOM: "target",
};
const COLOR_OPTIONS = ["#2e9484", "#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#4a3aa7"];

type Goal = {
  id: string; name: string; type: GoalType; icon: string; color: string;
  targetAmount: unknown; currentAmount: unknown; targetDate: Date | null;
};
const emptyState: GoalFormState = {};

function toDateInput(d: Date | null) {
  return d ? new Date(d).toISOString().slice(0, 10) : "";
}

export function GoalFormDialog({ goal }: { goal?: Goal }) {
  const isEdit = Boolean(goal);
  const action = isEdit ? updateGoal.bind(null, goal!.id) : createGoal;
  const [state, formAction, isPending] = useActionState(action, emptyState);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<GoalType>(goal?.type ?? "EMERGENCY_FUND");
  const [color, setColor] = useState(goal?.color ?? "#2e9484");

  useEffect(() => {
    if (state.success) {
      toast.success(isEdit ? "Meta atualizada" : "Meta criada");
      setOpen(false);
    }
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          isEdit ? (
            <Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="h-3.5 w-3.5" /></Button>
          ) : (
            <Button><Plus className="h-4 w-4" /> Nova meta</Button>
          )
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar meta" : "Nova meta"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="icon" value={ICON_BY_TYPE[type]} />
          <input type="hidden" name="color" value={color} />

          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input name="name" required defaultValue={goal?.name} placeholder="Viagem para Europa..." />
          </div>

          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select items={GOAL_TYPE_LABELS} value={type} onValueChange={(v) => v && setType(v as GoalType)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(GOAL_TYPE_LABELS) as GoalType[]).map((t) => (
                  <SelectItem key={t} value={t}>{GOAL_TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Valor objetivo</Label>
              <Input name="targetAmount" type="number" step="0.01" min="0.01" required defaultValue={goal ? Number(goal.targetAmount) : undefined} />
            </div>
            <div className="space-y-1.5">
              <Label>Valor já acumulado</Label>
              <Input name="currentAmount" type="number" step="0.01" min="0" defaultValue={goal ? Number(goal.currentAmount) : 0} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Prazo (opcional)</Label>
            <Input name="targetDate" type="date" defaultValue={goal ? toDateInput(goal.targetDate) : undefined} />
          </div>

          <div className="space-y-1.5">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className="h-7 w-7 rounded-full"
                  style={{ backgroundColor: c, outline: color === c ? `2px solid ${c}` : "none", outlineOffset: 2 }}
                  aria-label={c}
                />
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
