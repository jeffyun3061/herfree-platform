import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import * as usersApi from '@/lib/api/users';

vi.mock('@/lib/api/users', () => ({
  fetchMe: vi.fn(),
  withdraw: vi.fn(),
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
}));

vi.mock('@/lib/api/auth', () => ({
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
  completeOAuthProfile: vi.fn(),
}));

function AuthStateProbe() {
  const { isReady, isLoggedIn, user } = useAuth();
  return (
    <output>
      {isReady ? 'ready' : 'checking'}:{isLoggedIn ? 'member' : 'guest'}:{user?.nickname ?? '-'}
    </output>
  );
}

describe('AuthProvider session restoration', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it('does not trust a cached user while the HttpOnly session is unverified', async () => {
    let resolveMe: ((value: {
      id: number;
      nickname: string;
      profileImageUrl: null;
      role: 'USER';
    }) => void) | undefined;
    vi.mocked(usersApi.fetchMe).mockReturnValue(new Promise((resolve) => {
      resolveMe = resolve;
    }));
    window.sessionStorage.setItem('sessionUser', JSON.stringify({
      userId: 1,
      nickname: 'stale-user',
      role: 'USER',
    }));

    render(<AuthProvider><AuthStateProbe /></AuthProvider>);

    await waitFor(() => expect(usersApi.fetchMe).toHaveBeenCalledOnce());
    expect(screen.getByText('checking:guest:-')).toBeInTheDocument();

    resolveMe?.({
      id: 2,
      nickname: 'verified-user',
      profileImageUrl: null,
      role: 'USER',
    });
    await waitFor(() => {
      expect(screen.getByText('ready:member:verified-user')).toBeInTheDocument();
    });
  });

  it('finishes as a guest and clears stale state when server validation fails', async () => {
    const unauthorized = Object.assign(new Error('Unauthorized'), {
      name: 'ApiError',
      status: 401,
    });
    vi.mocked(usersApi.fetchMe).mockRejectedValue(unauthorized);
    window.sessionStorage.setItem('sessionUser', JSON.stringify({
      userId: 1,
      nickname: 'stale-user',
      role: 'USER',
    }));

    render(<AuthProvider><AuthStateProbe /></AuthProvider>);

    await waitFor(() => {
      expect(screen.getByText('ready:guest:-')).toBeInTheDocument();
    });
    expect(window.sessionStorage.getItem('sessionUser')).toBeNull();
  });
});
