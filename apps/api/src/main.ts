import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { loadLocalEnvironment } from "./config/load-local-env";
import {
  loadApiListenerPort,
  validateApiRuntimeEnvironment,
} from "./config/api-runtime-config";
import { JsonLogger } from "./logging/json-logger";

async function bootstrap(): Promise<void> {
  loadLocalEnvironment();
  const runtime = validateApiRuntimeEnvironment();
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(JsonLogger));
  app.setGlobalPrefix("api");
  app.enableShutdownHooks();
  app.getHttpAdapter().getInstance().set("trust proxy", runtime.trustProxyHops);

  const port = loadApiListenerPort();
  const host = process.env.API_HOST ?? "127.0.0.1";
  await app.listen(port, host);
}

void bootstrap();
