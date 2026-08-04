'use client';

import Link from 'next/link';

export type SignupAgreementState = {
  agreeTerms: boolean;
  agreePrivacy: boolean;
  agreeSensitive: boolean;
  agreeAge: boolean;
  agreeMarketing: boolean;
  agreeHealthStatistics: boolean;
};

type SignupAgreementFieldsProps = {
  value: SignupAgreementState;
  onChange: (next: SignupAgreementState) => void;
};

export function SignupAgreementFields({ value, onChange }: SignupAgreementFieldsProps) {
  const allAgreed = Object.values(value).every(Boolean);

  const toggleAll = (checked: boolean) => {
    onChange({
      agreeTerms: checked,
      agreePrivacy: checked,
      agreeSensitive: checked,
      agreeAge: checked,
      agreeMarketing: checked,
      agreeHealthStatistics: checked,
    });
  };

  return (
    <div className="space-y-3 rounded-[18px] border border-[#ECE5D8] bg-white p-4 shadow-card">
      <label className="flex items-center gap-3 border-b border-[#ECE5D8] pb-3 text-sm font-bold text-[#0B3B36]">
        <input
          type="checkbox"
          checked={allAgreed}
          onChange={(e) => toggleAll(e.target.checked)}
          className="h-5 w-5 shrink-0 rounded border-[#C9C1B3] text-[#0B3B36] focus:ring-[#0B3B36]"
        />
        <span>전체 동의하기</span>
      </label>
      <label className="flex items-start gap-3 text-sm text-[#1E2621]">
        <input
          type="checkbox"
          checked={value.agreeTerms}
          onChange={(e) => onChange({ ...value, agreeTerms: e.target.checked })}
          className="mt-0.5 h-5 w-5 shrink-0 rounded border-[#C9C1B3] text-[#0B3B36] focus:ring-[#0B3B36]"
        />
        <span>
          <span className="font-medium text-[#0B3B36]">[필수]</span>{' '}
          <Link href="/terms" className="underline underline-offset-2">
            이용약관
          </Link>
          에 동의합니다.
        </span>
      </label>
      <label className="flex items-start gap-3 text-sm text-[#1E2621]">
        <input
          type="checkbox"
          checked={value.agreeSensitive}
          onChange={(e) => onChange({ ...value, agreeSensitive: e.target.checked })}
          className="mt-0.5 h-5 w-5 shrink-0 rounded border-[#C9C1B3] text-[#0B3B36] focus:ring-[#0B3B36]"
        />
        <span>
          <span className="font-medium text-[#5C645A]">[선택·개인일지 이용 시 필요]</span>{' '}
          <Link href="/privacy#health-data" className="underline underline-offset-2">
            증상·투약·건강 메모 등 민감정보 처리
          </Link>
          에 동의합니다.
          <span className="mt-1 block text-xs leading-5 text-[#7A8178]">
            동의하지 않아도 커뮤니티에 가입할 수 있습니다. 개인일지를 저장하려면 개인일지 화면에서 별도 동의가 필요합니다.
          </span>
        </span>
      </label>
      <label className="flex items-start gap-3 text-sm text-[#1E2621]">
        <input
          type="checkbox"
          checked={value.agreePrivacy}
          onChange={(e) => onChange({ ...value, agreePrivacy: e.target.checked })}
          className="mt-0.5 h-5 w-5 shrink-0 rounded border-[#C9C1B3] text-[#0B3B36] focus:ring-[#0B3B36]"
        />
        <span>
          <span className="font-medium text-[#0B3B36]">[필수]</span>{' '}
          <Link href="/privacy" className="underline underline-offset-2">
            개인정보처리방침
          </Link>
          에 동의합니다.
        </span>
      </label>
      <label className="flex items-start gap-3 text-sm text-[#1E2621]">
        <input
          type="checkbox"
          checked={value.agreeAge}
          onChange={(e) => onChange({ ...value, agreeAge: e.target.checked })}
          className="mt-0.5 h-5 w-5 shrink-0 rounded border-[#C9C1B3] text-[#0B3B36] focus:ring-[#0B3B36]"
        />
        <span>
          <span className="font-medium text-[#0B3B36]">[필수]</span> 만 14세 이상입니다.
        </span>
      </label>
      <label className="flex items-start gap-3 text-sm text-[#1E2621]">
        <input
          type="checkbox"
          checked={value.agreeHealthStatistics}
          onChange={(e) => onChange({ ...value, agreeHealthStatistics: e.target.checked })}
          className="mt-0.5 h-5 w-5 shrink-0 rounded border-[#C9C1B3] text-[#0B3B36] focus:ring-[#0B3B36]"
        />
        <span>
          <span className="font-medium text-[#5C645A]">[선택]</span>{' '}
          <Link href="/privacy#health-statistics" className="underline underline-offset-2">
            건강정보 통계 활용
          </Link>
          에 동의합니다.
          <span className="mt-1 block text-xs leading-5 text-[#7A8178]">
            증상·투약·수면·스트레스 선택값을 통계·서비스 개선에 활용합니다.
            메모와 게시글 내용은 제외하며, 동의는 철회 또는 탈퇴까지 유효합니다.
            거부해도 기본 기능을 이용할 수 있습니다.
          </span>
        </span>
      </label>
      <label className="flex items-start gap-3 text-sm text-[#1E2621]">
        <input
          type="checkbox"
          checked={value.agreeMarketing}
          onChange={(e) => onChange({ ...value, agreeMarketing: e.target.checked })}
          className="mt-0.5 h-5 w-5 shrink-0 rounded border-[#C9C1B3] text-[#0B3B36] focus:ring-[#0B3B36]"
        />
        <span>
          <span className="font-medium text-[#5C645A]">[선택]</span> 마케팅 정보 수신에 동의합니다.
        </span>
      </label>
    </div>
  );
}

export function isRequiredSignupAgreed(value: SignupAgreementState): boolean {
  return value.agreeTerms && value.agreePrivacy && value.agreeAge;
}
