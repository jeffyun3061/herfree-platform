import Link from 'next/link';

const faqGroups = [
  {
    category: '기초 정보',
    items: [
      {
        question: 'Herfree는 어떤 서비스인가요?',
        answer:
          '같은 고민을 가진 사람들이 익명으로 기록하고, 묻고, 필요한 정보를 확인할 수 있는 건강 커뮤니티입니다.',
      },
      {
        question: '가입하지 않아도 볼 수 있나요?',
        answer:
          '칼럼, 영상, 일부 안내 정보는 둘러볼 수 있고, 글쓰기와 개인일지는 로그인 후 이용할 수 있습니다.',
      },
      {
        question: '익명으로 활동할 수 있나요?',
        answer:
          '커뮤니티에서는 닉네임 기반으로 활동합니다. 실명이나 연락처를 공개하지 않아도 사용할 수 있어요.',
      },
    ],
  },
  {
    category: '기록과 커뮤니티',
    items: [
      {
        question: '개인일지는 다른 사람에게 보이나요?',
        answer:
          '개인일지는 본인 계정에서만 관리됩니다. 공개 커뮤니티 글과 분리되어 있어 다른 회원에게 노출되지 않습니다.',
      },
      {
        question: '커뮤니티 글은 누가 볼 수 있나요?',
        answer:
          '커뮤니티 게시글은 서비스 정책에 따라 회원에게 노출될 수 있습니다. 민감한 상담은 1:1 비밀 상담 흐름을 권장합니다.',
      },
      {
        question: '질문 글은 어디에 올리면 되나요?',
        answer:
          '커뮤니티의 질문 성격 게시판에 올릴 수 있습니다. 자주 묻는 내용은 이 FAQ에서 먼저 확인할 수 있어요.',
      },
    ],
  },
  {
    category: '상담',
    items: [
      {
        question: '1:1 상담은 어디서 하나요?',
        answer:
          '하단 안내의 1:1 비밀상담을 누르면 상담 화면으로 이동합니다. 상담 화면에서 카카오톡 오픈채팅으로 이어갈 수 있어요.',
      },
      {
        question: '상담 내용이 공개되나요?',
        answer:
          '상담은 공개 게시판과 분리된 흐름입니다. 커뮤니티 글처럼 다른 회원에게 노출되는 구조가 아닙니다.',
      },
      {
        question: '의료 진단이나 처방도 가능한가요?',
        answer:
          'Herfree 상담은 의료 진단이나 처방을 대신하지 않습니다. 증상이 심하거나 급한 상황이면 의료기관 진료를 먼저 권장합니다.',
      },
    ],
  },
];

export default function QnaPage() {
  return (
    <main className="min-h-screen bg-[#F3EDE3] pb-28">
      <section className="px-5 pt-[62px]">
        <h1 className="hf-display m-0 text-[24px] font-extrabold leading-tight tracking-[-0.01em] text-[#1E2621]">
          자주 묻는 질문
        </h1>
        <p className="mt-[5px] text-[12.5px] text-[#9A9F94]">
          많이 물어보신 것들을 먼저 모아봤어요.
        </p>
      </section>

      <section className="flex flex-col gap-[22px] px-5 pt-[18px]">
        {faqGroups.map((group) => (
          <section key={group.category}>
            <h2 className="px-0.5 pb-2.5 text-[12.5px] font-bold tracking-[0.01em] text-[#15695E]">
              {group.category}
            </h2>
            <div className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(20,30,25,.04),0_14px_30px_-24px_rgba(20,30,25,.22)]">
              {group.items.map((item) => (
                <details key={item.question} className="group border-t border-[#F2ECE1] first:border-t-0">
                  <summary className="flex cursor-pointer list-none items-start gap-2.5 px-4 py-[15px]">
                    <span className="hf-display shrink-0 text-[15px] font-extrabold leading-[1.4] text-[#C9A24B]">
                      Q
                    </span>
                    <span className="flex-1 text-[13.5px] font-semibold leading-[1.5] tracking-[-0.01em] text-[#1E2621]">
                      {item.question}
                    </span>
                    <span className="mt-0.5 shrink-0 text-[13px] text-[#B4B2A6] transition-transform group-open:rotate-180">
                      ˅
                    </span>
                  </summary>
                  <div className="flex items-start gap-2.5 px-4 pb-4">
                    <span className="hf-display shrink-0 text-[15px] font-extrabold leading-[1.4] text-[#15695E]">
                      A
                    </span>
                    <p className="flex-1 text-[12.5px] leading-[1.75] text-[#5C645A]">{item.answer}</p>
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </section>

      <Link
        href="/consult"
        className="mx-5 mt-6 flex rounded-2xl bg-[#0B3B36] p-[17px_19px] shadow-[0_14px_30px_-18px_rgba(11,59,54,.6)]"
      >
        <span className="flex-1">
          <span className="block text-[13.5px] font-bold text-white">원하는 답을 못 찾으셨나요?</span>
          <span className="mt-[3px] block text-[12px] text-white/70">
            1:1 비밀상담으로 편하게 물어보세요.
          </span>
        </span>
        <span className="shrink-0 text-[20px] text-[#F0C778]">›</span>
      </Link>
    </main>
  );
}
