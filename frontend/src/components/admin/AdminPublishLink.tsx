'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { canWriteContent, isAdmin } from '@/domain/user/types';
import { CommunityFab } from '@/components/community/CommunityFab';

type AdminPublishProps = {
  tab: 'contents' | 'videos' | 'notices';
  label: string;
};

function canPublishTab(tab: AdminPublishProps['tab'], role: Parameters<typeof canWriteContent>[0]): boolean {
  if (tab === 'contents') return canWriteContent(role);
  return isAdmin(role);
}

export function AdminPublishLink({ tab, label }: AdminPublishProps) {
  const { user } = useAuth();

  if (!canPublishTab(tab, user?.role)) return null;

  return (
    <Link
      href={`/admin?tab=${tab}`}
      className="inline-flex items-center rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/10"
    >
      {label}
    </Link>
  );
}

/** 모바일: 커뮤니티 글쓰기 FAB와 동일 위치 */
export function AdminPublishFab({ tab, label }: AdminPublishProps) {
  const { user } = useAuth();

  if (!canPublishTab(tab, user?.role)) return null;

  return <CommunityFab href={`/admin?tab=${tab}`} ariaLabel={label} />;
}
