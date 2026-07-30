'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type { LoginRequest, OAuthLoginResult, SignupRequest } from '@/domain/auth/types';
import type { SessionUser } from '@/domain/user/types';
import * as authApi from '@/lib/api/auth';
import * as usersApi from '@/lib/api/users';
import { isApiError } from '@/lib/api/client';
import {
  bumpAuthEpoch,
  clearAuth,
  getAuthEpoch,
  setSessionUser,
} from '@/lib/auth-storage';
import { clearAppNotice } from '@/lib/app-notice';
import { forceUnlockBodyScroll } from '@/lib/body-scroll-lock';

type AuthContextValue = {
  user: SessionUser | null;
  isReady: boolean;
  isLoggedIn: boolean;
  login: (input: LoginRequest) => Promise<void>;
  signup: (input: SignupRequest) => Promise<void>;
  completeOAuthLogin: (result: OAuthLoginResult) => void;
  completeOAuthProfile: (
    profileCompletionToken: string,
    nickname: string,
    agreements: {
      agreeTerms: boolean;
      agreePrivacy: boolean;
      agreeSensitive: boolean;
      agreeAge: boolean;
      agreeMarketing: boolean;
      agreeHealthStatistics: boolean;
    },
  ) => Promise<void>;
  logout: () => Promise<void>;
  withdraw: () => Promise<void>;
  updateNickname: (nickname: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const RESTORE_TIMEOUT_MS = 1800;

function toSessionUser(result: {
  userId: number;
  nickname: string;
  role: SessionUser['role'];
}): SessionUser {
  return { userId: result.userId, nickname: result.nickname, role: result.role };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const restoreGenRef = useRef(0);

  // 첫 렌더 후 저장된 세션을 복원하고, 서버에 토큰 유효성을 확인한다.
  useEffect(() => {
    const onAuthCleared = () => {
      ++restoreGenRef.current;
      setUser(null);
      setIsReady(true);
      forceUnlockBodyScroll();
    };
    window.addEventListener('herfree:auth-cleared', onAuthCleared);
    return () => window.removeEventListener('herfree:auth-cleared', onAuthCleared);
  }, []);

  useEffect(() => {
    const restore = async () => {
      const gen = ++restoreGenRef.current;
      const epochAtStart = getAuthEpoch();

      // sessionStorage의 사용자 정보는 표시용 캐시일 뿐 인증 근거가 아니다.
      // HttpOnly 쿠키를 서버가 검증하기 전에는 개인 화면을 렌더링하지 않는다.
      setUser(null);
      setIsReady(false);
      try {
        const me = await Promise.race([
          usersApi.fetchMe(),
          new Promise<null>((resolve) => {
            window.setTimeout(() => resolve(null), RESTORE_TIMEOUT_MS);
          }),
        ]);
        if (me === null) {
          if (gen !== restoreGenRef.current || epochAtStart !== getAuthEpoch()) return;
          clearAuth();
          return;
        }
        if (gen !== restoreGenRef.current || epochAtStart !== getAuthEpoch()) return;
        const session: SessionUser = { userId: me.id, nickname: me.nickname, role: me.role };
        setSessionUser(session);
        setUser(session);
      } catch (error) {
        if (gen !== restoreGenRef.current || epochAtStart !== getAuthEpoch()) return;
        if (isApiError(error) && (error.status === 401 || error.status === 403)) {
          clearAuth();
          return;
        }
        clearAuth();
      } finally {
        if (gen === restoreGenRef.current) {
          setIsReady(true);
        }
      }
    };
    void restore();
  }, []);

  const establishSession = useCallback((result: {
    userId: number;
    nickname: string;
    role: SessionUser['role'];
  }) => {
    ++restoreGenRef.current;
    const session = toSessionUser(result);
    clearAppNotice();
    setSessionUser(session);
    setUser(session);
    setIsReady(true);
  }, []);

  const login = useCallback(async (input: LoginRequest) => {
    clearAuth();
    setUser(null);
    ++restoreGenRef.current;
    bumpAuthEpoch();

    const result = await authApi.login(input);
    establishSession(result);
  }, [establishSession]);

  const signup = useCallback(async (input: SignupRequest) => {
    clearAuth();
    setUser(null);
    ++restoreGenRef.current;
    bumpAuthEpoch();

    await authApi.signup(input);

    const result = await authApi.login({ email: input.email, password: input.password });
    establishSession(result);
  }, [establishSession]);

  const completeOAuthLogin = useCallback((result: OAuthLoginResult) => {
    if (
      result.needsProfile ||
      result.userId == null ||
      !result.nickname ||
      !result.role
    ) {
      return;
    }

    clearAuth();
    setUser(null);
    ++restoreGenRef.current;
    bumpAuthEpoch();
    establishSession({
      userId: result.userId,
      nickname: result.nickname,
      role: result.role,
    });
  }, [establishSession]);

  const completeOAuthProfile = useCallback(async (
    profileCompletionToken: string,
    nickname: string,
    agreements: {
      agreeTerms: boolean;
      agreePrivacy: boolean;
      agreeSensitive: boolean;
      agreeAge: boolean;
      agreeMarketing: boolean;
      agreeHealthStatistics: boolean;
    },
  ) => {
    clearAuth();
    setUser(null);
    ++restoreGenRef.current;
    bumpAuthEpoch();

    const result = await authApi.completeOAuthProfile({ profileCompletionToken, nickname, ...agreements });
    establishSession(result);
  }, [establishSession]);

  const logout = useCallback(async () => {
    ++restoreGenRef.current;
    clearAuth();
    setUser(null);
    forceUnlockBodyScroll();

    try {
      await Promise.race([
        authApi.logout(),
        new Promise<void>((resolve) => {
          window.setTimeout(resolve, 2500);
        }),
      ]);
    } catch {
      // 서버 호출이 실패해도 클라이언트 토큰은 반드시 폐기한다 (Stateless JWT 구조)
    }
  }, []);

  const withdraw = useCallback(async () => {
    await usersApi.withdraw();
    ++restoreGenRef.current;
    clearAuth();
    setUser(null);
  }, []);

  const updateNickname = useCallback(async (nickname: string) => {
    const me = await usersApi.updateProfile({ nickname });
    const session: SessionUser = { userId: me.id, nickname: me.nickname, role: me.role };
    setSessionUser(session);
    setUser(session);
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await usersApi.changePassword({ currentPassword, newPassword });
    ++restoreGenRef.current;
    clearAuth();
    setUser(null);
    forceUnlockBodyScroll();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isReady,
      isLoggedIn: user !== null,
      login,
      signup,
      completeOAuthLogin,
      completeOAuthProfile,
      logout,
      withdraw,
      updateNickname,
      changePassword,
    }),
    [user, isReady, login, signup, completeOAuthLogin, completeOAuthProfile, logout, withdraw, updateNickname, changePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.');
  }
  return context;
}
