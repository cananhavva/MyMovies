import { aiErrorForStatus, linkErrorForStatus, parseRetryAfter } from './httpErrors';

describe('aiErrorForStatus', () => {
  it.each([
    [401, 'AI_AUTH'],
    [403, 'AI_AUTH'],
    [429, 'AI_RATE_LIMITED'],
    [529, 'AI_OVERLOADED'],
    [500, 'SERVER_5XX'],
    [503, 'SERVER_5XX'],
    [504, 'AI_TIMEOUT'],
    [400, 'UNKNOWN'],
  ])('%p → %p', (status, code) => {
    expect(aiErrorForStatus(status).code).toBe(code);
  });

  it('carries Retry-After for rate limits', () => {
    expect(aiErrorForStatus(429, '17').retryAfterSec).toBe(17);
  });
});

describe('linkErrorForStatus', () => {
  it.each([
    [404, 'LINK_NOT_FOUND'],
    [410, 'LINK_NOT_FOUND'],
    [403, 'LINK_FETCH_BLOCKED'],
    [429, 'LINK_FETCH_BLOCKED'],
  ])('%p → %p', (status, code) => {
    expect(linkErrorForStatus(status)?.code).toBe(code);
  });

  it('accepts 200', () => {
    expect(linkErrorForStatus(200)).toBeUndefined();
  });
});

describe('parseRetryAfter', () => {
  it('reads seconds and HTTP dates', () => {
    const now = new Date('2026-10-20T10:00:00Z');
    expect(parseRetryAfter('30', now)).toBe(30);
    expect(parseRetryAfter('Tue, 20 Oct 2026 10:01:00 GMT', now)).toBe(60);
    expect(parseRetryAfter(null)).toBeUndefined();
  });
});

describe('http error mapping – edge cases', () => {
  it.each([
    [408, 'AI_TIMEOUT'],
    [502, 'SERVER_5XX'],
    [404, 'UNKNOWN'],
  ])('AI %p → %p', (status, code) => {
    expect(aiErrorForStatus(status).code).toBe(code);
  });

  it('marks AI auth errors as not retryable and overload as retryable', () => {
    expect(aiErrorForStatus(401).retryable).toBe(false);
    expect(aiErrorForStatus(529).retryable).toBe(true);
  });

  it.each([
    [401, 'LINK_FETCH_BLOCKED'],
    [503, 'LINK_FETCH_BLOCKED'],
    [500, 'LINK_FETCH_BLOCKED'],
    [451, 'LINK_FETCH_BLOCKED'],
  ])('link %p → %p', (status, code) => {
    expect(linkErrorForStatus(status)?.code).toBe(code);
  });

  it.each([200, 204, 301, 304])('link %p is not an error', (status) => {
    expect(linkErrorForStatus(status)).toBeUndefined();
  });

  it('handles odd Retry-After values', () => {
    const now = new Date('2026-10-20T10:00:00Z');
    expect(parseRetryAfter('', now)).toBeUndefined();
    expect(parseRetryAfter('1.2', now)).toBe(2);
    expect(parseRetryAfter('-5', now)).toBe(0);
    expect(parseRetryAfter('Tue, 20 Oct 2026 09:00:00 GMT', now)).toBe(0);
    expect(parseRetryAfter('soon', now)).toBeUndefined();
    expect(aiErrorForStatus(429).retryAfterSec).toBeUndefined();
  });
});
