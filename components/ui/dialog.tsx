import * as Primitive from "@radix-ui/react-dialog";

// Owned shadcn/Radix composition. Presentation belongs to the consuming surface.
// Keep the installed foundation shared with Sheet; no second dialog framework.
export const Dialog = Primitive.Root;
export const DialogPortal = Primitive.Portal;
export const DialogOverlay = Primitive.Overlay;
export const DialogContent = Primitive.Content;
export const DialogTitle = Primitive.Title;
