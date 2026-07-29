import { describe, expect, it } from 'vitest';
import {
  IMAGE_BODY_LIMIT,
  JSON_BODY_LIMIT,
  hasValidCsrfToken,
  hasValidOrigin,
  requestBodyLimit,
} from '@/lib/bff/security';

describe('BFF security policy', () => {
  it('accepts only the exact same origin', () => {
    expect(hasValidOrigin('https://herfree.example', 'https://herfree.example')).toBe(true);
    expect(hasValidOrigin('https://evil.example', 'https://herfree.example')).toBe(false);
    expect(hasValidOrigin(null, 'https://herfree.example')).toBe(false);
  });

  it('requires matching double-submit CSRF values', () => {
    expect(hasValidCsrfToken('secret', 'secret')).toBe(true);
    expect(hasValidCsrfToken('secret', 'other')).toBe(false);
  });

  it('uses a narrow upload exception and a one MiB default', () => {
    expect(requestBodyLimit('posts/images/upload', 'multipart/form-data; boundary=x'))
      .toBe(IMAGE_BODY_LIMIT);
    expect(requestBodyLimit('journal/records', 'application/json')).toBe(JSON_BODY_LIMIT);
  });
});
