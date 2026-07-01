'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { BackButton } from '@/components/ui/BackButton';
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
          <BackButton
            className="mb-5 bg-white text-[#123D37] shadow-[0_10px_24px_-20px_rgba(18,61,55,.65)] hover:bg-white"
          />
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

  const activeTab = ALL_TABS.find((item) => item.id === tab);

  return (
    <main className="min-h-screen bg-[#F3EDE3] pb-10 text-[#121816]">
      <section className="hidden">
        <div className="mx-auto max-w-[980px]">
          <div className="flex items-center justify-between gap-3">
            <BackButton
              className="bg-white/10 text-white hover:bg-white/16 hover:text-white"
            />
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-white/80">
              {roleLabel}
            </span>
          </div>

          <div className="mt-6 max-w-[680px]">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#D8C691]/70">Herpfree Admin</p>
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

      <div className="mx-auto max-w-[1180px] px-4 py-4 lg:px-6 lg:py-6">
        <header className="mb-3 flex items-center justify-between gap-3">
          <BackButton className="bg-white text-[#123D37] shadow-[0_10px_24px_-20px_rgba(18,61,55,.65)] hover:bg-white" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#958B78]">Herpfree Admin</p>
            <h1 className="mt-0.5 truncate text-[20px] font-extrabold text-[#1E2621]">
              {activeTab?.label ?? '운영 관리'}
            </h1>
          </div>
          <span className="shrink-0 rounded-full bg-[#0B3B36] px-3 py-1.5 text-[11px] font-bold text-white">
            {roleLabel}
          </span>
        </header>

        <section className="rounded-[18px] border border-[#E8DDCC] bg-[#FBF7EF] p-3 shadow-[0_14px_38px_-34px_rgba(26,31,27,.45)]">
          <div className="flex items-center gap-2">
            <label htmlFor="admin-tab-select" className="sr-only">
              관리 메뉴
            </label>
            <select
              id="admin-tab-select"
              value={tab}
              onChange={(event) => setTab(event.target.value as AdminTab)}
              className="h-11 min-w-0 flex-1 rounded-[14px] border border-[#E4D8C8] bg-white px-3 text-[13px] font-bold text-[#1E2621] outline-none focus:border-[#0B3B36]"
            >
              {tabs.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <span className="shrink-0 rounded-full bg-[#EEF4EF] px-2.5 py-1 text-[10.5px] font-bold text-[#0B3B36]">
              {activeTab ? TAB_HELP_TEXT[activeTab.id] : '관리'}
            </span>
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
