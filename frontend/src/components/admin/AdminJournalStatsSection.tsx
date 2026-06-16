'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { fetchAdminJournalStats } from '@/lib/api/admin';
import { JournalInsightLines } from '@/components/journal/JournalInsightLines';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { getErrorMessage } from '@/lib/api/client';

export function AdminJournalStatsSection() {
  const { data, isLoading, error } = useApiQuery(() => fetchAdminJournalStats(), []);

  if (isLoading) return <LoadingSpinner label="일지 통계 불러오는 중…" />;
  if (error) return <ErrorMessage message={getErrorMessage(error)} />;
  if (!data) return null;

  const { communityInsights } = data;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="누적 일지" value={`${data.totalRecords}건`} />
        <StatCard label="참여 회원" value={`${data.totalUsers}명`} />
        <StatCard label="재발(증상) 기록" value={`${data.symptomRecords}건`} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="최근 7일 기록" value={`${data.recordsLast7Days}건`} />
        <StatCard label="최근 30일 기록" value={`${data.recordsLast30Days}건`} />
        <StatCard label="7일 재발 기록" value={`${data.symptomRecordsLast7Days}건`} />
        <StatCard label="30일 재발 기록" value={`${data.symptomRecordsLast30Days}건`} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="대기 신고" value={`${data.pendingReports}건`} />
        <StatCard label="승인 신고" value={`${data.acceptedReports}건`} />
        <StatCard label="반려 신고" value={`${data.rejectedReports}건`} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard label="숨김 게시글" value={`${data.hiddenPostsCount}건`} />
        <StatCard label="숨김 댓글" value={`${data.hiddenCommentsCount}건`} />
      </div>

      {data.contentHints.length > 0 && (
        <section className="rounded-2xl border border-gold/30 bg-gold/5 p-4">
          <h3 className="text-sm font-semibold text-ink">콘텐츠 기획 힌트</h3>
          <ul className="mt-2 space-y-1.5">
            {data.contentHints.map((hint) => (
              <li key={hint} className="text-sm text-muted">
                · {hint}
              </li>
            ))}
          </ul>
        </section>
      )}

      <JournalInsightLines lines={data.insightLines} title="운영 통계 한 줄 요약" />

      {communityInsights.topTriggers.length > 0 && (
        <section className="rounded-2xl border border-border/80 bg-card px-4 py-4">
          <h3 className="text-sm font-semibold text-ink">커뮤니티 상위 트리거</h3>
          <ul className="mt-3 space-y-2">
            {communityInsights.topTriggers.map((item) => (
              <li key={item.code} className="flex items-center justify-between text-sm">
                <span className="text-ink">{item.label}</span>
                <span className="font-medium text-primary">{item.percentage}%</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-xs text-muted">
        관리자 화면에는 개인 메모·닉네임이 연결된 상세 기록은 표시되지 않습니다. 익명 집계만
        확인할 수 있습니다.
      </p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card px-4 py-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold text-ink">{value}</p>
    </div>
  );
}
