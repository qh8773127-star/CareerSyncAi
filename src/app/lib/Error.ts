// lib/errors.ts

export type ErrorCode =
  | "UNAUTHORIZED"
  | "VALIDATION_ERROR"
  | "DUPLICATE_RECORD"
  | "RATE_LIMIT"
  | "INVALID_AI_OUTPUT"
  | "INTERNAL";

  
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public status: number = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; code: ErrorCode; error: string };
