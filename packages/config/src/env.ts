import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_HOST: z.string().default("0.0.0.0"),
  API_PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().default("postgres://postgres:postgres@localhost:5432/sqb_erp"),
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

export function loadEnv(source: NodeJS.ProcessEnv = process.env): PlatformEnv {
  return envSchema.parse(source);
}
