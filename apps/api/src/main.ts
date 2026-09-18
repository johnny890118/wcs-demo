import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { loadLocalEnvironment } from "./config/load-local-env";
import { JsonLogger } from "./logging/json-logger";

async function bootstrap(): Promise<void> {
  loadLocalEnvironment();
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(JsonLogger));
  app.setGlobalPrefix("api");
  app.enableShutdownHooks();

  const port = Number(process.env.API_PORT ?? process.env.PORT ?? 3001);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65_535) {
    throw new Error("API_PORT must be a valid TCP port.");
  }
  const host = process.env.API_HOST ?? "127.0.0.1";
  await app.listen(port, host);
}

void bootstrap();
