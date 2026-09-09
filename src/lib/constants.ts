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
    name: "Alimentação",
    kind: "EXPENSE",
    icon: "utensils",
    color: "#22c55e",
    subcategories: [
      { name: "Mercado", icon: "shopping-cart" },
      { name: "Restaurante", icon: "utensils" },
      { name: "Lanche", icon: "sandwich" },
      { name: "Delivery", icon: "bike" },
      { name: "Outros", icon: "shapes" },
    ],
  },
  {
    name: "Compras",
    kind: "EXPENSE",
    icon: "shopping-bag",
    color: "#eab308",
    subcategories: [
      { name: "Roupas", icon: "shirt" },
      { name: "Calçados", icon: "footprints" },
      { name: "Eletrônicos", icon: "laptop" },
      { name: "Casa", icon: "sofa" },
      { name: "Cosméticos", icon: "sparkles" },
      { name: "Acessórios", icon: "watch" },
      { name: "Presentes", icon: "gift" },
      { name: "Compras online", icon: "shopping-bag" },
      { name: "Outros", icon: "shapes" },
    ],
  },
  {
    name: "Cuidados pessoais",
    kind: "EXPENSE",
    icon: "sparkles",
    color: "#14b8a6",
    subcategories: [
      { name: "Cabeleireiro/Barbearia", icon: "scissors" },
      { name: "Manicure/Pedicure", icon: "hand" },
      { name: "Cosméticos", icon: "sparkles" },
      { name: "Higiene pessoal", icon: "droplets" },
      { name: "Estética", icon: "gem" },
      { name: "Academia", icon: "dumbbell" },
      { name: "Outros", icon: "shapes" },
    ],
  },
  {
    name: "Educação",
    kind: "EXPENSE",
    icon: "graduation-cap",
    color: "#8b5cf6",
    subcategories: [
      { name: "Cursos", icon: "book-open" },
      { name: "Faculdade/Escola", icon: "graduation-cap" },
      { name: "Livros", icon: "book" },
      { name: "Material escolar", icon: "pencil" },
      { name: "Cursos online", icon: "monitor" },
      { name: "Idiomas", icon: "languages" },
      { name: "Certificações", icon: "award" },
      { name: "Outros", icon: "shapes" },
    ],
  },
  {
    name: "Entretenimento",
    kind: "EXPENSE",
    icon: "clapperboard",
    color: "#d946ef",
    subcategories: [
      { name: "Cinema", icon: "clapperboard" },
      { name: "Streaming", icon: "tv" },
      { name: "Música", icon: "music" },
      { name: "Jogos", icon: "gamepad-2" },
      { name: "Eventos/Shows", icon: "ticket" },
      { name: "Teatro", icon: "drama" },
      { name: "Livros", icon: "book" },
      { name: "Hobbies", icon: "palette" },
      { name: "Viagens", icon: "plane" },
      { name: "Passeios", icon: "map-pin" },
      { name: "Assinaturas", icon: "repeat" },
      { name: "Outros", icon: "shapes" },
    ],
  },
  {
    name: "Finanças",
    kind: "EXPENSE",
    icon: "landmark",
    color: "#f97316",
    subcategories: [
      { name: "Cartão de crédito", icon: "credit-card" },
      { name: "Tarifas bancárias", icon: "landmark" },
      { name: "Juros", icon: "percent" },
      { name: "Empréstimos", icon: "hand-coins" },
      { name: "Financiamentos", icon: "file-text" },
      { name: "Impostos/Taxas", icon: "receipt" },
      { name: "Outros", icon: "shapes" },
    ],
  },
  {
    name: "Moradia",
    kind: "EXPENSE",
    icon: "home",
    color: "#6366f1",
    subcategories: [
      { name: "Aluguel", icon: "key" },
      { name: "Condomínio", icon: "building" },
      { name: "Energia", icon: "zap" },
      { name: "Gás", icon: "flame" },
      { name: "Internet", icon: "wifi" },
      { name: "Água", icon: "droplet" },
      { name: "Manutenção/Reparos", icon: "wrench" },
      { name: "IPTU", icon: "file-text" },
      { name: "Outros", icon: "shapes" },
    ],
  },
  {
    name: "Pets",
    kind: "EXPENSE",
    icon: "paw-print",
    color: "#737373",
    subcategories: [
      { name: "Ração", icon: "bone" },
      { name: "Veterinário", icon: "stethoscope" },
      { name: "Medicamentos", icon: "pill" },
      { name: "Acessórios", icon: "package" },
      { name: "Pet Shop", icon: "store" },
      { name: "Banho e Tosa", icon: "scissors" },
      { name: "Outros", icon: "shapes" },
    ],
  },
  {
    name: "Saúde",
    kind: "EXPENSE",
    icon: "heart-pulse",
    color: "#ef4444",
    subcategories: [
      { name: "Plano de saúde", icon: "shield" },
      { name: "Consulta médica", icon: "stethoscope" },
      { name: "Exames", icon: "file-text" },
      { name: "Farmácia/Medicamentos", icon: "pill" },
      { name: "Outros", icon: "shapes" },
    ],
  },
  {
    name: "Transporte",
    kind: "EXPENSE",
    icon: "car",
    color: "#3b82f6",
    subcategories: [
      { name: "Combustível", icon: "fuel" },
      { name: "Transporte público", icon: "bus" },
      { name: "Uber/99/Táxi", icon: "car" },
      { name: "Estacionamento", icon: "parking-circle" },
      { name: "Pedágio", icon: "ticket" },
      { name: "Manutenção", icon: "wrench" },
      { name: "Seguro", icon: "shield" },
      { name: "IPVA/Licenciamento", icon: "file-text" },
      { name: "Lavagem", icon: "droplet" },
      { name: "Financiamento", icon: "landmark" },
      { name: "Outros", icon: "shapes" },
    ],
  },
  { name: "Salário", kind: "INCOME", icon: "wallet", color: "#22c55e" },
  { name: "Freelance", kind: "INCOME", icon: "laptop", color: "#16a34a" },
  { name: "Bonificação", kind: "INCOME", icon: "gift", color: "#15803d" },
  { name: "Rendimentos", kind: "INCOME", icon: "trending-up", color: "#059669" },
  { name: "Dividendos", kind: "INCOME", icon: "coins", color: "#0d9488" },
  { name: "Aluguéis", kind: "INCOME", icon: "building-2", color: "#0891b2" },
  { name: "Outras receitas", kind: "INCOME", icon: "plus-circle", color: "#65a30d" },
  { name: "Renda Fixa", kind: "INVESTMENT", icon: "landmark", color: "#0ea5e9" },
  { name: "Renda Variável", kind: "INVESTMENT", icon: "trending-up", color: "#22c55e" },
  { name: "Fundos Imobiliário", kind: "INVESTMENT", icon: "building-2", color: "#a855f7" },
  { name: "Criptomoedas", kind: "INVESTMENT", icon: "bitcoin", color: "#f59e0b" },
  { name: "Exterior", kind: "INVESTMENT", icon: "globe", color: "#06b6d4" },
  { name: "Previdência", kind: "INVESTMENT", icon: "shield", color: "#64748b" },
  { name: "Outros", kind: "INVESTMENT", icon: "shapes", color: "#94a3b8" },
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
  HOUSE: "Casa / Imóvel",
  CAR: "Carro / Veículo",
  DEBT_PAYOFF: "Quitar dívidas",
  INVESTMENT: "Investimentos",
  EDUCATION: "Educação",
  SHOPPING: "Compras",
  PERSONAL_EVENT: "Eventos / Projetos pessoais",
  CUSTOM: "Outras",
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
