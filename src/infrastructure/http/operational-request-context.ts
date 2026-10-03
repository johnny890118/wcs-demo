import type { GetServerSideProps, NextApiHandler } from "next";
import { withHumanReadPolicy } from "../auth/human-read-freshness";
import { requestTimingHeader, withRequestTiming } from "./request-timing";

/** Explicit read-only Operations request policy; non-GET remains strict. */
export function withReadOnlyOperationalNavigation<
  Props extends Record<string, unknown>,
>(handler: GetServerSideProps<Props>): GetServerSideProps<Props> {
  return (context) =>
    withHumanReadPolicy(context.req.method, () =>
      withRequestTiming(async () => {
        const started = performance.now();
        try {
          return await handler(context);
        } finally {
          if (!context.res.headersSent) {
            const stages = requestTimingHeader();
            context.res.setHeader(
              "Server-Timing",
              [
                `navigation_server;dur=${(performance.now() - started).toFixed(
                  2,
                )}`,
                stages,
              ]
                .filter(Boolean)
                .join(", "),
            );
          }
        }
      }),
    );
}

/** Set headers before a BFF sends its JSON body, not after headers are sent. */
export function withReadOnlyOperationalBff(
  handler: NextApiHandler,
): NextApiHandler {
  return (request, response) =>
    withHumanReadPolicy(request.method, () =>
      withRequestTiming(async () => {
        const started = performance.now();
        const originalJson = response.json;
        response.json = function (body) {
          if (!response.headersSent) {
            response.setHeader(
              "Server-Timing",
              [
                `bff_handler;dur=${(performance.now() - started).toFixed(2)}`,
                requestTimingHeader(),
              ]
                .filter(Boolean)
                .join(", "),
            );
          }
          return originalJson.call(response, body);
        };
        try {
          await handler(request, response);
        } finally {
          response.json = originalJson;
        }
      }),
    );
}
