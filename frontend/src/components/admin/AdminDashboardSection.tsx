'use client';

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useApiQuery } from '@/hooks/useApiQuery';
import { fetchAdminStatsOverview } from '@/lib/api/admin';

const EVENT_LABELS: Record<string, string> = {
  page_view: '페이지 조회',
  signup_click: '회원가입 클릭',
  login_click: '로그인 클릭',
  consult_click: '상담 클릭',
  journal_start_click: '기록 시작',
  community_open: '커뮤니티 진입',
  qna_open: 'FAQ 진입',
  content_open: '칼럼 진입',
  video_open: '영상 진입',
  signup_completed: '가입 완료',
  login_completed: '로그인 완료',
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat('ko-KR').format(value);
}

export function AdminDashboardSection() {
  const { data, isLoading, error } = useApiQuery(() => fetchAdminStatsOverview(), []);

  if (isLoading) return <LoadingSpinner label="운영 지표 불러오는 중…" />;
  if (error) return <ErrorMessage message={error} />;
  if (!data) return null;

  const pendingReportState = data.pendingReports > 0 ? '확인 필요' : '정상';
  const journalState = data.journalRecords7d > 0 ? '기록 발생' : '최근 기록 없음';
  const maxEventCount = Math.max(...data.topEvents7d.map((event) => event.count), 1);
  const topEvents = data.topEvents7d.slice(0, 6);

  return (
    <section className="grid gap-4 lg:grid-cols-[1.05fr_1.25fr]">
      <div className="space-y-4">
        <section className="rounded-[22px] bg-[#082B25] p-4 text-white shadow-[0_18px_38px_-26px_rgba(6,26,22,.55)] lg:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D8C691]/70">
                Operations
              </p>
              <h2 className="mt-1 text-[20px] font-extrabold leading-tight">오늘 운영 흐름</h2>
            </div>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10.5px] font-bold text-white/70">
              개인정보 제외
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <DarkMetric label="오늘 이벤트" value={data.eventsToday} helper="오늘 수집" />
            <DarkMetric label="7일 이벤트" value={data.events7d} helper="최근 흐름" />
          </div>
        </section>

        <section className="rounded-[20px] border border-[#E7DFD2] bg-[#FFFCF7] p-4 shadow-[0_14px_34px_-28px_rgba(20,31,26,.42)]">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[15px] font-extrabold text-[#1E2621]">운영 체크</h3>
            <span className="rounded-full bg-[#EFF7F4] px-2.5 py-1 text-[11px] font-bold text-[#0B3B36]">
              Privacy-safe
            </span>
          </div>
          <div className="mt-3 grid gap-2">
            <CheckRow label="신고 대기" value={`${pendingReportState} · ${formatNumber(data.pendingReports)}건`} />
            <CheckRow label="일지 사용" value={`${journalState} · 7일 ${formatNumber(data.journalRecords7d)}건`} />
            <CheckRow label="콘텐츠" value={`칼럼 ${formatNumber(data.contents)}개 · 영상 ${formatNumber(data.videos)}개`} />
          </div>
        </section>
      </div>

      <div className="space-y-4">
        <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <StatCard label="회원" value={data.totalUsers} helper={`7일 +${formatNumber(data.newUsers7d)}`} />
          <StatCard label="게시글" value={data.activePosts} helper={`7일 +${formatNumber(data.newPosts7d)}`} />
          <StatCard label="댓글" value={data.activeComments} helper="활성 기준" />
          <StatCard label="신고" value={data.pendingReports} helper="대기 건" />
          <StatCard label="개인일지" value={data.journalRecords} helper={`7일 +${formatNumber(data.journalRecords7d)}`} />
          <StatCard label="칼럼" value={data.contents} helper="등록 기준" />
          <StatCard label="영상" value={data.videos} helper="등록 기준" />
          <StatCard label="이벤트" value={data.events7d} helper="최근 7일" />
        </section>

        <section className="rounded-[22px] border border-[#E7DFD2] bg-[#FFFCF7] p-4 shadow-[0_14px_34px_-28px_rgba(20,31,26,.42)]">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-[#1E2621]">최근 7일 주요 이벤트</h3>
            <span className="rounded-full bg-[#EFF7F4] px-2.5 py-1 text-[11px] font-semibold text-[#0B3B36]">
              상위 6개
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {topEvents.length === 0 ? (
              <p className="rounded-[14px] bg-[#F7F3EC] px-4 py-5 text-center text-[13px] text-[#6F7772]">
                아직 수집된 이벤트가 없습니다.
              </p>
            ) : (
              topEvents.map((item) => {
                const width = `${Math.max(8, (item.count / maxEventCount) * 100)}%`;
                return (
                  <div key={item.eventName}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-[12px]">
                      <span className="min-w-0 truncate font-medium text-[#1E2621]">
                        {EVENT_LABELS[item.eventName] ?? item.eventName}
                      </span>
                      <span className="shrink-0 text-[#6F7772]">{formatNumber(item.count)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#EEF0EA]">
                      <div className="h-full rounded-full bg-[#0B3B36]" style={{ width }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </section>
  );
}

function DarkMetric({ label, value, helper }: { label: string; value: number; helper: string }) {
  return (
    <div className="rounded-[16px] bg-white/8 p-3">
      <p className="text-[11px] text-white/55">{label}</p>
      <p className="mt-1 text-[24px] font-extrabold leading-none">{formatNumber(value)}</p>
      <p className="mt-1 text-[11px] text-white/44">{helper}</p>
    </div>
  );
}

function CheckRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[14px] bg-[#F7F1E7] px-3 py-2.5">
      <span className="text-[12px] font-bold text-[#1F2A25]">{label}</span>
      <span className="min-w-0 truncate text-right text-[12px] text-[#7D857F]">{value}</span>
    </div>
  );
}

function StatCard({ label, value, helper }: { label: string; value: number; helper: string }) {
  return (
    <div className="rounded-[16px] border border-[#E7DFD2] bg-[#FFFCF7] p-3 shadow-[0_10px_24px_-22px_rgba(20,31,26,.34)]">
      <p className="text-[11px] font-bold text-[#5E6761]">{label}</p>
      <p className="mt-1.5 text-[22px] font-extrabold leading-none text-[#0B3B36]">{formatNumber(value)}</p>
      <p className="mt-1.5 line-clamp-1 text-[10.5px] leading-relaxed text-[#8A918C]">{helper}</p>
    </div>
  );
}
