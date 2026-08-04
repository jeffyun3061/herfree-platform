'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { getErrorMessage } from '@/lib/api/client';
import { fetchHealthDataConsent, updateHealthDataConsent } from '@/lib/api/users';

/**
 * The journal consent is intentionally managed separately from statistics
 * consent. Revocation is destructive: the API deletes journal rows in the
 * same transaction before returning the revoked state.
 */
export function HealthDataConsentCard() {
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  useEffect(() => {
    let active = true;
    void fetchHealthDataConsent()
      .then((response) => {
        if (active) setAgreed(response.agreed);
      })
      .catch((error) => {
        if (active) setMessage(getErrorMessage(error));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const updateConsent = async (next: boolean) => {
    if (isLoading || isSaving) return;
    setIsSaving(true);
    setMessage(null);
    try {
      const response = await updateHealthDataConsent(next);
      setAgreed(response.agreed);
      setMessage(response.agreed
        ? '개인일지 건강정보 처리 동의가 완료되었습니다.'
        : '동의를 철회하고 기존 개인일지 기록을 삭제했습니다.');
      setWithdrawOpen(false);
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="mypage-menu-card">
        <div className="px-[17px] py-[15px]">
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 text-[13.5px] font-semibold text-[#15201D]">개인일지 건강정보 처리</p>
            <span className={`shrink-0 text-[11px] font-semibold ${agreed ? 'text-[#167A55]' : 'text-[#8A9287]'}`}>
              {isLoading ? '확인 중' : agreed ? '동의 중' : '동의하지 않음'}
            </span>
          </div>
          <p className="mt-1 text-[11.5px] leading-5 text-[#8A9287]">
            <span className="block">증상·투약·수면·스트레스·메모 등 개인일지 저장에 필요합니다.</span>
            <span className="block">철회하면 기존 개인일지를 삭제하고 일지 API를 잠급니다.</span>
          </p>
          <Link href="/privacy#health-data" className="mt-1 inline-block text-[11px] font-semibold text-[#0B3B36] underline underline-offset-2">
            처리 기준 보기
          </Link>
          <div className="mt-3">
            {agreed ? (
              <Button type="button" variant="secondary" size="sm" disabled={isLoading || isSaving} onClick={() => setWithdrawOpen(true)}>
                동의 철회 및 기록 삭제
              </Button>
            ) : (
              <Button type="button" size="sm" disabled={isLoading || isSaving} onClick={() => void updateConsent(true)}>
                {isSaving ? '처리 중…' : '동의하고 개인일지 사용'}
              </Button>
            )}
          </div>
        </div>
        {message && <p className="border-t border-[#F2ECE1] px-[17px] py-2.5 text-[11.5px] leading-5 text-[#5C645A]">{message}</p>}
      </div>
      <ConfirmModal
        open={withdrawOpen}
        title="개인일지 건강정보 동의 철회"
        message={'동의를 철회하면 기존 개인일지 원문과 구조화 기록이 삭제되고 복구할 수 없습니다.\n커뮤니티와 건강통계 동의에는 영향을 주지 않습니다.'}
        confirmLabel="철회하고 기록 삭제"
        variant="danger"
        isLoading={isSaving}
        onConfirm={() => void updateConsent(false)}
        onClose={() => setWithdrawOpen(false)}
      />
    </>
  );
}
