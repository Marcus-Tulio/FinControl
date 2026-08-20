import { requireUserId } from "@/server/session";
import { listGoals } from "@/server/queries/goals";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DynamicIcon } from "@/components/dynamic-icon";
import { GoalFormDialog } from "@/components/goals/goal-form-dialog";
import { GoalContributionDialog } from "@/components/goals/goal-contribution-dialog";
import { DeleteIconButton } from "@/components/shared/delete-icon-button";
import { deleteGoal } from "@/server/actions/goals";
import { formatCurrency, formatDate } from "@/lib/format";
import { goalProgressPercent, goalMonthlyRequired } from "@/lib/finance";
import { GOAL_TYPE_LABELS } from "@/lib/constants";
import { serializeDecimals } from "@/lib/serialize";

export default async function MetasPage() {
  const userId = await requireUserId();
  const goals = await listGoals(userId);

  return (
    <div>
      <PageHeader title="Metas" description="Planeje e acompanhe seus objetivos financeiros." actions={<GoalFormDialog />} />

      {goals.length === 0 ? (
        <EmptyState icon="target" title="Nenhuma meta cadastrada" description="Crie sua primeira meta financeira." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => {
            const target = Number(goal.targetAmount);
            const current = Number(goal.currentAmount);
            const percent = goalProgressPercent(target, current);
            const monthlyRequired = goal.targetDate ? goalMonthlyRequired(target, current, goal.targetDate) : null;

            return (
              <Card key={goal.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${goal.color}1a`, color: goal.color }}>
                        <DynamicIcon name={goal.icon} className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{goal.name}</p>
                        <p className="text-xs text-muted-foreground">{GOAL_TYPE_LABELS[goal.type]}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <GoalFormDialog goal={serializeDecimals(goal)} />
                      <DeleteIconButton onDelete={deleteGoal.bind(null, goal.id)} confirmMessage="Excluir esta meta?" successMessage="Meta excluída" />
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-end justify-between">
                      <p className="text-xl font-semibold tabular-nums">{formatCurrency(current)}</p>
                      <p className="text-sm text-muted-foreground">de {formatCurrency(target)}</p>
                    </div>
                    <Progress value={percent * 100} className="mt-2 h-2" />
                    <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{Math.round(percent * 100)}% concluído</span>
                      {goal.targetDate && <span>até {formatDate(goal.targetDate)}</span>}
                    </div>
                  </div>

                  {monthlyRequired !== null && monthlyRequired > 0 && !goal.isCompleted && (
                    <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                      Necessário <strong className="text-foreground">{formatCurrency(monthlyRequired)}/mês</strong> para atingir a meta no prazo.
                    </p>
                  )}

                  {goal.isCompleted && (
                    <p className="mt-3 rounded-lg bg-[var(--status-good)]/10 px-3 py-2 text-xs font-medium text-[var(--status-good)]">
                      Meta concluída! 🎉
                    </p>
                  )}

                  <div className="mt-4">
                    <GoalContributionDialog goalId={goal.id} goalName={goal.name} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
