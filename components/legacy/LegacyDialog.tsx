import { useRef, type ReactNode, type RefObject } from "react";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "../ui/dialog";

/** Legacy presentation only: preserve content/callbacks, not operational truth. */
export function LegacyDialog({
  open,
  onClose,
  initialFocus,
  children,
}: {
  open: boolean;
  onClose: () => void;
  initialFocus: RefObject<HTMLElement | null>;
  children: ReactNode;
}) {
  const returnFocus = useRef<HTMLElement | null>(null);
  const backdropPress = useRef(false);
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogPortal>
        <DialogOverlay
          className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-gray-700/75 p-4 sm:items-center"
          // Radix 1.2 registers Overlay as a dismissable surface. Preserve the
          // old outside-click contract explicitly, without dismissing a drag
          // that began inside the form or a right/context click.
          onPointerDown={(event) => {
            backdropPress.current =
              event.target === event.currentTarget && event.button === 0;
          }}
          onPointerCancel={() => {
            backdropPress.current = false;
          }}
          onClick={(event) => {
            if (backdropPress.current && event.target === event.currentTarget)
              onClose();
            backdropPress.current = false;
          }}
        >
          <DialogContent
            aria-describedby={undefined}
            className="relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-gray-900 text-left shadow-xl focus:outline-none"
            onOpenAutoFocus={(event) => {
              returnFocus.current =
                document.activeElement instanceof HTMLElement
                  ? document.activeElement
                  : null;
              if (initialFocus.current) {
                event.preventDefault();
                initialFocus.current.focus();
              }
            }}
            onCloseAutoFocus={(event) => {
              if (returnFocus.current?.isConnected) {
                event.preventDefault();
                returnFocus.current.focus();
              }
            }}
          >
            {children}
          </DialogContent>
        </DialogOverlay>
      </DialogPortal>
    </Dialog>
  );
}

export function LegacyDialogTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <DialogTitle asChild>
      <h1 className={className}>{children}</h1>
    </DialogTitle>
  );
}
