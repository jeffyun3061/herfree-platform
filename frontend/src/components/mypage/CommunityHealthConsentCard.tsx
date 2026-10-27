'use client';

import { useState } from 'react';
import { useCommunityHealthConsent } from '@/hooks/useCommunityHealthConsent';
import { CommunityHealthConsentPanel } from '@/components/community/CommunityHealthConsentPanel';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

export function CommunityHealthConsentCard() {
  const state = useCommunityHealthConsent();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const withdraw = async () => {
    const result = await state.update(false);
    if (!result) return;
    setConfirmOpen(false);
    setMessage(result.deletionRequestId
      ? `동의를 철회하고 적용 대상 본인 콘텐츠를 숨겼습니다. 삭제 요청을 접수했으며 원문 삭제 완료는 아닙니다. 접수번호: ${result.deletionRequestId}`
      : '동의를 철회했습니다. 삭제 요청 처리 상태는 운영 문의로 확인해 주세요. 원문 삭제 완료를 뜻하지 않습니다.');
  };
  return <div id="community-health-consent" className="scroll-mt-5">
    <CommunityHealthConsentPanel state={state} showManageLink={false} />
    {state.consent?.latestDecisionAgreed === true && <Button type="button" variant="secondary" size="sm" className="mt-3" disabled={state.isLoading || state.isUpdating} onClick={() => setConfirmOpen(true)}>익명 고민 동의 철회 · 숨김 및 삭제 요청</Button>}
    {message && <p role="status" className="mt-3 text-[12px] leading-6 text-[#36453B]">{message}</p>}
    {!message && state.consent?.deletionRequestId && <p className="mt-3 text-[12px] leading-6 text-[#36453B]">삭제 요청 접수번호: {state.consent.deletionRequestId}. 원문 파기 완료 여부는 운영 문의로 확인해 주세요.</p>}
    <ConfirmModal open={confirmOpen} title="익명 고민 건강정보 동의 철회" message={'이 동의가 적용된 본인의 익명 고민 글·댓글을 즉시 숨기고 삭제 요청을 접수합니다.\n원문 삭제가 완료되는 것은 아닙니다. 동의 전 기존 콘텐츠·다른 게시판·개인일지에는 자동 적용되지 않습니다.'} confirmLabel="철회하고 숨김·삭제 요청" variant="danger" isLoading={state.isUpdating} onConfirm={() => void withdraw()} onClose={() => setConfirmOpen(false)} />
  </div>;
}
