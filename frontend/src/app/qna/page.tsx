import Link from 'next/link';
import { BrandMark } from '@/components/brand/BrandMark';
import { KAKAO_CONSULT_URL } from '@/domain/consult/constants';

const faqGroups = [
  {
    title: '서비스 이용',
    items: [
      {
        question: 'Herfree는 어떤 서비스인가요?',
        answer:
          '같은 고민을 가진 사람들이 익명으로 기록하고, 묻고, 정보를 확인할 수 있는 건강 커뮤니티입니다.',
      },
      {
        question: '가입하지 않아도 볼 수 있나요?',
        answer:
          '칼럼, 영상, 일부 커뮤니티 흐름은 둘러볼 수 있고, 글쓰기와 개인일지는 로그인이 필요합니다.',
      },
    ],
  },
  {
    title: '기록과 커뮤니티',
    items: [
      {
        question: '개인일지는 다른 사람에게 보이나요?',
        answer:
          '개인일지는 본인 계정에서만 관리됩니다. 공개 커뮤니티 글과 분리되어 있어요.',
      },
      {
        question: '익명으로 글을 쓸 수 있나요?',
        answer:
          '커뮤니티에서는 닉네임 기반으로 활동하며, 민감한 상담은 카카오톡 비밀 상담 흐름을 권장합니다.',
      },
    ],
  },
  {
    title: '상담',
    items: [
      {
        question: '1:1 상담은 어디서 하나요?',
        answer:
          '상담 화면의 카카오톡 상담 버튼을 누르면 Herfree 오픈채팅 상담방으로 이동합니다.',
      },
      {
        question: '의료 진단이나 처방을 받을 수 있나요?',
        answer:
          'Herfree 상담은 의료 진단이나 처방을 대신하지 않습니다. 증상이 심하면 의료기관 진료를 우선해 주세요.',
      },
    ],
  },
];

export default function QnaPage() {
  return (
    <main className="min-h-screen bg-[#F3EDE3] pb-36">
      <section className="px-4 pt-5">
        <div className="flex items-center justify-between">
          <BrandMark size="sm" variant="default" />
          <Link href="/consult" className="rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-[#0B3B36] shadow-sm">
            1:1 상담
          </Link>
        </div>

        <div className="mt-8">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#8B9590]">FAQ</p>
          <h1 className="hf-display mt-2 text-[28px] font-extrabold leading-[1.28] text-[#161C19]">
            자주 묻는 질문
          </h1>
          <p className="mt-2 text-[13px] leading-6 text-[#65706B]">
            많이 물어보신 것들을 먼저 모아봤어요. 더 개인적인 내용은 비밀 상담으로 이어가세요.
          </p>
        </div>
      </section>

      <section className="px-4 pt-5">
        <div className="space-y-4">
          {faqGroups.map((group) => (
            <article key={group.title} className="rounded-[22px] border border-[#E8E0D4] bg-white p-4 shadow-card">
              <h2 className="text-[15px] font-extrabold text-[#1E2621]">{group.title}</h2>
              <div className="mt-3 divide-y divide-[#EEF0EC]">
                {group.items.map((item) => (
                  <details key={item.question} className="group py-3 first:pt-0 last:pb-0">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-3 text-[13.5px] font-bold leading-5 text-[#1E2621]">
                      <span className="flex gap-2">
                        <span className="text-[#0B3B36]">Q</span>
                        <span>{item.question}</span>
                      </span>
                      <span className="mt-0.5 text-[#9EA79F] transition-transform group-open:rotate-90">›</span>
                    </summary>
                    <p className="mt-2 pl-5 text-[12.5px] leading-6 text-[#5C645A]">{item.answer}</p>
                  </details>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="px-4 pt-4">
        <div className="rounded-[20px] bg-[#07251F] p-4 text-white shadow-[0_18px_38px_-28px_rgba(7,37,31,.9)]">
          <p className="text-[13px] font-semibold">답을 찾지 못했나요?</p>
          <p className="mt-1.5 text-[12px] leading-5 text-white/68">
            민감한 고민은 공개 게시판보다 1:1 상담 흐름이 더 편할 수 있어요.
          </p>
          <a
            href={KAKAO_CONSULT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#F0C778] text-[13px] font-extrabold text-[#07251F]"
          >
            카톡 상담 시작
          </a>
        </div>
      </section>
    </main>
  );
}
