export const ERROR_CODES = [
  'NETWORK_OFFLINE',
  'AI_TIMEOUT',
  'AI_INVALID_RESPONSE',
  'AI_RATE_LIMITED',
  'AI_OVERLOADED',
  'SERVER_5XX',
  'AI_AUTH',
  'AI_LOW_CONFIDENCE',
  'AI_NOT_GARMENT',
  'LINK_INVALID',
  'LINK_FETCH_BLOCKED',
  'LINK_NOT_FOUND',
  'LINK_TIMEOUT',
  'NO_MATERIAL_INFO',
  'COMPOSITION_PARSE_FAILED',
  'IMAGE_TOO_LARGE',
  'IMAGE_UNSUPPORTED',
  'PERMISSION_CAMERA_DENIED',
  'PERMISSION_GALLERY_DENIED',
  'PLATFORM_UNSUPPORTED',
  'PLATFORM_RESTRICTED',
  'INSPIRATION_NO_OUTFIT',
  'EMPTY_WARDROBE',
  'NO_INSPIRATION',
  'DB_ERROR',
  'DUPLICATE_GARMENT',
  'USER_CANCELLED',
  'UNKNOWN',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export interface AppError {
  code: ErrorCode;
  retryable: boolean;
  /** Seconds to wait before retrying (AI_RATE_LIMITED). */
  retryAfterSec?: number;
  /** Whether the permission can still be requested again (PERMISSION_* codes). */
  canAskAgain?: boolean;
  cause?: unknown;
}

const RETRYABLE_CODES: ReadonlySet<ErrorCode> = new Set<ErrorCode>([
  'NETWORK_OFFLINE',
  'AI_TIMEOUT',
  'AI_RATE_LIMITED',
  'AI_OVERLOADED',
  'SERVER_5XX',
  'LINK_TIMEOUT',
  'DB_ERROR',
]);

export function appError(code: ErrorCode, extras: Omit<Partial<AppError>, 'code'> = {}): AppError {
  return { code, retryable: RETRYABLE_CODES.has(code), ...extras };
}

export function isAppError(value: unknown): value is AppError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    typeof value.code === 'string' &&
    (ERROR_CODES as readonly string[]).includes(value.code)
  );
}
