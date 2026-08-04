import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  OPERATOR_CONTACT_EMAIL,
  OPERATOR_DISPLAY_NAME,
  PRIVACY_CONTACT_DEPARTMENT,
  operatorContactMailtoHref,
} from '@/domain/site/contact';

function Section({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className={id ? 'scroll-mt-24' : undefined}>
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

export default function PrivacyPage() {
  return (
    <>
      <PageHeader title="개인정보처리방침" showBack mobileOnly />
      <main className="page-container max-w-2xl py-8 lg:py-12">
        <h1 className="hidden text-2xl font-semibold text-ink lg:block">Herpfree 개인정보처리방침</h1>
        <p className="mt-2 text-[12px] hf-text-muted">시행일: 2026년 8월 4일 · 최종 개정일: 2026년 8월 4일</p>

        <div className="prose-policy mt-8 space-y-7 text-sm leading-relaxed text-cream-foreground">
          <Section title="민감정보 처리 안내" id="health-data">
            <p>회원이 입력하는 병력·증상·투약·수면·스트레스 등 건강 관련 정보는 건강정보에 해당할 수 있는 민감정보로 분류하여 처리합니다. 일반 개인정보와 구분해 별도 동의를 받고 동의 이력과 정책 버전을 기록합니다. 가입 시 동의하지 않아도 커뮤니티 가입은 가능하지만 개인일지 첫 저장 전에 별도 동의가 필요합니다.</p>
            <p>개인일지 원문은 로그인한 본인 계정에서만 조회됩니다. 자유입력 메모는 AES-GCM으로 암호화하고, 구조화된 값은 DB 저장 암호화·전송 구간 보호·접근권한·감사기록으로 보호합니다. 공개 커뮤니티·광고·외부 연구·AI 학습의 원자료로 사용하지 않습니다.</p>
          </Section>

          <Section title="1. 처리하는 개인정보와 목적">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-xs">
                <thead><tr className="border-b border-border/80"><th className="p-2">구분</th><th className="p-2">항목</th><th className="p-2">목적</th><th className="p-2">근거</th></tr></thead>
                <tbody>
                  <tr className="border-b border-border/50"><td className="p-2">계정</td><td className="p-2">이메일, 비밀번호 해시, 닉네임, 상태·권한</td><td className="p-2">회원 식별·인증, 서비스 제공, 부정 이용 방지</td><td className="p-2">계약 이행·동의</td></tr>
                  <tr className="border-b border-border/50"><td className="p-2">소셜 로그인</td><td className="p-2">제공자·회원 식별자, 이메일·프로필 이미지(있는 경우)</td><td className="p-2">소셜 로그인·계정 연결</td><td className="p-2">회원 요청·동의</td></tr>
                  <tr className="border-b border-border/50"><td className="p-2">연령 확인</td><td className="p-2">만 14세 이상 확인값</td><td className="p-2">이용 자격 확인</td><td className="p-2">동의</td></tr>
                  <tr className="border-b border-border/50"><td className="p-2">개인일지</td><td className="p-2">증상·전조 증상·유발요인·투약·수면·스트레스·기분·운동·메모</td><td className="p-2">본인 전용 기록 제공</td><td className="p-2">별도 민감정보 동의</td></tr>
                  <tr className="border-b border-border/50"><td className="p-2">커뮤니티</td><td className="p-2">글·댓글·이미지, 공개범위, 익명 여부, 신고 내용</td><td className="p-2">게시·댓글·신고·권리침해 대응</td><td className="p-2">계약 이행·동의</td></tr>
                  <tr><td className="p-2">운영·분석</td><td className="p-2">요청 ID, 보안 이벤트, 허용 이벤트명, 서버에서 해시한 세션·IP·User-Agent</td><td className="p-2">장애·보안·운영 통계</td><td className="p-2">서비스 운영에 필요한 범위의 법적 근거 확인</td></tr>
                </tbody>
              </table>
            </div>
            <p>비밀번호는 원문이 아닌 해시로 저장합니다. 내부 분석 DB에는 IP·User-Agent·세션 식별값을 서버에서 salt 해시하여 저장하고, 이벤트에는 이메일·닉네임·게시글·댓글 본문·개인일지 메모를 넣지 않습니다. 외부 분석 기능을 켜는 경우에는 무작위 세션 ID와 허용된 이벤트명·경로만 전송합니다. 로그인 쿠키와 분석 세션 식별자가 브라우저에 저장될 수 있지만 건강 기록 원문은 브라우저 로컬 저장소에 보관하지 않습니다.</p>
          </Section>

          <Section title="2. 건강정보 통계 활용 선택 동의" id="health-statistics">
            <p>정책 버전 2026-07-16. 별도로 선택 동의한 경우에만 증상 여부, 전조 증상, 유발요인, 투약 여부, 수면·스트레스 등 구조화된 값을 최소 표본 집계와 서비스 개선에 사용합니다.</p>
            <BulletList items={[
              '자유 입력 메모, 글·댓글·상담문의 본문, 이메일, 닉네임, 정확한 날짜와 직접 식별자는 집계 원자료에서 제외합니다.',
              '동의한 회원의 기록만 집계하고 철회 이후 생성되는 집계에서 제외합니다.',
              '최소 참여자 수, 셀 억제 및 반올림으로 소수 집단 추론 위험을 낮춥니다.',
              '공개 홈의 전체 회원 수·오늘 기록자 수는 노출하지 않으며, 커뮤니티 인사이트는 임계값을 충족할 때만 반환합니다.',
              '연구기관 제공·공동연구·AI 학습·판매·광고는 별도 법적 근거와 고지 없이는 하지 않습니다.',
            ]} />
            <p>위 처리는 “완전한 익명화”를 약속하는 표현이 아니라 동의 기반의 집계·가명화와 재식별 위험 완화 조치입니다.</p>
          </Section>

          <Section title="3. 공개·비공개 게시물과 제3자 제공">
            <p>공개 게시판의 글·댓글·이미지는 공개범위에 따라 표시됩니다. 공개를 선택하면 비회원에게도 표시될 수 있고, 회원 전용을 선택하면 로그인한 회원에게 표시될 수 있습니다. 작성 화면에서 공개 가능성과 비공개 선택 방법을 안내하며, 개인일지·운영 문의·상담문의의 원문은 다른 회원에게 공개하지 않습니다.</p>
            <p>회사는 개인정보를 판매하거나 광고 목적으로 제공하지 않습니다. 다만 회원이 직접 공개한 게시물, 적법한 관계기관 요청, 생명·신체·재산 보호 등 법률상 근거가 있는 경우 필요한 최소 범위에서 제공할 수 있습니다.</p>
          </Section>

          <Section title="4. 개인정보 처리 위탁">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-xs">
                <thead><tr className="border-b border-border/80"><th className="p-2">수탁자 또는 유형</th><th className="p-2">업무</th><th className="p-2">처리 데이터</th><th className="p-2">국가·리전</th></tr></thead>
                <tbody>
                  <tr className="border-b border-border/50"><td className="p-2">Amazon Web Services(AWS)</td><td className="p-2">API·DB·파일·로그·비밀관리 등 클라우드 운영</td><td className="p-2">계정·게시물·개인일지·운영 로그</td><td className="p-2">서울 리전 중심. 글로벌 지원·재위탁은 계약 확인 필요</td></tr>
                  <tr className="border-b border-border/50"><td className="p-2">운영 메일 제공자(예: AWS SES)</td><td className="p-2">비밀번호 재설정·공지 메일</td><td className="p-2">이메일·발송 상태</td><td className="p-2">실제 사용 사업자·국가를 배포 전 확정</td></tr>
                  <tr><td className="p-2">PostHog 등 외부 분석 도구</td><td className="p-2">환경변수 키가 설정된 경우 이벤트 분석</td><td className="p-2">허용 이벤트명·경로·무작위 세션 ID</td><td className="p-2">활성화 전에 국가·보유기간·국외이전 확인</td></tr>
                </tbody>
              </table>
            </div>
            <p>수탁자와 위탁 업무가 추가·변경되면 방침을 갱신합니다. 카카오·Google·네이버는 소셜 로그인 과정에서 각자의 약관과 방침에 따라 처리하는 별도 서비스 제공자입니다.</p>
          </Section>

          <Section title="5. 국외 이전">
            <p>AWS 서울 리전을 사용하더라도 사업자의 글로벌 운영·지원 또는 선택한 메일·분석 서비스에 따라 국외 접근·이전이 발생할 수 있습니다. 실제로 발생하는 경우 이전받는 자·국가·항목·목적·방법·보유기간과 법적 근거를 최신 방침에 구체적으로 표시하고 필요한 동의·보호조치를 적용합니다. 배포 전 AWS·메일·분석 계약과 리전을 확인해야 합니다.</p>
          </Section>

          <Section title="6. 보유기간과 파기">
            <ul className="space-y-1">
              <li>계정·인증·소셜 연결: 탈퇴 처리 시까지. 탈퇴 시 식별정보와 연결을 삭제합니다.</li>
              <li>개인일지: 회원 삭제 또는 탈퇴 시까지. 삭제 요청 시 DB 원문을 삭제합니다.</li>
              <li>게시물·댓글: 회원 삭제·탈퇴 또는 운영 조치까지. 탈퇴 시 작성자 연결을 끊어 익명 처리할 수 있고 이미지 원본은 삭제합니다.</li>
              <li>분석 이벤트: 기본 90일, 비밀번호 재설정 토큰: 만료 후 최대 7일, 관리자·권한 감사 로그: 기본 365일.</li>
              <li>법령·분쟁·신고 대응에 필요한 최소 정보와 백업·스냅샷은 해당 보존기간 동안 분리 보관 후 파기합니다.</li>
            </ul>
          </Section>

          <Section title="7. 안전성 확보조치">
            <p>접근권한 최소화, 관리자 역할·접근망 제한, 감사 로그, 인증 시도 제한, CSRF·Origin 검증, HttpOnly·SameSite 쿠키, TLS, DB·S3 비공개 정책, 개인일지 필드 암호화, 비밀번호 해시, 백업·복원 통제를 적용합니다. 이러한 조치가 모든 침해 가능성을 제거한다는 의미는 아닙니다.</p>
          </Section>

          <Section title="8. 정보주체의 권리와 행사 방법">
            <p>회원은 열람, 정정, 삭제, 처리정지, 동의 철회 등을 요청할 수 있습니다. 닉네임 변경·개인일지 삭제·개인일지 건강정보 동의 철회·회원 탈퇴·건강정보 통계 동의 철회는 서비스 기능을 사용하고, 그 밖의 요청은 <a href={operatorContactMailtoHref()} className="text-primary underline underline-offset-2">{OPERATOR_CONTACT_EMAIL}</a>으로 접수합니다. 개인일지 건강정보 동의를 철회하면 기존 개인일지 원문을 삭제한 뒤 개인일지 처리를 중단합니다. 회사는 본인 확인 후 법령이 정한 기간과 범위에서 처리합니다.</p>
          </Section>

          <Section title="9. 쿠키와 행태정보">
            <p>로그인 상태 유지를 위한 필수 쿠키와 CSRF 쿠키를 사용합니다. 분석 세션 ID는 브라우저 저장소에 생성될 수 있습니다. 기본 배포값에서 `NEXT_PUBLIC_POSTHOG_KEY`가 비어 있으면 외부 PostHog 전송은 발생하지 않습니다. 키를 설정해 외부 분석을 활성화하려면 수탁자·국외이전·보유기간·법적 근거를 먼저 확정하고 이 방침과 동의·고지 화면을 갱신해야 합니다. 맞춤형 건강 광고는 제공하지 않습니다.</p>
          </Section>

          <Section title="10. 개인정보 보호책임자와 권익 구제">
            <p>운영자: {OPERATOR_DISPLAY_NAME}</p>
            <p>개인정보 보호 담당: {PRIVACY_CONTACT_DEPARTMENT}</p>
            <p>서비스·개인정보 문의: <a href={operatorContactMailtoHref()} className="text-primary underline underline-offset-2">{OPERATOR_CONTACT_EMAIL}</a></p>
            <p className="text-xs text-muted">현재 서비스는 무료·비영리 베타로 운영하며 결제·유료 광고·상품 판매·제휴 수익화를 제공하지 않습니다. 개인의 주민등록번호·자택 주소 등 불필요한 신상정보는 공개하지 않습니다. 수익화·판매·광고를 시작하거나 운영 형태가 변경되면 필요한 등록·신고와 운영자 정보를 다시 검토하여 이 방침을 갱신합니다.</p>
            <p>추가 구제·상담: 개인정보침해신고센터 118(<a href="https://privacy.kisa.or.kr" className="text-primary">privacy.kisa.or.kr</a>), 개인정보분쟁조정위원회 1833-6972(<a href="https://www.kopico.go.kr" className="text-primary">kopico.go.kr</a>)</p>
          </Section>

          <Section title="11. 방침의 변경">
            <p>법령, 처리 목적, 수탁자, 국외 이전, 보유기간 또는 보안 조치가 변경되면 변경 내용과 시행일을 공지합니다. 동의 내용이 바뀌는 경우 법령에 따른 사전 고지와 필요한 재동의를 진행합니다.</p>
          </Section>
        </div>

        <p className="mt-8 text-xs text-muted">
          <Link href="/terms" className="text-primary">이용약관</Link>{' · '}
          <Link href="/" className="text-primary">홈으로</Link>
        </p>
      </main>
    </>
  );
}
