import { describe, expect, it } from "vitest";
import { authOptions } from "../../pages/api/auth/[...nextauth]";
import {
  absoluteAuthRedirect,
  safeOperationsCallback,
} from "../../src/ui/auth/login-routing";

const origin = "https://app.example.com";

describe("login callback policy", () => {
  it.each([
    ["/operations", "/operations"],
    [
      "/operations/warehouse?task=1#detail",
      "/operations/warehouse?task=1#detail",
    ],
    ["https://app.example.com/operations/alarms", "/operations/alarms"],
  ])("accepts an operations destination %s", (candidate, expected) => {
    expect(safeOperationsCallback(candidate, origin)).toBe(expected);
  });

  it.each([
    "https://evil.example/operations",
    "//evil.example/operations",
    "/operations.evil.example",
    "/api/auth/signin",
    "/legacy",
    "/about",
    "not a url",
  ])("rejects unsafe or non-application callback %s", (candidate) => {
    expect(safeOperationsCallback(candidate, origin)).toBe("/operations");
  });

  it("keeps sign-out on the public origin while rejecting external auth redirects", () => {
    expect(absoluteAuthRedirect("/", origin)).toBe(`${origin}/`);
    expect(absoluteAuthRedirect("https://evil.example", origin)).toBe(
      `${origin}/operations`,
    );
    expect(authOptions.pages).toEqual({ signIn: "/login" });
    expect(
      authOptions.callbacks.redirect({
        url: "https://evil.example",
        baseUrl: origin,
      }),
    ).toBe(`${origin}/operations`);
  });

  it.each(["/about", "/contact", "/login", "/legacy"])(
    "does not use paused or non-product route %s as an auth destination",
    (candidate) => {
      expect(absoluteAuthRedirect(candidate, origin)).toBe(
        `${origin}/operations`,
      );
    },
  );
});
