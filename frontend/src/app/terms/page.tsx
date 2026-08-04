import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { OPERATOR_CONTACT_EMAIL, operatorContactMailtoHref } from '@/domain/site/contact';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  );
}

export default function TermsPage() {
  return (
    <>
      <PageHeader title="이용약관" showBack mobileOnly />
      <main className="page-container max-w-2xl py-8 lg:py-12">
        <h1 className="hidden text-2xl font-semibold text-ink lg:block">Herpfree 이용약관</h1>
        <p className="mt-2 text-[12px] hf-text-muted">시행일: 2026년 6월 13일 · 최종 개정일: 2026년 6월 13일</p>

        <div className="prose-policy mt-8 space-y-7 text-sm leading-relaxed text-cream-foreground">
          <Section title="제1조 (목적)">
            <p>이 약관은 Herpfree(헤르프리, 이하 “회사”)가 제공하는 익명 건강 커뮤니티, 개인일지 및 서비스 이용문의 기능의 이용 조건과 권리·의무를 정합니다.</p>
          </Section>

          <Section title="제2조 (서비스의 성격과 의료행위의 부인)">
            <p>서비스는 경험 공유, 정보 탐색 및 개인 기록을 위한 온라인 서비스입니다. 회사와 회원 게시물은 진단·처방·치료·의료행위를 제공하지 않으며, 게시물과 콘텐츠는 참고 정보일 뿐 개인의 의료적 판단을 대신하지 않습니다.</p>
            <p>응급 상황이나 증상 악화 시 의료기관 또는 119 등 적절한 기관에 연락해야 합니다. 상담문의는 서비스 이용·운영·신고 문의만 처리하며 의료 상담을 제공하지 않습니다.</p>
          </Section>

          <Section title="제3조 (회원가입과 이용자격)">
            <p>회원이 약관·개인정보처리방침·민감정보 처리 안내를 확인하고 가입 절차를 완료하면 이용계약이 성립합니다. 이메일 또는 카카오·Google·네이버 등 소셜 로그인을 이용할 수 있으며, 소셜 제공자의 약관과 개인정보처리방침도 적용될 수 있습니다.</p>
            <p>서비스는 만 14세 이상만 이용할 수 있습니다. 가입 화면은 생년월일을 저장하지 않고 만 14세 이상 확인을 받습니다.</p>
          </Section>

          <Section title="제4조 (민감정보와 개인일지)">
            <p>개인일지의 증상·투약·수면·스트레스·기분·유발요인·메모 등 건강 관련 값은 민감정보로 취급하며 일반 개인정보와 구분해 별도 동의를 받습니다.</p>
            <p>개인일지는 로그인한 본인 계정에서만 조회·수정·삭제할 수 있습니다. 회사는 운영에 필요한 최소 범위 외에 원문을 공개 커뮤니티, 광고, 외부 연구 또는 AI 학습에 사용하지 않습니다.</p>
            <p>건강정보 통계 활용은 별도의 선택 동의입니다. 동의한 경우에도 최소 표본·셀 억제·반올림 정책을 적용하며, 이는 완전한 익명화를 보증하는 표현이 아닙니다.</p>
          </Section>

          <Section title="제5조 (게시물의 공개와 개인정보)">
            <p>공개 게시판에 등록한 글·댓글·이미지는 선택한 공개범위에 따라 다른 회원 또는 비회원에게 표시될 수 있고, 회원 전용 게시물은 로그인한 회원에게 표시될 수 있습니다.</p>
            <p>익명 작성은 화면에 보이는 닉네임을 가리는 기능일 뿐, 신고·분쟁·권리행사를 위한 내부 계정 연결까지 삭제하지는 않습니다. 실명·연락처·병력·진단명·사진 등 식별 가능 정보나 타인의 개인정보를 공개 게시물에 입력하지 마십시오.</p>
            <p>운영 문의·상담문의·비밀사연의 전체 내용은 작성자와 권한이 있는 운영자에게만 표시됩니다.</p>
          </Section>

          <Section title="제6조 (금지행위)">
            <BulletList items={[
              '타인의 개인정보 또는 비공개 정보를 게시·수집·유포하는 행위',
              '허위 사실, 혐오·괴롭힘, 협박, 불법 콘텐츠 또는 타인의 권리를 침해하는 콘텐츠를 게시하는 행위',
              '의료인이 아닌 사람이 진단·처방·치료를 단정하거나 특정 병원·제품을 대가성으로 홍보하는 행위',
              '광고·스팸·도배·자동화 요청·보안 우회 또는 계정 양도·대여 행위',
              '회사 또는 제3자의 저작권·상표권·초상권·명예를 침해하는 행위',
            ]} />
          </Section>

          <Section title="제7조 (게시물 관리와 이용제한)">
            <p>회사는 법령, 신고 처리, 권리 침해 방지 또는 서비스 운영을 위해 게시물을 숨김·삭제하거나 운영자 화면에서 수정할 수 있습니다. 약관 위반이 반복되거나 긴급한 권리 침해·보안 위험이 있으면 이용을 정지하거나 계약을 해지할 수 있습니다.</p>
            <p>회원이 작성한 게시물의 권리는 회원에게 있습니다. 회사는 서비스 제공·노출·백업·신고 처리에 필요한 범위에서 게시물을 이용할 수 있으며, 탈퇴 시 게시물·댓글은 커뮤니티 맥락 보존을 위해 익명 처리될 수 있습니다.</p>
          </Section>

          <Section title="제8조 (탈퇴와 파기)">
            <p>회원은 언제든 탈퇴를 요청할 수 있습니다. 탈퇴 처리 시 계정 식별정보·인증연결·개인일지는 삭제하고, 게시물·댓글은 작성자 연결을 끊어 익명 처리할 수 있습니다. 신고·감사·법령상 보존이 필요한 최소 정보는 해당 기간 동안 분리 보관할 수 있습니다.</p>
          </Section>

          <Section title="제9조 (서비스 중단과 책임)">
            <p>점검, 장애, 보안 대응, 천재지변 등 사유가 있는 경우 서비스의 전부 또는 일부를 일시 중단할 수 있습니다. 회사는 고의 또는 과실이 있는 경우 관련 법령에 따른 책임을 부담하며, 회원 게시물의 정확성·의료적 유효성을 보증하지 않습니다.</p>
          </Section>

          <Section title="제10조 (수사기관·준거법·문의)">
            <p>회사는 법률상 근거와 적법한 절차가 있는 경우에만 필요한 최소 범위에서 정보를 제공합니다. 이 약관은 대한민국 법률에 따르며 관할은 민사소송법 등 강행규정에 따릅니다.</p>
            <p>약관·서비스 이용 문의: <a href={operatorContactMailtoHref()} className="text-primary underline underline-offset-2">{OPERATOR_CONTACT_EMAIL}</a></p>
          </Section>
        </div>

        <p className="mt-8 text-xs text-muted">
          <Link href="/privacy" className="text-primary">개인정보처리방침</Link>{' · '}
          <Link href="/" className="text-primary">홈으로</Link>
        </p>
      </main>
    </>
  );
}
