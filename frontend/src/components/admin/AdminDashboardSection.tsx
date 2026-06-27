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

function StatCard({ label, value, helper }: { label: string; value: number; helper: string }) {
  return (
    <div className="rounded-[18px] border border-[#E7DFD2] bg-white p-4 shadow-[0_14px_30px_-24px_rgba(20,31,26,.38)]">
      <p className="text-[12px] font-medium text-[#6F7772]">{label}</p>
      <p className="mt-2 text-[26px] font-extrabold text-[#0B3B36]">{formatNumber(value)}</p>
      <p className="mt-1 text-[11.5px] leading-relaxed text-[#8A918C]">{helper}</p>
    </div>
  );
}

export function AdminDashboardSection() {
  const { data, isLoading, error } = useApiQuery(() => fetchAdminStatsOverview(), []);

  if (isLoading) return <LoadingSpinner label="운영 지표를 불러오는 중..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!data) return null;

  return (
    <section className="space-y-4">
      <div className="rounded-[22px] bg-[#082B25] p-5 text-white shadow-[0_18px_38px_-26px_rgba(6,26,22,.55)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Operations</p>
        <h2 className="mt-2 text-[22px] font-extrabold">운영 대시보드</h2>
        <p className="mt-2 text-[13px] leading-[1.7] text-white/68">
          민감정보를 제외한 행동 이벤트와 핵심 운영 지표만 모아 봅니다.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-[16px] bg-white/8 p-3">
            <p className="text-[11px] text-white/55">오늘 이벤트</p>
            <p className="mt-1 text-[22px] font-bold">{formatNumber(data.eventsToday)}</p>
          </div>
          <div className="rounded-[16px] bg-white/8 p-3">
            <p className="text-[11px] text-white/55">7일 이벤트</p>
            <p className="mt-1 text-[22px] font-bold">{formatNumber(data.events7d)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="회원" value={data.totalUsers} helper={`최근 7일 +${formatNumber(data.newUsers7d)}`} />
        <StatCard label="게시글" value={data.activePosts} helper={`최근 7일 +${formatNumber(data.newPosts7d)}`} />
        <StatCard label="댓글" value={data.activeComments} helper="활성 댓글 기준" />
        <StatCard label="신고 대기" value={data.pendingReports} helper="운영자 확인 필요" />
        <StatCard label="개인일지" value={data.journalRecords} helper={`최근 7일 +${formatNumber(data.journalRecords7d)}`} />
        <StatCard label="칼럼" value={data.contents} helper="전체 등록 기준" />
        <StatCard label="영상" value={data.videos} helper="전체 등록 기준" />
        <StatCard label="수집 이벤트" value={data.events7d} helper="최근 7일 기준" />
      </div>

      <div className="rounded-[20px] border border-[#E7DFD2] bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-[#1E2621]">최근 7일 주요 이벤트</h3>
          <span className="rounded-full bg-[#EFF7F4] px-2.5 py-1 text-[11px] font-semibold text-[#0B3B36]">
            Privacy-safe
          </span>
        </div>
        <div className="mt-4 space-y-3">
          {data.topEvents7d.length === 0 ? (
            <p className="rounded-[14px] bg-[#F7F3EC] px-4 py-5 text-center text-[13px] text-[#6F7772]">
              아직 수집된 이벤트가 없습니다.
            </p>
          ) : (
            data.topEvents7d.map((item) => {
              const max = Math.max(...data.topEvents7d.map((event) => event.count), 1);
              const width = `${Math.max(8, (item.count / max) * 100)}%`;
              return (
                <div key={item.eventName}>
                  <div className="mb-1 flex items-center justify-between text-[12px]">
                    <span className="font-medium text-[#1E2621]">
                      {EVENT_LABELS[item.eventName] ?? item.eventName}
                    </span>
                    <span className="text-[#6F7772]">{formatNumber(item.count)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#EEF0EA]">
                    <div className="h-full rounded-full bg-[#0B3B36]" style={{ width }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
