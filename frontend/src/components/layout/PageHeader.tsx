'use client';

import { useEffect } from 'react';
import { usePageHeaderContext, type PageHeaderState } from '@/contexts/PageHeaderContext';

type PageHeaderProps = PageHeaderState & {
  /** 모바일: 상단 MobileHeader에만 표시. 데스크톱 TopBar 없음 (탭 페이지용) */
  mobileOnly?: boolean;
  rightSlot?: React.ReactNode;
  className?: string;
};

/**
 * 모바일 제목·뒤로가기는 AppShell MobileHeader 한 줄에 표시.
 * 하위 페이지는 데스크톱에서만 TopBar를 렌더합니다.
 */
export function PageHeader({
  title,
  showBack = false,
  backHref,
  mobileOnly = false,
  rightSlot,
  className,
}: PageHeaderProps) {
  const setHeader = usePageHeaderContext()?.setHeader;

  useEffect(() => {
    if (!setHeader) return undefined;
    setHeader({ title, showBack, backHref, rightSlot, desktopVisible: !mobileOnly });
    return () => setHeader(null);
  }, [title, showBack, backHref, rightSlot, mobileOnly, setHeader]);

  // Header markup is owned by AppHeader. Keeping this component declarative
  // avoids a desktop TopBar plus a mobile shell header being rendered together.
  void mobileOnly;
  void className;
  return null;
}
