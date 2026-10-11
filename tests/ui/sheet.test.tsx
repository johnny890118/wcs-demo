// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import Link from "next/link";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "../../components/ui/sheet";
import { Button } from "../../components/ui/button";

afterEach(cleanup);
it("owns one localized close control, accessible title and focus-return contract", async () => {
  render(
    <Sheet>
      <SheetTrigger asChild>
        <Button>開啟導覽</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetTitle>操作導覽</SheetTitle>
        <SheetClose asChild>
          <Button>關閉導覽</Button>
        </SheetClose>
        <Link href="/operations/work">工作</Link>
      </SheetContent>
    </Sheet>,
  );
  const trigger = screen.getByRole("button", { name: "開啟導覽" });
  trigger.focus();
  fireEvent.click(trigger);
  const dialog = await screen.findByRole("dialog", { name: "操作導覽" });
  expect(dialog.getAttribute("data-slot")).toBe("sheet-content");
  expect(screen.getAllByRole("button", { name: "關閉導覽" })).toHaveLength(1);
  expect(screen.queryByRole("button", { name: /^Close$/ })).toBeNull();
  await waitFor(() =>
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "關閉導覽" }),
    ),
  );
  fireEvent.keyDown(document.activeElement!, { key: "Escape" });
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  await waitFor(() => expect(document.activeElement).toBe(trigger));
});
