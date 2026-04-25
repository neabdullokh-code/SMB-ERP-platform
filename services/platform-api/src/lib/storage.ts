import * as Minio from "minio";
import { loadEnv } from "@sqb/config";

const BUCKET = "credit-documents";

let client: Minio.Client | null = null;
let bucketEnsured = false;

function getClient(): Minio.Client {
  if (!client) {
    const env = loadEnv();
    client = new Minio.Client({
      endPoint: env.MINIO_ENDPOINT ?? "localhost",
      port: Number(env.MINIO_PORT ?? 9000),
      useSSL: Boolean(env.MINIO_USE_SSL),
      accessKey: env.MINIO_ACCESS_KEY ?? "",
      secretKey: env.MINIO_SECRET_KEY ?? ""
    });
  }
  return client;
}

async function ensureBucket() {
  if (bucketEnsured) return;
  const mc = getClient();
  const exists = await mc.bucketExists(BUCKET);
  if (!exists) {
    await mc.makeBucket(BUCKET);
  }
  bucketEnsured = true;
}

export async function uploadDocument(
  key: string,
  buffer: Buffer,
  mimeType: string
): Promise<void> {
  await ensureBucket();
  await getClient().putObject(BUCKET, key, buffer, buffer.length, {
    "Content-Type": mimeType
  });
}

export async function getDocumentUrl(key: string, expirySeconds = 3600): Promise<string> {
  await ensureBucket();
  return getClient().presignedGetObject(BUCKET, key, expirySeconds);
}

export async function deleteDocument(key: string): Promise<void> {
  await ensureBucket();
  await getClient().removeObject(BUCKET, key);
}

export function isStorageAvailable(): boolean {
  try {
    const env = loadEnv();
    return Boolean(env.MINIO_ENDPOINT && env.MINIO_ACCESS_KEY && env.MINIO_SECRET_KEY);
  } catch {
    return false;
  }
}
