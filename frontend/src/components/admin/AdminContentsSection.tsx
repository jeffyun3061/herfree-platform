'use client';

import { useEffect, useState } from 'react';
import { useAdminContents } from '@/hooks/useAdminContents';
import { Pagination } from '@/components/common/Pagination';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Badge } from '@/components/ui/Badge';
import {
  AdminChipGroup,
  AdminListToolbar,
  AdminManageRow,
  AdminPublishHeader,
  AdminSectionModeTabs,
  type AdminSectionMode,
} from '@/components/admin/AdminPublishUi';
import {
  CONTENT_AUTHOR_TYPE_OPTIONS,
  CONTENT_CATEGORIES,
  getContentPreview,
  getContentTypeLabel,
  type ContentAuthorType,
} from '@/domain/content/types';
import type { AdminModerationStatus } from '@/lib/api/admin';
import { swapSortOrderWithNeighbor } from '@/lib/adminCuration';
import { getErrorMessage } from '@/lib/api/client';
import * as adminApi from '@/lib/api/admin';

const EMPTY_FORM = {
  title: '',
  content: '',
  category: CONTENT_CATEGORIES[0],
  contentType: 'ADMIN' as ContentAuthorType,
};

function formatContentDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('ko-KR');
}

export function AdminContentsSection() {
  const [mode, setMode] = useState<AdminSectionMode>('list');
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<AdminModerationStatus | ''>('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const { contentPage, isLoading, error, refetch } = useAdminContents({
    page,
    keyword,
    status: statusFilter,
    category: categoryFilter,
  });

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  useEffect(() => {
    setPage(0);
  }, [keyword, statusFilter, categoryFilter]);

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
      if (editingId) {
        await adminApi.updateContent(editingId, {
          title: form.title.trim(),
          content: form.content.trim(),
          category: form.category,
        });
      } else {
        await adminApi.createContent({
          title: form.title.trim(),
          content: form.content.trim(),
          category: form.category,
          contentType: form.contentType,
        });
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

  const toggleVisibility = async (contentId: number, isVisible: boolean) => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      await adminApi.setContentVisibility(contentId, !isVisible);
      await refetch();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (contentId: number) => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      await adminApi.deleteContent(contentId);
      setDeleteTargetId(null);
      if (editingId === contentId) resetForm();
      await refetch();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyContentCuration = async (contentId: number, input: adminApi.ContentCurationInput) => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      await adminApi.updateContentCuration(contentId, input);
      await refetch();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (item: (typeof contentPage.content)[number]) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      content: item.content,
      category: item.category,
      contentType: (item.contentType as ContentAuthorType) ?? 'ADMIN',
    });
    setMode('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-5">
      <AdminPublishHeader
        title="칼럼 올리기"
        description="커뮤니티 게시판이 아니라, 사용자 ‘칼럼’ 메뉴에 노출되는 큐레이션 글을 등록합니다."
        note="제목 · 카테고리 · 본문을 작성한 뒤 등록하면 /contents 에 바로 반영됩니다. 숨기기는 임시 비노출, 삭제는 복구할 수 없습니다."
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
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            categoryOptions={[...CONTENT_CATEGORIES]}
          />

          {actionError && <ErrorMessage message={actionError} />}
          {isLoading && <LoadingSpinner />}
          {error && <ErrorMessage message={getErrorMessage(error)} />}

          <div className="space-y-2">
            {contentPage.content.map((item, index) => {
              const isVisible = item.status !== 'HIDDEN';
              return (
                <AdminManageRow
                  key={item.id}
                  title={item.title}
                  meta={`${item.category} · ${formatContentDate(item.createdAt)}`}
                  statusLabel={isVisible ? '노출 중' : '숨김'}
                  statusVariant={isVisible ? 'default' : 'muted'}
                  isVisible={isVisible}
                  isSubmitting={isSubmitting}
                  sortOrder={item.sortOrder ?? 0}
                  isPinned={item.isPinned}
                  canMoveUp={index > 0}
                  canMoveDown={index < contentPage.content.length - 1}
                  onMoveUp={() =>
                    void swapSortOrderWithNeighbor(
                      contentPage.content,
                      index,
                      'up',
                      (id, sortOrder) => applyContentCuration(id, { sortOrder }),
                    )
                  }
                  onMoveDown={() =>
                    void swapSortOrderWithNeighbor(
                      contentPage.content,
                      index,
                      'down',
                      (id, sortOrder) => applyContentCuration(id, { sortOrder }),
                    )
                  }
                  onTogglePin={() =>
                    void applyContentCuration(item.id, { isPinned: !item.isPinned })
                  }
                  onEdit={() => startEdit(item)}
                  onToggleVisibility={() => void toggleVisibility(item.id, isVisible)}
                  onDelete={() => setDeleteTargetId(item.id)}
                />
              );
            })}
            {!isLoading && contentPage.content.length === 0 && (
              <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-[12px] text-muted">
                조건에 맞는 칼럼이 없습니다.
              </p>
            )}
          </div>

          <Pagination page={page} totalPages={contentPage.totalPages} onPageChange={setPage} />
        </>
      ) : (
        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[14px] font-semibold text-cream-foreground">
              {editingId ? '칼럼 수정' : '새 칼럼 작성'}
            </h3>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-[11px] font-medium text-primary hover:underline"
              >
                새 글 작성
              </button>
            )}
          </div>

          <Input
            label="제목"
            required
            placeholder="예) 재발 전에 챙기면 좋은 수면 루틴"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          />

          <AdminChipGroup
            label="카테고리"
            value={form.category}
            options={CONTENT_CATEGORIES.map((category) => ({ value: category, label: category }))}
            onChange={(category) => setForm((prev) => ({ ...prev, category }))}
          />

          {!editingId && (
            <AdminChipGroup
              label="작성 주체 표시"
              value={form.contentType}
              options={CONTENT_AUTHOR_TYPE_OPTIONS}
              onChange={(contentType) => setForm((prev) => ({ ...prev, contentType }))}
            />
          )}

          <Textarea
            label="본문"
            required
            rows={14}
            placeholder="칼럼 본문을 입력하세요. 줄바꿈이 그대로 반영됩니다."
            value={form.content}
            onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
            className="min-h-[280px]"
          />

          {form.title.trim() && form.content.trim() && (
            <div className="rounded-xl border border-dashed border-border bg-cream-dark/40 p-3">
              <p className="text-[10px] font-medium text-muted">미리보기 (칼럼 목록)</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="gold">{form.category}</Badge>
                <span className="text-[10px] text-muted">
                  {getContentTypeLabel(form.contentType)}
                </span>
              </div>
              <p className="mt-2 text-[13px] font-medium text-cream-foreground">{form.title}</p>
              <p className="mt-1 text-[12px] text-muted">{getContentPreview(form.content)}</p>
            </div>
          )}

          {actionError && <ErrorMessage message={actionError} />}
          <Button disabled={isSubmitting || !canSubmit} onClick={() => void handleSubmit()}>
            {isSubmitting ? '저장 중…' : editingId ? '수정 저장' : '칼럼 등록'}
          </Button>
        </Card>
      )}

      <ConfirmModal
        open={deleteTargetId !== null}
        title="칼럼 삭제"
        message="이 칼럼을 삭제할까요? 삭제 후에는 복구할 수 없습니다."
        confirmLabel="삭제"
        variant="danger"
        isLoading={isSubmitting}
        onConfirm={() => deleteTargetId !== null && void handleDelete(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
