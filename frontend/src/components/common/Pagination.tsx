import { Button } from '@/components/ui/Button';

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 py-4">
      <Button
        variant="secondary"
        size="sm"
        disabled={page <= 0}
        onClick={() => onPageChange(page - 1)}
      >
        이전
      </Button>
      <span className="text-sm text-muted">
        {page + 1} / {totalPages}
      </span>
      <Button
        variant="secondary"
        size="sm"
        disabled={page >= totalPages - 1}
        onClick={() => onPageChange(page + 1)}
      >
        다음
      </Button>
    </div>
  );
}
