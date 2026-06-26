'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { TopBar } from '@/components/layout/TopBar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Button } from '@/components/ui/Button';
import { AdminModerationSection } from '@/components/admin/AdminModerationSection';
import { AdminReportsSection } from '@/components/admin/AdminReportsSection';
import { AdminContentsSection } from '@/components/admin/AdminContentsSection';
import { AdminNoticesSection } from '@/components/admin/AdminNoticesSection';
import { AdminVideosSection } from '@/components/admin/AdminVideosSection';
import { AdminProductsSection } from '@/components/admin/AdminProductsSection';
import { AdminJournalStatsSection } from '@/components/admin/AdminJournalStatsSection';
import { AdminUsersSection } from '@/components/admin/AdminUsersSection';
import { FEATURE_PRODUCTS_ENABLED } from '@/domain/featureFlags';
import { isAdmin, isStaff, isSuperAdmin, canWriteContent, USER_ROLE_LABELS, type UserRole } from '@/domain/user/types';
import { cn } from '@/lib/cn';

type AdminTab = 'reports' | 'moderation' | 'users' | 'notices' | 'contents' | 'videos' | 'products' | 'journal';

const ALL_TABS: { id: AdminTab; label: string; minRole: 'moderator' | 'admin' | 'super' }[] = [
  { id: 'reports', label: '신고', minRole: 'moderator' },
  { id: 'moderation', label: '숨김 관리', minRole: 'moderator' },
  { id: 'journal', label: '일지 통계', minRole: 'admin' },
  { id: 'notices', label: '공지 올리기', minRole: 'admin' },
  { id: 'contents', label: '칼럼 올리기', minRole: 'moderator' },
  { id: 'videos', label: '영상 등록', minRole: 'admin' },
  { id: 'products', label: '제품', minRole: 'admin' },
  { id: 'users', label: '회원', minRole: 'admin' },
];

function canSeeTab(
  tab: (typeof ALL_TABS)[number],
  role: UserRole | undefined | null,
): boolean {
  if (tab.id === 'contents') return canWriteContent(role);
  if (!isStaff(role)) return false;
  if (tab.minRole === 'moderator') return isStaff(role);
  if (tab.minRole === 'admin') return isAdmin(role);
  return isSuperAdmin(role);
}

export default function AdminPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AdminPageContent />
    </Suspense>
  );
}

function AdminPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isReady, isLoggedIn, user } = useAuth();
  const tabs = useMemo(
    () =>
      ALL_TABS.filter((tab) => {
        if (tab.id === 'products' && !FEATURE_PRODUCTS_ENABLED) return false;
        return canSeeTab(tab, user?.role);
      }),
    [user?.role],
  );
  const [tab, setTab] = useState<AdminTab>('reports');

  useEffect(() => {
    const fromQuery = searchParams.get('tab');
    if (
      fromQuery &&
      ALL_TABS.some((item) => item.id === fromQuery) &&
      canSeeTab(ALL_TABS.find((item) => item.id === fromQuery)!, user?.role)
    ) {
      setTab(fromQuery as AdminTab);
    }
  }, [searchParams, user?.role]);

  useEffect(() => {
    if (isReady && !isLoggedIn) {
      router.replace('/login?from=%2Fadmin');
    }
  }, [isReady, isLoggedIn, router]);

  useEffect(() => {
    if (tabs.length > 0 && !tabs.some((item) => item.id === tab)) {
      setTab(tabs[0].id);
    }
  }, [tabs, tab]);

  if (!isReady) return <LoadingSpinner />;

  if (!isLoggedIn) return null;

  if (!isStaff(user?.role) && !canWriteContent(user?.role)) {
    return (
      <>
        <TopBar title="운영 관리" showBack />
        <div className="px-4 py-6">
          <ErrorMessage message="운영 권한이 있는 계정만 접근할 수 있습니다." />
          <Button className="mt-4" onClick={() => router.replace('/')}>
            홈으로
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title="운영 관리" showBack />
      <div className="px-4 py-4">
        <p className="mb-3 text-xs text-muted">
          현재 권한: {user?.role ? USER_ROLE_LABELS[user.role] : '—'}
          {isSuperAdmin(user?.role) && ' · 권한 부여/회수 가능'}
        </p>

        <div className="scrollbar-hide -mx-1 mb-4 flex gap-2 overflow-x-auto px-1">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                'shrink-0 rounded-full px-4 py-2 text-sm',
                tab === item.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-cream-dark text-muted',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === 'reports' && <AdminReportsSection />}
        {tab === 'moderation' && <AdminModerationSection />}
        {tab === 'journal' && <AdminJournalStatsSection />}
        {tab === 'notices' && <AdminNoticesSection />}
        {tab === 'contents' && <AdminContentsSection />}
        {tab === 'videos' && <AdminVideosSection />}
        {FEATURE_PRODUCTS_ENABLED && tab === 'products' && <AdminProductsSection />}
        {tab === 'users' && <AdminUsersSection />}
      </div>
    </>
  );
}
