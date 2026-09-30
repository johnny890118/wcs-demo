// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth/react", () => ({ useSession: vi.fn() }));
vi.mock("next/router", () => ({ useRouter: vi.fn() }));

import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { WarehouseContextControl } from "../../components/platform/WarehouseContextControl";
import { LocaleProvider } from "../../src/ui/i18n/locale-provider";
import { testOperationalAccess } from "../fixtures/operational-access";

const targetWarehouseId = "20000000-0000-4000-8000-000000000001";
const multiWarehouseAccess = {
  ...testOperationalAccess,
  principal: {
    ...testOperationalAccess.principal,
    warehouseScopes: [
      ...testOperationalAccess.principal.warehouseScopes,
      {
        warehouseId: targetWarehouseId,
        code: "SECOND",
        name: "Second Warehouse",
      },
    ],
  },
};

describe("warehouse context control", () => {
  const update = vi.fn();
  const replace = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSession).mockReturnValue({ update } as never);
    vi.mocked(useRouter).mockReturnValue({
      asPath: "/operations/inbound",
      replace,
    } as never);
  });

  afterEach(cleanup);

  it("shows static context for one scope and a bounded selector for multiple scopes", async () => {
    const single = render(
      <LocaleProvider>
        <WarehouseContextControl access={testOperationalAccess} />
      </LocaleProvider>,
    );
    expect(screen.queryByRole("combobox")).toBeNull();
    single.unmount();

    const { container } = render(
      <LocaleProvider>
        <WarehouseContextControl access={multiWarehouseAccess} />
      </LocaleProvider>,
    );
    const selector = screen.getByRole("combobox", { name: "目前倉庫" });
    expect(selector).toHaveProperty(
      "value",
      testOperationalAccess.currentWarehouseId,
    );
    expect(
      (
        await axe.run(container, {
          rules: { "color-contrast": { enabled: false } },
        })
      ).violations,
    ).toEqual([]);
  });

  it("submits only the selected warehouse and refreshes after server confirmation", async () => {
    update.mockResolvedValue({
      access: {
        ...multiWarehouseAccess,
        currentWarehouseId: targetWarehouseId,
      },
    });
    render(
      <LocaleProvider>
        <WarehouseContextControl access={multiWarehouseAccess} />
      </LocaleProvider>,
    );

    fireEvent.change(screen.getByRole("combobox", { name: "目前倉庫" }), {
      target: { value: targetWarehouseId },
    });

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({
        currentWarehouseId: targetWarehouseId,
      }),
    );
    expect(replace).toHaveBeenCalledWith("/operations/inbound", undefined, {
      scroll: false,
    });
  });

  it("retains the prior context and reports a failed update", async () => {
    update.mockRejectedValue(new Error("API unavailable"));
    render(
      <LocaleProvider>
        <WarehouseContextControl access={multiWarehouseAccess} />
      </LocaleProvider>,
    );

    fireEvent.change(screen.getByRole("combobox", { name: "目前倉庫" }), {
      target: { value: targetWarehouseId },
    });

    expect(
      await screen.findByText("無法切換倉庫，系統仍保留原本的營運情境。"),
    ).toBeTruthy();
    expect(replace).not.toHaveBeenCalled();
  });
});
