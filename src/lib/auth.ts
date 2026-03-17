import { SignJWT, jwtVerify } from "jose";
import { AuthRole } from "./types";

export const COOKIE_NAME = "poz-session";
const EXPIRY = "7d";

function getSecret() {
  return new TextEncoder().encode(process.env.JWT_SECRET || "poz-secret-key-dev");
}

export interface SessionPayload {
  userId: number;
  authRole: AuthRole;
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ userId: payload.userId, authRole: payload.authRole })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      userId: payload.userId as number,
      authRole: payload.authRole as AuthRole,
    };
  } catch {
    return null;
  }
}
