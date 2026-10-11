import * as Primitive from "@radix-ui/react-dialog";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from "react";
import { cn } from "./utils";

// Owned shadcn Sheet composition. The caller owns the localized close control;
// there is no second English-only close button or decorative entry animation.
export const Sheet = Primitive.Root;
export const SheetTrigger = Primitive.Trigger;
export const SheetClose = Primitive.Close;
export const SheetTitle = Primitive.Title;

export const SheetContent = forwardRef<
  ElementRef<typeof Primitive.Content>,
  ComponentPropsWithoutRef<typeof Primitive.Content>
>(({ className, children, ...props }, ref) => (
  <Primitive.Portal>
    <Primitive.Overlay className="swp-sheet-overlay" />
    <Primitive.Content
      ref={ref}
      data-slot="sheet-content"
      aria-describedby={undefined}
      className={cn("swp-type swp-sheet-content", className)}
      {...props}
    >
      {children}
    </Primitive.Content>
  </Primitive.Portal>
));
SheetContent.displayName = "SheetContent";
