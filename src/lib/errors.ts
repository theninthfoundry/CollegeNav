import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "validation_failed"
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rule_violation"
  | "rate_limited"
  | "internal";

export class ApiError extends Error {
  public readonly code: ApiErrorCode;
  public readonly status: number;
  public readonly details?: unknown;

  constructor(code: ApiErrorCode, message: string, status: number = 400, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
      },
      { status: error.status }
    );
  }

  // Handle standard errors
  const message = error instanceof Error ? error.message : "Internal server error";
  console.error("Unhandled API Error:", error);

  return NextResponse.json(
    {
      error: {
        code: "internal" as ApiErrorCode,
        message,
      },
    },
    { status: 500 }
  );
}
