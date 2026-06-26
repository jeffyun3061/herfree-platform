import { cn } from '@/lib/cn';

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

function getVisiblePages(page: number, totalPages: number): number[] {
  const windowSize = 5;
  const half = Math.floor(windowSize / 2);
  const start = Math.max(0, Math.min(page - half, totalPages - windowSize));
  const end = Math.min(totalPages, start + windowSize);
  return Array.from({ length: end - start }, (_, index) => start + index);
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const visiblePages = getVisiblePages(page, totalPages);
  const progress = ((page + 1) / totalPages) * 100;

  const changePage = (nextPage: number) => {
    if (nextPage < 0 || nextPage >= totalPages || nextPage === page) return;
    onPageChange(nextPage);
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  };

  return (
    <nav className="mt-5 rounded-[20px] border border-[#ECE5D8] bg-white/82 px-3 py-3 shadow-card" aria-label="페이지 이동">
      <div className="mb-3 h-1 overflow-hidden rounded-full bg-[#EFE8DC]">
        <div
          className="h-full rounded-full bg-[#0B3B36] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          disabled={page <= 0}
          onClick={() => changePage(page - 1)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#ECE5D8] bg-[#F6F1E8] text-[#0B3B36] transition-colors disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="이전 페이지"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5">
          {visiblePages[0] > 0 && (
            <>
              <button type="button" onClick={() => changePage(0)} className="pagination-number">
                1
              </button>
              {visiblePages[0] > 1 && <span className="px-0.5 text-xs text-[#A6ABA0]">...</span>}
            </>
          )}

          {visiblePages.map((pageNumber) => {
            const active = pageNumber === page;
            return (
              <button
                key={pageNumber}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => changePage(pageNumber)}
                className={cn('pagination-number', active && 'pagination-number-active')}
              >
                {pageNumber + 1}
              </button>
            );
          })}

          {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
            <>
              {visiblePages[visiblePages.length - 1] < totalPages - 2 && (
                <span className="px-0.5 text-xs text-[#A6ABA0]">...</span>
              )}
              <button type="button" onClick={() => changePage(totalPages - 1)} className="pagination-number">
                {totalPages}
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          disabled={page >= totalPages - 1}
          onClick={() => changePage(page + 1)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#ECE5D8] bg-[#F6F1E8] text-[#0B3B36] transition-colors disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="다음 페이지"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </nav>
  );
}
