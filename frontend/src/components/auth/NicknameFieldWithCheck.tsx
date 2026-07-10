'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { checkNicknameAvailability } from '@/lib/api/auth';
import { validateNickname } from '@/domain/auth/validate';
import { getErrorMessage } from '@/lib/api/client';

type NicknameFieldWithCheckProps = {
  nickname: string;
  onNicknameChange: (value: string) => void;
  error?: string;
  onAvailabilityChange?: (available: boolean | null) => void;
};

export function NicknameFieldWithCheck({
  nickname,
  onNicknameChange,
  error,
  onAvailabilityChange,
}: NicknameFieldWithCheckProps) {
  const [availability, setAvailability] = useState<'idle' | 'available' | 'unavailable' | 'checking'>('idle');
  const [checkMessage, setCheckMessage] = useState<string | null>(null);
  const [checkedNickname, setCheckedNickname] = useState('');

  const updateAvailability = (next: 'idle' | 'available' | 'unavailable' | 'checking') => {
    setAvailability(next);
    onAvailabilityChange?.(
      next === 'available' ? true : next === 'unavailable' ? false : null,
    );
  };

  const handleNicknameChange = (value: string) => {
    onNicknameChange(value);
    if (value.trim() !== checkedNickname) {
      updateAvailability('idle');
      setCheckMessage(null);
    }
  };

  const handleCheck = async () => {
    const nicknameError = validateNickname(nickname);
    if (nicknameError) {
      setCheckMessage(nicknameError);
      updateAvailability('unavailable');
      return;
    }

    setCheckMessage(null);
    updateAvailability('checking');

    try {
      const result = await checkNicknameAvailability(nickname.trim());
      const trimmed = nickname.trim();
      setCheckedNickname(trimmed);
      if (result.available) {
        updateAvailability('available');
        setCheckMessage('사용 가능한 닉네임이에요.');
      } else {
        updateAvailability('unavailable');
        setCheckMessage('이미 사용 중인 닉네임이에요.');
      }
    } catch (err) {
      updateAvailability('idle');
      setCheckMessage(getErrorMessage(err));
    }
  };

  return (
    <div>
      <label className="mb-2 block text-[12px] font-medium text-[#5C645A]">닉네임</label>
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <input
            required
            value={nickname}
            onChange={(e) => handleNicknameChange(e.target.value)}
            maxLength={20}
            placeholder="커뮤니티에 표시될 이름"
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
