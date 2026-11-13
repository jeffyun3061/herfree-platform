export type RichMark = { type: 'bold' } | { type: 'link'; attrs: { href: string } };
export type RichNode = { type: string; text?: string; attrs?: { level?: 2 | 3; start?: number }; marks?: RichMark[]; content?: RichNode[] };
const blocks = ['paragraph', 'heading', 'blockquote', 'bulletList', 'orderedList'];

export function safePostLink(href: string): boolean {
  try {
    const url = new URL(href);
    return href.length <= 2048 && !/[\s\u0000-\u001f\u007f]/.test(href) && ['https:', 'http:'].includes(url.protocol)
      && !!url.hostname && !url.username && !url.password;
  } catch { return false; }
}

/** Strip editor attributes, retain only our document schema and never pass HTML to a renderer. */
export function normalizeRichDocument(value: unknown): RichNode {
  let count = 0;
  function visit(value: unknown, parent: string, depth: number): RichNode {
    if (depth > 12 || ++count > 3000 || !value || typeof value !== 'object') throw new Error('Invalid document');
    const input = value as Record<string, unknown>;
    const type = String(input.type);
    const inline = ['paragraph', 'heading'].includes(parent);
    const allowed = parent === 'root' ? type === 'doc' : inline ? ['text', 'hardBreak'].includes(type)
      : ['bulletList', 'orderedList'].includes(parent) ? type === 'listItem' : blocks.includes(type);
    if (!allowed) throw new Error('Invalid node');
    const result: RichNode = { type };
    const attrs = input.attrs as Record<string, unknown> | undefined;
    if (type === 'heading') {
      if (attrs?.level !== 2 && attrs?.level !== 3) throw new Error('Invalid heading');
      result.attrs = { level: attrs.level };
    }
    if (type === 'orderedList') {
      const start = attrs?.start ?? 1;
      if (typeof start !== 'number' || !Number.isInteger(start) || start < 1 || start > 1000) throw new Error('Invalid list');
      result.attrs = { start };
    }
    if (type === 'text') {
      if (typeof input.text !== 'string') throw new Error('Invalid text');
      result.text = input.text;
      if (input.marks !== undefined) {
        if (!Array.isArray(input.marks) || input.marks.length > 2) throw new Error('Invalid marks');
        const seen = new Set<string>();
        result.marks = input.marks.map((mark): RichMark => {
          if (seen.has(mark.type)) throw new Error('Duplicate mark');
          seen.add(mark.type);
          if (mark.type === 'bold') return { type: 'bold' };
          if (mark.type === 'link' && typeof mark.attrs?.href === 'string' && safePostLink(mark.attrs.href)) {
            return { type: 'link', attrs: { href: mark.attrs.href } };
          }
          throw new Error('Invalid mark');
        });
      }
    } else if (type !== 'hardBreak') {
      const textBlock = ['paragraph', 'heading'].includes(type);
      if (input.content === undefined && textBlock) return result;
      if (!Array.isArray(input.content) || (!textBlock && !input.content.length)) throw new Error('Invalid children');
      result.content = input.content.map((child) => visit(child, type, depth + 1));
    }
    return result;
  }
  return visit(value, 'root', 0);
}

export function parseRichContent(raw: string | null | undefined): RichNode | null {
  if (!raw || raw.length > 200000) return null;
  try { return normalizeRichDocument(JSON.parse(raw)); } catch { return null; }
}
export function richPlainText(node: RichNode): string {
  if (node.type === 'text') return node.text ?? '';
  if (node.type === 'hardBreak') return '\n';
  return (node.content ?? []).map(richPlainText).join(['paragraph', 'heading'].includes(node.type) ? '' : '\n');
}
export function plainRichDocument(text: string): RichNode {
  return { type: 'doc', content: text.replace(/\r\n?/g, '\n').split('\n').map((line) => ({ type: 'paragraph', ...(line ? { content: [{ type: 'text', text: line }] } : {}) })) };
}
