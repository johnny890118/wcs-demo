import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Headers,
  Post,
  UnprocessableEntityException,
  UseGuards,
} from "@nestjs/common";
import { ServiceTokenGuard } from "../auth/service-token.guard";
import { RequirePermission } from "../auth/permissions";
import { requireOperatorId } from "../auth/operator-identity";
import {
  IdempotencyConflictError,
  InvalidLocationError,
} from "./inbound.errors";
import { InboundService } from "./inbound.service";
import type {
  CreateInboundReceipt,
  InboundReceiptResult,
} from "./inbound.types";

type InboundBody = Omit<CreateInboundReceipt, "idempotencyKey" | "actorId">;

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requiredString(
  record: Record<string, unknown>,
  field: string,
  maxLength = 200,
): string {
  const value = record[field];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new BadRequestException(`${field} must be a non-empty string.`);
  }
  if (value.length > maxLength) {
    throw new BadRequestException(
      `${field} must be at most ${maxLength} characters.`,
    );
  }
  return value.trim();
}

function parseBody(value: unknown): InboundBody {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new BadRequestException("Request body must be an object.");
  }
  const body = value as Record<string, unknown>;
  const loadValue = body.load;
  if (!loadValue || typeof loadValue !== "object" || Array.isArray(loadValue)) {
    throw new BadRequestException("load must be an object.");
  }
  const load = loadValue as Record<string, unknown>;
  const quantity = load.quantity;
  if (!Number.isSafeInteger(quantity) || (quantity as number) <= 0) {
    throw new BadRequestException("load.quantity must be a positive integer.");
  }

  const sourceLocationId = requiredString(body, "sourceLocationId", 36);
  const destinationLocationId = requiredString(
    body,
    "destinationLocationId",
    36,
  );
  if (
    !uuidPattern.test(sourceLocationId) ||
    !uuidPattern.test(destinationLocationId)
  ) {
    throw new BadRequestException("Location identifiers must be UUIDs.");
  }
  if (sourceLocationId === destinationLocationId) {
    throw new BadRequestException("Source and destination must be different.");
  }

  return {
    externalReference: requiredString(body, "externalReference"),
    sourceLocationId,
    destinationLocationId,
    load: {
      externalId: requiredString(load, "externalId"),
      sku: requiredString(load, "sku"),
      quantity: quantity as number,
    },
  };
}

@Controller("v1/inbound-receipts")
@UseGuards(ServiceTokenGuard)
@RequirePermission("inbound.create")
export class InboundController {
  constructor(private readonly inboundService: InboundService) {}

  @Post()
  async create(
    @Headers("idempotency-key") idempotencyKey: string | undefined,
    @Headers("x-operator-id") operatorId: string | undefined,
    @Body() rawBody: unknown,
  ): Promise<InboundReceiptResult> {
    if (!idempotencyKey || idempotencyKey.trim().length < 8) {
      throw new BadRequestException(
        "Idempotency-Key header must contain at least 8 characters.",
      );
    }
    if (idempotencyKey.length > 200) {
      throw new BadRequestException(
        "Idempotency-Key header must be at most 200 characters.",
      );
    }

    try {
      return await this.inboundService.create({
        ...parseBody(rawBody),
        idempotencyKey: idempotencyKey.trim(),
        actorId: requireOperatorId(operatorId),
      });
    } catch (error) {
      if (error instanceof IdempotencyConflictError) {
        throw new ConflictException({
          code: "IDEMPOTENCY_CONFLICT",
          message: error.message,
        });
      }
      if (error instanceof InvalidLocationError) {
        throw new UnprocessableEntityException({
          code: "INVALID_LOCATION",
          message: error.message,
        });
      }
      throw error;
    }
  }
}
