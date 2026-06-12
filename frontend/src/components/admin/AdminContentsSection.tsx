'use client';

import { useState } from 'react';
import { useContentList } from '@/hooks/useContents';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CONTENT_CATEGORIES } from '@/domain/content/types';
import { getErrorMessage } from '@/lib/api/client';
import * as adminApi from '@/lib/api/admin';

const EMPTY_FORM = {
  title: '',
  content: '',
  category: CONTENT_CATEGORIES[0],
  contentType: 'ADMIN',
};

export function AdminContentsSection() {
  const { contentPage, isLoading, error, refetch } = useContentList(undefined, 20);
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
        await adminApi.updateContent(editingId, {
          title: form.title,
          content: form.content,
          category: form.category,
        });
      } else {
        await adminApi.createContent(form);
      }
      resetForm();
      await refetch();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHide = async (contentId: number) => {
    if (!confirm('이 정보글을 숨기시겠습니까?')) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      await adminApi.hideContent(contentId);
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
      contentType: item.contentType,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="mb-3 font-medium text-cream-foreground">
          {editingId ? '정보글 수정' : '정보글 등록'}
        </h3>
        <div className="space-y-3">
          <Input
            placeholder="제목"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          />
          <select
            value={form.category}
            onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
          >
            {CONTENT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <Textarea
            placeholder="본문"
            value={form.content}
            onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
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
        {contentPage.content.map((item) => (
          <Card key={item.id}>
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="gold">{item.category}</Badge>
              <span className="text-xs text-muted">{item.contentType}</span>
            </div>
            <p className="font-medium text-cream-foreground">{item.title}</p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => startEdit(item)}>
                수정
              </Button>
              <Button
                size="sm"
                variant="danger"
                disabled={isSubmitting}
                onClick={() => void handleHide(item.id)}
              >
                숨김
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
