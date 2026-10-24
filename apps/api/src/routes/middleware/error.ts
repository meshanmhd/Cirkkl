import { Context } from "hono";
import { ZodError } from "zod";
import { AppError } from "../../errors";

export function errorHandler(err: Error, c: Context) {
  if (err instanceof AppError) {
    return c.json(
      {
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
        },
      },
      err.status as any
    );
  }

  if (err instanceof ZodError) {
    return c.json(
      {
        error: {
          code: "BAD_REQUEST",
          message: "Validation failed",
          details: err.flatten(),
        },
      },
      400
    );
  }

  return c.json(
    {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: err.message || "An unexpected error occurred",
      },
    },
    500
  );
}
