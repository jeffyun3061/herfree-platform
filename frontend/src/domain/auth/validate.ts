// 백엔드 SignupRequest Bean Validation과 동일한 기준으로 클라이언트에서 선검증한다.
// 서버 검증이 최종 기준이지만, 즉각적인 피드백으로 불필요한 요청을 줄인다.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type FieldErrors = Record<string, string>;

export function validateEmail(email: string): string | null {
  if (!email.trim()) return '이메일을 입력해 주세요.';
  if (!EMAIL_PATTERN.test(email)) return '올바른 이메일 형식이 아닙니다.';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return '비밀번호를 입력해 주세요.';
  if (password.length < 8) return '비밀번호는 최소 8자 이상이어야 합니다.';
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
  if (!input.password) errors.password = '비밀번호를 입력해 주세요.';
  return errors;
}
