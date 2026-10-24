import { ErrorCode } from "@cirkkl/contracts";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: ErrorCode, message: string, status: number = 400, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function badRequest(message: string, details?: unknown): AppError {
  return new AppError("BAD_REQUEST", message, 400, details);
}

export function unauthorized(message: string = "Unauthorized"): AppError {
  return new AppError("UNAUTHORIZED", message, 401);
}

export function forbidden(message: string = "Forbidden"): AppError {
  return new AppError("FORBIDDEN", message, 403);
}

export function notFound(message: string = "Not found"): AppError {
  return new AppError("NOT_FOUND", message, 404);
}

export function conflict(message: string): AppError {
  return new AppError("CONFLICT", message, 409);
}

export function unprocessable(message: string, details?: unknown): AppError {
  return new AppError("UNPROCESSABLE_ENTITY", message, 422, details);
}

export function internalError(message: string = "Internal server error"): AppError {
  return new AppError("INTERNAL_SERVER_ERROR", message, 500);
}
