import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import { createLogger, loadEnv } from "@sqb/config";
import { auditModule } from "./modules/audit/index.js";
import { authModule } from "./modules/auth/index.js";
import { bankMonitoringModule } from "./modules/bank-monitoring/index.js";
import { creditModule } from "./modules/credit/index.js";
import { financeModule } from "./modules/finance/index.js";
import { inventoryModule } from "./modules/inventory/index.js";
import { notificationsModule } from "./modules/notifications/index.js";
import { productionModule } from "./modules/production/index.js";
import { serviceOrdersModule } from "./modules/service-orders/index.js";
import { tenancyModule } from "./modules/tenancy/index.js";
import { workflowModule } from "./modules/workflow/index.js";
import { requestContextPlugin } from "./plugins/context.js";
import { errorHandlingPlugin } from "./plugins/errors.js";

export function buildApp() {
  const env = loadEnv();
  const logger = createLogger("platform-api");
  const allowedOrigins = env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean);

  const app = Fastify({ logger: true });

  app.register(cors, {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"), false);
      }
    },
    credentials: true
  });

  app.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: "1 minute",
    keyGenerator: (request) => request.ip
  });

  app.register(requestContextPlugin);
  app.register(errorHandlingPlugin);

  app.get("/health", async () => ({
    status: "ok",
    service: "platform-api",
    env: env.NODE_ENV
  }));

  app.register(multipart, { limits: { fileSize: 20 * 1024 * 1024 } });

  app.register(authModule);
  app.register(tenancyModule);
  app.register(financeModule);
  app.register(inventoryModule);
  app.register(productionModule);
  app.register(serviceOrdersModule);
  app.register(workflowModule);
  app.register(bankMonitoringModule);
  app.register(creditModule);
  app.register(auditModule);
  app.register(notificationsModule);

  logger.info("API bootstrapped", { port: env.API_PORT });

  return app;
}
