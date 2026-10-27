'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { getErrorMessage } from '@/lib/api/client';
import { acknowledgeCommunityDeletionRequest, fetchCommunityDeletionRequest, fetchCommunityDeletionRequests, type CommunityDeletionRequest } from '@/lib/api/admin/community-deletion-requests';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Pagination } from '@/components/common/Pagination';

const time = (value: string | null) => value ? new Date(value).toLocaleString('ko-KR') : '아직 확인하지 않음';
export function AdminCommunityDeletionRequestsSection() {
  const [page, setPage] = useState(0);
  const { data, isLoading, error, refetch } = useApiQuery(() => fetchCommunityDeletionRequests(page), [page]);
  const [selected, setSelected] = useState<CommunityDeletionRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const open = async (id: number) => {
    setBusy(true); setActionError(null); setSelected(null);
    try { setSelected(await fetchCommunityDeletionRequest(id)); }
    catch (cause) { setActionError(getErrorMessage(cause)); }
    finally { setBusy(false); }
  };
  const acknowledge = async () => {
    if (!selected || busy) return;
    setBusy(true); setActionError(null);
    try { setSelected(await acknowledgeCommunityDeletionRequest(selected.id)); setConfirmOpen(false); await refetch(); }
    catch (cause) { setActionError(getErrorMessage(cause)); }
    finally { setBusy(false); }
  };
  return <section className="rounded-[20px] border border-[#E7DFD2] bg-[#FFFCF7] p-4">
    <div className="flex items-center justify-between gap-3"><h2 className="text-base font-bold">익명 고민 건강정보 삭제 요청</h2><Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => void refetch()}>새로고침</Button></div>
    <p className="mt-3 text-sm leading-6 text-muted">동의 철회로 공개가 중단된 본인 콘텐츠의 삭제 요청입니다. 접수 정보와 대상 ID만 표시하며 건강정보 원문·닉네임·이메일은 표시하지 않습니다.</p>
    <p className="mt-2 text-sm leading-6 text-[#6B552E]">접수 확인은 검토 시작 기록입니다. 원문·첨부·백업의 삭제 완료나 법적 보존 판단을 대신하지 않습니다. 실제 파기와 결과 안내는 승인된 운영 절차로 처리해 주세요.</p>
    {isLoading ? <LoadingSpinner /> : error ? <ErrorMessage message={error} /> : <div className="mt-4 space-y-3">
      {data?.content.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E7DFD2] bg-white p-3">
        <div><p className="text-sm font-bold">접수 #{item.id} · {item.status === 'RECEIVED' ? '접수됨' : '검토 중'}</p><p className="mt-1 text-xs text-muted">글 {item.postCount}건 · 댓글 {item.commentCount}건 · {time(item.receivedAt)}</p></div>
        <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => void open(item.id)}>접수 #{item.id} 확인</Button>
      </div>)}
      {data?.content.length === 0 && <p className="py-5 text-center text-sm text-muted">접수된 삭제 요청이 없습니다.</p>}
      <Pagination page={page} totalPages={data?.totalPages ?? 0} onPageChange={setPage} />
    </div>}
    {actionError && <ErrorMessage message={actionError} className="mt-3" />}
    {selected && <section aria-label={`삭제 요청 ${selected.id} 상세`} className="mt-5 rounded-xl border border-[#C9D9D0] bg-[#EDF4F0] p-4">
      <h3 className="font-bold">접수 #{selected.id} · {selected.status === 'RECEIVED' ? '접수됨' : '검토 중'}</h3>
      <p className="mt-2 text-xs leading-6">접수: {time(selected.receivedAt)}<br />접수 확인: {time(selected.acknowledgedAt)}<br />철회 정책 버전: {selected.policyVersion}</p>
      <ul className="mt-2 list-disc pl-5 text-xs leading-6">{selected.items.map((item) => <li key={`${item.targetType}-${item.targetId}`}>{item.targetType === 'POST' ? '게시글' : '댓글'} ID {item.targetId}</li>)}</ul>
      {selected.items.length === 0 && <p className="mt-2 text-xs text-muted">표시할 대상 ID가 없습니다. 접수 경위를 확인해 주세요.</p>}
      <div className="mt-3 flex flex-wrap gap-3">{selected.status === 'RECEIVED' && <Button type="button" size="sm" disabled={busy} onClick={() => setConfirmOpen(true)}>접수 확인 · 검토 시작</Button>}<Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => setSelected(null)}>상세 닫기</Button></div>
    </section>}
    <ConfirmModal open={confirmOpen} title="삭제 요청 접수 확인" message="이 요청을 확인하고 검토를 시작한 기록을 남깁니다. 콘텐츠를 삭제하거나 삭제 완료로 처리하지 않습니다." confirmLabel="접수 확인 기록" isLoading={busy} onConfirm={() => void acknowledge()} onClose={() => setConfirmOpen(false)} />
  </section>;
}
