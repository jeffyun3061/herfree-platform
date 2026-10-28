import { describe, expect, it } from 'vitest';
import { shouldShowBottomNav } from './navigation';

describe('community bottom navigation', () => {
  it.each(['/community/write', '/community/write/123', '/community/posts/11'])(
    'does not cover the reading or writing screen %s',
    (pathname) => expect(shouldShowBottomNav(pathname)).toBe(false),
  );
  it.each(['/', '/community', '/community/7', '/journal', '/mypage'])(
    'keeps navigation available at %s',
    (pathname) => expect(shouldShowBottomNav(pathname)).toBe(true),
  );
});
