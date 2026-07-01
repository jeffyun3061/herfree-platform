import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

const NAV_STACK_KEY = 'herpfree_nav_stack';

function readStack(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(NAV_STACK_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeStack(stack: string[]) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(NAV_STACK_KEY, JSON.stringify(stack.slice(-40)));
}

function resolveReturnUrl(from: string | null): string {
  if (!from || !from.startsWith('/') || from.startsWith('//')) return '/';
  if (from.startsWith('/login') || from.startsWith('/signup')) return '/';
  return from;
}

/** 브라우저 히스토리 없을 때 이동할 맥락별 부모 경로 */
export function resolveContextualBackTarget(pathname: string, search = ''): string {
  const params = new URLSearchParams(search.replace(/^\?/, ''));

  if (pathname === '/login' || pathname === '/signup') {
    return resolveReturnUrl(params.get('from'));
  }
  if (pathname === '/forgot-password' || pathname === '/reset-password') {
    return '/login';
  }

  if (pathname.startsWith('/community/posts/')) {
    return '/community';
  }
  if (pathname === '/community/write') {
    const boardId = params.get('boardId');
    if (boardId && /^\d+$/.test(boardId)) return `/community/${boardId}`;
    return '/community';
  }
  if (pathname === '/community/search') {
    return '/community';
  }
  if (/^\/community\/\d+$/.test(pathname)) {
    return '/community';
  }

  if (pathname.startsWith('/contents/')) {
    return '/contents';
  }
  if (pathname.startsWith('/videos/')) {
    return '/videos';
  }

  if (pathname === '/consult/write') {
    return '/consult';
  }
  if (pathname === '/consult') {
    return '/mypage';
  }
  if (pathname === '/inquiry/write' || pathname === '/inquiry') {
    return '/mypage';
  }

  if (pathname === '/terms' || pathname === '/privacy') {
    return '/mypage';
  }

  if (pathname.startsWith('/admin')) {
    return '/';
  }

  const tabRoots = ['/community', '/journal', '/qna', '/mypage', '/contents', '/videos'];
  if (tabRoots.includes(pathname)) {
    return '/';
  }

  return '/';
}

export function canNavigateBackInApp(): boolean {
  return readStack().length > 1;
}

export function syncNavigationStack(pathname: string) {
  const stack = readStack();
  if (stack.length === 0) {
    writeStack([pathname]);
    return;
  }

  const last = stack[stack.length - 1];
  const prev = stack[stack.length - 2];

  if (pathname === prev) {
    writeStack(stack.slice(0, -1));
    return;
  }

  if (pathname !== last) {
    writeStack([...stack, pathname]);
  }
}

function resetStack(pathname: string) {
  writeStack([pathname]);
}

type NavigateBackOptions = {
  pathname?: string;
  search?: string;
  backHref?: string;
  fallbackHref?: string;
};

export function navigateBack(
  router: AppRouterInstance,
  { pathname, search, backHref, fallbackHref }: NavigateBackOptions = {},
) {
  const currentPath =
    pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '/');
  const currentSearch =
    search ?? (typeof window !== 'undefined' ? window.location.search : '');
  const fallback = fallbackHref ?? resolveContextualBackTarget(currentPath, currentSearch);

  if (backHref) {
    router.push(backHref);
    return;
  }

  if (fallback !== '/' && currentPath !== fallback) {
    router.push(fallback);
    return;
  }

  if (canNavigateBackInApp()) {
    router.back();
    return;
  }

  router.push(fallback);
}

export function installBackNavigationGuard(
  pathname: string,
  router: AppRouterInstance,
): () => void {
  if (typeof window === 'undefined') return () => undefined;

  syncNavigationStack(pathname);

  const fallbackForPage = resolveContextualBackTarget(pathname, window.location.search);
  const needsGuard = !canNavigateBackInApp() && pathname !== fallbackForPage;

  if (needsGuard) {
    const state = window.history.state as { herpfreeBackGuard?: boolean } | null;
    if (!state?.herpfreeBackGuard) {
      window.history.pushState({ herpfreeBackGuard: true }, '', window.location.href);
    }
  }

  const onPopState = (event: PopStateEvent) => {
    const state = event.state as { herpfreeBackGuard?: boolean } | null;

    if (state?.herpfreeBackGuard || !canNavigateBackInApp()) {
      resetStack(fallbackForPage);
      router.replace(fallbackForPage);
    }
  };

  window.addEventListener('popstate', onPopState);
  return () => window.removeEventListener('popstate', onPopState);
}
