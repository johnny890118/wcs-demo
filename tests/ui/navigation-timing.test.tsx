// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
const { listeners, events } = vi.hoisted(() => {
  const listeners = new Map<string, (...args: unknown[]) => void>();
  return {
    listeners,
    events: {
      on: vi.fn((name: string, callback: (...args: unknown[]) => void) =>
        listeners.set(name, callback),
      ),
      off: vi.fn((name: string) => listeners.delete(name)),
    },
  };
});
vi.mock("next/router", () => ({ useRouter: () => ({ events }) }));
import { OperationalNavigationTiming } from "../../src/ui/observability/OperationalNavigationTiming";
afterEach(() => {
  cleanup();
  listeners.clear();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});
describe("operational browser timing", () => {
  it("records fixed-name bounded measurements and ignores obsolete completions", () => {
    const clock = {
      now: vi
        .fn()
        .mockReturnValueOnce(10)
        .mockReturnValueOnce(20)
        .mockReturnValueOnce(35),
      getEntriesByName: vi.fn(() => Array(50)),
      clearMeasures: vi.fn(),
      measure: vi.fn(),
    };
    vi.stubGlobal("performance", clock);
    const view = render(<OperationalNavigationTiming enabled />);
    act(
      () => listeners.get("routeChangeStart")?.("/operations/tasks/private-id"),
    );
    act(
      () =>
        listeners.get("routeChangeStart")?.(
          "/operations/inventory?private=query",
        ),
    );
    act(
      () =>
        listeners.get("routeChangeComplete")?.("/operations/tasks/private-id"),
    );
    expect(clock.measure).not.toHaveBeenCalled();
    act(
      () =>
        listeners.get("routeChangeComplete")?.(
          "/operations/inventory?private=query",
        ),
    );
    expect(clock.measure).toHaveBeenCalledWith("swp.navigation_total", {
      start: 20,
      end: 35,
    });
    expect(clock.clearMeasures).toHaveBeenCalledWith("swp.navigation_total");
    view.unmount();
    expect(events.off).toHaveBeenCalledTimes(3);
  });
  it("does not subscribe outside Operations", () => {
    render(<OperationalNavigationTiming enabled={false} />);
    expect(events.on).not.toHaveBeenCalled();
  });
});
