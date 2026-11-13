import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminMfaBoundary } from './AdminMfaBoundary';

const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('@/lib/api/client', () => ({ request, getErrorMessage: () => '인증 실패' }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ isReady: true, isLoggedIn: true, user: { userId: 7, role: 'ADMIN' } }) }));

describe('administrator MFA screen', () => {
  beforeEach(() => request.mockReset());
  it('keeps admin content hidden while MFA is missing', async () => {
    request.mockResolvedValue({ enrolled: false, verified: false, expiresIn: 0 });
    render(<AdminMfaBoundary><div>운영 데이터</div></AdminMfaBoundary>);
    expect(await screen.findByLabelText('등록 승인 코드')).toBeInTheDocument();
    expect(screen.queryByText('운영 데이터')).not.toBeInTheDocument();
  });
  it('removes mounted admin content when the server requires fresh MFA', async () => {
    request.mockResolvedValue({ enrolled: true, verified: true, expiresIn: 900 });
    render(<AdminMfaBoundary><div>운영 데이터</div></AdminMfaBoundary>);
    expect(await screen.findByText('운영 데이터')).toBeInTheDocument();
    act(() => window.dispatchEvent(new Event('herfree:admin-mfa-required')));
    expect(screen.queryByText('운영 데이터')).not.toBeInTheDocument();
    expect(screen.getByLabelText('인증앱 6자리 번호')).toBeInTheDocument();
  });
  it('shows recovery codes once and opens admin content only after acknowledgement', async () => {
    request.mockResolvedValueOnce({ enrolled: false, verified: false, expiresIn: 0 })
      .mockResolvedValueOnce({ secret: 'LOCAL-ENROLLMENT-KEY', expiresIn: 900 })
      .mockResolvedValueOnce({ expiresIn: 900, recoveryCodes: ['one-time-code'] });
    render(<AdminMfaBoundary><div>운영 데이터</div></AdminMfaBoundary>);
    fireEvent.change(await screen.findByLabelText('등록 승인 코드'), { target: { value: 'independent-approval' } });
    fireEvent.click(screen.getByText('인증앱 등록 시작'));
    fireEvent.change(await screen.findByLabelText('인증앱 6자리 번호'), { target: { value: '123456' } });
    fireEvent.click(screen.getByText('인증 확인'));
    expect(await screen.findByLabelText('일회용 복구 코드')).toHaveValue('one-time-code');
    expect(screen.queryByText('운영 데이터')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('보관 완료 · 관리자 화면으로'));
    expect(screen.getByText('운영 데이터')).toBeInTheDocument();
    expect(screen.queryByLabelText('일회용 복구 코드')).not.toBeInTheDocument();
  });
});
