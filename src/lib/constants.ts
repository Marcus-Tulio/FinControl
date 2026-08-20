import type { CategoryKind, FinancialAccountType, DebtType, InvestmentType, GoalType } from "@prisma/client";

export type DefaultCategorySeed = {
  name: string;
  kind: CategoryKind;
  icon: string;
  color: string;
  subcategories?: { name: string; icon: string }[];
};

export const DEFAULT_CATEGORIES: DefaultCategorySeed[] = [
  {
    name: "Moradia",
    kind: "EXPENSE",
    icon: "home",
    color: "#f97316",
    subcategories: [
      { name: "Aluguel/Financiamento", icon: "key" },
      { name: "Energia", icon: "zap" },
      { name: "Água", icon: "droplet" },
      { name: "Gás", icon: "flame" },
      { name: "Condomínio", icon: "building" },
      { name: "Internet", icon: "wifi" },
    ],
  },
  { name: "Alimentação", kind: "EXPENSE", icon: "utensils", color: "#ef4444" },
  { name: "Transporte", kind: "EXPENSE", icon: "car", color: "#3b82f6" },
  { name: "Saúde", kind: "EXPENSE", icon: "heart-pulse", color: "#ec4899" },
  { name: "Educação", kind: "EXPENSE", icon: "graduation-cap", color: "#8b5cf6" },
  { name: "Entretenimento", kind: "EXPENSE", icon: "clapperboard", color: "#a855f7" },
  { name: "Compras", kind: "EXPENSE", icon: "shopping-bag", color: "#f59e0b" },
  { name: "Viagens", kind: "EXPENSE", icon: "plane", color: "#06b6d4" },
  { name: "Assinaturas", kind: "EXPENSE", icon: "repeat", color: "#6366f1" },
  { name: "Contas", kind: "EXPENSE", icon: "receipt", color: "#64748b" },
  { name: "Outros", kind: "EXPENSE", icon: "shapes", color: "#94a3b8" },
  { name: "Salário", kind: "INCOME", icon: "wallet", color: "#22c55e" },
  { name: "Freelance", kind: "INCOME", icon: "laptop", color: "#16a34a" },
  { name: "Bonificação", kind: "INCOME", icon: "gift", color: "#15803d" },
  { name: "Rendimentos", kind: "INCOME", icon: "trending-up", color: "#059669" },
  { name: "Dividendos", kind: "INCOME", icon: "coins", color: "#0d9488" },
  { name: "Aluguéis", kind: "INCOME", icon: "building-2", color: "#0891b2" },
  { name: "Outras receitas", kind: "INCOME", icon: "plus-circle", color: "#65a30d" },
  { name: "Investimentos", kind: "INVESTMENT", icon: "line-chart", color: "#0ea5e9" },
];

export const ACCOUNT_TYPE_LABELS: Record<FinancialAccountType, string> = {
  CHECKING: "Conta corrente",
  SAVINGS: "Poupança",
  DIGITAL_WALLET: "Carteira digital",
  CASH: "Dinheiro em espécie",
  INVESTMENT: "Conta de investimento",
};

export const DEBT_TYPE_LABELS: Record<DebtType, string> = {
  LOAN: "Empréstimo",
  FINANCING: "Financiamento",
  INSTALLMENT: "Parcelamento",
  CREDIT_CARD: "Cartão de crédito",
  OTHER: "Outra dívida",
};

export const INVESTMENT_TYPE_LABELS: Record<InvestmentType, string> = {
  FIXED_INCOME: "Renda fixa",
  STOCK: "Ações",
  ETF: "ETFs",
  FUND: "Fundos",
  CRYPTO: "Criptomoedas",
  PENSION: "Previdência",
  OTHER: "Outros ativos",
};

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  EMERGENCY_FUND: "Reserva de emergência",
  TRAVEL: "Viagem",
  CAR: "Carro",
  HOUSE: "Casa",
  INVESTMENT: "Investimento",
  DEBT_PAYOFF: "Quitar dívida",
  CUSTOM: "Objetivo personalizado",
};

export const CHART_COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#a855f7",
  "#ec4899",
  "#84cc16",
  "#0ea5e9",
  "#f97316",
];
