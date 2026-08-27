import { Fragment } from 'react';
import { cn } from '@/lib/cn';

type ReadableContentProps = {
  text: string;
  variant?: 'article' | 'community' | 'video';
  className?: string;
};

/**
 * Renders legacy plain-text content as controlled paragraphs.
 * It preserves intentional line breaks without allowing repeated blank lines
 * to create unpredictable vertical gaps or overflow.
 */
export function ReadableContent({ text, variant = 'article', className }: ReadableContentProps) {
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
