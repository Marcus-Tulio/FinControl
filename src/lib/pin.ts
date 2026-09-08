export const PIN_COOKIE = "pin_ok";
export const PIN_COOKIE_MAX_AGE = 60 * 60 * 12; // 12h

function toBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** HMAC assinado com AUTH_SECRET — funciona tanto no middleware (Edge) quanto em Server Actions (Node), sem depender do Prisma. */
export async function signPinToken(userId: string): Promise<string> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET não configurado");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(userId));
  return toBase64Url(signature);
}

export async function verifyPinToken(userId: string, token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const expected = await signPinToken(userId);
  return expected === token;
}
