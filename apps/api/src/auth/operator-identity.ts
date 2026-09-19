import { BadRequestException } from "@nestjs/common";

export function requireOperatorId(value: string | undefined): string {
  if (!value || value.trim().length === 0 || value.length > 100) {
    throw new BadRequestException(
      "X-Operator-Id must be a non-empty string of at most 100 characters.",
    );
  }
  return value.trim();
}
