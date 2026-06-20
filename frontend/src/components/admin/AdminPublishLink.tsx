'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { isAdmin } from '@/domain/user/types';

type AdminPublishLinkProps = {
  tab: 'contents' | 'videos';
  label: string;
};

export function AdminPublishLink({ tab, label }: AdminPublishLinkProps) {
  const { user } = useAuth();

  if (!isAdmin(user?.role)) return null;

  return (
    <Link
      href={`/admin?tab=${tab}`}
      className="inline-flex items-center rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/10"
    >
      {label}
    </Link>
  );
}
