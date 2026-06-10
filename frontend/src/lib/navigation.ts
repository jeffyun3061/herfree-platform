export const NAV_ITEMS = [
  { href: '/', label: '홈', icon: 'home' as const },
  { href: '/community', label: '커뮤니티', icon: 'community' as const },
  { href: '/lounge', label: '평온라운지', icon: 'lounge' as const },
  { href: '/routine', label: '루틴', icon: 'routine' as const },
  { href: '/mypage', label: '마이', icon: 'mypage' as const },
] as const;

export const HIDE_NAV_PATHS = ['/login', '/signup', '/community/write', '/admin'] as const;

export function shouldShowBottomNav(pathname: string): boolean {
  if (HIDE_NAV_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return false;
  }
  return true;
}
