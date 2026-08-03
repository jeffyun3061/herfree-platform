import { describe, expect, it } from 'vitest';
import {
  IMAGE_BODY_LIMIT,
  JSON_BODY_LIMIT,
  hasValidCsrfToken,
  hasValidOrigin,
  requestBodyLimit,
  resolveExternalOrigin,
  shouldAlwaysClearSession,
  shouldInvalidateSessionOnUnauthorized,
} from '@/lib/bff/security';

describe('BFF security policy', () => {
  it('accepts only the exact same origin', () => {
    expect(hasValidOrigin('https://herfree.example', 'https://herfree.example')).toBe(true);
    expect(hasValidOrigin('https://evil.example', 'https://herfree.example')).toBe(false);
    expect(hasValidOrigin(null, 'https://herfree.example')).toBe(false);
  });

  it('uses the external host instead of the server bind address', () => {
    expect(resolveExternalOrigin(
      'http://0.0.0.0:3000',
      'localhost:3000',
      null,
      false,
    )).toBe('http://localhost:3000');
    expect(resolveExternalOrigin(
      'http://127.0.0.1:3000',
      'develop.example.com',
      'https',
      true,
      'https://develop.example.com',
    )).toBe('https://develop.example.com');
    expect(resolveExternalOrigin(
      'http://127.0.0.1:3000',
      'attacker.example',
      'https',
      true,
      'https://develop.example.com',
    )).toBe('https://develop.example.com');
    expect(resolveExternalOrigin(
      'http://127.0.0.1:3000',
      'develop.example.com',
      'https',
      true,
    )).toBeNull();
    expect(resolveExternalOrigin(
      'http://127.0.0.1:3000',
      null,
      null,
      false,
    )).toBeNull();
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

  it('keeps credential-check failures but invalidates rejected API sessions', () => {
    expect(shouldInvalidateSessionOnUnauthorized('users/me')).toBe(true);
    expect(shouldInvalidateSessionOnUnauthorized('journal/records')).toBe(true);
    expect(shouldInvalidateSessionOnUnauthorized('users/me/password')).toBe(false);
    expect(shouldInvalidateSessionOnUnauthorized('auth/login')).toBe(false);
  });

  it('always clears the local session only for a real logout mutation', () => {
    expect(shouldAlwaysClearSession('auth/logout', 'POST')).toBe(true);
    expect(shouldAlwaysClearSession('auth/logout', 'GET')).toBe(false);
    expect(shouldAlwaysClearSession('users/me', 'DELETE')).toBe(false);
  });
});
