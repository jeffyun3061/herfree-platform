'use client';

import { useMemo, useState } from 'react';
import { useAdminVideos } from '@/hooks/useAdminVideos';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import {
  AdminManageRow,
  AdminPublishHeader,
} from '@/components/admin/AdminPublishUi';
import { extractYoutubeVideoId, getYoutubeThumbnailUrl } from '@/domain/video/youtube';
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
  const { videoPage, isLoading, error, refetch } = useAdminVideos(50);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const previewVideoId = useMemo(() => extractYoutubeVideoId(form.youtubeUrl), [form.youtubeUrl]);
  const canSubmit = form.title.trim().length > 0 && previewVideoId !== null;

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

  const startEdit = (video: (typeof videoPage.content)[number]) => {
    setEditingId(video.id);
    setForm({
      title: video.title,
      youtubeUrl: video.youtubeUrl,
      description: video.description ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-5">
      <AdminPublishHeader
        title="영상 링크 등록"
        description="유튜브 URL만 등록하면 됩니다. 파일 업로드 없이 /videos 에 노출됩니다."
        note="공개 목록에는 최신 노출 영상 6개만 보입니다. 숨기기는 임시 비노출, 삭제는 DB에서 제거됩니다."
      />

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

      <div>
        <h3 className="mb-3 text-[13px] font-semibold text-cream-foreground">등록된 영상</h3>
        {isLoading && <LoadingSpinner />}
        {error && <ErrorMessage message={getErrorMessage(error)} />}
        <div className="space-y-2">
          {videoPage.content.map((video) => (
            <AdminManageRow
              key={video.id}
              title={video.title}
              meta={formatVideoDate(video.createdAt)}
              statusLabel={video.isVisible ? '노출 중' : '숨김'}
              statusVariant={video.isVisible ? 'default' : 'muted'}
              isVisible={video.isVisible}
              isSubmitting={isSubmitting}
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
              아직 등록된 영상이 없습니다.
            </p>
          )}
        </div>
      </div>

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
