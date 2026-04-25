import { buildApp } from "./app.js";
import { loadEnv } from "@sqb/config";

const env = loadEnv();
const app = buildApp();

const start = async () => {
  try {
    await app.listen({ port: Number(env.API_PORT) || 4000, host: env.API_HOST || "0.0.0.0" });
    // logger handles the "listening" message
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
