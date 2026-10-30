import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { UserSession } from "@/types";

const AUTH_SECRET = process.env.AUTH_SECRET || "repeatless_super_secret_jwt_key_meta_ai_2026_dev";
const encodedKey = new TextEncoder().encode(AUTH_SECRET);
const COOKIE_NAME = "repeatless_session";

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signSession(session: UserSession): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function verifySession(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as unknown as UserSession;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySession(token);
  } catch {
    return null;
  }
}

export async function setSessionCookie(session: UserSession): Promise<void> {
  const token = await signSession(session);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// User ownership check utility
export function enforceOwnership(
  resourceOwnerId: string | undefined | null,
  session: UserSession
): boolean {
  if (!resourceOwnerId) return false;
  const ownerStr = resourceOwnerId.toString();
  return (
    ownerStr === session.userId ||
    Boolean(session.householdId && ownerStr === session.householdId)
  );
}
