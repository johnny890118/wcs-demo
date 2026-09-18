export class OutboundIdempotencyConflictError extends Error {
  constructor(key: string) {
    super(`Idempotency key ${key} was already used with different input.`);
    this.name = "OutboundIdempotencyConflictError";
  }
}

export class InvalidOutboundDestinationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidOutboundDestinationError";
  }
}

export class InsufficientInventoryError extends Error {
  constructor(sku: string, requested: number, available: number) {
    super(
      `SKU ${sku} requested ${requested} units but only ${available} are allocatable.`,
    );
    this.name = "InsufficientInventoryError";
  }
}
