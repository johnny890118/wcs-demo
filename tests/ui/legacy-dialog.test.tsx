// @vitest-environment jsdom
import { useRef, useState } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import {
  LegacyDialog,
  LegacyDialogTitle,
} from "../../components/legacy/LegacyDialog";

afterEach(cleanup);

function Example({ refuseClose = false, onClose = () => {} }) {
  const [open, setOpen] = useState(false);
  const cancel = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open legacy</button>
      <LegacyDialog
        open={open}
        initialFocus={cancel}
        onClose={() => {
          onClose();
          if (!refuseClose) setOpen(false);
        }}
      >
        <LegacyDialogTitle>Legacy fixture</LegacyDialogTitle>
        <button ref={cancel} onClick={() => setOpen(false)}>
          Cancel
        </button>
        <input aria-label="Legacy value" />
      </LegacyDialog>
    </>
  );
}

it("retains initial cancel focus, controlled close, and the invoking focus", async () => {
  render(<Example />);
  const open = screen.getByRole("button", { name: "Open legacy" });
  open.focus();
  fireEvent.click(open);
  expect(
    await screen.findByRole("dialog", { name: "Legacy fixture" }),
  ).toBeTruthy();
  await waitFor(() =>
    expect(document.activeElement).toBe(screen.getByText("Cancel")),
  );
  fireEvent.keyDown(document.activeElement!, { key: "Escape" });
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  await waitFor(() => expect(document.activeElement).toBe(open));
});

it("does not force closed a controlled authentication gate that refuses dismissal", async () => {
  const onClose = vi.fn();
  render(<Example refuseClose onClose={onClose} />);
  fireEvent.click(screen.getByText("Open legacy"));
  await screen.findByRole("dialog");
  fireEvent.keyDown(document.activeElement!, { key: "Escape" });
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("dialog")).toBeTruthy();
});
