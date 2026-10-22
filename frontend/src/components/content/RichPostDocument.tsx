import { Fragment, type ReactNode } from 'react';
import { type RichNode } from '@/domain/post/richContent';

export function RichPostDocument({ document }: { document: RichNode }) {
  function render(node: RichNode, key: number): ReactNode {
    const children = node.content?.map(render);
    switch (node.type) {
      case 'doc': return <Fragment key={key}>{children}</Fragment>;
      case 'paragraph': return <p key={key}>{children?.length ? children : <br />}</p>;
      case 'heading': return node.attrs?.level === 3 ? <h3 key={key}>{children}</h3> : <h2 key={key}>{children}</h2>;
      case 'bulletList': return <ul key={key}>{children}</ul>;
      case 'orderedList': return <ol key={key} start={node.attrs?.start ?? 1}>{children}</ol>;
      case 'listItem': return <li key={key}>{children}</li>;
      case 'blockquote': return <blockquote key={key}>{children}</blockquote>;
      case 'hardBreak': return <br key={key} />;
      case 'text': {
        let text: ReactNode = node.text;
        for (const mark of node.marks ?? []) {
          text = mark.type === 'bold' ? <strong>{text}</strong>
            : <a href={mark.attrs.href} target="_blank" rel="noopener noreferrer nofollow ugc">{text}</a>;
        }
        return <Fragment key={key}>{text}</Fragment>;
      }
      default: return null;
    }
  }
  return render(document, 0);
}
