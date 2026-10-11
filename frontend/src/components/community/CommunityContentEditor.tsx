'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ReadableContent } from '@/components/content/ReadableContent';
import { CommunityRichEditor } from './CommunityRichEditor';
import { plainRichDocument } from '@/domain/post/richContent';

type CommunityContentEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label?: string;
  richContent?: string | null;
  onRichChange?: (plain: string, document: string) => void;
};

export function CommunityContentEditor({
  value, onChange, placeholder, label = '본문', richContent = null, onRichChange,
}: CommunityContentEditorProps) {
  const editor = useRef<HTMLTextAreaElement>(null);
  const previewId = useId();
  const [previewOpen, setPreviewOpen] = useState(false);
  const richEditing = Boolean(onRichChange && richContent);

  useEffect(() => {
    const field = editor.current;
    if (!field) return;
    const fitHeight = () => {
      field.style.height = 'auto';
      field.style.height = `${field.scrollHeight}px`;
    };
    fitHeight();
  }, [value]);

  useEffect(() => {
    const field = editor.current;
    if (!field) return;
    let width = field.getBoundingClientRect().width;
    const fitHeight = () => {
      field.style.height = 'auto';
      field.style.height = `${field.scrollHeight}px`;
    };
    const observer = new ResizeObserver(() => {
      const nextWidth = field.getBoundingClientRect().width;
      if (nextWidth !== width) { width = nextWidth; fitHeight(); }
    });
    observer.observe(field);
    document.fonts.addEventListener('loadingdone', fitHeight);
    return () => {
      observer.disconnect();
      document.fonts.removeEventListener('loadingdone', fitHeight);
    };
  }, [richEditing]);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor="content" className="text-[13px] font-semibold text-[#2C342E]">{label}</label>
        <button type="button" aria-expanded={previewOpen} aria-controls={previewId}
          onClick={() => setPreviewOpen(!previewOpen)}
          className="min-h-10 px-2 text-[13px] font-semibold text-[#0B3B36]">
          {previewOpen ? '미리보기 닫기' : '본문 미리보기'}
        </button>
      </div>
      {onRichChange && !richContent && <button type="button" onClick={() => onRichChange(value, JSON.stringify(plainRichDocument(value)))} className="mb-3 min-h-11 rounded-xl bg-[#EEF4EF] px-3 text-sm font-bold text-[#0B3B36]">서식 편집 시작 · 굵게, 목록, 인용, 링크</button>}
      {onRichChange && richContent ? <CommunityRichEditor value={value} richContent={richContent} label={label} placeholder={placeholder} onChange={onRichChange} /> : <div className="-mx-3 rounded-[14px] bg-[#FFFCF7] px-3 py-3 ring-1 ring-[#E2D5C2] focus-within:ring-[#0B3B36]/50">
        <textarea ref={editor} id="content" required wrap="soft" value={value}
          onChange={(event) => onChange(event.target.value)} placeholder={placeholder}
          className="hf-community-body hf-community-editor placeholder:text-[#8C958B]" />
      </div>}
      <p className="mt-3 text-[12px] leading-relaxed text-[#65706B]">줄을 바꾸려면 Enter를 눌러 주세요. 빈 줄을 넣으면 문단을 나눌 수 있어요.</p>
      {previewOpen && (
        <section id={previewId} aria-label="게시글 본문 미리보기" className="mt-5 border-t border-[#EAE3D6] pt-4">
          <h2 className="mb-3 text-[13px] font-semibold text-[#65706B]">게시글 본문 미리보기</h2>
          {value ? <ReadableContent text={value} richContent={richContent} variant="community" />
            : <p className="text-[13px] text-[#65706B]">글을 입력하면 여기에 표시돼요.</p>}
        </section>
      )}
    </div>
  );
}
