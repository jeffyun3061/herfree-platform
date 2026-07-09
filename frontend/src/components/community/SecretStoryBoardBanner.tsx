import { SECRET_STORY_BOARD_COPY } from '@/domain/board/privateBoard';
import { cn } from '@/lib/cn';

type SecretStoryBoardBannerProps = {
  className?: string;
};

export function SecretStoryBoardBanner({ className }: SecretStoryBoardBannerProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-primary/20 bg-primary/5 px-4 py-3',
        className,
      )}
    >
      <p className="text-sm font-semibold text-ink">{SECRET_STORY_BOARD_COPY.bannerTitle}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-wrtn-muted">
        {SECRET_STORY_BOARD_COPY.bannerDescription}
      </p>
    </div>
  );
}
