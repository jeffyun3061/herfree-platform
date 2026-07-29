import { describe, expect, it } from 'vitest';
import { safeInternalReturnPath } from '@/domain/auth/returnPath';

describe('safeInternalReturnPath', () => {
  it('keeps normal internal paths and query strings', () => {
    expect(safeInternalReturnPath('/journal?tab=records')).toBe('/journal?tab=records');
  });

  it.each(['//evil.example', '/\\evil.example', 'https://evil.example', '/journal\n/evil'])(
    'rejects unsafe redirect value %s',
    (value) => {
      expect(safeInternalReturnPath(value, '/journal')).toBe('/journal');
    },
  );

  it('prevents auth redirect loops', () => {
    expect(safeInternalReturnPath('/login?from=/journal')).toBe('/');
  });
});
