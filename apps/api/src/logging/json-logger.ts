import { Injectable, type LoggerService } from "@nestjs/common";
import { requestContext } from "./request-context";

type LogLevel = "debug" | "error" | "info" | "warn";

@Injectable()
export class JsonLogger implements LoggerService {
  log(message: unknown, context?: string): void {
    this.write("info", message, context);
  }

  error(message: unknown, trace?: string, context?: string): void {
    this.write("error", message, context, trace);
  }

  warn(message: unknown, context?: string): void {
    this.write("warn", message, context);
  }

  debug(message: unknown, context?: string): void {
    this.write("debug", message, context);
  }

  verbose(message: unknown, context?: string): void {
    this.write("debug", message, context);
  }

  private write(
    level: LogLevel,
    message: unknown,
    context?: string,
    trace?: string,
  ): void {
    const entry = JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      requestId: requestContext.getStore()?.requestId ?? null,
      context: context ?? null,
      message: this.normalize(message),
      ...(trace ? { trace } : {}),
    });
    (level === "error" ? process.stderr : process.stdout).write(`${entry}\n`);
  }

  private normalize(message: unknown): unknown {
    if (message instanceof Error) {
      return { name: message.name, message: message.message };
    }
    return message;
  }
}
