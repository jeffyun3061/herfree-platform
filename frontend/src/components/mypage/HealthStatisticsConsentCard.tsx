'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  fetchHealthStatisticsConsent,
  updateHealthStatisticsConsent,
} from '@/lib/api/users';
import { getErrorMessage } from '@/lib/api/client';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

export function HealthStatisticsConsentCard() {
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  useEffect(() => {
    let active = true;
    void fetchHealthStatisticsConsent()
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
      const response = await updateHealthStatisticsConsent(next);
      setAgreed(response.agreed);
      setMessage(response.agreed
        ? '건강정보 통계 활용에 동의했습니다.'
        : '동의를 철회했습니다. 이후 통계 집계에서 제외됩니다.');
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
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[13.5px] font-semibold text-[#15201D]">건강정보 통계 활용</p>
              <p className="mt-1 text-[11.5px] leading-5 text-[#8A9287]">
                최소 표본 집계에만 참여하며 메모와 게시글 내용은 제외됩니다.
              </p>
              <Link
                href="/privacy#health-statistics"
                className="mt-1 inline-block text-[11px] font-semibold text-[#0B3B36] underline underline-offset-2"
              >
                처리 기준 보기
              </Link>
            </div>
            <span
              className={`shrink-0 text-[11px] font-semibold ${
                agreed ? 'text-[#167A55]' : 'text-[#8A9287]'
              }`}
            >
              {isLoading ? '확인 중' : agreed ? '동의함' : '동의하지 않음'}
            </span>
          </div>
          <div className="mt-3">
            {agreed ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={isLoading || isSaving}
                onClick={() => setWithdrawOpen(true)}
              >
                동의 철회
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                disabled={isLoading || isSaving}
                onClick={() => void updateConsent(true)}
              >
                {isSaving ? '처리 중…' : '동의하기'}
              </Button>
            )}
          </div>
        </div>
        {message && (
          <p className="border-t border-[#F2ECE1] px-[17px] py-2.5 text-[11.5px] leading-5 text-[#5C645A]">
            {message}
          </p>
        )}
      </div>
      <ConfirmModal
        open={withdrawOpen}
        title="건강정보 통계 활용 동의 철회"
        message={'동의를 철회하면 이후 공개·운영 통계 집계에서 기록이 제외됩니다.\n개인 일지와 커뮤니티 기능은 그대로 이용할 수 있습니다.'}
        confirmLabel="동의 철회"
        variant="danger"
        isLoading={isSaving}
        onConfirm={() => void updateConsent(false)}
        onClose={() => setWithdrawOpen(false)}
      />
    </>
  );
}
