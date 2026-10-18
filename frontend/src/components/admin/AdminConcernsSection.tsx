'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApiQuery } from '@/hooks/useApiQuery';
import { fetchAdminConcerns } from '@/lib/api/admin/concerns';
import { Pagination } from '@/components/common/Pagination';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

export function AdminConcernsSection({ compact = false }: { compact?: boolean }) {
  const [answered, setAnswered] = useState(false);
  const [page, setPage] = useState(0);
  const { data, isLoading, error, refetch } = useApiQuery(() => fetchAdminConcerns(answered, page), [answered, page]);
  return <section className="rounded-[20px] border border-[#E7DFD2] bg-[#FFFCF7] p-4">
    <div className="flex items-center justify-between gap-2"><h2 className="text-[15px] font-extrabold">익명 고민 {data ? `· ${data.totalElements}건` : ''}</h2><button type="button" onClick={() => void refetch()} className="text-xs font-bold text-[#0B3B36]">새로고침</button></div>
    <p className="mt-2 text-xs leading-relaxed text-muted">오래 기다린 고민부터 답변해 주세요. 답변은 공개 글의 댓글로 등록하며 닉네임은 표시하지 않습니다.</p>
    {!compact && <div className="mt-3 flex gap-2">{[false, true].map(value => <button key={String(value)} type="button" aria-pressed={answered === value} onClick={() => {setAnswered(value);setPage(0);}} className={`rounded-full px-3 py-2 text-xs font-bold ${answered === value ? 'bg-[#0B3B36] text-white' : 'bg-[#EDF4F0]'}`}>{value ? '운영자 답변 완료' : '답변 대기'}</button>)}</div>}
    {isLoading ? <LoadingSpinner /> : error ? <ErrorMessage message={error} /> : <div className="mt-3 space-y-2">
      {(compact ? data?.content.slice(0, 5) : data?.content)?.map(post => <Link key={post.id} href={`/community/posts/${post.id}`} className="block rounded-xl border border-[#ECE5D8] p-3"><span className="text-[11px] text-muted">{post.staffReplied ? '운영자 답변 완료' : '답변 대기'} · {new Date(post.createdAt).toLocaleDateString('ko-KR')}</span><p className="mt-1 break-words text-sm font-bold">{post.title}</p><span className="mt-1 inline-block text-xs font-semibold text-[#0B3B36]">글 열고 답변하기 →</span></Link>)}
      {data?.content.length === 0 && <p className="py-4 text-center text-sm text-muted">{answered ? '답변 완료된 고민이 없습니다.' : '답변을 기다리는 고민이 없습니다.'}</p>}
      {compact ? <Link href="/admin?tab=concerns" className="inline-block pt-2 text-xs font-bold text-[#0B3B36]">고민·질문 관리 전체 보기 →</Link> : <Pagination page={page} totalPages={data?.totalPages ?? 0} onPageChange={setPage} />}
    </div>}
  </section>;
}
