import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const providers: Provider[] = [
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "E-mail", type: "email" },
      password: { label: "Senha", type: "password" },
      profileType: { label: "Tipo de perfil", type: "text" },
    },
    async authorize(credentials) {
      const email = credentials?.email as string | undefined;
      const password = credentials?.password as string | undefined;
      const profileType = credentials?.profileType as "PERSONAL" | "BUSINESS" | undefined;
      if (!email || !password) return null;

      // Um mesmo e-mail pode ter uma conta Pessoa Física e uma conta Empresa (contas independentes,
      // cada uma com sua própria senha) — profileType desambigua qual delas autenticar.
      const candidates = await prisma.user.findMany({ where: { email } });
      const user = profileType
        ? candidates.find((c) => c.profileType === profileType)
        : candidates.length === 1
          ? candidates[0]
          : undefined;
      if (!user?.passwordHash) return null;

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return null;

      return { id: user.id, name: user.name, email: user.email, image: user.image };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

if (process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET) {
  providers.push(
    Apple({
      clientId: process.env.APPLE_CLIENT_ID,
      // O "client secret" da Apple não é uma string fixa: é um JWT assinado com a chave privada do
      // Apple Developer (Team ID + Key ID + .p8), com validade máxima de 6 meses. Gere-o via
      // `npx auth apple secret` (pacote `next-auth`) ou os scripts da própria Apple, e renove antes de expirar.
      clientSecret: process.env.APPLE_CLIENT_SECRET,
    })
  );
}

if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  providers.push(
    MicrosoftEntraID({
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      // Sem "issuer", o padrão é o endpoint "common", que aceita contas pessoais
      // (Outlook/Hotmail/Live) e contas corporativas/escolares (Microsoft 365) — exatamente o
      // comportamento desejado para login social genérico.
    })
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers,
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
      }
      if (user || trigger === "update") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { pinHash: true, name: true, profileType: true, avatarIcon: true },
        });
        token.hasPin = Boolean(dbUser?.pinHash);
        token.profileType = dbUser?.profileType;
        token.avatarIcon = dbUser?.avatarIcon ?? null;
        if (trigger === "update" && dbUser) token.name = dbUser.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.hasPin = Boolean(token.hasPin);
        session.user.profileType = token.profileType ?? "PERSONAL";
        session.user.avatarIcon = token.avatarIcon ?? null;
      }
      return session;
    },
  },
});
