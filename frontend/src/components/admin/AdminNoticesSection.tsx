'use client';

import { useEffect, useState } from 'react';
import { useAdminNotices } from '@/hooks/useAdminNotices';
import { Pagination } from '@/components/common/Pagination';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import {
  AdminListToolbar,
  AdminManageRow,
  AdminPublishHeader,
  AdminSectionModeTabs,
  type AdminSectionMode,
} from '@/components/admin/AdminPublishUi';
import type { AdminModerationStatus } from '@/lib/api/admin';
import { swapSortOrderWithNeighbor } from '@/lib/adminCuration';
import { getErrorMessage } from '@/lib/api/client';
import * as adminApi from '@/lib/api/admin';

const EMPTY_FORM = {
  title: '',
  content: '',
};

function formatNoticeDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('ko-KR');
}

export function AdminNoticesSection() {
  const [mode, setMode] = useState<AdminSectionMode>('list');
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<AdminModerationStatus | ''>('');

  const { noticePage, isLoading, error, refetch } = useAdminNotices({
    page,
    keyword,
    status: statusFilter,
  });

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  useEffect(() => {
    setPage(0);
  }, [keyword, statusFilter]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const canSubmit = form.title.trim().length > 0 && form.content.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      const payload = { title: form.title.trim(), content: form.content.trim() };
      if (editingId) {
        await adminApi.updateNotice(editingId, payload);
      } else {
        await adminApi.createNotice(payload);
      }
      resetForm();
      setMode('list');
      await refetch();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleVisibility = async (postId: number, isVisible: boolean) => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      await adminApi.setNoticeVisibility(postId, !isVisible);
      await refetch();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (postId: number) => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      await adminApi.deleteNotice(postId);
      setDeleteTargetId(null);
      if (editingId === postId) resetForm();
      await refetch();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyNoticeCuration = async (postId: number, input: adminApi.NoticeCurationInput) => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      await adminApi.updateNoticeCuration(postId, input);
      await refetch();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (item: (typeof noticePage.content)[number]) => {
    setEditingId(item.id);
    setForm({ title: item.title, content: item.content });
    setMode('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-5">
      <AdminPublishHeader
        title="공지사항 올리기"
        description="커뮤니티 ‘공지사항’ 게시판에 노출됩니다. 일반 회원은 글쓰기할 수 없고, 운영자만 등록합니다."
        note="고정·순서는 목록에서 ▲▼·상단 고정으로 조정합니다. 숨기기는 임시 비노출, 삭제는 복구할 수 없습니다."
      />

      <AdminSectionModeTabs mode={mode} onChange={setMode} />

      {mode === 'list' ? (
        <>
          <AdminListToolbar
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            onSearchSubmit={() => setKeyword(searchInput.trim())}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />

          {actionError && <ErrorMessage message={actionError} />}
          {isLoading && <LoadingSpinner />}
          {error && <ErrorMessage message={getErrorMessage(error)} />}

          <div className="space-y-2">
            {noticePage.content.map((item, index) => {
              const isVisible = item.status === 'ACTIVE';
              return (
                <AdminManageRow
                  key={item.id}
                  title={item.title}
                  meta={formatNoticeDate(item.createdAt)}
                  statusLabel={isVisible ? '노출 중' : '숨김'}
                  statusVariant={isVisible ? 'default' : 'muted'}
                  isVisible={isVisible}
                  isSubmitting={isSubmitting}
                  sortOrder={item.sortOrder}
                  isPinned={item.isPinned}
                  canMoveUp={index > 0}
                  canMoveDown={index < noticePage.content.length - 1}
                  onMoveUp={() =>
                    void swapSortOrderWithNeighbor(
                      noticePage.content,
                      index,
                      'up',
                      (id, sortOrder) => applyNoticeCuration(id, { sortOrder }),
                    )
                  }
                  onMoveDown={() =>
                    void swapSortOrderWithNeighbor(
                      noticePage.content,
                      index,
                      'down',
                      (id, sortOrder) => applyNoticeCuration(id, { sortOrder }),
                    )
                  }
                  onTogglePin={() =>
                    void applyNoticeCuration(item.id, { isPinned: !item.isPinned })
                  }
                  onEdit={() => startEdit(item)}
                  onToggleVisibility={() => void toggleVisibility(item.id, isVisible)}
                  onDelete={() => setDeleteTargetId(item.id)}
                />
              );
            })}
            {!isLoading && noticePage.content.length === 0 && (
              <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-[12px] text-muted">
                조건에 맞는 공지가 없습니다.
              </p>
            )}
          </div>

          <Pagination page={page} totalPages={noticePage.totalPages} onPageChange={setPage} />
        </>
      ) : (
        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[14px] font-semibold text-cream-foreground">
              {editingId ? '공지 수정' : '새 공지 작성'}
            </h3>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-[11px] font-medium text-primary hover:underline"
              >
                새 공지 작성
              </button>
            )}
          </div>

          <Input
            label="제목"
            required
            placeholder="공지 제목"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          />

          <Textarea
            label="내용"
            required
            rows={10}
            placeholder="공지 본문"
            value={form.content}
            onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
          />

          {actionError && <ErrorMessage message={actionError} />}
          <Button disabled={isSubmitting || !canSubmit} onClick={() => void handleSubmit()}>
            {isSubmitting ? '저장 중…' : editingId ? '수정 저장' : '공지 등록'}
          </Button>
        </Card>
      )}

      <ConfirmModal
        open={deleteTargetId !== null}
        title="공지 삭제"
        message="이 공지를 삭제할까요? 삭제 후에는 복구할 수 없습니다."
        confirmLabel="삭제"
        variant="danger"
        isLoading={isSubmitting}
        onConfirm={() => deleteTargetId !== null && void handleDelete(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
