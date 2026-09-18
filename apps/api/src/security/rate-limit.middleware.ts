import { Injectable, type NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { loadApiRuntimeConfig } from "../config/api-runtime-config";

type Bucket = { count: number; resetAt: number };

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly buckets = new Map<string, Bucket>();
  private readonly maximumTrackedClients = 10_000;
  private readonly limit: number;
  private readonly windowMs: number;

  constructor() {
    const config = loadApiRuntimeConfig();
    this.limit = config.rateLimitMax;
    this.windowMs = config.rateLimitWindowMs;
  }

  use(request: Request, response: Response, next: NextFunction): void {
    const now = Date.now();
    const key = request.ip || request.socket.remoteAddress || "unknown";
    let bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      this.makeRoomFor(key, now);
      bucket = { count: 0, resetAt: now + this.windowMs };
      this.buckets.set(key, bucket);
    }

    const resetSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1_000));
    response.setHeader("RateLimit-Limit", String(this.limit));
    response.setHeader("RateLimit-Reset", String(resetSeconds));
    if (bucket.count >= this.limit) {
      response.setHeader("RateLimit-Remaining", "0");
      response.setHeader("Retry-After", String(resetSeconds));
      response.status(429).json({
        code: "RATE_LIMITED",
        message: "Too many requests. Retry after the current window.",
      });
      return;
    }

    bucket.count += 1;
    response.setHeader(
      "RateLimit-Remaining",
      String(Math.max(0, this.limit - bucket.count)),
    );
    next();
  }

  private makeRoomFor(key: string, now: number): void {
    if (this.buckets.has(key)) return;
    for (const [candidate, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(candidate);
    }
    if (this.buckets.size < this.maximumTrackedClients) return;
    const oldest = this.buckets.keys().next().value as string | undefined;
    if (oldest) this.buckets.delete(oldest);
  }
}
