'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import type { CommunityHealthConsentState } from '@/hooks/useCommunityHealthConsent';

export function CommunityHealthConsentPanel({ state, showManageLink = true }: { state: CommunityHealthConsentState; showManageLink?: boolean }) {
  const [acceptedVersion, setAcceptedVersion] = useState<string | null>(null);
  const accepted = !state.agreed && !!state.consent && acceptedVersion === state.consent.requiredPolicyVersion;

  return <section aria-label="익명 고민 건강정보 처리 동의" className="mt-4 rounded-xl border border-[#D7E4DC] bg-white p-4 text-[12px] leading-[1.7] text-[#36453B]">
    <h3 className="font-bold text-[#0B3B36]">익명 고민 건강정보 처리 · 개인일지와 별도</h3>
    {state.isLoading ? <p role="status" className="mt-2">동의 상태를 확인하고 있어요.</p> : state.agreed ? <>
      <p className="mt-2">현재 버전의 익명 고민 건강정보 처리에 동의했습니다. 글과 답변의 공개 여부는 등록 전에 따로 확인해 주세요.</p>
      {showManageLink && <Link href="/mypage#community-health-consent" className="mt-2 inline-block underline underline-offset-2">동의 확인·철회 및 삭제 요청</Link>}
    </> : <>
      <ul className="mt-2 list-disc space-y-1 pl-4">
        <li>항목: 익명 고민의 제목·본문·첨부 사진·댓글에 본인이 입력하는 증상·병력 등 건강정보.</li>
        <li>목적: 공개 고민 게시·답변 및 신고·권리 요청 처리. 개인일지·건강통계 동의와 구분됩니다.</li>
        <li>거부할 수 있으며 가입·읽기에는 영향이 없습니다. 동의 전에는 새 익명 고민 글·답변·사진을 등록할 수 없습니다.</li>
        <li>철회하면 이 동의가 적용된 본인 콘텐츠를 숨기고 삭제 요청을 접수합니다. 접수는 원문 파기 완료가 아닙니다.</li>
        <li>동의 전 기존 콘텐츠·다른 게시판·개인일지에는 자동으로 적용되지 않습니다.</li>
      </ul>
      <p className="mt-2 rounded bg-[#FFF5DF] p-2 text-[#6B552E]">검토용 안내: 원문·동의 증빙의 보유기간과 삭제 요청 처리기한은 운영자·법률 검토로 확정해야 합니다. 이 확인 전에는 운영 서비스에 적용하지 않습니다.</p>
      <Link href="/privacy" className="mt-2 inline-block underline underline-offset-2">개인정보처리방침 확인</Link>
      {state.consent && <>
        <p className="mt-2 text-[11px] text-muted">검토 정책 버전: {state.consent.requiredPolicyVersion}</p>
        <label className="mt-3 flex items-start gap-2"><input type="checkbox" checked={accepted} onChange={(event) => setAcceptedVersion(event.target.checked ? state.consent?.requiredPolicyVersion ?? null : null)} className="mt-1 h-4 w-4 shrink-0 accent-[#0B3B36]" /><span>위 익명 고민 건강정보 처리에 별도로 동의합니다.</span></label>
        <Button type="button" size="sm" className="mt-3" disabled={!accepted || state.isUpdating} onClick={() => { setAcceptedVersion(null); void state.update(true); }}>{state.isUpdating ? '동의 처리 중…' : '익명 고민 건강정보 처리에 동의'}</Button>
      </>}
      <div><Link href="/journal" prefetch={false} className="mt-3 inline-block underline underline-offset-2">동의하지 않고 본인 전용 개인일지 이용하기</Link></div>
    </>}
    {state.error && <ErrorMessage message={state.error} className="mt-2" />}
    {!state.isLoading && !state.consent && <Button type="button" size="sm" variant="secondary" className="mt-2" onClick={() => void state.refresh()}>동의 상태 다시 확인</Button>}
  </section>;
}
