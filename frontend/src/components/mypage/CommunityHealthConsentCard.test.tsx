import React from 'react';
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CommunityHealthConsentCard } from './CommunityHealthConsentCard';
import { useCommunityHealthConsent } from '@/hooks/useCommunityHealthConsent';

const mocks = vi.hoisted(() => ({ fetch: vi.fn(), update: vi.fn(), actor: 7 }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ isReady: true, isLoggedIn: true, user: { userId: mocks.actor, role: 'USER' } }) }));
vi.mock('@/lib/api/users', () => ({
  COMMUNITY_HEALTH_PURPOSE: 'ANONYMOUS_CONCERN_PUBLICATION',
  fetchCommunityHealthConsent: mocks.fetch, updateCommunityHealthConsent: mocks.update,
}));

const consent = (agreed: boolean, extra: Record<string, unknown> = {}) => ({ agreed, latestDecisionAgreed: agreed,
  requiredPolicyVersion: '2026-10-27', policyVersion: agreed ? '2026-10-27' : null,
  purpose: 'ANONYMOUS_CONCERN_PUBLICATION', decidedAt: agreed ? '2026-10-27T00:00:00Z' : null,
  deletionRequestId: null, ...extra });

describe('separate anonymous concern health consent', () => {
  beforeEach(() => { mocks.fetch.mockReset(); mocks.update.mockReset(); mocks.actor = 7; });

  it('requires a separate choice and submits the version read from the server', async () => {
    mocks.fetch.mockResolvedValue(consent(false));
    mocks.update.mockResolvedValue(consent(true));
    render(<CommunityHealthConsentCard />);
    const choice = await screen.findByLabelText('위 익명 고민 건강정보 처리에 별도로 동의합니다.');
    const agree = screen.getByRole('button', { name: /^익명 고민 건강정보 처리에 동의$/ });
    expect(choice).not.toBeChecked(); expect(agree).toBeDisabled(); expect(mocks.update).not.toHaveBeenCalled();
    fireEvent.click(choice); fireEvent.click(agree);
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith(true, '2026-10-27'));
    expect(await screen.findByRole('button', { name: '익명 고민 동의 철회 · 숨김 및 삭제 요청' })).toBeInTheDocument();
  });

  it('allows withdrawing an older grant and reports a pending deletion request rather than erasure', async () => {
    mocks.fetch.mockResolvedValue(consent(false, { latestDecisionAgreed: true, policyVersion: '2026-10-25', decidedAt: '2026-10-25T00:00:00Z' }));
    mocks.update.mockResolvedValue(consent(false, { latestDecisionAgreed: false, policyVersion: '2026-10-27', decidedAt: '2026-10-27T00:01:00Z', deletionRequestId: 42 }));
    render(<CommunityHealthConsentCard />);
    fireEvent.click(await screen.findByRole('button', { name: '익명 고민 동의 철회 · 숨김 및 삭제 요청' }));
    expect(mocks.update).not.toHaveBeenCalled();
    expect(screen.getByText(/동의 전 기존 콘텐츠·다른 게시판·개인일지에는 자동 적용되지 않습니다./)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '철회하고 숨김·삭제 요청' }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith(false, '2026-10-27'));
    expect(await screen.findByRole('status')).toHaveTextContent('원문 삭제 완료는 아닙니다. 접수번호: 42');
    expect(screen.queryByRole('button', { name: '익명 고민 동의 철회 · 숨김 및 삭제 요청' })).not.toBeInTheDocument();
  });

  it('fails closed for the wrong purpose and does not carry consent to another account', async () => {
    mocks.fetch.mockResolvedValueOnce(consent(true));
    const { result, rerender } = renderHook(() => useCommunityHealthConsent());
    await waitFor(() => expect(result.current.agreed).toBe(true));
    let resolve: (value: unknown) => void = () => undefined;
    mocks.fetch.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
    mocks.actor = 8; rerender();
    expect(result.current.agreed).toBe(false);
    await act(async () => { resolve(consent(true, { purpose: 'JOURNAL' })); });
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.agreed).toBe(false); expect(result.current.consent).toBeNull();
  });
});
