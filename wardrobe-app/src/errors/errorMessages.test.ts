import en from '@/i18n/en.json';
import tr from '@/i18n/tr.json';
import { appError, ERROR_CODES, isAppError, type ErrorCode } from './AppError';
import { errorActions, errorMessageKey, isSilentError } from './errorMessages';
import { toAppError } from './toAppError';

type Tree = { [key: string]: string | Tree };
const lookup = (tree: Tree, key: string): unknown =>
  key.split('.').reduce<unknown>((node, part) => (node && typeof node === 'object' ? (node as Tree)[part] : undefined), tree);

describe('errorMessageKey', () => {
  const shown = ERROR_CODES.filter((code) => !isSilentError(appError(code)));
  it.each(shown.map((code) => [code]))('%s resolves to a non-empty message in TR and EN', (code) => {
    for (const byokMode of [false, true]) {
      const key = errorMessageKey(appError(code), { byokMode });
      for (const messages of [en, tr] as Tree[]) {
        const message = lookup(messages, key);
        expect(typeof message).toBe('string');
        expect((message as string).trim()).not.toBe('');
      }
    }
  });

  it('shows the generic AUTH message in production and the key hint only in BYOK mode', () => {
    expect(errorMessageKey(appError('AI_AUTH'))).toBe('errors.AI_AUTH');
    expect(errorMessageKey(appError('AI_AUTH'), { byokMode: true })).toBe('errors.AI_AUTH_BYOK');
    expect(lookup(en as Tree, 'errors.AI_AUTH')).not.toMatch(/key/i);
  });
});

describe('errorActions (PLAN §4 table)', () => {
  it.each`
    code                          | actions
    ${'NETWORK_OFFLINE'}          | ${['manual', 'retry']}
    ${'AI_TIMEOUT'}               | ${['retry', 'manual']}
    ${'AI_OVERLOADED'}            | ${['retry', 'manual']}
    ${'SERVER_5XX'}               | ${['retry', 'manual']}
    ${'LINK_FETCH_BLOCKED'}       | ${['add_screenshot', 'paste_info', 'manual']}
    ${'LINK_NOT_FOUND'}           | ${['add_screenshot', 'paste_info', 'manual']}
    ${'LINK_TIMEOUT'}             | ${['retry', 'add_screenshot', 'paste_info', 'manual']}
    ${'NO_MATERIAL_INFO'}         | ${['label_photo', 'type_composition', 'skip']}
    ${'PERMISSION_CAMERA_DENIED'} | ${['open_settings', 'pick_gallery']}
    ${'PERMISSION_GALLERY_DENIED'} | ${['open_settings', 'take_photo']}
    ${'PLATFORM_RESTRICTED'}      | ${['add_screenshot']}
    ${'PLATFORM_UNSUPPORTED'}     | ${['add_screenshot']}
    ${'EMPTY_WARDROBE'}           | ${['add_item']}
    ${'DUPLICATE_GARMENT'}        | ${['add_anyway', 'open_existing']}
    ${'UNKNOWN'}                  | ${['restart']}
  `('$code → $actions', ({ code, actions }: { code: ErrorCode; actions: string[] }) => {
    expect(errorActions(appError(code))).toEqual(actions);
  });

  it('offers "ask again" on a first permission denial', () => {
    expect(errorActions(appError('PERMISSION_CAMERA_DENIED', { canAskAgain: true }))).toEqual(['ask_again', 'pick_gallery']);
    expect(errorActions(appError('PERMISSION_GALLERY_DENIED', { canAskAgain: true }))).toEqual(['ask_again', 'take_photo']);
  });

  it('always leaves a way to continue manually when AI fails', () => {
    const aiCodes: ErrorCode[] = ['NETWORK_OFFLINE', 'AI_TIMEOUT', 'AI_INVALID_RESPONSE', 'AI_RATE_LIMITED', 'AI_OVERLOADED', 'SERVER_5XX', 'AI_AUTH', 'AI_NOT_GARMENT'];
    for (const code of aiCodes) expect(errorActions(appError(code))).toContain('manual');
  });

  it('only silences user cancellation', () => {
    expect(ERROR_CODES.filter((code) => isSilentError(appError(code)))).toEqual(['USER_CANCELLED']);
  });
});

describe('appError / isAppError', () => {
  it('marks only transient codes retryable', () => {
    const retryable = ERROR_CODES.filter((code) => appError(code).retryable).sort();
    expect(retryable).toEqual(['AI_OVERLOADED', 'AI_RATE_LIMITED', 'AI_TIMEOUT', 'DB_ERROR', 'LINK_TIMEOUT', 'NETWORK_OFFLINE', 'SERVER_5XX']);
  });

  it('recognises only known codes', () => {
    expect(isAppError({ code: 'AI_TIMEOUT' })).toBe(true);
    expect(isAppError({ code: 'NOPE' })).toBe(false);
    expect(isAppError(null)).toBe(false);
    expect(isAppError('AI_TIMEOUT')).toBe(false);
  });
});

describe('toAppError', () => {
  const abortError = () => Object.assign(new Error('aborted'), { name: 'AbortError' });

  it('maps fetch TypeErrors to NETWORK_OFFLINE', () => {
    expect(toAppError(new TypeError('Network request failed')).code).toBe('NETWORK_OFFLINE');
  });

  it('maps a user abort to USER_CANCELLED and our own timeout to the given code', () => {
    expect(toAppError(abortError()).code).toBe('USER_CANCELLED');
    expect(toAppError(abortError(), { timedOut: true }).code).toBe('AI_TIMEOUT');
    expect(toAppError(abortError(), { timedOut: true, timeoutCode: 'LINK_TIMEOUT' }).code).toBe('LINK_TIMEOUT');
  });

  it('passes AppErrors through and wraps everything else as UNKNOWN', () => {
    const original = appError('DB_ERROR');
    expect(toAppError(original)).toBe(original);
    expect(toAppError(new Error('boom'))).toMatchObject({ code: 'UNKNOWN', retryable: false });
    expect(toAppError('string thrown').code).toBe('UNKNOWN');
  });
});
