'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

type HealthDataConsentGateProps = {
  isUpdating: boolean;
  error?: string | null;
  onAgree: () => Promise<void>;
};

export function HealthDataConsentGate({ isUpdating, error, onAgree }: HealthDataConsentGateProps) {
  return (
    <section className="mx-auto max-w-app rounded-[20px] border border-[#D7E4DC] bg-white p-5 shadow-card">
      <h2 className="text-base font-bold text-[#0B3B36]">개인일지 이용 동의가 필요해요</h2>
      <p className="mt-2 text-sm leading-6 text-[#5C645A]">
        개인일지에는 증상·투약·수면·스트레스·메모 등 건강 관련 정보가 저장될 수 있습니다.
        아래 내용을 확인하고 동의하면 본인 전용 개인일지를 이용할 수 있습니다.
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-xs leading-5 text-[#5C645A]">
        <li>개인일지는 로그인한 본인 계정에서만 조회됩니다.</li>
        <li>자유입력 메모는 AES-GCM으로 암호화됩니다.</li>
        <li>동의를 철회하면 개인일지 기록은 삭제되고 개인일지 API가 차단됩니다.</li>
        <li>건강정보 통계 활용은 별도 선택 동의이며 기본 기능과 분리됩니다.</li>
      </ul>
      <p className="mt-3 text-xs leading-5 text-[#7A8178]">
        <Link href="/privacy#health-data" className="underline underline-offset-2">
          개인정보처리방침의 건강정보 처리 항목을 확인하세요.
        </Link>
      </p>
      {error && <ErrorMessage message={error} className="mt-3" />}
      <Button
        type="button"
        fullWidth
        className="mt-4"
        disabled={isUpdating}
        onClick={() => void onAgree().catch(() => undefined)}
      >
        {isUpdating ? '동의 처리 중…' : '확인하고 개인일지 시작하기'}
      </Button>
    </section>
  );
}
