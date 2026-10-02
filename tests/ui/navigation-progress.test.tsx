// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
const { events, listeners } = vi.hoisted(() => {
  const listeners = new Map<string, (...args: unknown[]) => void>();
  return {
    listeners,
    events: {
      on: vi.fn((event: string, callback: (...args: unknown[]) => void) =>
        listeners.set(event, callback),
      ),
      off: vi.fn((event: string) => listeners.delete(event)),
    },
  };
});
vi.mock("next/router", () => ({ useRouter: () => ({ events }) }));
import { NavigationProgress } from "../../components/platform/NavigationProgress";
import { LocaleProvider } from "../../src/ui/i18n/locale-provider";
afterEach(() => {
  cleanup();
  listeners.clear();
  window.localStorage.clear();
  vi.clearAllMocks();
});
describe("operational navigation feedback", () => {
  it("announces pending navigation and ignores obsolete completion", () => {
    render(
      <LocaleProvider>
        <NavigationProgress />
      </LocaleProvider>,
    );
    act(() => listeners.get("routeChangeStart")?.("/operations/tasks"));
    expect(screen.getByRole("status").textContent).toBe("正在開啟工作區…");
    act(() => listeners.get("routeChangeStart")?.("/operations/inventory"));
    act(() => listeners.get("routeChangeComplete")?.("/operations/tasks"));
    expect(screen.getByRole("status").hidden).toBe(false);
    act(
      () =>
        listeners.get("routeChangeError")?.(
          { cancelled: true },
          "/operations/inventory",
        ),
    );
    expect(screen.queryByRole("status")).toBeNull();
  });
  it("clears completion and removes all listeners on unmount", () => {
    const view = render(
      <LocaleProvider>
        <NavigationProgress />
      </LocaleProvider>,
    );
    act(() => listeners.get("routeChangeStart")?.("/operations/tasks"));
    act(() => listeners.get("routeChangeComplete")?.("/operations/tasks"));
    expect(screen.queryByRole("status")).toBeNull();
    view.unmount();
    expect(events.off).toHaveBeenCalledTimes(3);
  });
});
