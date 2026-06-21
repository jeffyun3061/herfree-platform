'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAdminVideos } from '@/hooks/useAdminVideos';
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
import { extractYoutubeVideoId, getYoutubeThumbnailUrl } from '@/domain/video/youtube';
import type { AdminModerationStatus } from '@/lib/api/admin';
import { swapSortOrderWithNeighbor } from '@/lib/adminCuration';
import { getErrorMessage } from '@/lib/api/client';
import * as adminApi from '@/lib/api/admin';

const EMPTY_FORM = {
  title: '',
  youtubeUrl: '',
  description: '',
};

function formatVideoDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('ko-KR');
}

export function AdminVideosSection() {
  const [mode, setMode] = useState<AdminSectionMode>('list');
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<AdminModerationStatus | ''>('');

  const { videoPage, isLoading, error, refetch } = useAdminVideos({
    page,
    keyword,
    status: statusFilter,
  });

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const previewVideoId = useMemo(() => extractYoutubeVideoId(form.youtubeUrl), [form.youtubeUrl]);
  const canSubmit = form.title.trim().length > 0 && previewVideoId !== null;

  useEffect(() => {
    setPage(0);
  }, [keyword, statusFilter]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      const payload = {
        title: form.title.trim(),
        youtubeUrl: form.youtubeUrl.trim(),
        description: form.description.trim() || undefined,
      };
      if (editingId) {
        await adminApi.updateVideo(editingId, payload);
      } else {
        await adminApi.createVideo(payload);
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

  const toggleVisibility = async (videoId: number, isVisible: boolean) => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      await adminApi.setVideoVisibility(videoId, !isVisible);
      await refetch();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (videoId: number) => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      await adminApi.deleteVideo(videoId);
      setDeleteTargetId(null);
      if (editingId === videoId) resetForm();
      await refetch();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyVideoCuration = async (videoId: number, input: adminApi.VideoCurationInput) => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      await adminApi.updateVideoCuration(videoId, input);
      await refetch();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (video: (typeof videoPage.content)[number]) => {
    setEditingId(video.id);
    setForm({
      title: video.title,
      youtubeUrl: video.youtubeUrl,
      description: video.description ?? '',
    });
    setMode('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-5">
      <AdminPublishHeader
        title="영상 링크 등록"
        description="유튜브 URL만 등록하면 됩니다. 파일 업로드 없이 /videos 에 노출됩니다."
        note="공개 목록에는 추천·노출 영상 최대 6개가 sort_order 순으로 보입니다. 추천 등록·순서 변경은 목록에서 ▲▼ 버튼을 사용하세요."
      />

      <AdminSectionModeTabs mode={mode} onChange={setMode} createLabel="새로 등록" />

      {mode === 'list' ? (
        <>
          <AdminListToolbar
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            onSearchSubmit={() => setKeyword(searchInput.trim())}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            searchPlaceholder="영상 제목 검색"
          />

          {actionError && <ErrorMessage message={actionError} />}
          {isLoading && <LoadingSpinner />}
          {error && <ErrorMessage message={getErrorMessage(error)} />}

          <div className="space-y-2">
            {videoPage.content.map((video, index) => (
              <AdminManageRow
                key={video.id}
                title={video.title}
                meta={formatVideoDate(video.createdAt)}
                statusLabel={video.isVisible ? '노출 중' : '숨김'}
                statusVariant={video.isVisible ? 'default' : 'muted'}
                isVisible={video.isVisible}
                isSubmitting={isSubmitting}
                sortOrder={video.sortOrder}
                isFeatured={video.isFeatured}
                canMoveUp={index > 0}
                canMoveDown={index < videoPage.content.length - 1}
                onMoveUp={() =>
                  void swapSortOrderWithNeighbor(
                    videoPage.content,
                    index,
                    'up',
                    (id, sortOrder) => applyVideoCuration(id, { sortOrder }),
                  )
                }
                onMoveDown={() =>
                  void swapSortOrderWithNeighbor(
                    videoPage.content,
                    index,
                    'down',
                    (id, sortOrder) => applyVideoCuration(id, { sortOrder }),
                  )
                }
                onToggleFeatured={() =>
                  void applyVideoCuration(video.id, { isFeatured: !video.isFeatured })
                }
                onEdit={() => startEdit(video)}
                onToggleVisibility={() => void toggleVisibility(video.id, video.isVisible)}
                onDelete={() => setDeleteTargetId(video.id)}
                preview={
                  <img
                    src={`https://img.youtube.com/vi/${video.youtubeVideoId}/mqdefault.jpg`}
                    alt=""
                    className="h-16 w-28 shrink-0 rounded-lg object-cover"
                  />
                }
              />
            ))}
            {!isLoading && videoPage.content.length === 0 && (
              <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-[12px] text-muted">
                조건에 맞는 영상이 없습니다.
              </p>
            )}
          </div>

          <Pagination page={page} totalPages={videoPage.totalPages} onPageChange={setPage} />
        </>
      ) : (
        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[14px] font-semibold text-cream-foreground">
              {editingId ? '영상 수정' : '새 영상 등록'}
            </h3>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-[11px] font-medium text-primary hover:underline"
              >
                새 영상 등록
              </button>
            )}
          </div>

          <Input
            label="제목"
            required
            placeholder="영상 제목"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          />

          <Input
            label="유튜브 링크"
            required
            placeholder="https://www.youtube.com/watch?v=..."
            value={form.youtubeUrl}
            onChange={(e) => setForm((prev) => ({ ...prev, youtubeUrl: e.target.value }))}
          />
          {form.youtubeUrl.trim() && !previewVideoId && (
            <p className="text-[11px] text-red-600">올바른 유튜브 URL을 입력해 주세요.</p>
          )}

          {previewVideoId && (
            <div className="overflow-hidden rounded-xl border border-border">
              <img
                src={getYoutubeThumbnailUrl(previewVideoId)}
                alt="유튜브 썸네일 미리보기"
                className="aspect-video w-full object-cover"
              />
            </div>
          )}

          <Textarea
            label="설명 (선택)"
            rows={3}
            placeholder="영상에 대한 짧은 설명"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          />

          {actionError && <ErrorMessage message={actionError} />}
          <Button disabled={isSubmitting || !canSubmit} onClick={() => void handleSubmit()}>
            {isSubmitting ? '저장 중…' : editingId ? '수정 저장' : '영상 등록'}
          </Button>
        </Card>
      )}

      <ConfirmModal
        open={deleteTargetId !== null}
        title="영상 삭제"
        message="이 영상을 삭제할까요? 삭제 후에는 복구할 수 없습니다."
        confirmLabel="삭제"
        variant="danger"
        isLoading={isSubmitting}
        onConfirm={() => deleteTargetId !== null && void handleDelete(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
