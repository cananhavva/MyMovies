import { appError, isAppError, type AppError } from './AppError';

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

/** fetch() rejects with a TypeError when the network is unreachable (RN, browsers and Deno alike). */
function isNetworkFailure(error: unknown): boolean {
  return error instanceof TypeError;
}

/**
 * Converts anything thrown into an AppError. `timedOut` distinguishes our own timeout abort from a
 * user-initiated cancel, since both surface as AbortError.
 */
export function toAppError(error: unknown, options: { timedOut?: boolean; timeoutCode?: AppError['code'] } = {}): AppError {
  if (isAppError(error)) return error;
  if (isAbortError(error)) {
    return options.timedOut ? appError(options.timeoutCode ?? 'AI_TIMEOUT', { cause: error }) : appError('USER_CANCELLED');
  }
  if (isNetworkFailure(error)) return appError('NETWORK_OFFLINE', { cause: error });
  return appError('UNKNOWN', { cause: error });
}
