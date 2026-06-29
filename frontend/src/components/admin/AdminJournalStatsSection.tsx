'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { fetchAdminJournalStats } from '@/lib/api/admin';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { getErrorMessage } from '@/lib/api/client';

function formatCount(value: number, unit = '건') {
  return `${value.toLocaleString('ko-KR')}${unit}`;
}

export function AdminJournalStatsSection() {
  const { data, isLoading, error } = useApiQuery(() => fetchAdminJournalStats(), []);

  if (isLoading) return <LoadingSpinner label="일지 통계 불러오는 중…" />;
  if (error) return <ErrorMessage message={getErrorMessage(error)} />;
  if (!data) return null;

  const { communityInsights } = data;

  return (
    <div className="space-y-4">
      <section className="rounded-[20px] bg-[#082B25] p-4 text-white shadow-[0_18px_38px_-26px_rgba(6,26,22,.55)]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D8C691]/70">
          Journal Overview
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2.5">
          <HeroMetric label="누적 일지" value={formatCount(data.totalRecords)} />
          <HeroMetric label="참여 회원" value={formatCount(data.totalUsers, '명')} />
          <HeroMetric label="재발 기록" value={formatCount(data.symptomRecords)} />
        </div>
      </section>

      <section className="rounded-[20px] border border-[#E7DFD2] bg-[#FFFCF7] p-4 shadow-[0_14px_34px_-28px_rgba(20,31,26,.42)]">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-[15px] font-extrabold text-[#1E2621]">최근 기록 흐름</h2>
            <p className="mt-1 text-[11.5px] text-[#7C847E]">7일과 30일 변화를 나눠 봅니다.</p>
          </div>
          <span className="rounded-full bg-[#EEF4EF] px-2.5 py-1 text-[10.5px] font-bold text-[#0B3B36]">
            익명 집계
          </span>
        </div>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          <FlowCard
            title="전체 기록"
            primaryLabel="최근 7일"
            primaryValue={formatCount(data.recordsLast7Days)}
            secondaryLabel="최근 30일"
            secondaryValue={formatCount(data.recordsLast30Days)}
          />
          <FlowCard
            title="재발 기록"
            primaryLabel="최근 7일"
            primaryValue={formatCount(data.symptomRecordsLast7Days)}
            secondaryLabel="최근 30일"
            secondaryValue={formatCount(data.symptomRecordsLast30Days)}
          />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <CompactPanel
          title="신고 처리"
          items={[
            ['대기', formatCount(data.pendingReports)],
            ['승인', formatCount(data.acceptedReports)],
            ['반려', formatCount(data.rejectedReports)],
          ]}
        />
        <CompactPanel
          title="숨김 콘텐츠"
          items={[
            ['게시글', formatCount(data.hiddenPostsCount)],
            ['댓글', formatCount(data.hiddenCommentsCount)],
          ]}
        />
      </section>

      {data.insightLines.length > 0 && (
        <section className="rounded-[20px] border border-[#E7DFD2] bg-white p-4 shadow-[0_14px_34px_-28px_rgba(20,31,26,.32)]">
          <h2 className="text-[15px] font-extrabold text-[#1E2621]">운영 통계 한 줄 요약</h2>
          <ul className="mt-3 space-y-2">
            {data.insightLines.slice(0, 4).map((line) => (
              <li key={line} className="rounded-[14px] bg-[#F6F1E8] px-3 py-2 text-[12px] leading-[1.55] text-[#5C645A]">
                {line}
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.contentHints.length > 0 && (
        <section className="rounded-[20px] border border-[#E5C66F]/45 bg-[#FFF8E6] p-4">
          <h2 className="text-[14px] font-extrabold text-[#1E2621]">콘텐츠 기획 힌트</h2>
          <ul className="mt-2 space-y-1.5">
            {data.contentHints.map((hint) => (
              <li key={hint} className="text-[12px] leading-[1.6] text-[#6F6549]">
                {hint}
              </li>
            ))}
          </ul>
        </section>
      )}

      {communityInsights.topTriggers.length > 0 && (
        <section className="rounded-[20px] border border-[#E7DFD2] bg-[#FFFCF7] p-4">
          <h2 className="text-[14px] font-extrabold text-[#1E2621]">커뮤니티 상위 트리거</h2>
          <ul className="mt-3 space-y-2.5">
            {communityInsights.topTriggers.map((item) => (
              <li key={item.code}>
                <div className="mb-1 flex items-center justify-between text-[12px]">
                  <span className="font-semibold text-[#1E2621]">{item.label}</span>
                  <span className="font-bold text-[#0B3B36]">{item.percentage}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#EFE8DC]">
                  <div className="h-full rounded-full bg-[#0B3B36]" style={{ width: `${item.percentage}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="rounded-[14px] bg-white/55 px-3 py-2 text-[11px] leading-[1.6] text-muted">
        관리자 화면에는 개인 메모나 닉네임이 연결된 상세 기록을 표시하지 않고, 운영에 필요한 익명 집계만 보여줍니다.
      </p>
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[15px] bg-white/8 p-3">
      <p className="text-[10.5px] text-white/55">{label}</p>
      <p className="mt-1 text-[18px] font-extrabold leading-none text-white">{value}</p>
    </div>
  );
}

function FlowCard({
  title,
  primaryLabel,
  primaryValue,
  secondaryLabel,
  secondaryValue,
}: {
  title: string;
  primaryLabel: string;
  primaryValue: string;
  secondaryLabel: string;
  secondaryValue: string;
}) {
  return (
    <div className="rounded-[16px] border border-[#ECE5D8] bg-white px-3.5 py-3">
      <p className="text-[12px] font-extrabold text-[#1E2621]">{title}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <MiniMetric label={primaryLabel} value={primaryValue} />
        <MiniMetric label={secondaryLabel} value={secondaryValue} />
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[13px] bg-[#F6F1E8] px-3 py-2">
      <p className="text-[10.5px] text-[#7C847E]">{label}</p>
      <p className="mt-1 text-[15px] font-extrabold text-[#0B3B36]">{value}</p>
    </div>
  );
}

function CompactPanel({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <section className="rounded-[18px] border border-[#E7DFD2] bg-white p-4">
      <h2 className="text-[14px] font-extrabold text-[#1E2621]">{title}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map(([label, value]) => (
          <div key={label} className="min-w-[82px] flex-1 rounded-[13px] bg-[#F6F1E8] px-3 py-2">
            <p className="text-[10.5px] text-[#7C847E]">{label}</p>
            <p className="mt-1 text-[15px] font-extrabold text-[#1E2621]">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
