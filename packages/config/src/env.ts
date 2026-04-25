import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_HOST: z.string().default("0.0.0.0"),
  API_PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  ALLOW_DEMO_AUTH: z.coerce.boolean().default(false),
  SESSION_COOKIE_NAME: z.string().default("erp_session"),
  OTP_TTL_SECONDS: z.coerce.number().default(300),
  OTP_ISSUER: z.string().default("SQB Business OS"),
  OTP_TOTP_WINDOW: z.coerce.number().default(1),
  OTP_SMS_PROVIDER: z.enum(["disabled", "log", "twilio"]).default("log"),
  OTP_SMS_FROM: z.string().optional(),
  OTP_SMS_TWILIO_ACCOUNT_SID: z.string().optional(),
  OTP_SMS_TWILIO_AUTH_TOKEN: z.string().optional(),
  MINIO_ENDPOINT: z.string().default("localhost"),
  MINIO_PORT: z.coerce.number().default(9000),
  MINIO_USE_SSL: z.coerce.boolean().default(false),
  MINIO_ACCESS_KEY: z.string().default("minioadmin"),
  MINIO_SECRET_KEY: z.string().default("minioadmin"),
  JWT_SECRET: z.string().min(32).default("dev-secret-change-in-production-minimum-32-chars!!"),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(7),
  ALLOWED_ORIGINS: z.string().default("http://localhost:3000,http://localhost:3001")
});

export type PlatformEnv = z.infer<typeof envSchema>;

function findEnvFile(startDir = process.cwd()) {
  let current = path.resolve(startDir);

  while (true) {
    const candidate = path.join(current, ".env");
    if (fs.existsSync(candidate)) {
      return candidate;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

function parseDotEnvFile(filePath: string) {
  const parsed: Record<string, string> = {};
  const contents = fs.readFileSync(filePath, "utf8");

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    parsed[key] = value;
  }

  return parsed;
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): PlatformEnv {
  const envFile = findEnvFile();
  const fileValues = envFile ? parseDotEnvFile(envFile) : {};
  return envSchema.parse({
    ...fileValues,
    ...source
  });
}

function hasScheme(value: string) {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(value);
}

function encodeCredential(value: string) {
  try {
    return encodeURIComponent(decodeURIComponent(value));
  } catch {
    return encodeURIComponent(value);
  }
}

function normalizeCredentials(rawUrl: string) {
  if (!hasScheme(rawUrl)) {
    throw new Error("DATABASE_URL must be a valid PostgreSQL connection string.");
  }

  const schemeEnd = rawUrl.indexOf("://");
  const authorityStart = schemeEnd + 3;
  const pathStart = rawUrl.indexOf("/", authorityStart);
  if (pathStart === -1) {
    return rawUrl;
  }

  const authority = rawUrl.slice(authorityStart, pathStart);
  const lastAt = authority.lastIndexOf("@");
  if (lastAt === -1) {
    return rawUrl;
  }

  const credentials = authority.slice(0, lastAt);
  const host = authority.slice(lastAt + 1);
  const separator = credentials.indexOf(":");
  if (separator === -1) {
    return rawUrl;
  }

  const username = credentials.slice(0, separator);
  const password = credentials.slice(separator + 1);

  return `${rawUrl.slice(0, authorityStart)}${encodeCredential(username)}:${encodeCredential(password)}@${host}${rawUrl.slice(pathStart)}`;
}

export function normalizeDatabaseUrl(rawUrl: string) {
  const trimmed = rawUrl.trim();
  const normalized = normalizeCredentials(trimmed);
  const parsed = new URL(normalized);
  const isSupabaseHost = parsed.hostname.endsWith(".supabase.co");

  if (isSupabaseHost && !parsed.searchParams.has("sslmode")) {
    parsed.searchParams.set("sslmode", "require");
  }

  return parsed.toString();
}

export function isDirectSupabaseConnection(rawUrl: string) {
  try {
    const parsed = new URL(normalizeDatabaseUrl(rawUrl));
    return parsed.hostname.startsWith("db.") && parsed.hostname.endsWith(".supabase.co") && parsed.port === "5432";
  } catch {
    return false;
  }
}

export function isSupabasePoolerConnection(rawUrl: string) {
  try {
    const parsed = new URL(normalizeDatabaseUrl(rawUrl));
    return parsed.hostname.endsWith(".pooler.supabase.com");
  } catch {
    return false;
  }
}
