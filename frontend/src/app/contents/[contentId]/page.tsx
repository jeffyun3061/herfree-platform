'use client';

import { useParams } from 'next/navigation';
import { useContentDetail } from '@/hooks/useContents';
import { TopBar } from '@/components/layout/TopBar';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { MedicalDisclaimer } from '@/components/layout/MedicalDisclaimer';
import { getContentTypeLabel } from '@/domain/content/types';
import { getErrorMessage } from '@/lib/api/client';

export default function ContentDetailPage() {
  const params = useParams();
  const contentId = Number(params.contentId);
  const { content, isLoading, error } = useContentDetail(contentId);

  if (isLoading) return <LoadingSpinner />;
  if (error || !content) {
    return (
      <div className="px-4 py-6">
        <ErrorMessage message={error ? getErrorMessage(error) : '글을 찾을 수 없습니다.'} />
      </div>
    );
  }

  return (
    <>
      <TopBar title="정보글" showBack />
      <article className="px-4 py-5">
        <div className="mb-4 flex items-center gap-2">
          <Badge variant="gold">{content.category}</Badge>
          <span className="text-xs text-muted">{getContentTypeLabel(content.contentType)}</span>
        </div>
        <h1 className="text-lg font-semibold text-cream-foreground">{content.title}</h1>
        <MedicalDisclaimer />
        <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-cream-foreground">
          {content.content}
        </div>
      </article>
    </>
  );
}
