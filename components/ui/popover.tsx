import * as Primitive from "@radix-ui/react-popover";
import type { ComponentProps } from "react";

export const Popover = Primitive.Root;
export const PopoverTrigger = Primitive.Trigger;
export const PopoverClose = Primitive.Close;
export function PopoverContent({
  className = "",
  align = "start",
  sideOffset = 8,
  collisionPadding = 12,
  ...props
}: ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Portal>
      <Primitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={`swp-popover ${className}`}
        {...props}
      />
    </Primitive.Portal>
  );
}
