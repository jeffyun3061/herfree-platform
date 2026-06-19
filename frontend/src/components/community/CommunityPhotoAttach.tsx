'use client';

import { useRef, useState } from 'react';
import { uploadPostImage } from '@/lib/api/posts';
import {
  POST_IMAGE_MAX_BYTES,
  resolvePostImageContentType,
} from '@/domain/post/types';
import { getErrorMessage } from '@/lib/api/client';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

type CommunityPhotoAttachProps = {
  imageUrl: string | null;
  onChange: (imageUrl: string | null) => void;
  disabled?: boolean;
};

export function CommunityPhotoAttach({
  imageUrl,
  onChange,
  disabled = false,
}: CommunityPhotoAttachProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const contentType = resolvePostImageContentType(file);
    if (!contentType) {
      setError('JPEG, PNG, WEBP 형식의 이미지만 업로드할 수 있습니다.');
      return;
    }
    if (file.size > POST_IMAGE_MAX_BYTES) {
      setError('이미지는 10MB 이하만 업로드할 수 있습니다.');
      return;
    }

    setError(null);
    setIsUploading(true);
    try {
      const uploadedUrl = await uploadPostImage(file);
      onChange(uploadedUrl);
    } catch (uploadError) {
      setError(getErrorMessage(uploadError));
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setError(null);
    onChange(null);
  };

  return (
    <div className="wrtn-field">
      <p className="wrtn-label">사진 첨부 (선택)</p>
      <p className="mt-1 text-xs text-wrtn-muted">
        사진 1장, 10MB 이하 (JPEG, PNG, WEBP)
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={disabled || isUploading}
        onChange={(e) => void handleFileChange(e)}
      />

      {imageUrl ? (
        <div className="mt-3 overflow-hidden rounded-xl border border-wrtn-border bg-white">
          <img src={imageUrl} alt="첨부 이미지 미리보기" className="max-h-64 w-full object-contain" />
          <div className="flex gap-2 border-t border-wrtn-border p-3">
            <button
              type="button"
              disabled={disabled || isUploading}
              onClick={() => inputRef.current?.click()}
              className="rounded-lg border border-wrtn-border px-3 py-2 text-xs font-medium text-ink hover:bg-wrtn-bg disabled:opacity-50"
            >
              {isUploading ? '업로드 중…' : '다른 사진 선택'}
            </button>
            <button
              type="button"
              disabled={disabled || isUploading}
              onClick={handleRemove}
              className="rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              삭제
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || isUploading}
          onClick={() => inputRef.current?.click()}
          className="mt-3 flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/[0.03] px-4 py-8 text-primary/80 transition-colors hover:bg-primary/[0.06] disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="9" cy="10" r="1.5" fill="currentColor" stroke="none" />
            <path d="M3 16l4.5-4.5a1 1 0 0 1 1.4 0L14 16l2.3-2.3a1 1 0 0 1 1.4 0L21 18" />
            <path d="M16 8h4M18 6v4" strokeLinecap="round" />
          </svg>
          <span className="text-sm font-medium">{isUploading ? '업로드 중…' : '사진 추가'}</span>
        </button>
      )}

      {error && (
        <div className="mt-2">
          <ErrorMessage message={error} />
        </div>
      )}
    </div>
  );
}
