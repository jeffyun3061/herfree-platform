'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { checkEmailAvailability } from '@/lib/api/auth';
import { validateEmail } from '@/domain/auth/validate';
import { getErrorMessage } from '@/lib/api/client';

type EmailFieldWithCheckProps = {
  email: string;
  onEmailChange: (value: string) => void;
  error?: string;
  onAvailabilityChange?: (available: boolean | null) => void;
};

export function EmailFieldWithCheck({
  email,
  onEmailChange,
  error,
  onAvailabilityChange,
}: EmailFieldWithCheckProps) {
  const [availability, setAvailability] = useState<'idle' | 'available' | 'unavailable' | 'checking'>('idle');
  const [checkMessage, setCheckMessage] = useState<string | null>(null);
  const [checkedEmail, setCheckedEmail] = useState('');

  const updateAvailability = (next: 'idle' | 'available' | 'unavailable' | 'checking') => {
    setAvailability(next);
    onAvailabilityChange?.(
      next === 'available' ? true : next === 'unavailable' ? false : null,
    );
  };

  const handleEmailChange = (value: string) => {
    onEmailChange(value);
    if (value.trim().toLowerCase() !== checkedEmail) {
      updateAvailability('idle');
      setCheckMessage(null);
    }
  };

  const handleCheck = async () => {
    const emailError = validateEmail(email);
    if (emailError) {
      setCheckMessage(emailError);
      updateAvailability('unavailable');
      return;
    }

    setCheckMessage(null);
    updateAvailability('checking');

    try {
      const result = await checkEmailAvailability(email.trim());
      const normalized = email.trim().toLowerCase();
      setCheckedEmail(normalized);
      if (result.available) {
        updateAvailability('available');
        setCheckMessage('사용 가능한 이메일이에요.');
      } else {
        updateAvailability('unavailable');
        setCheckMessage('이미 가입된 이메일이에요. 로그인하거나 비밀번호 찾기를 이용해 주세요.');
      }
    } catch (err) {
      updateAvailability('idle');
      setCheckMessage(getErrorMessage(err));
    }
  };

  return (
    <div>
      <label htmlFor="signup-email" className="mb-2 block text-[12px] font-medium text-[#5C645A]">
        이메일<span className="text-[#C0512F]">*</span>
      </label>
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <input
            id="signup-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            maxLength={254}
            placeholder="이메일을 입력해 주세요"
            className="h-[46px] w-full rounded-[12px] border border-[#ECE5D8] bg-white px-3.5 text-[14px] text-[#1E2621] outline-none transition focus:border-[#0B3B36] focus:ring-2 focus:ring-[#0B3B36]/15"
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          className="h-[46px] shrink-0 px-4 text-[13px]"
          disabled={availability === 'checking'}
          onClick={() => void handleCheck()}
        >
          {availability === 'checking' ? '확인 중…' : '중복확인'}
        </Button>
      </div>
      {error ? <p className="mt-1.5 text-[12px] text-red-600">{error}</p> : null}
      {checkMessage ? (
        <p
          className={
            availability === 'available'
              ? 'mt-1.5 text-[12px] text-[#0B3B36]'
              : 'mt-1.5 text-[12px] text-red-600'
          }
        >
          {checkMessage}
        </p>
      ) : null}
    </div>
  );
}
