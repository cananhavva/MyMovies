import type { AppError, ErrorCode } from './AppError';

export type ErrorAction =
  | 'retry'
  | 'manual'
  | 'open_settings'
  | 'ask_again'
  | 'pick_gallery'
  | 'take_photo'
  | 'add_screenshot'
  | 'paste_info'
  | 'label_photo'
  | 'type_composition'
  | 'skip'
  | 'add_anyway'
  | 'open_existing'
  | 'add_item'
  | 'restart';

const LINK_ALTERNATIVES: readonly ErrorAction[] = ['add_screenshot', 'paste_info', 'manual'];

const ACTIONS: Readonly<Record<ErrorCode, readonly ErrorAction[]>> = {
  NETWORK_OFFLINE: ['manual', 'retry'],
  AI_TIMEOUT: ['retry', 'manual'],
  AI_INVALID_RESPONSE: ['retry', 'manual'],
  AI_RATE_LIMITED: ['manual'],
  AI_OVERLOADED: ['retry', 'manual'],
  SERVER_5XX: ['retry', 'manual'],
  AI_AUTH: ['manual'],
  AI_LOW_CONFIDENCE: [],
  AI_NOT_GARMENT: ['take_photo', 'manual'],
  LINK_INVALID: [],
  LINK_FETCH_BLOCKED: LINK_ALTERNATIVES,
  LINK_NOT_FOUND: LINK_ALTERNATIVES,
  LINK_TIMEOUT: ['retry', ...LINK_ALTERNATIVES],
  NO_MATERIAL_INFO: ['label_photo', 'type_composition', 'skip'],
  COMPOSITION_PARSE_FAILED: [],
  IMAGE_TOO_LARGE: [],
  IMAGE_UNSUPPORTED: ['pick_gallery'],
  PERMISSION_CAMERA_DENIED: ['open_settings', 'pick_gallery'],
  PERMISSION_GALLERY_DENIED: ['open_settings', 'take_photo'],
  PLATFORM_UNSUPPORTED: ['add_screenshot'],
  PLATFORM_RESTRICTED: ['add_screenshot'],
  INSPIRATION_NO_OUTFIT: ['add_screenshot'],
  EMPTY_WARDROBE: ['add_item'],
  NO_INSPIRATION: [],
  DB_ERROR: ['retry'],
  DUPLICATE_GARMENT: ['add_anyway', 'open_existing'],
  USER_CANCELLED: [],
  UNKNOWN: ['restart'],
};

/** Codes that never show a message (the user caused them). */
const SILENT_CODES: ReadonlySet<ErrorCode> = new Set<ErrorCode>(['USER_CANCELLED']);

export function errorMessageKey(error: AppError, options: { byokMode?: boolean } = {}): string {
  if (error.code === 'AI_AUTH') return options.byokMode ? 'errors.AI_AUTH_BYOK' : 'errors.AI_AUTH';
  return `errors.${error.code}`;
}

export function errorActions(error: AppError): readonly ErrorAction[] {
  if (error.code === 'PERMISSION_CAMERA_DENIED' && error.canAskAgain) return ['ask_again', 'pick_gallery'];
  if (error.code === 'PERMISSION_GALLERY_DENIED' && error.canAskAgain) return ['ask_again', 'take_photo'];
  return ACTIONS[error.code];
}

export function isSilentError(error: AppError): boolean {
  return SILENT_CODES.has(error.code);
}
