'use client';

import Link from 'next/link';

export type SignupAgreementState = {
  agreeTerms: boolean;
  agreePrivacy: boolean;
  agreeSensitive: boolean;
  agreeAge: boolean;
  agreeMarketing: boolean;
};

type SignupAgreementFieldsProps = {
  value: SignupAgreementState;
  onChange: (next: SignupAgreementState) => void;
};

export function SignupAgreementFields({ value, onChange }: SignupAgreementFieldsProps) {
  return (
    <div className="space-y-3 rounded-[18px] border border-[#ECE5D8] bg-white p-4 shadow-card">
      <label className="flex items-start gap-3 text-sm text-[#1E2621]">
        <input
          type="checkbox"
          checked={value.agreeTerms}
          onChange={(e) => onChange({ ...value, agreeTerms: e.target.checked })}
          className="mt-0.5 h-4 w-4 rounded border-[#ECE5D8] text-[#0B3B36] focus:ring-[#0B3B36]"
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
          className="mt-0.5 h-4 w-4 rounded border-[#ECE5D8] text-[#0B3B36] focus:ring-[#0B3B36]"
        />
        <span>
          <span className="font-medium text-[#0B3B36]">[필수]</span>{' '}
          증상·투약·건강 메모 등 민감정보 처리에 동의합니다.
        </span>
      </label>
      <label className="flex items-start gap-3 text-sm text-[#1E2621]">
        <input
          type="checkbox"
          checked={value.agreePrivacy}
          onChange={(e) => onChange({ ...value, agreePrivacy: e.target.checked })}
          className="mt-0.5 h-4 w-4 rounded border-[#ECE5D8] text-[#0B3B36] focus:ring-[#0B3B36]"
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
          className="mt-0.5 h-4 w-4 rounded border-[#ECE5D8] text-[#0B3B36] focus:ring-[#0B3B36]"
        />
        <span>
          <span className="font-medium text-[#0B3B36]">[필수]</span> 만 14세 이상입니다.
        </span>
      </label>
      <label className="flex items-start gap-3 text-sm text-[#1E2621]">
        <input
          type="checkbox"
          checked={value.agreeMarketing}
          onChange={(e) => onChange({ ...value, agreeMarketing: e.target.checked })}
          className="mt-0.5 h-4 w-4 rounded border-[#ECE5D8] text-[#0B3B36] focus:ring-[#0B3B36]"
        />
        <span>
          <span className="font-medium text-[#5C645A]">[선택]</span> 마케팅 정보 수신에 동의합니다.
        </span>
      </label>
    </div>
  );
}

export function isRequiredSignupAgreed(value: SignupAgreementState): boolean {
  return value.agreeTerms && value.agreePrivacy && value.agreeSensitive && value.agreeAge;
}
