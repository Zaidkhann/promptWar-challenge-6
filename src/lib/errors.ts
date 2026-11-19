/**
 * SaansAI Standard Domain Error Architecture.
 * Provides strongly-typed, serialization-safe error primitives across API routes and services.
 */

export type ErrorCode =
  | "VALIDATION_FAILED"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "RATE_LIMIT_EXCEEDED"
  | "PAYLOAD_TOO_LARGE"
  | "EXTERNAL_PROVIDER_ERROR"
  | "SIMULATION_FAILED"
  | "INTERNAL_SERVER_ERROR";

export class SaansAIError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly timestamp: string;

  constructor(message: string, code: ErrorCode = "INTERNAL_SERVER_ERROR", statusCode: number = 500, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  public toJSON() {
    return {
      success: false,
      error: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}

export class ValidationError extends SaansAIError {
  constructor(message: string = "Request validation failed", details?: unknown) {
    super(message, "VALIDATION_FAILED", 400, details);
  }
}

export class NotFoundError extends SaansAIError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, "NOT_FOUND", 404);
  }
}

export class UnauthorizedError extends SaansAIError {
  constructor(message: string = "Unauthorized access attempt") {
    super(message, "UNAUTHORIZED", 403);
  }
}

export class RateLimitExceededError extends SaansAIError {
  constructor(retryAfterSeconds: number = 60) {
    super("API rate limit exceeded. Please retry later.", "RATE_LIMIT_EXCEEDED", 429, {
      retryAfterSeconds,
    });
  }
}

export class ExternalProviderError extends SaansAIError {
  constructor(providerName: string, message: string = "Provider unavailable") {
    super(`External provider '${providerName}' failed: ${message}`, "EXTERNAL_PROVIDER_ERROR", 502);
  }
}
