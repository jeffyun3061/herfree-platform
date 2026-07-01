'use client';

import Link from 'next/link';
import { PUBLIC_IMAGES } from '@/domain/assets/static';

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function GuestPeaceCta() {
  return (
    <section className="mx-2 mt-2 overflow-hidden rounded-[26px] border border-[#E7DFD2] bg-white shadow-[0_22px_52px_-34px_rgba(24,34,28,.5)]">
      <div className="relative">
        <div className="relative aspect-[16/9] overflow-hidden bg-[#0B3B36]">
          <img
            src={PUBLIC_IMAGES.journalDashboardHero}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,37,31,.18)_0%,rgba(7,37,31,.72)_100%)]" />
          <div className="absolute left-4 top-4 rounded-full bg-white/16 px-3 py-1 text-[10px] font-extrabold uppercase text-white/86 backdrop-blur">
            Private journal
          </div>
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-[12px] font-semibold text-white/78">내 몸의 흐름을 조용히 기록해요</p>
            <h2 className="hf-display mt-1 text-[25px] font-extrabold leading-tight text-white">
              오늘의 몸상태를
              <br />
              기록해 보세요
            </h2>
          </div>
        </div>

        <div className="relative px-4 pb-5 pt-4">
          <div className="-mt-9 ml-auto w-[72%] rounded-[20px] border border-[#E9DFD1] bg-[#FFFCF7] p-3 shadow-[0_18px_36px_-28px_rgba(7,37,31,.55)]">
            <div className="grid grid-cols-3 gap-2">
              {[
                ['수면', '7시간+'],
                ['복용', '체크'],
                ['컨디션', '메모'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[13px] bg-white px-2 py-2 text-center">
                  <p className="text-[11px] font-extrabold text-[#0B3B36]">{value}</p>
                  <p className="mt-1 text-[9.5px] text-[#7B837E]">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-4 text-[13px] leading-[1.7] text-[#5B6864]">
            증상, 약 복용, 스트레스, 생활 패턴을 한 번에 남기고 나만의 재발 패턴을 확인할 수 있어요.
          </p>

          <div className="mt-4 space-y-2.5">
            {[
              '기록은 본인 계정에서만 확인돼요',
              '지난 날짜도 선택해서 남길 수 있어요',
              '루틴과 재발 기록을 함께 관리해요',
            ].map((text) => (
              <div key={text} className="flex items-center gap-2 text-[12px] font-medium text-[#1E2621]">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E7F1EC] text-[#0B3B36]">
                  <CheckIcon />
                </span>
                {text}
              </div>
            ))}
          </div>

          <Link
            href="/signup?from=/journal"
            className="mt-5 flex min-h-[46px] items-center justify-center rounded-[14px] bg-[#0B3B36] text-[14px] font-extrabold text-white shadow-[0_16px_30px_-24px_rgba(11,59,54,.75)]"
          >
            가입 후 기록 시작하기
          </Link>
          <Link
            href="/login?from=%2Fjournal"
            className="mt-3 block text-center text-[12.5px] font-semibold text-[#65706B]"
          >
            이미 계정이 있다면 로그인
          </Link>
        </div>
      </div>
    </section>
  );
}
