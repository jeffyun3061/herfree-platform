import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';

export default function PrivacyPage() {
  return (
    <>
      <PageHeader title="개인정보처리방침" showBack mobileOnly />
      <div className="page-container max-w-2xl py-8 lg:py-12">
        <h1 className="hidden text-2xl font-semibold text-ink lg:block">개인정보처리방침</h1>
        <p className="mt-2 text-xs text-muted">시행일: 2026년 6월 13일</p>

        <div className="prose-policy mt-8 space-y-6 text-sm leading-relaxed text-cream-foreground">
          <section>
            <h2 className="text-base font-semibold text-ink">1. 수집하는 개인정보</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>회원가입: 이메일, 비밀번호(암호화 저장), 닉네임</li>
              <li>서비스 이용: 게시물·댓글·개인 일지 기록, 접속 로그</li>
              <li>분석 정보: 페이지 이동, 상담 클릭, 가입·로그인 완료 여부 등 최소 행동 이벤트</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink">2. 이용 목적</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>회원 식별·인증 및 서비스 제공</li>
              <li>커뮤니티 운영, 신고 처리, 부정 이용 방지</li>
              <li>개인 일지·통계 기능 제공 (본인만 열람)</li>
              <li>서비스 품질 개선과 운영 통계 확인. 분석 이벤트에는 이메일, 닉네임, 일지 메모, 게시글 본문을 포함하지 않습니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink">3. 보관 및 파기</h2>
            <p className="mt-2">
              회원 탈퇴 시 계정 정보는 지체 없이 파기하며, 커뮤니티 게시물은 익명 처리됩니다.
              관련 법령에 따라 보관이 필요한 경우 해당 기간 동안만 보관합니다.
              접속·분석 로그는 운영 통계 목적에 필요한 기간만 보관하고, IP·브라우저 정보는 원문이 아닌 해시값으로 저장합니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink">4. 제3자 제공</h2>
            <p className="mt-2">
              원칙적으로 회원 개인정보를 외부에 제공하지 않습니다. 법령에 따른 요청이 있는 경우
              예외적으로 제공될 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink">5. 회원의 권리</h2>
            <p className="mt-2">
              회원은 마이페이지에서 닉네임을 수정하거나 회원 탈퇴를 요청할 수 있습니다. 개인정보
              열람·정정·삭제 문의는 아래 연락처로 요청해 주세요.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink">6. 문의처</h2>
            <p className="mt-2">
              개인정보 보호 문의:{' '}
              <a href="mailto:privacy@herfree.kr" className="text-primary">
                privacy@herfree.kr
              </a>
            </p>
          </section>
        </div>

        <p className="mt-8 text-xs text-muted">
          <Link href="/terms" className="text-primary">
            이용약관
          </Link>
          {' · '}
          <Link href="/" className="text-primary">
            홈으로
          </Link>
        </p>
      </div>
    </>
  );
}
