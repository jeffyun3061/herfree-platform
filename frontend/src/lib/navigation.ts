export const NAV_ITEMS = [
  { href: '/', label: '홈' },
  { href: '/community', label: '커뮤니티' },
  { href: '/journal', label: '개인일지' },
  { href: '/qna', label: 'FAQ' },
  { href: '/mypage', label: '마이페이지' },
] as const;

export const DESKTOP_NAV_ITEMS = [
  { href: '/', label: '홈' },
  { href: '/community', label: '커뮤니티' },
  { href: '/contents', label: '칼럼' },
  { href: '/journal', label: '개인일지' },
  { href: '/videos', label: '영상' },
] as const;

export const HIDE_NAV_PATHS = ['/login', '/signup', '/admin'] as const;

export const HIDE_SHELL_HEADER_PATHS = [
  '/login',
  '/signup',
  '/admin',
  '/community/write',
  '/community/search',
  '/inquiry/write',
  '/consult',
  '/consult/write',
  '/forgot-password',
  '/mypage',
] as const;

const HIDE_SHELL_HEADER_EXACT_PATHS = [
  '/',
  '/community',
  '/contents',
  '/videos',
  '/journal',
  '/qna',
  '/mypage',
] as const;

export function shouldShowBottomNav(pathname: string): boolean {
  if (HIDE_NAV_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return false;
  }
  if (pathname === '/community/search') {
    return false;
  }
  return true;
}

export function shouldShowShellHeader(pathname: string): boolean {
  if (isCommunityListRoute(pathname)) {
    return false;
  }
  if (
    pathname.startsWith('/community/posts/') ||
    pathname.startsWith('/contents/') ||
    pathname.startsWith('/videos/')
  ) {
    return false;
  }
  if (HIDE_SHELL_HEADER_EXACT_PATHS.some((p) => pathname === p)) {
    return false;
  }
  if (HIDE_SHELL_HEADER_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return false;
  }
  return true;
}

export function isCommunityListRoute(pathname: string): boolean {
  if (pathname === '/community') return true;
  return /^\/community\/\d+$/.test(pathname);
}

const MOBILE_TAB_ROOT_TITLES: Record<string, string> = {
  '/contents': '칼럼',
  '/videos': '영상',
  '/mypage': '마이페이지',
  '/journal': '개인일지',
  '/qna': 'FAQ',
  '/inquiry': '운영 문의',
  '/inquiry/write': '문의하기',
  '/consult': '1:1 비밀상담',
  '/consult/write': '상담 글쓰기',
};

export function getMobileTabRootTitle(pathname: string): string | null {
  if (isCommunityListRoute(pathname)) {
    return '커뮤니티';
  }
  if (pathname.startsWith('/community/posts/') || pathname.startsWith('/community/write')) {
    return null;
  }
  return MOBILE_TAB_ROOT_TITLES[pathname] ?? null;
}
