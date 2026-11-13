'use client';

import { useEffect, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { normalizeRichDocument, parseRichContent, plainRichDocument, richPlainText, safePostLink } from '@/domain/post/richContent';

type Props = { value: string; richContent: string | null; label: string; placeholder: string; onChange: (plain: string, document: string) => void };
export function CommunityRichEditor({ value, richContent, label, placeholder, onChange }: Props) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkError, setLinkError] = useState('');
  const [documentError, setDocumentError] = useState('');
  const [, refreshToolbar] = useState(0);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit.configure({
      code: false, codeBlock: false, horizontalRule: false, italic: false, strike: false, underline: false,
      heading: { levels: [2, 3] },
      link: { autolink: false, linkOnPaste: false, openOnClick: false, isAllowedUri: safePostLink,
        HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer nofollow ugc' } },
    })],
    content: parseRichContent(richContent) ?? plainRichDocument(value),
    editorProps: { attributes: { id: 'content', role: 'textbox', 'aria-label': label, 'aria-multiline': 'true',
      class: 'hf-community-body hf-community-rich hf-rich-editor', 'data-placeholder': placeholder } },
    onUpdate: ({ editor }) => {
      try {
        const document = normalizeRichDocument(editor.getJSON());
        onChange(richPlainText(document), JSON.stringify(document)); setDocumentError('');
      } catch {
        onChange(editor.getText({ blockSeparator: '\n' }), JSON.stringify(editor.getJSON()));
        setDocumentError('서식이 너무 복잡합니다. 목록 깊이나 내용을 줄여 주세요.');
      }
    },
    onTransaction: () => refreshToolbar((revision) => revision + 1),
  });

  useEffect(() => {
    if (!editor) return;
    const incoming = parseRichContent(richContent) ?? plainRichDocument(value);
    try {
      const current = normalizeRichDocument(editor.getJSON());
      if (JSON.stringify(incoming) !== JSON.stringify(current)) editor.commands.setContent(incoming, { emitUpdate: false });
    } catch { /* Keep an invalid draft visible for correction; submission validation blocks it. */ }
  }, [editor, richContent, value]);

  if (!editor) return <p className="py-4 text-sm text-[#65706B]">편집기 준비 중…</p>;
  const actions = [
    { label: '굵게', active: editor.isActive('bold'), enabled: editor.can().toggleBold(), run: () => editor.chain().focus().toggleBold().run() },
    { label: '소제목', active: editor.isActive('heading', { level: 2 }), enabled: editor.can().toggleHeading({ level: 2 }), run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: '작은 제목', active: editor.isActive('heading', { level: 3 }), enabled: editor.can().toggleHeading({ level: 3 }), run: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { label: '글머리 목록', active: editor.isActive('bulletList'), enabled: editor.can().toggleBulletList(), run: () => editor.chain().focus().toggleBulletList().run() },
    { label: '번호 목록', active: editor.isActive('orderedList'), enabled: editor.can().toggleOrderedList(), run: () => editor.chain().focus().toggleOrderedList().run() },
    { label: '인용', active: editor.isActive('blockquote'), enabled: editor.can().toggleBlockquote(), run: () => editor.chain().focus().toggleBlockquote().run() },
  ];
  return <div>
    <div role="group" aria-label="본문 서식" className="mb-3 flex flex-wrap gap-1.5">
      {actions.map((action) => <button key={action.label} type="button" disabled={!action.enabled} aria-pressed={action.active} onMouseDown={(event) => event.preventDefault()} onClick={action.run}
        className={`min-h-11 rounded-lg px-3 text-xs font-bold disabled:opacity-40 ${action.active ? 'bg-[#0B3B36] text-white' : 'bg-[#EEF4EF] text-[#0B3B36]'}`}>{action.label}</button>)}
      <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { setLinkUrl(editor.getAttributes('link').href ?? ''); setLinkOpen(!linkOpen); setLinkError(''); }} className="min-h-11 rounded-lg bg-[#EEF4EF] px-3 text-xs font-bold">링크</button>
      <button type="button" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()} className="min-h-11 rounded-lg bg-[#EEF4EF] px-3 text-xs font-bold disabled:opacity-40">되돌리기</button>
      <button type="button" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()} className="min-h-11 rounded-lg bg-[#EEF4EF] px-3 text-xs font-bold disabled:opacity-40">다시 실행</button>
    </div>
    {linkOpen && <div className="mb-3 rounded-xl bg-[#EEF4EF] p-3">
      <label className="block text-sm" htmlFor="post-link-url">링크 주소</label><input id="post-link-url" type="url" value={linkUrl} maxLength={2048} placeholder="https://…" onChange={(event) => setLinkUrl(event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-[#E2D5C2] bg-white px-3 text-sm" />
      <p className="mt-1 text-xs">먼저 연결할 글자를 선택해 주세요.</p>
      <div className="mt-2 flex flex-wrap gap-3 text-sm font-bold"><button type="button" className="min-h-11" onClick={() => {
        if (!safePostLink(linkUrl.trim())) { setLinkError('http 또는 https 주소를 입력해 주세요.'); return; }
        if (editor.state.selection.empty) { setLinkError('링크로 만들 글자를 먼저 선택해 주세요.'); return; }
        editor.chain().focus().extendMarkRange('link').setLink({ href: new URL(linkUrl.trim()).href }).run(); setLinkOpen(false);
      }}>링크 적용</button><button type="button" className="min-h-11" onClick={() => { editor.chain().focus().extendMarkRange('link').unsetLink().run(); setLinkOpen(false); }}>링크 제거</button><button type="button" className="min-h-11" onClick={() => setLinkOpen(false)}>닫기</button></div>
      {linkError && <p role="alert" className="text-sm text-red-700">{linkError}</p>}
    </div>}
    {editor.isEmpty && <p className="mb-2 text-xs text-[#65706B]">{placeholder}</p>}
    <div className="-mx-3 rounded-[14px] bg-[#FFFCF7] px-3 py-3 ring-1 ring-[#E2D5C2] focus-within:ring-[#0B3B36]/50"><EditorContent editor={editor} /></div>
    {documentError && <p role="alert" className="mt-2 text-sm text-red-700">{documentError}</p>}
  </div>;
}
