'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { LoginRequest, SignupRequest } from '@/domain/auth/types';
import type { SessionUser } from '@/domain/user/types';
import * as authApi from '@/lib/api/auth';
import * as usersApi from '@/lib/api/users';
import {
  clearAuth,
  getAccessToken,
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  // 첫 렌더 후 저장된 세션을 복원하고, 서버에 토큰 유효성을 확인한다.
  // 만료 토큰이면 client.ts의 401 처리로 자동 정리된다.
  useEffect(() => {
    const restore = async () => {
      const token = getAccessToken();
      if (!token) {
        setIsReady(true);
        return;
      }
      setUser(getSessionUser());
      try {
        const me = await usersApi.fetchMe();
        const session: SessionUser = { userId: me.id, nickname: me.nickname, role: me.role };
        setSessionUser(session);
        setUser(session);
      } catch {
        clearAuth();
        setUser(null);
      } finally {
        setIsReady(true);
      }
    };
    void restore();
  }, []);

  const login = useCallback(async (input: LoginRequest) => {
    const result = await authApi.login(input);
    setAccessToken(result.accessToken);
    const session: SessionUser = {
      userId: result.userId,
      nickname: result.nickname,
      role: result.role,
    };
    setSessionUser(session);
    setUser(session);
  }, []);

  const signup = useCallback(async (input: SignupRequest) => {
    await authApi.signup(input);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // 서버 호출이 실패해도 클라이언트 토큰은 반드시 폐기한다 (Stateless JWT 구조)
    }
    clearAuth();
    setUser(null);
  }, []);

  const withdraw = useCallback(async () => {
    await usersApi.withdraw();
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
