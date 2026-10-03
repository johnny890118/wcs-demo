import { describe, expect, it } from "vitest";
import {
  measureRequestTiming,
  recordRequestTiming,
  recordUpstreamTiming,
  requestTimingHeader,
  withRequestTiming,
} from "../../src/infrastructure/http/request-timing";

describe("privacy-safe request timing", () => {
  it("accumulates known stages and rejects untrusted upstream descriptions", () => {
    withRequestTiming(() => {
      recordRequestTiming("session_validation", 10);
      recordRequestTiming("session_validation", 5);
      recordRequestTiming("projection_api", NaN);
      recordRequestTiming("projection_api", -1);
      recordUpstreamTiming(
        'api_handler;dur=12.5, database_query;dur=3, secret;dur=5, api_handler;dur=3;desc="credential"',
      );
      expect(requestTimingHeader()).toBe(
        "session_validation;dur=15.00, api_handler;dur=12.50, database_query;dur=3.00",
      );
    });
    expect(requestTimingHeader()).toBe("");
  });

  it("isolates simultaneous requests across asynchronous boundaries", async () => {
    const results = await Promise.all(
      [7, 19].map((duration) =>
        withRequestTiming(async () => {
          await Promise.resolve();
          recordRequestTiming("projection_api", duration);
          await Promise.resolve();
          return requestTimingHeader();
        }),
      ),
    );
    expect(results).toEqual([
      "projection_api;dur=7.00",
      "projection_api;dur=19.00",
    ]);
  });

  it("records failed operations without exposing their errors", async () => {
    await withRequestTiming(async () => {
      await expect(
        measureRequestTiming("session_validation", async () => {
          throw new Error("private failure detail");
        }),
      ).rejects.toThrow("private failure detail");
      expect(requestTimingHeader()).toMatch(
        /^session_validation;dur=\d+\.\d{2}$/,
      );
      expect(requestTimingHeader()).not.toContain("private");
    });
  });
});
