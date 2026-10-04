import type { GetServerSideProps, NextApiHandler } from "next";
import {
  withHumanReadPolicy,
  humanReadAuthority,
} from "../auth/human-read-freshness";
import { requestTimingHeader, withRequestTiming } from "./request-timing";

/** Explicit read-only Operations request policy; non-GET remains strict. */
export function withReadOnlyOperationalNavigation<
  Props extends Record<string, unknown>,
>(handler: GetServerSideProps<Props>): GetServerSideProps<Props> {
  return (context) =>
    withHumanReadPolicy(context.req.method, () =>
      withRequestTiming(async () => {
        const started = performance.now();
        context.res.setHeader("Cache-Control", "private, no-store");
        try {
          const result = await handler(context);
          if ("props" in result)
            return {
              ...result,
              props: {
                ...(await result.props),
                operationalReadContext: humanReadAuthority(),
              },
            };
          return result;
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
        response.setHeader("Cache-Control", "private, no-store");
        const originalJson = response.json;
        response.json = function (body) {
          if (!response.headersSent) {
            const authority = humanReadAuthority();
            if (authority && response.statusCode === 200) {
              response.setHeader("X-SWP-Read-Scope", authority.scopeKey);
              response.setHeader(
                "X-SWP-Read-Until",
                String(authority.validUntil),
              );
            }
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
