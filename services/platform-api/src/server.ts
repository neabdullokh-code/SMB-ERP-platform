import { loadEnv } from "@sqb/config";
import { buildApp } from "./app.js";
import { cleanExpiredSessions } from "./modules/auth/store.js";

const env = loadEnv();
const app = buildApp();

const SESSION_CLEANUP_INTERVAL_MS = 15 * 60 * 1000; // every 15 minutes

app
  .listen({ host: env.API_HOST, port: env.API_PORT })
  .then(() => {
    app.log.info(`platform-api listening on ${env.API_HOST}:${env.API_PORT}`);
    setInterval(() => {
      cleanExpiredSessions().catch((err) => app.log.error({ err }, "session cleanup failed"));
    }, SESSION_CLEANUP_INTERVAL_MS);
  })
  .catch((error) => {
    app.log.error(error);
    process.exit(1);
  });
