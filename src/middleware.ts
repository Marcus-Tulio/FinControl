import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { PIN_COOKIE, verifyPinToken } from "@/lib/pin";

const PUBLIC_PATHS = ["/login", "/register", "/esqueci-senha", "/redefinir-senha"];

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic =
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) || pathname.startsWith("/api/auth");

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie: req.nextUrl.protocol === "https:",
  });

  if (!token && !isPublic) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (token && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  if (token?.id && pathname !== "/desbloquear" && !isPublic) {
    if (token.hasPin) {
      const cookieValue = req.cookies.get(PIN_COOKIE)?.value;
      const unlocked = await verifyPinToken(token.id, cookieValue);
      if (!unlocked) {
        const url = new URL("/desbloquear", req.nextUrl.origin);
        url.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(url);
      }
    }
  }

  if (token?.id && pathname === "/desbloquear" && !token.hasPin) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)"],
};
