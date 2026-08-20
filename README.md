# FinControl

Aplicativo completo de controle financeiro pessoal — dashboard, transações, orçamento, metas, dívidas, investimentos, relatórios e calendário financeiro em um só lugar.

Construído com **Next.js 16 (App Router) + TypeScript**, **PostgreSQL via Prisma**, **NextAuth (Auth.js) v5**, **Tailwind CSS v4** e componentes **shadcn/ui** (sobre Base UI), com gráficos em **Recharts**.

## Stack

- **Frontend + Backend**: Next.js App Router (Server Components, Server Actions) — um único projeto full-stack
- **Banco de dados**: PostgreSQL, acessado via **Prisma ORM**
- **Autenticação**: NextAuth v5 — login por e-mail/senha (credentials) e, opcionalmente, Google OAuth
- **UI**: Tailwind CSS v4 + shadcn/ui, tema claro/escuro (next-themes), paleta validada para acessibilidade (contraste e daltonismo)
- **Gráficos**: Recharts
- **Import/Export**: CSV (PapaParse) e PDF (jsPDF) para relatórios e importação de transações

## Como rodar localmente

### 1. Pré-requisitos

- Node.js 20+ instalado
- Um banco PostgreSQL acessível (local ou na nuvem — veja opções abaixo)

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```bash
cp .env.example .env
```

- `DATABASE_URL` — string de conexão do PostgreSQL
- `AUTH_SECRET` — gere com `npx auth secret` (ou `openssl rand -base64 32`)
- `NEXTAUTH_URL` — `http://localhost:3000` em dev
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — opcional, para login com Google (veja seção abaixo)

**Banco de dados local**: se você tem PostgreSQL instalado localmente, crie um banco `fincontrol` e aponte `DATABASE_URL` para ele. Se preferir não instalar nada localmente, crie um banco gratuito no [Neon](https://neon.tech) ou use a integração **Vercel Postgres** (ambos compatíveis, já que ambos são Postgres) e aponte para lá — funciona igual em dev e produção.

### 4. Rodar as migrations e popular com dados de demonstração

```bash
npx prisma migrate deploy
npm run db:seed
```

O seed cria um usuário de demonstração com ~9 meses de histórico realista (contas, categorias, transações, orçamentos, metas, dívidas e investimentos):

```
E-mail: demo@fincontrol.app
Senha:  Demo1234!
```

### 5. Rodar o servidor de desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Deploy na Vercel

1. Suba o repositório para o GitHub/GitLab/Bitbucket e importe o projeto em [vercel.com/new](https://vercel.com/new).
2. Adicione um banco Postgres pela aba **Storage** do projeto na Vercel (Neon é a opção nativa) — isso preenche `DATABASE_URL` automaticamente.
3. Configure as demais variáveis de ambiente do projeto (Settings → Environment Variables):
   - `AUTH_SECRET`
   - `NEXTAUTH_URL` → a URL de produção (ex.: `https://seu-app.vercel.app`)
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (opcional)
4. Rode as migrations contra o banco de produção (uma vez, localmente ou via um script de release):
   ```bash
   DATABASE_URL="<url-de-producao>" npx prisma migrate deploy
   ```
5. Faça o deploy. O `postinstall` do projeto já roda `prisma generate` automaticamente durante o build da Vercel.

Opcionalmente, rode `npm run db:seed` apontando para o banco de produção se quiser começar com dados de demonstração.

## Login com Google (opcional)

1. Crie um projeto no [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → Credentials → Create OAuth Client ID** (tipo *Web application*).
2. Adicione como *Authorized redirect URI*: `<sua-url>/api/auth/callback/google` (em dev: `http://localhost:3000/api/auth/callback/google`).
3. Preencha `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no `.env`. O botão "Google" aparece automaticamente na tela de login quando essas variáveis existem.

## Funcionalidades

- **Dashboard**: patrimônio total, saldo disponível, receitas/despesas do período, evolução financeira, receitas x despesas, gastos por categoria, metas em andamento, insights automáticos, seletor de período (hoje/semana/mês/trimestre/semestre/ano).
- **Transações / Receitas / Despesas**: CRUD completo, busca, filtros (conta, categoria, tipo, valor), duplicar, parcelamento, recorrência, marcar como pago/recebido.
- **Categorias**: categorias e subcategorias personalizáveis, com categorias padrão pré-criadas no cadastro.
- **Contas**: contas correntes, poupança, carteiras digitais, dinheiro e conta de investimento, com saldo e histórico individual, e transferências entre contas.
- **Contas a pagar**: central de vencimentos (hoje, próximos, atrasados, pagos recentemente).
- **Orçamento**: limite mensal por categoria, com barra de progresso e alertas visuais ao se aproximar/ultrapassar o limite.
- **Metas financeiras**: valor objetivo, progresso, prazo, valor mensal necessário e aportes.
- **Dívidas**: empréstimos, financiamentos, parcelamentos e cartões, com projeção de quitação.
- **Investimentos**: renda fixa, ações, ETFs, fundos, cripto e previdência, com aportes, resgates, dividendos, rentabilidade e distribuição da carteira.
- **Relatórios**: evolução do patrimônio, receitas x despesas, taxa de economia, evolução de dívidas e investimentos, exportação em CSV/Excel e PDF.
- **Calendário financeiro**: visão mensal de todos os eventos (receitas, despesas, faturas, parcelas).
- **Notificações inteligentes**: contas vencendo, orçamento estourando, aumento de gastos, metas quase concluídas — geradas automaticamente a partir dos seus dados.
- **Importação de CSV**: detecção automática de colunas (data/descrição/valor/categoria) e de transações duplicadas.
- **Segurança**: senha com hash (bcrypt), login opcional via Google, PIN numérico adicional, sessões via NextAuth.
- **Tema claro/escuro** com paleta de marca dedicada para cada modo.

## Limitações conhecidas / próximos passos

Este projeto é funcional de ponta a ponta, mas alguns pontos ficaram deliberadamente simplificados para caber no escopo desta entrega:

- **PIN**: é armazenado com segurança e pode ser definido/alterado em Configurações, mas ainda não há uma tela de bloqueio de app que exija o PIN ao abrir — hoje ele funciona como uma segunda credencial guardada, não como um gate de UI.
- **Importação**: aceita arquivos **CSV** (inclusive os exportados do Excel); não há parser de `.xlsx` binário nativo.
- **Backup**: não há botão de backup manual dentro do app — em produção, isso é responsabilidade do provedor do banco (Neon/Vercel Postgres já fazem backups automáticos).
- **Apple Login**: não implementado (spec pedia "Google/Apple"); Google está pronto e Apple pode ser adicionado com o mesmo padrão do provider do NextAuth.
- O arquivo `src/middleware.ts` usa a convenção `middleware` (Next.js emite um aviso de depreciação sugerindo renomear para `proxy` no futuro) — funciona normalmente hoje; é só uma futura migração de nome de arquivo, sem mudança de comportamento.

## Estrutura do projeto

```
prisma/schema.prisma       Modelo de dados completo (usuários, contas, categorias, transações, orçamentos, metas, dívidas, investimentos, notificações)
prisma/seed.ts             Script de dados de demonstração
src/app/(auth)/            Telas de login e cadastro
src/app/(app)/             Todas as páginas autenticadas (dashboard e demais módulos)
src/components/            Componentes de UI, organizados por domínio
src/server/queries/        Leituras de dados (Server Components)
src/server/actions/        Mutações (Server Actions)
src/lib/                   Formatação, cálculos financeiros, períodos, paleta de gráficos
```
