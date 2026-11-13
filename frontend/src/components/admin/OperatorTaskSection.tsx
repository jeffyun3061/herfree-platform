'use client';

import Link from 'next/link';
import { useApiQuery } from '@/hooks/useApiQuery';
import { fetchOperatorTasks } from '@/lib/api/admin/operations';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

const boardLabel = (type: string) => type === 'INQUIRY' ? '이용 문의' : '비공개 상담';
function waiting(at: string | null, now: string) {
  if (!at) return '대기 없음';
  const hours = Math.max(0, Math.floor((Date.parse(now) - Date.parse(at)) / 3600000));
  return hours >= 24 ? `${Math.floor(hours / 24)}일 ${hours % 24}시간 대기` : `${hours}시간 대기`;
}

export function OperatorTaskSection() {
  const { data, isLoading, error, refetch } = useApiQuery(fetchOperatorTasks, []);
  return <section className="rounded-[20px] border border-[#E7DFD2] bg-[#FFFCF7] p-4 lg:col-span-2">
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-lg font-extrabold">먼저 처리할 일</h2>
      <button type="button" onClick={() => void refetch()} disabled={isLoading} className="min-h-11 rounded-xl px-3 text-sm font-bold text-[#0B3B36] disabled:opacity-50">새로고침</button>
    </div>
    {isLoading ? <LoadingSpinner label="대기 업무 확인 중…" /> : error ? <ErrorMessage message={error} /> : data && <>
      <p className="mb-3 text-xs text-[#687269]">24시간이 지난 접수부터 확인해 주세요. 운영자 답글이 없는 활성 글을 집계합니다.</p>
      <div className="grid gap-2">
        <Link href="/admin?tab=reports" className="rounded-xl bg-[#F7F1E7] p-3 text-sm">
          <span className="font-bold">24시간 지난 신고</span><span className="float-right font-bold text-[#9D3D22]">{data.overdueReports}건 ›</span>
        </Link>
        {['INQUIRY', 'PRIVATE_CONSULT'].map((type) => {
          const queue = data.queues.find((q) => q.boardType === type);
          return <Link key={type} href={type === 'INQUIRY' ? '/inquiry' : '/consult'} className="rounded-xl border border-[#E7DFD2] p-3">
            <div className="flex justify-between gap-2 text-sm"><span className="font-bold">{boardLabel(type)}</span><span>{queue?.pending ?? 0}건 미답변 ›</span></div>
            <p className="mt-1 text-xs text-[#687269]">24시간 초과 {queue?.overdue ?? 0}건 · 가장 오래된 글 {waiting(queue?.oldest ?? null, data.generatedAt)}</p>
          </Link>;
        })}
      </div>
      {data.oldestTasks.length > 0 && <div className="mt-4">
        <h3 className="text-sm font-bold">오래 기다린 문의·상담</h3>
        <ul className="mt-2 divide-y divide-[#E7DFD2]">
          {data.oldestTasks.map((task) => <li key={task.id}><Link className="flex min-h-11 items-center justify-between gap-3 py-2 text-sm" href={`/community/posts/${task.id}`}>
            <span>{boardLabel(task.boardType)} #{task.id}</span><span className="text-xs text-[#687269]">{waiting(task.createdAt, data.generatedAt)} ›</span>
          </Link></li>)}
        </ul>
      </div>}
      <p className="mt-3 text-xs text-[#687269]">확인 시각 {new Date(data.generatedAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</p>
    </>}
    <div className="mt-4 grid grid-cols-2 gap-2 text-center text-sm font-bold">
      {[['회원 관리', 'users'], ['운영 이력', 'audit'], ['공지 작성', 'notices'], ['콘텐츠 관리', 'contents']].map(([label, tab]) =>
        <Link key={tab} className="rounded-xl bg-[#EEF4EF] px-3 py-3 text-[#0B3B36]" href={`/admin?tab=${tab}`}>{label}</Link>)}
    </div>
  </section>;
}
