import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReadableContent } from '@/components/content/ReadableContent';
import { parseRichContent, plainRichDocument, richPlainText, safePostLink } from '@/domain/post/richContent';

describe('safe rich community content', () => {
  it('preserves blank lines and treats legacy HTML as plain text', () => {
    const plain = 'one\n\n\n<img src=x onerror=alert(1)>';
    expect(richPlainText(plainRichDocument(plain))).toBe(plain);
    const { container } = render(<ReadableContent text={plain} variant="community" />);
    expect(container.textContent).toBe(plain);
    expect(container.querySelector('img')).toBeNull();
  });
  it('renders approved emphasis and safe external links through React', () => {
    const raw = JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '<script>safe text</script>', marks: [{ type: 'bold' }, { type: 'link', attrs: { href: 'https://example.test/' } }] }] }] });
    const { container } = render(<ReadableContent text="fallback" richContent={raw} variant="community" />);
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('strong')).toHaveTextContent('<script>safe text</script>');
    expect(screen.getByRole('link')).toHaveAttribute('rel', 'noopener noreferrer nofollow ugc');
  });
  it('rejects executable URLs, custom HTML nodes and deeply nested payloads', () => {
    for (const href of ['javascript:alert(1)', 'data:text/html,unsafe', '//example.test/', 'https://user:secret@example.test/', 'https://example.test/\nprivate']) expect(safePostLink(href)).toBe(false);
    expect(parseRichContent('{"type":"doc","content":[{"type":"script"}]}')).toBeNull();
    let child: unknown = { type: 'paragraph' };
    for (let i = 0; i < 20; i++) child = { type: 'blockquote', content: [child] };
    expect(parseRichContent(JSON.stringify({ type: 'doc', content: [child] }))).toBeNull();
  });
});
