import { SignJWT, jwtVerify } from "jose";
import type { Permission, Role } from "@sqb/domain-types";
import { loadEnv } from "@sqb/config";

export interface AccessTokenClaims {
  sub: string;
  jti: string;
  role: Role;
  tenantId?: string;
  permissions: Permission[];
}

function getSecret(): Uint8Array {
  return new TextEncoder().encode(loadEnv().JWT_SECRET);
}

export async function signAccessToken(claims: AccessTokenClaims, ttlSeconds: number): Promise<string> {
  return new SignJWT({
    role: claims.role,
    tenantId: claims.tenantId ?? null,
    permissions: claims.permissions
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setJti(claims.jti)
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(getSecret());
}

export async function verifyAccessToken(token: string): Promise<AccessTokenClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.sub !== "string" || typeof payload.jti !== "string") {
      return null;
    }
    return {
      sub: payload.sub,
      jti: payload.jti,
      role: payload["role"] as Role,
      tenantId: (payload["tenantId"] as string | null) ?? undefined,
      permissions: (payload["permissions"] as Permission[]) ?? []
    };
  } catch {
    return null;
  }
}
