'use client';

import type { RefObject } from 'react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { COMMENT_MAX_LENGTH, displayAuthorNickname, type Comment } from '@/domain/comment/types';
import { cn } from '@/lib/cn';

type CommentComposerProps = {
  inputRef: RefObject<HTMLTextAreaElement>;
  replyTarget: Comment | null;
  isMaskedPost: boolean;
  value: string;
  isSubmitting: boolean;
  onChange: (value: string) => void;
  onCancelReply: () => void;
  onSubmit: () => void;
};

function CommentSendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M22 2L11 13" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 2L15 22l-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CommentComposer({
  inputRef,
  replyTarget,
  isMaskedPost,
  value,
  isSubmitting,
  onChange,
  onCancelReply,
  onSubmit,
}: CommentComposerProps) {
  return (
    <div className="mt-[18px]">
      {replyTarget && (
        <div
          role="status"
          className="mb-2.5 flex min-w-0 items-center justify-between gap-3 rounded-[12px] border border-[#C9D9D0] bg-[#EDF4F0] px-3.5 py-2.5"
        >
          <p className="min-w-0 truncate text-[12px] text-[#52625A]">
            <span className="mr-2 font-bold text-[#0B3B36]">답글</span>
            <strong className="font-semibold text-[#26352E]">
              {displayAuthorNickname(replyTarget.authorNickname)}
            </strong>
            님에게 작성 중
          </p>
          <button
            type="button"
            className="shrink-0 text-[12px] font-semibold text-[#66756D] underline underline-offset-2 hover:text-[#0B3B36]"
            onClick={onCancelReply}
          >
            취소
          </button>
        </div>
      )}
      <div className="flex items-end gap-2 lg:gap-3">
        <Textarea
          ref={inputRef}
          placeholder={
            replyTarget
              ? `${displayAuthorNickname(replyTarget.authorNickname)}님에게 답글을 남겨 주세요.`
              : isMaskedPost
                ? '운영자 답변을 작성해 주세요.'
                : '따뜻한 댓글을 남겨주세요'
          }
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={COMMENT_MAX_LENGTH}
          containerClassName="min-w-0 flex-1"
          className={cn(
            'mt-0 min-h-[46px] rounded-[12px] bg-[#F8F4EC] px-3.5 py-3 text-[13px] placeholder:text-[#B4B2A6] lg:min-h-[52px] lg:px-4 lg:text-sm',
            replyTarget ? 'border-[#AFC8BB] focus:border-[#709582]' : 'border-[#ECE5D8]',
          )}
        />
        <Button
          disabled={isSubmitting}
          onClick={onSubmit}
          className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[12px] px-0 lg:h-[52px] lg:w-[52px]"
          aria-label={replyTarget ? '답글 등록' : isMaskedPost ? '답변 등록' : '댓글 등록'}
        >
          <CommentSendIcon />
        </Button>
      </div>
    </div>
  );
}
