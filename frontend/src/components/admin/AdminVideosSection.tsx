'use client';

import { useState } from 'react';
import { useVideos } from '@/hooks/useVideos';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getErrorMessage } from '@/lib/api/client';
import * as adminApi from '@/lib/api/admin';

const EMPTY_FORM = {
  title: '',
  youtubeUrl: '',
  description: '',
};

export function AdminVideosSection() {
  const { videoPage, isLoading, error, refetch } = useVideos(20);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      if (editingId) {
        await adminApi.updateVideo(editingId, form);
      } else {
        await adminApi.createVideo(form);
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

  const startEdit = (video: (typeof videoPage.content)[number]) => {
    setEditingId(video.id);
    setForm({
      title: video.title,
      youtubeUrl: video.youtubeUrl,
      description: video.description ?? '',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="mb-3 font-medium text-cream-foreground">
          {editingId ? '영상 수정' : '영상 등록'}
        </h3>
        <div className="space-y-3">
          <Input
            placeholder="제목"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          />
          <Input
            placeholder="유튜브 URL"
            value={form.youtubeUrl}
            onChange={(e) => setForm((prev) => ({ ...prev, youtubeUrl: e.target.value }))}
          />
          <Textarea
            placeholder="설명 (선택)"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          />
          {actionError && <ErrorMessage message={actionError} />}
          <div className="flex gap-2">
            <Button disabled={isSubmitting} onClick={() => void handleSubmit()}>
              {editingId ? '수정 저장' : '등록'}
            </Button>
            {editingId && (
              <Button variant="secondary" onClick={resetForm}>
                취소
              </Button>
            )}
          </div>
        </div>
      </Card>

      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage message={getErrorMessage(error)} />}

      <div className="space-y-3">
        {videoPage.content.map((video) => (
          <Card key={video.id}>
            <div className="mb-2 flex items-center gap-2">
              <Badge variant={video.isVisible ? 'default' : 'muted'}>
                {video.isVisible ? '노출' : '숨김'}
              </Badge>
            </div>
            <p className="font-medium text-cream-foreground">{video.title}</p>
            <p className="mt-1 truncate text-xs text-muted">{video.youtubeUrl}</p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => startEdit(video)}>
                수정
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={isSubmitting}
                onClick={() => void toggleVisibility(video.id, video.isVisible)}
              >
                {video.isVisible ? '숨기기' : '노출'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
