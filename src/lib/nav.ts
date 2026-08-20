export type NavItem = { href: string; label: string; icon: string };
export type NavGroup = { label: string; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Visão geral",
    items: [{ href: "/", label: "Dashboard", icon: "layout-dashboard" }],
  },
  {
    label: "Movimentação",
    items: [
      { href: "/transacoes", label: "Transações", icon: "arrow-left-right" },
      { href: "/receitas", label: "Receitas", icon: "trending-up" },
      { href: "/despesas", label: "Despesas", icon: "trending-down" },
      { href: "/contas-a-pagar", label: "Contas a pagar", icon: "calendar-clock" },
      { href: "/calendario", label: "Calendário", icon: "calendar-days" },
    ],
  },
  {
    label: "Planejamento",
    items: [
      { href: "/orcamento", label: "Orçamento", icon: "pie-chart" },
      { href: "/metas", label: "Metas", icon: "target" },
      { href: "/dividas", label: "Dívidas", icon: "landmark" },
    ],
  },
  {
    label: "Patrimônio",
    items: [
      { href: "/contas", label: "Contas", icon: "wallet" },
      { href: "/investimentos", label: "Investimentos", icon: "line-chart" },
    ],
  },
  {
    label: "Análises",
    items: [{ href: "/relatorios", label: "Relatórios", icon: "bar-chart-3" }],
  },
  {
    label: "Sistema",
    items: [
      { href: "/categorias", label: "Categorias", icon: "shapes" },
      { href: "/configuracoes", label: "Configurações", icon: "settings" },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);
