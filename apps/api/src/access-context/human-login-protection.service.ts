import { randomUUID } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import type { Pool, PoolClient } from "pg";
import {
  loadHumanLoginProtectionPolicy,
  type HumanLoginAttemptDecision,
} from "../../../../src/application/access/login-protection";
import { DATABASE_POOL } from "../database/database.module";
import { auditCorrelationId } from "../logging/request-context";

type ThrottleRow = Readonly<{
  failure_count: number;
  window_started_at: Date;
  blocked_until: Date | null;
}>;

@Injectable()
export class HumanLoginProtectionService {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async evaluate(
    identityProvider: string,
    identifierFingerprint: string,
    accepted: boolean,
  ): Promise<HumanLoginAttemptDecision> {
    const policy = loadHumanLoginProtectionPolicy();
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
        [`${identityProvider}:${identifierFingerprint}`],
      );
      const clock = await client.query<{ now: Date }>("SELECT now() AS now");
      const now = clock.rows[0]?.now;
      if (!(now instanceof Date))
        throw new Error("Database clock unavailable.");
      const result = await client.query<ThrottleRow>(
        `SELECT failure_count, window_started_at, blocked_until
         FROM human_login_throttles
         WHERE identity_provider = $1 AND identifier_fingerprint = $2
         FOR UPDATE`,
        [identityProvider, identifierFingerprint],
      );
      const current = result.rows[0];
      if (current?.blocked_until && current.blocked_until > now) {
        await this.recordSecurityEvent(
          client,
          identityProvider,
          identifierFingerprint,
          "throttled",
        );
        await client.query("COMMIT");
        return {
          allowed: false,
          retryAfterSeconds: remainingSeconds(current.blocked_until, now),
        };
      }

      if (accepted) {
        await client.query(
          `DELETE FROM human_login_throttles
           WHERE identity_provider = $1 AND identifier_fingerprint = $2`,
          [identityProvider, identifierFingerprint],
        );
        await client.query("COMMIT");
        return { allowed: true, retryAfterSeconds: null };
      }

      const windowExpired =
        !current ||
        current.window_started_at.getTime() +
          policy.failureWindowSeconds * 1_000 <=
          now.getTime();
      const failureCount = windowExpired ? 1 : current.failure_count + 1;
      const windowStartedAt = windowExpired ? now : current.window_started_at;
      const blockedUntil =
        failureCount >= policy.failureLimit
          ? new Date(now.getTime() + policy.throttleSeconds * 1_000)
          : null;
      await client.query(
        `INSERT INTO human_login_throttles
          (identity_provider, identifier_fingerprint, failure_count,
           window_started_at, last_failed_at, blocked_until, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $5)
         ON CONFLICT (identity_provider, identifier_fingerprint) DO UPDATE SET
           failure_count = EXCLUDED.failure_count,
           window_started_at = EXCLUDED.window_started_at,
           last_failed_at = EXCLUDED.last_failed_at,
           blocked_until = EXCLUDED.blocked_until,
           updated_at = EXCLUDED.updated_at`,
        [
          identityProvider,
          identifierFingerprint,
          failureCount,
          windowStartedAt,
          now,
          blockedUntil,
        ],
      );
      await this.recordSecurityEvent(
        client,
        identityProvider,
        identifierFingerprint,
        "failed",
      );
      await client.query("COMMIT");
      return {
        allowed: false,
        retryAfterSeconds: blockedUntil
          ? remainingSeconds(blockedUntil, now)
          : null,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  private async recordSecurityEvent(
    client: PoolClient,
    identityProvider: string,
    identifierFingerprint: string,
    outcome: "failed" | "throttled",
  ): Promise<void> {
    const eventId = randomUUID();
    await client.query(
      `INSERT INTO authentication_security_events
        (id, identity_provider, identifier_fingerprint, outcome, correlation_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        eventId,
        identityProvider,
        identifierFingerprint,
        outcome,
        auditCorrelationId(eventId),
      ],
    );
  }
}

function remainingSeconds(until: Date, now: Date): number {
  return Math.max(1, Math.ceil((until.getTime() - now.getTime()) / 1_000));
}
