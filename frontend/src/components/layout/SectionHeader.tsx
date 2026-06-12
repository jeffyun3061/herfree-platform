import Link from 'next/link';

type SectionHeaderProps = {
  title: string;
  href?: string;
  linkLabel?: string;
};

export function SectionHeader({ title, href, linkLabel = '더 보기' }: SectionHeaderProps) {
  return (
    <div className="mb-3 flex items-end justify-between">
      <h2 className="section-title">{title}</h2>
      {href && (
        <Link href={href} className="text-xs font-medium text-primary">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
