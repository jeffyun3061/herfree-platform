import { Fragment } from 'react';
import { cn } from '@/lib/cn';
import { parseRichContent } from '@/domain/post/richContent';
import { RichPostDocument } from './RichPostDocument';

type ReadableContentProps = {
  text: string;
  richContent?: string | null;
  variant?: 'article' | 'community' | 'video';
  className?: string;
};

/**
 * Renders legacy plain-text content as controlled paragraphs.
 * It preserves intentional line breaks without allowing repeated blank lines
 * to create unpredictable vertical gaps or overflow.
 */
export function ReadableContent({ text, richContent, variant = 'article', className }: ReadableContentProps) {
  // Match the plain-text editor's wrapping and intentional blank lines. React
  // escapes the text, so a preview never interprets user input as HTML.
  if (variant === 'community') {
    const document = parseRichContent(richContent);
    if (document) return <div className={cn('hf-community-body hf-community-rich', className)}><RichPostDocument document={document} /></div>;
    return <div className={cn('hf-readable-content hf-community-body', 'hf-readable-content--community', className)}>{text.replace(/\r\n?/g, '\n')}</div>;
  }
  const normalized = text.replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  const paragraphs = normalized ? normalized.split(/\n{2,}/) : [];

  return (
    <div className={cn('hf-readable-content', `hf-readable-content--${variant}`, className)}>
      {paragraphs.map((paragraph, paragraphIndex) => {
        const lines = paragraph.split('\n');

        return (
          <p key={`${paragraphIndex}-${paragraph.slice(0, 20)}`}>
            {lines.map((line, lineIndex) => (
              <Fragment key={`${lineIndex}-${line.slice(0, 12)}`}>
                {lineIndex > 0 && <br />}
                {line}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
