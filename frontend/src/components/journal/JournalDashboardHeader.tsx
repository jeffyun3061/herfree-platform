import { BrandMark } from '@/components/brand/BrandMark';

export function JournalDashboardHeader() {
  return (
    <header className="flex items-center gap-1.5 px-0.5 pb-0.5">
      <BrandMark size="sm" showText={false} />
      <p className="text-[13px] text-[var(--color-text-secondary)]">
        헤르프리와 함께 하루를 기록해요
      </p>
    </header>
  );
}