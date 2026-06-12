'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { TopBar } from '@/components/layout/TopBar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Button } from '@/components/ui/Button';
import { AdminReportsSection } from '@/components/admin/AdminReportsSection';
import { AdminContentsSection } from '@/components/admin/AdminContentsSection';
import { AdminVideosSection } from '@/components/admin/AdminVideosSection';
import { AdminProductsSection } from '@/components/admin/AdminProductsSection';
import { AdminJournalStatsSection } from '@/components/admin/AdminJournalStatsSection';
import { isAdmin } from '@/domain/user/types';
import { cn } from '@/lib/cn';

type AdminTab = 'reports' | 'contents' | 'videos' | 'products' | 'journal';

const TABS: { id: AdminTab; label: string }[] = [
  { id: 'reports', label: '신고' },
  { id: 'journal', label: '일지 통계' },
  { id: 'contents', label: '정보글' },
  { id: 'videos', label: '영상' },
  { id: 'products', label: '제품' },
];

export default function AdminPage() {
  const router = useRouter();
  const { isReady, user } = useAuth();
  const [tab, setTab] = useState<AdminTab>('reports');

  if (!isReady) return <LoadingSpinner />;

  if (!isAdmin(user?.role)) {
    return (
      <>
        <TopBar title="관리자" showBack />
        <div className="px-4 py-6">
          <ErrorMessage message="관리자만 접근할 수 있습니다." />
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
        <div className="scrollbar-hide -mx-1 mb-4 flex gap-2 overflow-x-auto px-1">
          {TABS.map((item) => (
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
        {tab === 'journal' && <AdminJournalStatsSection />}
        {tab === 'contents' && <AdminContentsSection />}
        {tab === 'videos' && <AdminVideosSection />}
        {tab === 'products' && <AdminProductsSection />}
      </div>
    </>
  );
}
