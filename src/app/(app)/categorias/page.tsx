import { requireUserId } from "@/server/session";
import { listCategories, listTopLevelCategories } from "@/server/queries/categories";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DynamicIcon } from "@/components/dynamic-icon";
import { CategoryFormDialog } from "@/components/categories/category-form-dialog";
import { DeleteCategoryButton } from "@/components/categories/delete-category-button";
import type { CategoryKind } from "@prisma/client";

const KIND_TABS: { value: CategoryKind; label: string }[] = [
  { value: "EXPENSE", label: "Despesas" },
  { value: "INCOME", label: "Receitas" },
  { value: "INVESTMENT", label: "Investimentos" },
];

export default async function CategoriasPage() {
  const userId = await requireUserId();
  const allCategories = await listCategories(userId);
  const parentOptions = allCategories.map((c) => ({ id: c.id, name: c.name, kind: c.kind }));

  const groups = await Promise.all(KIND_TABS.map((t) => listTopLevelCategories(userId, t.value)));

  return (
    <div>
      <PageHeader title="Categorias" description="Organize suas transações com categorias e subcategorias." />

      <Tabs defaultValue="EXPENSE">
        <TabsList>
          {KIND_TABS.map((t) => <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>)}
        </TabsList>

        {KIND_TABS.map((t, i) => (
          <TabsContent key={t.value} value={t.value} className="mt-4">
            <div className="mb-3 flex justify-end">
              <CategoryFormDialog parents={parentOptions} defaultKind={t.value} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {groups[i].map((cat) => (
                <Card key={cat.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${cat.color}1a`, color: cat.color }}>
                        <DynamicIcon name={cat.icon} className="h-4.5 w-4.5" />
                      </div>
                      <p className="flex-1 truncate text-sm font-medium">{cat.name}</p>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <CategoryFormDialog
                          parents={parentOptions}
                          category={{ id: cat.id, name: cat.name, kind: cat.kind, icon: cat.icon, color: cat.color, parentId: cat.parentId }}
                        />
                        {!cat.isDefault && <DeleteCategoryButton id={cat.id} />}
                      </div>
                    </div>
                    {cat.subcategories.length > 0 && (
                      <div className="mt-3 space-y-1.5 border-t border-border pt-3">
                        {cat.subcategories.map((sub) => (
                          <div key={sub.id} className="flex items-center gap-2 pl-2">
                            <DynamicIcon name={sub.icon} className="h-3.5 w-3.5 text-muted-foreground" />
                            <p className="flex-1 truncate text-sm text-muted-foreground">{sub.name}</p>
                            <div className="flex shrink-0 items-center gap-0.5">
                              <CategoryFormDialog
                                parents={parentOptions}
                                category={{ id: sub.id, name: sub.name, kind: sub.kind, icon: sub.icon, color: sub.color, parentId: sub.parentId }}
                              />
                              {!sub.isDefault && <DeleteCategoryButton id={sub.id} />}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
