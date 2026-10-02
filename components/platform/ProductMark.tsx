import Image from "next/image";
import { PRODUCT_ICON } from "../../src/ui/identity/product-identity";
// Decorative: surrounding brand link supplies the accessible product name.
export function ProductMark() {
  return (
    <Image
      src={PRODUCT_ICON}
      width={36}
      height={36}
      alt=""
      aria-hidden="true"
      unoptimized
      className="h-9 w-9 shrink-0"
    />
  );
}
