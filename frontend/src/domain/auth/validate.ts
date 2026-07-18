// 백엔드 CredentialPolicy와 동일한 기준으로 클라이언트에서 선검증한다.
// 서버 검증이 최종 기준이지만, 즉각적인 피드백으로 불필요한 요청을 줄인다.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_SPECIAL_CHAR_PATTERN = /[^A-Za-z0-9]/;

export const EMAIL_MAX_LENGTH = 254;
export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 24;
/** 로그인·현재 비밀번호 입력 (기존 긴 비밀번호 계정 호환) */
export const PASSWORD_INPUT_MAX_LENGTH = 64;

export const PASSWORD_HINT = '10~24자, 특수문자 1개 이상';

export type FieldErrors = Record<string, string>;

export function validateEmail(email: string): string | null {
  if (!email.trim()) return '이메일을 입력해 주세요.';
  if (email.length > EMAIL_MAX_LENGTH) return `이메일은 ${EMAIL_MAX_LENGTH}자 이하로 입력해 주세요.`;
  if (!EMAIL_PATTERN.test(email)) return '올바른 이메일 형식이 아닙니다.';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return '비밀번호를 입력해 주세요.';
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `비밀번호는 ${PASSWORD_MIN_LENGTH}~${PASSWORD_MAX_LENGTH}자로 입력해 주세요.`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `비밀번호는 ${PASSWORD_MAX_LENGTH}자 이하로 입력해 주세요.`;
  }
  if (!PASSWORD_SPECIAL_CHAR_PATTERN.test(password)) {
    return '비밀번호에 특수문자(!, @, # 등)를 하나 이상 포함해 주세요.';
  }
  return null;
}

export function validateNickname(nickname: string): string | null {
  if (!nickname.trim()) return '닉네임을 입력해 주세요.';
  if (nickname.length > 20) return '닉네임은 최대 20자까지 입력할 수 있습니다.';
  return null;
}

export function validateSignup(input: {
  email: string;
  password: string;
  passwordConfirm: string;
  nickname: string;
}): FieldErrors {
  const errors: FieldErrors = {};

  const emailError = validateEmail(input.email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(input.password);
  if (passwordError) errors.password = passwordError;
  else if (input.password !== input.passwordConfirm) {
    errors.passwordConfirm = '비밀번호가 일치하지 않습니다.';
  }

  const nicknameError = validateNickname(input.nickname);
  if (nicknameError) errors.nickname = nicknameError;

  return errors;
}

export function validateLogin(input: { email: string; password: string }): FieldErrors {
  const errors: FieldErrors = {};
  if (!input.email.trim()) errors.email = '이메일을 입력해 주세요.';
  else if (input.email.length > EMAIL_MAX_LENGTH) {
    errors.email = `이메일은 ${EMAIL_MAX_LENGTH}자 이하로 입력해 주세요.`;
  }
  if (!input.password) errors.password = '비밀번호를 입력해 주세요.';
  else if (input.password.length > PASSWORD_INPUT_MAX_LENGTH) {
    errors.password = `비밀번호는 ${PASSWORD_INPUT_MAX_LENGTH}자 이하로 입력해 주세요.`;
  }
  return errors;
}
