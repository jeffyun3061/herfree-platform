import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminModerationSection } from './AdminModerationSection';

const mocks = vi.hoisted(() => ({ review: vi.fn() }));
vi.mock('@/lib/api/admin', () => ({ fetchAdminPostReview: mocks.review }));
vi.mock('@/hooks/useAdminModeration', () => ({ useAdminModeration: () => ({
  postPage: { content: [{ id: 41, title: '숨김 글', boardName: '자유', status: 'HIDDEN', authorNickname: '익명', createdAt: '2026-10-27T00:00:00Z' }, { id: 42, title: '공개 글', boardName: '자유', status: 'ACTIVE', authorNickname: '익명', createdAt: '2026-10-27T00:00:00Z' }], totalElements: 2, totalPages: 1 },
  commentPage: { content: [
    { id: 21, postId: 41, postTitle: '숨김 글', postStatus: 'HIDDEN', contentPreview: '댓글', status: 'HIDDEN', authorNickname: '익명', createdAt: '2026-10-27T00:00:00Z' },
    { id: 22, postId: 42, postTitle: '공개 글', postStatus: 'ACTIVE', contentPreview: '댓글', status: 'ACTIVE', authorNickname: '익명', createdAt: '2026-10-27T00:00:00Z' },
    { id: 23, postId: 43, postTitle: '삭제된 게시글', postStatus: 'DELETED', contentPreview: '댓글', status: 'HIDDEN', authorNickname: '익명', createdAt: '2026-10-27T00:00:00Z' },
  ], totalElements: 3, totalPages: 1 },
  pageIndex: 0, setPage: vi.fn(), isLoading: false, error: null, actionError: null, isProcessing: false,
  hidePost: vi.fn(), restorePost: vi.fn(), hideComment: vi.fn(), restoreComment: vi.fn(),
}) }));

describe('admin review of hidden content', () => {
  beforeEach(() => {
    mocks.review.mockReset();
    mocks.review.mockResolvedValue({ id: 41, boardName: '자유', status: 'HIDDEN', title: '숨김 글', content: '관리용 본문', imageUrl: null });
  });
  it('opens hidden posts and comment parents through the protected review API', async () => {
    render(<AdminModerationSection />);
    expect(mocks.review).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: '글 보기' })).toHaveAttribute('href', '/community/posts/42');
    fireEvent.click(screen.getByRole('button', { name: '글 확인' }));
    expect(await screen.findByRole('region', { name: '관리자 게시글 확인' })).toHaveTextContent('관리용 본문');
    expect(mocks.review).toHaveBeenCalledWith(41);
    fireEvent.click(screen.getByRole('button', { name: '닫기' }));
    expect(screen.queryByText('관리용 본문')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '댓글' }));
    expect(screen.getByRole('link', { name: '원글 보기' })).toHaveAttribute('href', '/community/posts/42');
    expect(screen.getByText('삭제되었거나 상태를 확인할 수 없는 게시글입니다.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '원글 확인' }));
    await waitFor(() => expect(mocks.review).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole('region', { name: '관리자 게시글 확인' })).toHaveTextContent('관리용 본문');
  });
});
