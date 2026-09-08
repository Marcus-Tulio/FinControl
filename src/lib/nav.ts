export type NavItem = { href: string; label: string; icon: string };
export type NavGroup = { label?: string; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { href: "/", label: "Painel", icon: "layout-dashboard" },
      { href: "/transacoes", label: "Transações", icon: "arrow-left-right" },
      { href: "/contas", label: "Contas", icon: "wallet" },
      { href: "/orcamento", label: "Orçamentos", icon: "pie-chart" },
      { href: "/metas", label: "Metas", icon: "target" },
      { href: "/relatorios", label: "Relatórios", icon: "bar-chart-3" },
    ],
  },
  {
    label: "Patrimônio",
    items: [
      { href: "/dividas", label: "Dívidas", icon: "landmark" },
      { href: "/investimentos", label: "Investimentos", icon: "line-chart" },
    ],
  },
];

export const FOOTER_NAV_ITEM: NavItem = { href: "/configuracoes", label: "Configurações", icon: "settings" };

export const ALL_NAV_ITEMS: NavItem[] = [...NAV_GROUPS.flatMap((g) => g.items), FOOTER_NAV_ITEM];
