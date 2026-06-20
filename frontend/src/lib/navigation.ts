export const NAV_ITEMS = [
  { href: '/', label: '홈', icon: 'home' as const },
  { href: '/community', label: '커뮤니티', icon: 'community' as const },
  { href: '/contents', label: '정보', icon: 'info' as const },
  { href: '/videos', label: '영상', icon: 'video' as const },
  { href: '/mypage', label: '마이페이지', icon: 'mypage' as const },
] as const;

export const DESKTOP_NAV_ITEMS = [
  { href: '/', label: '홈' },
  { href: '/community', label: '커뮤니티' },
  { href: '/contents', label: '정보' },
  { href: '/journal', label: '개인일지' },
  { href: '/videos', label: '영상' },
] as const;

export const HIDE_NAV_PATHS = ['/login', '/signup', '/community/write', '/admin'] as const;

export const HIDE_SHELL_HEADER_PATHS = ['/login', '/signup', '/admin', '/community/write', '/forgot-password'] as const;

export function shouldShowBottomNav(pathname: string): boolean {
  if (HIDE_NAV_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return false;
  }
  return true;
}

export function shouldShowShellHeader(pathname: string): boolean {
  if (HIDE_SHELL_HEADER_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return false;
  }
  return true;
}
