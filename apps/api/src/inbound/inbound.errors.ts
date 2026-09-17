export class IdempotencyConflictError extends Error {
  constructor(idempotencyKey: string) {
    super(`Idempotency key ${idempotencyKey} was reused with different input.`);
    this.name = "IdempotencyConflictError";
  }
}

export class InvalidLocationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidLocationError";
  }
}
