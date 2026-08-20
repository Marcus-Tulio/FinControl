import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@fincontrol.app";
const DEMO_PASSWORD = "Demo1234!";

const DEFAULT_CATEGORIES = [
  {
    name: "Moradia",
    kind: "EXPENSE" as const,
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
  { name: "Alimentação", kind: "EXPENSE" as const, icon: "utensils", color: "#ef4444" },
  { name: "Transporte", kind: "EXPENSE" as const, icon: "car", color: "#3b82f6" },
  { name: "Saúde", kind: "EXPENSE" as const, icon: "heart-pulse", color: "#ec4899" },
  { name: "Educação", kind: "EXPENSE" as const, icon: "graduation-cap", color: "#8b5cf6" },
  { name: "Entretenimento", kind: "EXPENSE" as const, icon: "clapperboard", color: "#a855f7" },
  { name: "Compras", kind: "EXPENSE" as const, icon: "shopping-bag", color: "#f59e0b" },
  { name: "Viagens", kind: "EXPENSE" as const, icon: "plane", color: "#06b6d4" },
  { name: "Assinaturas", kind: "EXPENSE" as const, icon: "repeat", color: "#6366f1" },
  { name: "Contas", kind: "EXPENSE" as const, icon: "receipt", color: "#64748b" },
  { name: "Outros", kind: "EXPENSE" as const, icon: "shapes", color: "#94a3b8" },
  { name: "Salário", kind: "INCOME" as const, icon: "wallet", color: "#22c55e" },
  { name: "Freelance", kind: "INCOME" as const, icon: "laptop", color: "#16a34a" },
  { name: "Bonificação", kind: "INCOME" as const, icon: "gift", color: "#15803d" },
  { name: "Rendimentos", kind: "INCOME" as const, icon: "trending-up", color: "#059669" },
  { name: "Dividendos", kind: "INCOME" as const, icon: "coins", color: "#0d9488" },
  { name: "Aluguéis", kind: "INCOME" as const, icon: "building-2", color: "#0891b2" },
  { name: "Outras receitas", kind: "INCOME" as const, icon: "plus-circle", color: "#65a30d" },
  { name: "Investimentos", kind: "INVESTMENT" as const, icon: "line-chart", color: "#0ea5e9" },
];

function monthsAgo(n: number, day = 1) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - n);
  d.setDate(day);
  return d;
}

function inDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (existing) {
    console.log("Demo user already exists, deleting to reseed...");
    await prisma.user.delete({ where: { id: existing.id } });
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const user = await prisma.user.create({
    data: { name: "Usuário Demo", email: DEMO_EMAIL, passwordHash },
  });

  await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.map((c) => ({
      userId: user.id,
      name: c.name,
      kind: c.kind,
      icon: c.icon,
      color: c.color,
      isDefault: true,
    })),
  });
  const parents = await prisma.category.findMany({ where: { userId: user.id } });
  for (const c of DEFAULT_CATEGORIES) {
    if (!c.subcategories?.length) continue;
    const parent = parents.find((p) => p.name === c.name)!;
    await prisma.category.createMany({
      data: c.subcategories.map((sub) => ({
        userId: user.id,
        name: sub.name,
        kind: c.kind,
        icon: sub.icon,
        color: c.color,
        parentId: parent.id,
        isDefault: true,
      })),
    });
  }
  const categories = await prisma.category.findMany({ where: { userId: user.id } });
  const cat = (name: string) => categories.find((c) => c.name === name)!.id;

  const checking = await prisma.financialAccount.create({
    data: { userId: user.id, name: "Conta Corrente", type: "CHECKING", institution: "Banco Alfa", color: "#2a78d6", icon: "landmark", initialBalance: 3200 },
  });
  const savings = await prisma.financialAccount.create({
    data: { userId: user.id, name: "Poupança", type: "SAVINGS", institution: "Banco Alfa", color: "#1baf7a", icon: "piggy-bank", initialBalance: 15000 },
  });
  const wallet = await prisma.financialAccount.create({
    data: { userId: user.id, name: "Carteira", type: "CASH", color: "#eda100", icon: "wallet", initialBalance: 150 },
  });
  const digital = await prisma.financialAccount.create({
    data: { userId: user.id, name: "Carteira Digital", type: "DIGITAL_WALLET", institution: "NuConta", color: "#4a3aa7", icon: "smartphone", initialBalance: 800 },
  });

  const transactions: Prisma.TransactionCreateManyInput[] = [];

  for (let m = 8; m >= 0; m--) {
    transactions.push({
      userId: user.id, financialAccountId: checking.id, categoryId: cat("Salário"),
      kind: "INCOME", status: "PAID", description: "Salário mensal", amount: 6800,
      date: monthsAgo(m, 5), paidDate: monthsAgo(m, 5), isEssential: true,
    });

    transactions.push({
      userId: user.id, financialAccountId: checking.id, categoryId: cat("Aluguel/Financiamento"),
      kind: "EXPENSE", status: "PAID", description: "Aluguel", amount: 1800,
      date: monthsAgo(m, 10), paidDate: monthsAgo(m, 10), isEssential: true,
    });
    transactions.push({
      userId: user.id, financialAccountId: checking.id, categoryId: cat("Energia"),
      kind: "EXPENSE", status: "PAID", description: "Conta de luz", amount: 180 + Math.round(Math.random() * 60),
      date: monthsAgo(m, 12), paidDate: monthsAgo(m, 12), isEssential: true,
    });
    transactions.push({
      userId: user.id, financialAccountId: checking.id, categoryId: cat("Água"),
      kind: "EXPENSE", status: "PAID", description: "Conta de água", amount: 90 + Math.round(Math.random() * 30),
      date: monthsAgo(m, 12), paidDate: monthsAgo(m, 12), isEssential: true,
    });
    transactions.push({
      userId: user.id, financialAccountId: checking.id, categoryId: cat("Internet"),
      kind: "EXPENSE", status: "PAID", description: "Internet fibra", amount: 120,
      date: monthsAgo(m, 8), paidDate: monthsAgo(m, 8), isEssential: true,
    });
    transactions.push({
      userId: user.id, financialAccountId: checking.id, categoryId: cat("Condomínio"),
      kind: "EXPENSE", status: "PAID", description: "Condomínio", amount: 450,
      date: monthsAgo(m, 10), paidDate: monthsAgo(m, 10), isEssential: true,
    });

    const groceriesFactor = m === 1 ? 0.75 : 1;
    for (let g = 0; g < 4; g++) {
      transactions.push({
        userId: user.id, financialAccountId: digital.id, categoryId: cat("Alimentação"),
        kind: "EXPENSE", status: "PAID", description: g % 2 === 0 ? "Supermercado" : "Restaurante",
        amount: Math.round((150 + Math.random() * 200) * groceriesFactor),
        date: monthsAgo(m, 3 + g * 7 > 28 ? 27 : 3 + g * 7), isEssential: g % 2 === 0,
      });
    }

    transactions.push({
      userId: user.id, financialAccountId: checking.id, categoryId: cat("Transporte"),
      kind: "EXPENSE", status: "PAID", description: "Combustível", amount: 220 + Math.round(Math.random() * 80),
      date: monthsAgo(m, 15), isEssential: true,
    });
    transactions.push({
      userId: user.id, financialAccountId: digital.id, categoryId: cat("Transporte"),
      kind: "EXPENSE", status: "PAID", description: "Aplicativo de transporte", amount: 60 + Math.round(Math.random() * 40),
      date: monthsAgo(m, 20), isEssential: false,
    });

    const entertainmentFactor = m === 2 ? 1.4 : 1;
    transactions.push({
      userId: user.id, financialAccountId: digital.id, categoryId: cat("Entretenimento"),
      kind: "EXPENSE", status: "PAID", description: "Cinema e lazer", amount: Math.round((90 + Math.random() * 60) * entertainmentFactor),
      date: monthsAgo(m, 18), isEssential: false,
    });

    transactions.push({
      userId: user.id, financialAccountId: checking.id, categoryId: cat("Assinaturas"),
      kind: "EXPENSE", status: "PAID", description: "Netflix", amount: 55.9,
      date: monthsAgo(m, 6), isEssential: false,
    });
    transactions.push({
      userId: user.id, financialAccountId: checking.id, categoryId: cat("Assinaturas"),
      kind: "EXPENSE", status: "PAID", description: "Spotify", amount: 21.9,
      date: monthsAgo(m, 6), isEssential: false,
    });

    if (m % 3 === 0) {
      transactions.push({
        userId: user.id, financialAccountId: checking.id, categoryId: cat("Freelance"),
        kind: "INCOME", status: "PAID", description: "Projeto freelance", amount: 900 + Math.round(Math.random() * 600),
        date: monthsAgo(m, 22), isEssential: true,
      });
    }

    transactions.push({
      userId: user.id, financialAccountId: savings.id, categoryId: cat("Rendimentos"),
      kind: "INCOME", status: "PAID", description: "Rendimento da poupança", amount: 60 + Math.round(Math.random() * 20),
      date: monthsAgo(m, 28), isEssential: true,
    });
  }

  const recurringRuleNetflix = await prisma.recurringRule.create({
    data: { userId: user.id, financialAccountId: checking.id, categoryId: cat("Assinaturas"), kind: "EXPENSE", description: "Netflix", amount: 55.9, frequency: "MONTHLY", startDate: monthsAgo(8, 6), isSubscription: true, isEssential: false },
  });
  const recurringRuleSpotify = await prisma.recurringRule.create({
    data: { userId: user.id, financialAccountId: checking.id, categoryId: cat("Assinaturas"), kind: "EXPENSE", description: "Spotify", amount: 21.9, frequency: "MONTHLY", startDate: monthsAgo(8, 6), isSubscription: true, isEssential: false },
  });
  const recurringRuleSalary = await prisma.recurringRule.create({
    data: { userId: user.id, financialAccountId: checking.id, categoryId: cat("Salário"), kind: "INCOME", description: "Salário mensal", amount: 6800, frequency: "MONTHLY", startDate: monthsAgo(8, 5), isEssential: true },
  });

  await prisma.transaction.createMany({ data: transactions });
  await prisma.transaction.updateMany({
    where: { userId: user.id, description: "Netflix" },
    data: { recurringRuleId: recurringRuleNetflix.id },
  });
  await prisma.transaction.updateMany({
    where: { userId: user.id, description: "Spotify" },
    data: { recurringRuleId: recurringRuleSpotify.id },
  });
  await prisma.transaction.updateMany({
    where: { userId: user.id, description: "Salário mensal" },
    data: { recurringRuleId: recurringRuleSalary.id },
  });

  await prisma.transaction.create({
    data: { userId: user.id, financialAccountId: checking.id, categoryId: cat("Aluguel/Financiamento"), kind: "EXPENSE", status: "PENDING", description: "Aluguel", amount: 1800, date: inDays(2), dueDate: inDays(2), isEssential: true },
  });
  await prisma.transaction.create({
    data: { userId: user.id, financialAccountId: checking.id, categoryId: cat("Condomínio"), kind: "EXPENSE", status: "PENDING", description: "Condomínio", amount: 450, date: inDays(0), dueDate: inDays(0), isEssential: true },
  });
  await prisma.transaction.create({
    data: { userId: user.id, financialAccountId: checking.id, categoryId: cat("Contas"), kind: "EXPENSE", status: "OVERDUE", description: "IPTU parcela 3/10", amount: 210, date: inDays(-5), dueDate: inDays(-5), isEssential: true },
  });
  await prisma.transaction.create({
    data: { userId: user.id, financialAccountId: checking.id, categoryId: cat("Freelance"), kind: "INCOME", status: "PENDING", description: "Recebimento projeto freelance", amount: 1500, date: inDays(4), dueDate: inDays(4), isEssential: true },
  });

  const notebookGroup = crypto.randomUUID();
  for (let i = 0; i < 10; i++) {
    const occDate = monthsAgo(3 - i, 14);
    transactions.length = 0;
    await prisma.transaction.create({
      data: {
        userId: user.id, financialAccountId: checking.id, categoryId: cat("Compras"),
        kind: "EXPENSE", status: i < 4 ? "PAID" : "PENDING",
        description: `Notebook Dell (${i + 1}/10)`, amount: 320,
        date: occDate, dueDate: i < 4 ? null : occDate, paidDate: i < 4 ? occDate : null,
        isEssential: false, installmentGroupId: notebookGroup, installmentNumber: i + 1, installmentTotal: 10,
      },
    });
  }

  await prisma.budget.createMany({
    data: [
      { userId: user.id, categoryId: cat("Alimentação"), month: new Date().getMonth() + 1, year: new Date().getFullYear(), limitAmount: 1000 },
      { userId: user.id, categoryId: cat("Transporte"), month: new Date().getMonth() + 1, year: new Date().getFullYear(), limitAmount: 500 },
      { userId: user.id, categoryId: cat("Entretenimento"), month: new Date().getMonth() + 1, year: new Date().getFullYear(), limitAmount: 300 },
      { userId: user.id, categoryId: cat("Compras"), month: new Date().getMonth() + 1, year: new Date().getFullYear(), limitAmount: 400 },
      { userId: user.id, categoryId: cat("Assinaturas"), month: new Date().getMonth() + 1, year: new Date().getFullYear(), limitAmount: 100 },
    ],
  });

  const emergencyGoal = await prisma.goal.create({
    data: { userId: user.id, name: "Reserva de emergência", type: "EMERGENCY_FUND", icon: "shield", color: "#1baf7a", targetAmount: 30000, currentAmount: 18000, targetDate: monthsAgo(-10) },
  });
  await prisma.goalContribution.createMany({
    data: [
      { goalId: emergencyGoal.id, amount: 3000, date: monthsAgo(6) },
      { goalId: emergencyGoal.id, amount: 3000, date: monthsAgo(3) },
      { goalId: emergencyGoal.id, amount: 2000, date: monthsAgo(1) },
    ],
  });
  const travelGoal = await prisma.goal.create({
    data: { userId: user.id, name: "Viagem para Europa", type: "TRAVEL", icon: "plane", color: "#2a78d6", targetAmount: 12000, currentAmount: 9600, targetDate: monthsAgo(-6) },
  });
  await prisma.goalContribution.createMany({
    data: [
      { goalId: travelGoal.id, amount: 4000, date: monthsAgo(5) },
      { goalId: travelGoal.id, amount: 5600, date: monthsAgo(1) },
    ],
  });
  await prisma.goal.create({
    data: { userId: user.id, name: "Carro novo", type: "CAR", icon: "car", color: "#eda100", targetAmount: 60000, currentAmount: 5000, targetDate: monthsAgo(-24) },
  });

  const carFinancing = await prisma.debt.create({
    data: { userId: user.id, name: "Financiamento do carro", type: "FINANCING", originalAmount: 45000, remainingAmount: 32000, interestRate: 1.2, installmentsTotal: 48, installmentsPaid: 16, installmentAmount: 980, dueDay: 10, nextDueDate: inDays(10) },
  });
  await prisma.debtPayment.createMany({
    data: Array.from({ length: 6 }, (_, i) => ({ debtId: carFinancing.id, amount: 980, date: monthsAgo(6 - i, 10) })),
  });
  await prisma.debt.create({
    data: { userId: user.id, name: "Cartão de crédito", type: "CREDIT_CARD", originalAmount: 1850, remainingAmount: 1850, interestRate: 0, nextDueDate: inDays(6) },
  });

  const tesouro = await prisma.investment.create({
    data: { userId: user.id, name: "Tesouro Selic 2029", type: "FIXED_INCOME", broker: "Tesouro Direto", quantity: 1, avgPrice: 8000, currentPrice: 8620 },
  });
  await prisma.investmentMovement.createMany({
    data: [
      { investmentId: tesouro.id, type: "CONTRIBUTION", amount: 5000, quantity: 1, price: 5000, date: monthsAgo(8) },
      { investmentId: tesouro.id, type: "CONTRIBUTION", amount: 3000, quantity: 0, price: 8000, date: monthsAgo(3) },
    ],
  });

  const petr4 = await prisma.investment.create({
    data: { userId: user.id, name: "Petrobras PN", type: "STOCK", broker: "XP Investimentos", ticker: "PETR4", quantity: 150, avgPrice: 28, currentPrice: 33.4 },
  });
  await prisma.investmentMovement.createMany({
    data: [
      { investmentId: petr4.id, type: "CONTRIBUTION", amount: 2800, quantity: 100, price: 28, date: monthsAgo(7) },
      { investmentId: petr4.id, type: "CONTRIBUTION", amount: 1400, quantity: 50, price: 28, date: monthsAgo(4) },
      { investmentId: petr4.id, type: "DIVIDEND", amount: 210, date: monthsAgo(2) },
    ],
  });

  const ivvb11 = await prisma.investment.create({
    data: { userId: user.id, name: "IVVB11", type: "ETF", broker: "XP Investimentos", ticker: "IVVB11", quantity: 40, avgPrice: 250, currentPrice: 271 },
  });
  await prisma.investmentMovement.createMany({
    data: [
      { investmentId: ivvb11.id, type: "CONTRIBUTION", amount: 10000, quantity: 40, price: 250, date: monthsAgo(6) },
    ],
  });

  console.log("Seed completed.");
  console.log(`Login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
