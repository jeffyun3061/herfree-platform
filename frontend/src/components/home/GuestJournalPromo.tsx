'use client';

import Link from 'next/link';
import { ButtonLink } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

type GuestJournalPromoProps = {
  className?: string;
};

const previewItems = [
  { label: '수면', value: '7시간', color: '#6FC2A6' },
  { label: '영양제', value: '체크', color: '#1D9E75' },
  { label: '스트레스', value: '기록', color: '#E0A93D' },
];

export function GuestJournalPromo({ className }: GuestJournalPromoProps) {
  return (
    <section className={cn('px-4 pt-4', className)}>
      <div className="overflow-hidden rounded-[24px] border border-[#E7DFD2] bg-white shadow-[0_18px_42px_-30px_rgba(24,34,28,.45)]">
        <div className="bg-[#07251F] px-5 pb-6 pt-7 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/48">
            Private journal
          </p>
          <h1 className="hf-display mt-2 text-[26px] font-extrabold leading-[1.32]">
            오늘의 몸 상태를
            <br />
            조용히 기록해요
          </h1>
          <p className="mt-3 text-[13px] leading-[1.7] text-white/72">
            수면, 영양제, 스트레스, 전조 증상을 한 흐름으로 남기고 나만의 패턴을 확인할 수 있어요.
          </p>
        </div>

        <div className="px-5 py-5">
          <div className="grid grid-cols-3 gap-2">
            {previewItems.map((item) => (
              <div key={item.label} className="rounded-[16px] bg-[#F7F3EC] px-3 py-3">
                <span
                  className="mb-2 block h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <p className="text-[11px] text-[#8B9590]">{item.label}</p>
                <p className="mt-1 text-[13px] font-bold text-[#15201D]">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-[18px] border border-[#ECE5D8] bg-[#FFFCF7] p-4">
            <p className="text-[13px] font-semibold text-[#1E2621]">로그인하면 바로 사용할 수 있어요</p>
            <p className="mt-1.5 text-[12px] leading-[1.65] text-[#65706B]">
              기록은 본인에게만 보이고, 회복 일수와 최근 패턴을 자동으로 정리해 줍니다.
            </p>
          </div>

          <ButtonLink href="/login?from=%2Fjournal" fullWidth size="lg" className="mt-4 rounded-[14px]">
            로그인하고 개인 일지 기록하기
          </ButtonLink>
          <Link href="/signup?from=/journal" className="mt-3 block text-center text-[12.5px] text-[#54614F]">
            처음이라면 계정 만들기
          </Link>
        </div>
      </div>
    </section>
  );
}
