'use client';

import { useEffect } from 'react';
import { usePageHeaderContext, type PageHeaderState } from '@/contexts/PageHeaderContext';
import { TopBar } from '@/components/layout/TopBar';

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
  const ctx = usePageHeaderContext();

  useEffect(() => {
    if (!ctx) return undefined;
    ctx.setHeader({ title, showBack, backHref });
    return () => ctx.setHeader(null);
  }, [title, showBack, backHref, ctx]);

  if (mobileOnly) return null;

  return (
    <TopBar
      title={title}
      showBack={showBack}
      backHref={backHref}
      rightSlot={rightSlot}
      className={className ?? 'hidden lg:flex'}
    />
  );
}
