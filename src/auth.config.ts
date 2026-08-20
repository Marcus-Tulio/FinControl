import type { NextAuthConfig } from "next-auth";

const PUBLIC_PATHS = ["/login", "/register"];

export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname, origin } = request.nextUrl;

      const isPublic =
        PUBLIC_PATHS.some((p) => pathname.startsWith(p)) || pathname.startsWith("/api/auth");

      if (!auth && !isPublic) {
        const url = new URL("/login", origin);
        url.searchParams.set("callbackUrl", pathname);
        return Response.redirect(url);
      }

      if (auth && (pathname === "/login" || pathname === "/register")) {
        return Response.redirect(new URL("/", origin));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
