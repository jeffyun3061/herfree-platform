export const NAV_ITEMS = [
  { href: '/', label: '홈', icon: '🏠' },
  { href: '/community', label: '커뮤니티', icon: '💬' },
  { href: '/lounge', label: '평온라운지', icon: '🌿' },
  { href: '/routine', label: '루틴', icon: '✨' },
  { href: '/mypage', label: '마이', icon: '👤' },
] as const;

// 바텀 네비가 없는 화면 — 로그인·글쓰기 등 집중형 플로우
export const HIDE_NAV_PATHS = ['/login', '/signup', '/community/write', '/admin'] as const;

export function shouldShowBottomNav(pathname: string): boolean {
  if (HIDE_NAV_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return false;
  }
  return true;
}
