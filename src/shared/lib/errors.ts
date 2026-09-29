export type AppErrorCode =
  | 'UNSUPPORTED_FORMAT'
  | 'CORRUPT'
  | 'TOO_LARGE'
  | 'TOO_MANY_PIXELS'
  | 'SANITIZE_FAILED'
  | 'VALIDATION_FAILED'
  | 'CANCELLED'
  | 'UNKNOWN';

/** An error whose message is safe to show to users (no stack traces, no metadata values). */
export class AppError extends Error {
  readonly code: AppErrorCode;
  constructor(code: AppErrorCode, message: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
  }
}

export interface SerializedError {
  code: AppErrorCode;
  message: string;
}

export function serializeError(err: unknown): SerializedError {
  if (err instanceof AppError) return { code: err.code, message: err.message };
  if (err instanceof RangeError || (err instanceof Error && /memory|allocation/i.test(err.message)))
    return { code: 'TOO_LARGE', message: 'The browser ran out of memory while processing this image.' };
  return {
    code: 'UNKNOWN',
    message: "We couldn't process this image. The file may be corrupted or use a format that isn't currently supported.",
  };
}
