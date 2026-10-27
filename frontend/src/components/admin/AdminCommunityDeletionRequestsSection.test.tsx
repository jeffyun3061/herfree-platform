import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminCommunityDeletionRequestsSection } from './AdminCommunityDeletionRequestsSection';

const api = vi.hoisted(() => ({ list: vi.fn(), get: vi.fn(), acknowledge: vi.fn() }));
vi.mock('@/lib/api/admin/community-deletion-requests', () => ({ fetchCommunityDeletionRequests: api.list,
  fetchCommunityDeletionRequest: api.get, acknowledgeCommunityDeletionRequest: api.acknowledge }));

const receipt = { id: 7, status: 'RECEIVED', postCount: 1, commentCount: 1, receivedAt: '2026-10-27T00:00:00Z',
  acknowledgedAt: null, policyVersion: '2026-10-27', purpose: 'ANONYMOUS_CONCERN_PUBLICATION',
  items: [{ targetType: 'POST', targetId: 91 }, { targetType: 'COMMENT', targetId: 92 }],
  content: 'private health body must never render', authorNickname: 'private nickname', email: 'private@example.invalid' };

describe('privacy operator deletion request receipt', () => {
  beforeEach(() => {
    api.list.mockReset(); api.get.mockReset(); api.acknowledge.mockReset();
    api.list.mockResolvedValue({ content: [receipt], totalElements: 1, totalPages: 1, number: 0, size: 20 });
    api.get.mockResolvedValue(receipt);
    api.acknowledge.mockResolvedValue({ ...receipt, status: 'IN_REVIEW', acknowledgedAt: '2026-10-27T00:01:00Z' });
  });

  it('shows metadata only and records review acknowledgement after confirmation', async () => {
    render(<AdminCommunityDeletionRequestsSection />);
    fireEvent.click(await screen.findByRole('button', { name: '접수 #7 확인' }));
    expect(await screen.findByText('게시글 ID 91')).toBeInTheDocument();
    expect(screen.getByText('댓글 ID 92')).toBeInTheDocument();
    expect(screen.queryByText(receipt.content)).not.toBeInTheDocument();
    expect(screen.queryByText(receipt.authorNickname)).not.toBeInTheDocument();
    expect(screen.queryByText(receipt.email)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '접수 확인 · 검토 시작' }));
    expect(api.acknowledge).not.toHaveBeenCalled();
    expect(screen.getByText('이 요청을 확인하고 검토를 시작한 기록을 남깁니다. 콘텐츠를 삭제하거나 삭제 완료로 처리하지 않습니다.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '접수 확인 기록' }));
    await waitFor(() => expect(api.acknowledge).toHaveBeenCalledWith(7));
    await waitFor(() => expect(screen.getByRole('region', { name: '삭제 요청 7 상세' })).toHaveTextContent('검토 중'));
    expect(screen.queryByRole('button', { name: /삭제 완료/ })).not.toBeInTheDocument();
  });
});
