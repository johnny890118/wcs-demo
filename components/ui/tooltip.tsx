import * as Primitive from "@radix-ui/react-tooltip";
import type { ReactElement } from "react";

export const TooltipProvider = Primitive.Provider;
export function Tooltip({
  children,
  label,
  disabled = false,
}: {
  children: ReactElement;
  label: string;
  disabled?: boolean;
}) {
  if (disabled) return children;
  return (
    <Primitive.Root>
      <Primitive.Trigger asChild>{children}</Primitive.Trigger>
      <Primitive.Portal>
        <div role="region" aria-label={label}>
          <Primitive.Content
            side="right"
            sideOffset={8}
            collisionPadding={12}
            className="swp-tooltip"
          >
            {label}
          </Primitive.Content>
        </div>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
