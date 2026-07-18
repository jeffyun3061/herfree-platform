'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoggedOutMyPagePromptCard } from '@/components/mypage/LoggedOutMyPagePrompt';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  PASSWORD_HINT,
  PASSWORD_MAX_LENGTH,
  validateNickname,
  validatePassword,
} from '@/domain/auth/validate';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/api/client';
import { fetchAccountSecurity } from '@/lib/api/users';

export default function AccountSettingsPage() {
  const router = useRouter();
  const { isReady, isLoggedIn, user, updateNickname, changePassword } = useAuth();
  const [nickname, setNickname] = useState('');
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [nicknameSuccess, setNicknameSuccess] = useState<string | null>(null);
  const [isUpdatingNickname, setIsUpdatingNickname] = useState(false);
  const [passwordChangeAvailable, setPasswordChangeAvailable] = useState<boolean | null>(null);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    if (!isReady || !isLoggedIn) return;
    let active = true;
    void fetchAccountSecurity()
      .then((result) => {
        if (active) setPasswordChangeAvailable(result.passwordChangeAvailable);
      })
      .catch((error) => {
        if (active) setSecurityError(getErrorMessage(error));
      });
    return () => {
      active = false;
    };
  }, [isReady, isLoggedIn]);

  if (!isReady) return <LoadingSpinner label="회원정보 불러오는 중…" />;
  if (!isLoggedIn) return <LoggedOutMyPagePromptCard />;

  const handleNicknameSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextNickname = nickname.trim();
    const validationError = validateNickname(nextNickname);
    if (validationError) {
      setNicknameError(validationError);
      return;
    }
    if (nextNickname === user?.nickname) {
      setNicknameError('현재 사용 중인 닉네임입니다.');
      setNicknameSuccess(null);
      return;
    }

    setIsUpdatingNickname(true);
    setNicknameError(null);
    setNicknameSuccess(null);
    try {
      await updateNickname(nextNickname);
      setNickname('');
      setNicknameSuccess(`${nextNickname}으로 변경되었습니다.`);
    } catch (error) {
      setNicknameError(getErrorMessage(error));
    } finally {
      setIsUpdatingNickname(false);
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const errors: Record<string, string> = {};
    if (!currentPassword) errors.currentPassword = '현재 비밀번호를 입력해 주세요.';
    else {
      const currentPasswordError = validatePassword(currentPassword);
      if (currentPasswordError) errors.currentPassword = currentPasswordError;
    }
    const newPasswordError = validatePassword(newPassword);
    if (newPasswordError) errors.newPassword = newPasswordError;
    else if (currentPassword === newPassword) {
      errors.newPassword = '현재 비밀번호와 다른 비밀번호를 입력해 주세요.';
    }
    if (newPassword !== newPasswordConfirm) {
      errors.newPasswordConfirm = '비밀번호가 일치하지 않습니다.';
    }
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setPasswordErrors({});
    setPasswordError(null);
    setIsUpdatingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
      router.replace('/login?reason=password_changed');
    } catch (error) {
      setPasswordError(getErrorMessage(error));
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <>
      <PageHeader title="회원정보 수정" showBack backHref="/mypage" />
      <main className="page-container mx-auto w-full max-w-app pb-24 lg:max-w-content lg:pb-12">
        <header className="mb-5 px-0.5">
          <h1 className="hf-display text-[24px] font-extrabold text-[#1E2621] lg:hidden">회원정보 수정</h1>
          <p className="mt-1 text-[12.5px] leading-[1.65] text-[#7C8279]">
            커뮤니티에 표시되는 이름과 로그인 비밀번호를 관리합니다.
          </p>
        </header>

        <section className="mypage-menu-card px-[17px] py-[18px]">
          <h2 className="text-[15px] font-bold text-[#15201D]">닉네임 변경</h2>
          <p className="mt-1 text-[11.5px] leading-[1.6] text-[#8A9287]">
            현재 닉네임은 <strong className="font-semibold text-[#4E5851]">{user?.nickname}</strong>이며, 30일에 한 번 변경할 수 있습니다.
          </p>
          <form onSubmit={(event) => void handleNicknameSubmit(event)} className="mt-4">
            <Input
              id="account-nickname"
              label="새 닉네임"
              placeholder="새 닉네임을 입력해 주세요"
              value={nickname}
              required
              onChange={(event) => {
                setNickname(event.target.value);
                setNicknameError(null);
                setNicknameSuccess(null);
              }}
              maxLength={20}
              showCharCount
              error={nicknameError ?? undefined}
            />
            {nicknameSuccess && (
              <p className="mt-3 rounded-[12px] bg-[#EEF7F1] px-3 py-2.5 text-[12px] font-semibold text-[#167A55]" role="status">
                {nicknameSuccess}
              </p>
            )}
            <Button type="submit" fullWidth className="mt-4" disabled={isUpdatingNickname}>
              {isUpdatingNickname ? '변경 중…' : '닉네임 변경'}
            </Button>
          </form>
        </section>

        <section className="mypage-menu-card mt-4 px-[17px] py-[18px]">
          <h2 className="text-[15px] font-bold text-[#15201D]">비밀번호 변경</h2>
          {securityError ? (
            <div className="mt-3"><ErrorMessage message={securityError} /></div>
          ) : passwordChangeAvailable === null ? (
            <div className="mt-4"><LoadingSpinner label="계정 확인 중…" /></div>
          ) : !passwordChangeAvailable ? (
            <p className="mt-3 rounded-[12px] bg-[#F6F1E8] px-3.5 py-3 text-[12px] leading-[1.7] text-[#687068]">
              소셜 로그인 계정의 비밀번호는 연결된 카카오·네이버·구글 계정에서 관리해 주세요.
            </p>
          ) : (
            <>
              <p className="mt-1 text-[11.5px] leading-[1.6] text-[#8A9287]">
                현재 비밀번호를 확인한 뒤 {PASSWORD_HINT} 조건의 새 비밀번호로 변경합니다.
              </p>
              <form onSubmit={(event) => void handlePasswordSubmit(event)} className="mt-4 space-y-4">
                <Input
                  id="current-password"
                  label="현재 비밀번호"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  required
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  maxLength={PASSWORD_MAX_LENGTH}
                  error={passwordErrors.currentPassword}
                />
                <Input
                  id="new-password"
                  label="새 비밀번호"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  required
                  onChange={(event) => setNewPassword(event.target.value)}
                  maxLength={PASSWORD_MAX_LENGTH}
                  hint={<span className="text-[11px] font-normal text-[#9A9F94]">{PASSWORD_HINT}</span>}
                  error={passwordErrors.newPassword}
                />
                <Input
                  id="new-password-confirm"
                  label="새 비밀번호 확인"
                  type="password"
                  autoComplete="new-password"
                  value={newPasswordConfirm}
                  required
                  onChange={(event) => setNewPasswordConfirm(event.target.value)}
                  maxLength={PASSWORD_MAX_LENGTH}
                  error={passwordErrors.newPasswordConfirm}
                />
                {passwordError && <ErrorMessage message={passwordError} />}
                <Button type="submit" fullWidth disabled={isUpdatingPassword}>
                  {isUpdatingPassword ? '변경 중…' : '비밀번호 변경'}
                </Button>
              </form>
            </>
          )}
        </section>
      </main>
    </>
  );
}
