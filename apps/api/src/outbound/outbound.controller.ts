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
import {
  InsufficientInventoryError,
  InvalidOutboundDestinationError,
  OutboundIdempotencyConflictError,
} from "./outbound.errors";
import { OutboundService } from "./outbound.service";
import type {
  CreateOutboundOrder,
  OutboundOrderResult,
} from "./outbound.types";

type OutboundBody = Omit<CreateOutboundOrder, "idempotencyKey" | "actorId">;

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requiredString(
  body: Record<string, unknown>,
  field: string,
  maxLength = 200,
): string {
  const value = body[field];
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

function parseBody(value: unknown): OutboundBody {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new BadRequestException("Request body must be an object.");
  }
  const body = value as Record<string, unknown>;
  const quantity = body.quantity;
  if (!Number.isSafeInteger(quantity) || (quantity as number) <= 0) {
    throw new BadRequestException("quantity must be a positive integer.");
  }
  const destinationLocationId = requiredString(
    body,
    "destinationLocationId",
    36,
  );
  if (!uuidPattern.test(destinationLocationId)) {
    throw new BadRequestException("destinationLocationId must be a UUID.");
  }
  return {
    externalReference: requiredString(body, "externalReference"),
    sku: requiredString(body, "sku"),
    quantity: quantity as number,
    destinationLocationId,
  };
}

@Controller("v1/outbound-orders")
@UseGuards(ServiceTokenGuard)
export class OutboundController {
  constructor(private readonly outboundService: OutboundService) {}

  @Post()
  async create(
    @Headers("idempotency-key") idempotencyKey: string | undefined,
    @Body() rawBody: unknown,
  ): Promise<OutboundOrderResult> {
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
    const actorId = process.env.API_SERVICE_ID;
    if (!actorId) throw new Error("API_SERVICE_ID is required.");

    try {
      return await this.outboundService.create({
        ...parseBody(rawBody),
        idempotencyKey: idempotencyKey.trim(),
        actorId,
      });
    } catch (error) {
      if (error instanceof OutboundIdempotencyConflictError) {
        throw new ConflictException({
          code: "IDEMPOTENCY_CONFLICT",
          message: error.message,
        });
      }
      if (error instanceof InsufficientInventoryError) {
        throw new ConflictException({
          code: "INSUFFICIENT_INVENTORY",
          message: error.message,
        });
      }
      if (error instanceof InvalidOutboundDestinationError) {
        throw new UnprocessableEntityException({
          code: "INVALID_DESTINATION",
          message: error.message,
        });
      }
      throw error;
    }
  }
}
