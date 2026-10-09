import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// shadcn composition utility, Tailwind 3-compatible merge. Visual tokens remain
// owned by SWP; call sites can override a utility without duplicate precedence.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
