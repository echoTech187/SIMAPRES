/**
 * SIMAPRES 110 - STANDAR ENTERPRISE TYPE SAFETY: SERVER ACTION RESULT
 * Lapisan: Types / Cross-cutting
 * 
 * Discriminated union result type for type-safe Client <-> Server Action RPC.
 * Guarantees that if `success === true`, `data` is guaranteed to exist.
 * If `success === false`, `error` message is guaranteed to exist.
 */

export interface ActionSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ActionFailure {
  success: false;
  error: string;
  code?: string;
}

export type ActionResult<T = void> = ActionSuccess<T> | ActionFailure;

/**
 * Safely extracts error message from any caught exception (Error, string, or unknown)
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'Terjadi kesalahan sistem internal. Silakan coba beberapa saat lagi.';
}

export function actionSuccess<T>(data: T, message?: string): ActionSuccess<T> {
  return {
    success: true,
    data,
    ...(message ? { message } : {}),
  };
}

export function actionFailure(error: unknown, code?: string): ActionFailure {
  return {
    success: false,
    error: getErrorMessage(error),
    ...(code ? { code } : {}),
  };
}
