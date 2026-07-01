import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';

export default function TermsPage() {
  return (
    <>
      <PageHeader title="이용약관" showBack mobileOnly />
      <div className="page-container max-w-2xl py-8 lg:py-12">
        <h1 className="hidden text-2xl font-semibold text-ink lg:block">이용약관</h1>
        <p className="mt-2 text-xs text-muted">시행일: 2026년 6월 13일</p>

        <div className="prose-policy mt-8 space-y-6 text-sm leading-relaxed text-cream-foreground">
          <section>
            <h2 className="text-base font-semibold text-ink">제1조 (목적)</h2>
            <p className="mt-2">
              본 약관은 Herpfree(헤르프리, 이하 &quot;서비스&quot;)가 제공하는 익명 건강 커뮤니티 및
              개인 기록 서비스의 이용 조건과 절차, 회사와 회원 간의 권리·의무를 규정함을 목적으로
              합니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink">제2조 (서비스의 성격)</h2>
            <p className="mt-2">
              서비스는 의료행위를 제공하지 않으며, 커뮤니티 게시물과 정보 콘텐츠는 참고용입니다.
              증상 악화·응급 상황 시 반드시 의료 전문가와 상담해야 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink">제3조 (회원의 의무)</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>타인의 개인정보·연락처를 게시하지 않습니다.</li>
              <li>허위 의료 정보, 혐오·괴롭힘, 불법 콘텐츠를 게시하지 않습니다.</li>
              <li>계정 정보를 타인과 공유하지 않습니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink">제4조 (게시물 및 계정)</h2>
            <p className="mt-2">
              회원이 작성한 게시물의 저작권은 회원에게 있으나, 서비스 운영·신고 처리 목적으로
              필요한 범위 내에서 이용할 수 있습니다. 약관 위반 게시물은 숨김·삭제될 수 있으며,
              탈퇴 시 게시물은 익명 처리될 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink">제5조 (면책)</h2>
            <p className="mt-2">
              서비스는 천재지변·시스템 장애 등 불가항력으로 인한 중단에 대해 책임을 지지 않습니다.
              회원 상호 간 분쟁에 대해 회사는 합리적 범위 내에서 중재·조치할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink">제6조 (문의)</h2>
            <p className="mt-2">
              약관 관련 문의:{' '}
              <a href="mailto:support@herfree.kr" className="text-primary">
                support@herfree.kr
              </a>
            </p>
          </section>
        </div>

        <p className="mt-8 text-xs text-muted">
          <Link href="/privacy" className="text-primary">
            개인정보처리방침
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
