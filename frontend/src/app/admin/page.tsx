'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Button } from '@/components/ui/Button';
import { AdminDashboardSection } from '@/components/admin/AdminDashboardSection';
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

type AdminTab = 'dashboard' | 'reports' | 'moderation' | 'users' | 'notices' | 'contents' | 'videos' | 'products' | 'journal';

const ALL_TABS: { id: AdminTab; label: string; minRole: 'moderator' | 'admin' | 'super' }[] = [
  { id: 'dashboard', label: '대시보드', minRole: 'admin' },
  { id: 'reports', label: '신고', minRole: 'moderator' },
  { id: 'moderation', label: '숨김 관리', minRole: 'moderator' },
  { id: 'journal', label: '일지 통계', minRole: 'admin' },
  { id: 'notices', label: '공지 올리기', minRole: 'admin' },
  { id: 'contents', label: '칼럼 올리기', minRole: 'moderator' },
  { id: 'videos', label: '영상 등록', minRole: 'admin' },
  { id: 'products', label: '제품', minRole: 'admin' },
  { id: 'users', label: '회원', minRole: 'admin' },
];

const TAB_HELP_TEXT: Record<AdminTab, string> = {
  dashboard: '오늘 확인할 지표',
  reports: '신고 접수 확인',
  moderation: '숨김 콘텐츠 복구',
  users: '회원 상태 관리',
  notices: '공지 등록',
  contents: '칼럼 관리',
  videos: '영상 관리',
  products: '제품 관리',
  journal: '기록 사용 흐름',
};

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
  const [tab, setTab] = useState<AdminTab>('dashboard');

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

  const roleLabel = user?.role ? USER_ROLE_LABELS[user.role] : '권한 확인 중';

  if (!isStaff(user?.role) && !canWriteContent(user?.role)) {
    return (
      <main className="min-h-screen bg-[#F3EDE3] px-4 py-6">
        <section className="mx-auto max-w-[720px] rounded-[26px] border border-[#E8DDCC] bg-[#FBF7EF] p-5 shadow-[0_18px_45px_-34px_rgba(26,31,27,.45)]">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#123D37] shadow-[0_10px_24px_-20px_rgba(18,61,55,.65)]"
            aria-label="뒤로 가기"
          >
            <span className="text-xl leading-none">‹</span>
          </button>
          <p className="text-[12px] font-semibold text-[#79817C]">현재 권한: {roleLabel}</p>
          <h1 className="hf-display mt-2 text-[28px] font-extrabold text-[#111816]">운영 권한이 필요합니다</h1>
          <div className="mt-5">
            <ErrorMessage message="운영 권한이 있는 계정만 접근할 수 있습니다." />
          </div>
          <Button className="mt-4" onClick={() => router.replace('/')}>
            홈으로
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F3EDE3] pb-10 text-[#121816]">
      <section className="relative overflow-hidden bg-[#07251F] px-4 pb-7 pt-4 text-white shadow-[0_22px_60px_-36px_rgba(7,37,31,.7)]">
        <div className="mx-auto max-w-[980px]">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/16"
              aria-label="뒤로 가기"
            >
              <span className="text-xl leading-none">‹</span>
            </button>
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-white/80">
              {roleLabel}
            </span>
          </div>

          <div className="mt-6 max-w-[680px]">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#D8C691]/70">Herfree Admin</p>
            <h1 className="hf-display mt-2 text-[29px] font-extrabold leading-[1.12] sm:text-[38px]">
              운영 관리
            </h1>
            <p className="mt-3 max-w-[560px] text-[14px] leading-[1.75] text-white/72">
              신고, 콘텐츠, 회원 상태와 개인정보에 민감한 운영 지표를 한 흐름에서 확인합니다.
            </p>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="min-w-0 rounded-[16px] bg-white/8 p-2.5 sm:p-3">
              <p className="truncate text-[10px] text-white/52 sm:text-[11px]">사용 가능 메뉴</p>
              <p className="mt-1 text-[18px] font-extrabold sm:text-[22px]">{tabs.length}</p>
            </div>
            <div className="min-w-0 rounded-[16px] bg-white/8 p-2.5 sm:p-3">
              <p className="truncate text-[10px] text-white/52 sm:text-[11px]">현재 화면</p>
              <p className="mt-1 truncate text-[13px] font-extrabold sm:text-[16px]">{ALL_TABS.find((item) => item.id === tab)?.label}</p>
            </div>
            <div className="min-w-0 rounded-[16px] bg-white/8 p-2.5 sm:p-3">
              <p className="truncate text-[10px] text-white/52 sm:text-[11px]">권한 관리</p>
              <p className="mt-1 text-[13px] font-extrabold">{isSuperAdmin(user?.role) ? '가능' : '제한'}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto -mt-4 max-w-[980px] px-4">
        <section className="rounded-[22px] border border-[#E8DDCC] bg-[#FBF7EF] p-2.5 shadow-[0_18px_48px_-38px_rgba(26,31,27,.5)] sm:p-3">
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="text-[12px] font-bold text-[#26322E]">운영 메뉴</p>
            <p className="text-[11px] font-medium text-[#7C847E]">
              {isSuperAdmin(user?.role) ? '권한 부여/회수 가능' : '권한에 맞는 메뉴만 표시'}
            </p>
          </div>
          <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  'min-w-[98px] shrink-0 rounded-[15px] border px-3 py-2.5 text-left transition-colors sm:min-w-[112px] sm:py-3',
                  tab === item.id
                    ? 'border-[#0B3B36] bg-[#0B3B36] text-white shadow-[0_12px_24px_-18px_rgba(11,59,54,.75)]'
                    : 'border-[#E7DFD2] bg-white text-[#1F2A25] hover:border-[#CFC5B5]',
                )}
              >
                <span className="block text-[13px] font-extrabold">{item.label}</span>
                <span className={cn('mt-1 block text-[11px]', tab === item.id ? 'text-white/62' : 'text-[#858C87]')}>
                  {TAB_HELP_TEXT[item.id]}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-4">
          {tab === 'dashboard' && <AdminDashboardSection />}
          {tab === 'reports' && <AdminReportsSection />}
          {tab === 'moderation' && <AdminModerationSection />}
          {tab === 'journal' && <AdminJournalStatsSection />}
          {tab === 'notices' && <AdminNoticesSection />}
          {tab === 'contents' && <AdminContentsSection />}
          {tab === 'videos' && <AdminVideosSection />}
          {FEATURE_PRODUCTS_ENABLED && tab === 'products' && <AdminProductsSection />}
          {tab === 'users' && <AdminUsersSection />}
        </section>
      </div>
    </main>
  );
}
