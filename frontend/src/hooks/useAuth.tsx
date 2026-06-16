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
import type { LoginRequest, SignupRequest } from '@/domain/auth/types';
import type { SessionUser } from '@/domain/user/types';
import * as authApi from '@/lib/api/auth';
import * as usersApi from '@/lib/api/users';
import {
  bumpAuthEpoch,
  clearAuth,
  getAccessToken,
  getAuthEpoch,
  getSessionUser,
  setAccessToken,
  setSessionUser,
} from '@/lib/auth-storage';

type AuthContextValue = {
  user: SessionUser | null;
  // localStorage 복원이 끝나기 전에는 로그인 여부를 판단할 수 없으므로 준비 상태를 별도 제공한다
  isReady: boolean;
  isLoggedIn: boolean;
  login: (input: LoginRequest) => Promise<void>;
  signup: (input: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
  withdraw: () => Promise<void>;
  updateNickname: (nickname: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

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
    const restore = async () => {
      const gen = ++restoreGenRef.current;
      const epochAtStart = getAuthEpoch();
      const token = getAccessToken();

      if (!token) {
        setIsReady(true);
        return;
      }

      setUser(getSessionUser());
      try {
        const me = await usersApi.fetchMe();
        if (gen !== restoreGenRef.current || epochAtStart !== getAuthEpoch()) return;
        const session: SessionUser = { userId: me.id, nickname: me.nickname, role: me.role };
        setSessionUser(session);
        setUser(session);
      } catch {
        if (gen !== restoreGenRef.current || epochAtStart !== getAuthEpoch()) return;
        clearAuth();
        setUser(null);
      } finally {
        if (gen === restoreGenRef.current) {
          setIsReady(true);
        }
      }
    };
    void restore();
  }, []);

  const login = useCallback(async (input: LoginRequest) => {
    clearAuth();
    setUser(null);
    ++restoreGenRef.current;
    bumpAuthEpoch();

    const result = await authApi.login(input);
    ++restoreGenRef.current;

    setAccessToken(result.accessToken);
    const session = toSessionUser(result);
    setSessionUser(session);
    setUser(session);
  }, []);

  const signup = useCallback(async (input: SignupRequest) => {
    clearAuth();
    setUser(null);
    ++restoreGenRef.current;
    bumpAuthEpoch();

    await authApi.signup(input);

    const result = await authApi.login({ email: input.email, password: input.password });
    ++restoreGenRef.current;

    setAccessToken(result.accessToken);
    const session = toSessionUser(result);
    setSessionUser(session);
    setUser(session);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // 서버 호출이 실패해도 클라이언트 토큰은 반드시 폐기한다 (Stateless JWT 구조)
    }
    ++restoreGenRef.current;
    clearAuth();
    setUser(null);
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

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isReady,
      isLoggedIn: user !== null,
      login,
      signup,
      logout,
      withdraw,
      updateNickname,
    }),
    [user, isReady, login, signup, logout, withdraw, updateNickname],
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
