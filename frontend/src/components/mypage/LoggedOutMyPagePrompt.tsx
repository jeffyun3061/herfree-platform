'use client';

import Link from 'next/link';
import { PUBLIC_IMAGES } from '@/domain/assets/static';

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function LoggedOutMyPagePromptCard() {
  return (
    <div className="px-4 pb-36 pt-5">
      <section className="mx-auto max-w-[340px] overflow-hidden rounded-[26px] border border-[#E7DFD2] bg-white shadow-[0_24px_54px_-34px_rgba(24,34,28,.52)]">
        <div className="relative aspect-[16/9] overflow-hidden bg-[#0B3B36]">
          <img
            src={PUBLIC_IMAGES.journalDashboardHero}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,37,31,.08)_0%,rgba(7,37,31,.80)_100%)]" />
          <div className="absolute left-4 top-4 rounded-full bg-white/14 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[.08em] text-white/84 backdrop-blur">
            My page
          </div>
          <div className="absolute bottom-8 left-4 right-4">
            <p className="text-[11.5px] font-semibold text-white/76">
              내 기록과 활동을 한곳에 모아요
            </p>
            <h1 className="hf-display mt-1 text-[22px] font-extrabold leading-[1.12] text-white">
              로그인하면
              <br />
              이어서 확인할 수 있어요
            </h1>
          </div>
        </div>

        <div className="px-4 pb-5 pt-4">
          <div className="-mt-4 mx-auto w-[86%] max-w-[260px] rounded-[20px] border border-[#E9DFD1] bg-[#FFFCF7] p-3 shadow-[0_18px_36px_-28px_rgba(7,37,31,.55)]">
            <div className="grid grid-cols-3 gap-2">
              {[
                ['글', '활동'],
                ['공감', '반응'],
                ['일지', '요약'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-[13px] bg-white px-2 py-2 text-center">
                  <p className="text-[11px] font-extrabold text-[#0B3B36]">{value}</p>
                  <p className="mt-1 text-[9.5px] text-[#7B837E]">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-4 text-[13px] leading-[1.7] text-[#5B6864]">
            내가 쓴 글, 받은 공감, 개인일지 요약과 상담 흐름을 안전하게 이어서 볼 수 있어요.
          </p>

          <div className="mt-4 space-y-2.5">
            {[
              '커뮤니티 활동과 개인 기록은 분리돼요',
              '필요한 정보만 마이페이지에서 확인해요',
              '상담과 기록 흐름을 끊기지 않게 이어가요',
            ].map((text) => (
              <div key={text} className="flex items-center gap-2 text-[12px] font-medium text-[#1E2621]">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E7F1EC] text-[#0B3B36]">
                  <CheckIcon />
                </span>
                <span>{text}</span>
              </div>
            ))}
          </div>

          <Link
            href="/login?from=%2Fmypage"
            className="mt-5 flex min-h-[48px] items-center justify-center rounded-[14px] bg-[#0B3B36] text-[14px] font-extrabold text-white shadow-[0_16px_32px_-24px_rgba(11,59,54,.75)]"
          >
            로그인하고 확인하기
          </Link>
          <Link
            href="/signup?from=/mypage"
            className="mt-3 block text-center text-[12.5px] font-semibold text-[#65706B]"
          >
            아직 계정이 없다면 회원가입
          </Link>
        </div>
      </section>
    </div>
  );
}
