import type { PoolClient } from "pg";
import { captureRequestTimingRecorder } from "../../../../src/infrastructure/http/request-timing";

/** pg Pool.query uses the callback overload; transactions often use promises. */
export function instrumentQueryTiming(client: PoolClient): void {
  const query = client.query;
  client.query = function (...args: unknown[]) {
    const started = performance.now();
    const recordDuration = captureRequestTimingRecorder("database_query");
    let recorded = false;
    const record = () => {
      if (!recorded) {
        recorded = true;
        recordDuration(performance.now() - started);
      }
    };
    const callback = args[args.length - 1];
    if (typeof callback === "function") {
      args[args.length - 1] = function (this: unknown, ...result: unknown[]) {
        record();
        return Reflect.apply(callback, this, result);
      };
    }
    try {
      const result = Reflect.apply(query, client, args);
      if (result && typeof result.then === "function") {
        return result.finally(record);
      }
      return result;
    } catch (error) {
      record();
      throw error;
    }
  } as PoolClient["query"];
}
