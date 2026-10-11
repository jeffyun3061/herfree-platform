'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { fetchAuditActions, fetchMemberChanges } from '@/lib/api/admin/operations';
import { USER_ROLE_LABELS, USER_STATUS_LABELS, type UserRole, type UserStatus } from '@/domain/user/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

function actionLabel(path: string, method: string) {
  const resource = path.includes('/users') ? '회원' : path.includes('/reports') ? '신고' : path.includes('/posts') ? '게시글' : path.includes('/comments') ? '댓글' : path.includes('/notices') ? '공지' : path.includes('/contents') ? '칼럼' : path.includes('/videos') ? '영상' : path.includes('/admin-mfa/') ? '추가 인증' : '운영';
  return `${resource} ${path.endsWith('/role') ? '권한 변경' : path.endsWith('/restriction') ? '이용 제한' : path.endsWith('/status') ? '상태 변경' : method === 'DELETE' ? '삭제' : method === 'POST' ? '등록·처리' : '수정'}`;
}
const at = (value: string) => new Date(value).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
const role = (value: string | null) => value ? USER_ROLE_LABELS[value as UserRole] ?? value : '—';
const status = (value: string | null) => value ? USER_STATUS_LABELS[value as UserStatus] ?? value : '—';

export function AdminAuditSection() {
  const [mode, setMode] = useState<'actions' | 'members'>('actions');
  const [page, setPage] = useState(0);
  const [days, setDays] = useState(7);
  const [draftId, setDraftId] = useState('');
  const [id, setId] = useState('');
  const actions = useApiQuery(() => fetchAuditActions(page, days, id), [page, days, id], { enabled: mode === 'actions' });
  const members = useApiQuery(() => fetchMemberChanges(page, days, id), [page, days, id], { enabled: mode === 'members' });
  const query = mode === 'actions' ? actions : members;
  function changeMode(next: 'actions' | 'members') { setMode(next); setPage(0); setId(''); setDraftId(''); }
  return <section className="rounded-[20px] border border-[#E7DFD2] bg-[#FFFCF7] p-4" aria-label="운영 이력">
    <h2 className="text-lg font-extrabold">누가 어떤 조치를 했는지</h2><p className="mt-1 text-xs leading-relaxed text-[#687269]">운영 요청 결과와 회원 변경 이력을 확인합니다. 요청 내용·비밀번호·일지 원문은 표시하지 않습니다.</p>
    <div className="mt-4 flex gap-2">
      {([['actions', '운영 조치'], ['members', '회원 변경']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={mode === value} onClick={() => changeMode(value)} className={`min-h-11 flex-1 rounded-xl px-3 text-sm font-bold ${mode === value ? 'bg-[#0B3B36] text-white' : 'bg-[#EEF4EF] text-[#0B3B36]'}`}>{label}</button>)}
    </div>
    <div className="mt-3 flex items-center gap-2"><label htmlFor="audit-days" className="text-sm">조회 기간</label><select id="audit-days" value={days} onChange={(event) => { setDays(Number(event.target.value)); setPage(0); }} className="h-11 rounded-xl border border-[#E7DFD2] bg-white px-3 text-sm"><option value={1}>최근 1일</option><option value={7}>최근 7일</option><option value={30}>최근 30일</option></select>
      <button type="button" onClick={() => void query.refetch()} disabled={query.isLoading} className="ml-auto min-h-11 px-2 text-sm font-bold disabled:opacity-50">새로고침</button>
    </div>
    <form className="mt-3 flex gap-2" onSubmit={(event) => { event.preventDefault(); setId(draftId); setPage(0); }}>
      <label htmlFor="audit-user-id" className="sr-only">{mode === 'actions' ? '조치한 계정 ID' : '대상 회원 ID'}</label>
      <input id="audit-user-id" inputMode="numeric" pattern="[1-9][0-9]*" maxLength={18} value={draftId} onChange={(event) => setDraftId(event.target.value)} placeholder={mode === 'actions' ? '조치한 계정 ID (선택)' : '대상 회원 ID (선택)'} className="h-11 min-w-0 flex-1 rounded-xl border border-[#E7DFD2] bg-white px-3 text-sm" />
      <button type="submit" className="rounded-xl bg-[#EEF4EF] px-4 text-sm font-bold">조회</button>
    </form>
    <div className="mt-4">
      {query.isLoading ? <LoadingSpinner label="운영 이력 확인 중…" /> : query.error ? <ErrorMessage message={query.error} /> : <>
        {query.data?.content.length === 0 && <p className="rounded-xl bg-[#F7F1E7] p-4 text-sm">이 기간에 기록된 조치가 없습니다.</p>}
        {mode === 'actions' && actions.data?.content.map((entry) => <article key={entry.id} className="mb-2 rounded-xl bg-[#F7F1E7] p-3 text-sm">
          <div className="flex justify-between gap-2"><h3 className="font-bold">{actionLabel(entry.path, entry.method)}</h3><span className={entry.status < 400 ? 'text-[#0B3B36]' : 'text-[#9D3D22]'}>{entry.status < 400 ? '완료' : entry.status === 403 ? '차단' : '실패'} ({entry.status})</span></div>
          <p className="mt-1 text-xs text-[#687269]">계정 #{entry.actorId} · {at(entry.at)}</p><p className="mt-2 break-all font-mono text-xs">{entry.method} {entry.path}</p><p className="mt-1 break-all text-xs text-[#687269]">요청 ID: {entry.requestId}</p>
        </article>)}
        {mode === 'members' && members.data?.content.map((entry) => <article key={entry.id} className="mb-2 rounded-xl bg-[#F7F1E7] p-3 text-sm">
          <h3 className="font-bold">{entry.action === 'ROLE_CHANGE' ? '권한 변경' : entry.action === 'STATUS_CHANGE' ? '이용 상태 변경' : '닉네임 초기화'}</h3>
          <p className="mt-1">{entry.action === 'ROLE_CHANGE' ? `${role(entry.previousRole)} → ${role(entry.newRole)}` : entry.action === 'STATUS_CHANGE' ? `${status(entry.previousStatus)} → ${status(entry.newStatus)}` : '닉네임 변경 처리'}</p>
          <p className="mt-1 text-xs text-[#687269]">계정 #{entry.actorId} 처리 · {at(entry.at)}</p><Link className="mt-2 inline-block min-h-8 font-bold text-[#0B3B36] underline" href={`/admin?tab=users&q=%23${entry.targetUserId}`}>대상 회원 #{entry.targetUserId} 확인</Link>
        </article>)}
      </>}
    </div>
    <div className="mt-4 flex items-center justify-between text-sm"><button type="button" disabled={page === 0 || query.isLoading} onClick={() => setPage(page - 1)} className="min-h-11 rounded-xl bg-[#EEF4EF] px-4 disabled:opacity-40">이전</button><span>{page + 1}페이지</span><button type="button" disabled={!query.data?.hasNext || page >= 100 || query.isLoading} onClick={() => setPage(page + 1)} className="min-h-11 rounded-xl bg-[#EEF4EF] px-4 disabled:opacity-40">다음</button></div>
  </section>;
}
