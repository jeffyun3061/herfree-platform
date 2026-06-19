import { BrandMark } from '@/components/brand/BrandMark';

export function JournalDashboardHeader() {
  return (
    <header className="flex items-center gap-2">
      <BrandMark size="sm" showText={false} />
      <p className="text-sm text-ink-soft">헤르프리와 함께 하루를 기록해요</p>
    </header>
  );
}
