import type { Context } from "../types";

interface RequestError {
  message?: string;
}

type Errors = {
  [x: string]: string[] | undefined;
  [x: number]: string[] | undefined;
  [x: symbol]: string[] | undefined;
};

interface BadRequestError extends RequestError {
  errors?: Errors;
}

export function badRequestError(c: Context, error?: BadRequestError) {
  return c.json(
    {
      ok: false,
      code: "BAD_REQUEST" as const,
      message: error?.message ?? "Wrong data passed",
      errors: error?.errors,
    },
    400
  );
}

export function unauthorizedError(c: Context, error?: RequestError) {
  return c.json(
    {
      ok: false,
      code: "UNAUTHORIZED" as const,
      message: error?.message ?? "Not authorized",
    },
    401
  );
}

export function forbiddenError(c: Context, error?: RequestError) {
  return c.json(
    {
      ok: false,
      code: "FORBIDDEN" as const,
      message: error?.message ?? "Forbidden",
    },
    403
  );
}

export function notFoundError(c: Context, message: string) {
  return c.json(
    {
      ok: false,
      code: "NOT_FOUND" as const,
      message,
    },
    404
  );
}

export function requestTimeoutError(c: Context) {
  return c.json(
    {
      ok: false,
      code: "REQUEST_TIMEOUT" as const,
      message: "Request timed out",
    },
    408
  );
}

export function conflictError(c: Context, error: { message: string }) {
  return c.json(
    {
      ok: false,
      code: "CONFLICT" as const,
      message: error.message,
    },
    409
  );
}

export function contentTooLargeError(c: Context) {
  return c.json(
    {
      ok: false,
      code: "CONTENT_TOO_LARGE" as const,
      message: "Content too large",
    },
    413
  );
}

export function tooManyRequestsError(c: Context) {
  return c.json(
    {
      ok: false,
      code: "TOO_MANY_REQUESTS" as const,
      message: "Too many requests, please try again later",
    },
    429
  );
}

export function internalServerError(c: Context, error?: RequestError) {
  return c.json(
    {
      ok: false,
      code: "INTERNAL_SERVER_ERROR" as const,
      message: error?.message ?? "Something went wrong",
    },
    500
  );
}
