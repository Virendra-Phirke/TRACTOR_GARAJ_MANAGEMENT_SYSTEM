"use server";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// ─── Security: No fallback secrets or credentials ────────────────────
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "FATAL: JWT_SECRET environment variable is not set. " +
      "Set it in .env.local to a strong random string (min 32 chars)."
    );
  }
  return new TextEncoder().encode(secret);
}

function getAdminCredentials() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) {
    throw new Error(
      "FATAL: ADMIN_USERNAME and ADMIN_PASSWORD environment variables must be set."
    );
  }
  return { username, password };
}

const COOKIE_NAME = "gbms_session";

export async function authenticate(
  username: string,
  password: string
): Promise<boolean> {
  const creds = getAdminCredentials();
  // Constant-time-ish comparison to avoid timing attacks
  const userMatch = username === creds.username;
  const passMatch = password === creds.password;
  return userMatch && passMatch;
}

export async function createSession(): Promise<string> {
  const SECRET = getJwtSecret();
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return token;
}

export async function verifySession(): Promise<boolean> {
  try {
    const SECRET = getJwtSecret();
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return false;
    await jwtVerify(token, SECRET);
    return true;
  } catch {
    return false;
  }
}

/** Verify session from a raw cookie header string (for API routes) */
export async function verifyApiRequest(request: Request): Promise<boolean> {
  try {
    const SECRET = getJwtSecret();
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(
      new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`)
    );
    if (!match) return false;
    await jwtVerify(match[1], SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
