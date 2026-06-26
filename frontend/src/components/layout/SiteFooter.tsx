import Link from 'next/link';
import { BrandMark } from '@/components/brand/BrandMark';
import { PRIVATE_BOARD_META } from '@/domain/board/privateBoard';

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-white px-4 py-8 lg:px-10">
      <div className="mx-auto max-w-content">
        <BrandMark size="sm" />
        <p className="mt-1 text-xs leading-relaxed text-muted">
          헤르페스 환우를 위한 익명 건강 커뮤니티입니다. 의료 행위를 대체하지 않습니다.
        </p>
        <nav className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs">
          <Link href="/terms" className="text-muted hover:text-primary">
            이용약관
          </Link>
          <Link href="/privacy" className="text-muted hover:text-primary">
            개인정보처리방침
          </Link>
          <Link href="/forgot-password" className="text-muted hover:text-primary">
            비밀번호 찾기
          </Link>
          <Link href={PRIVATE_BOARD_META.INQUIRY.writePath} className="text-muted hover:text-primary">
            문의하기
          </Link>
        </nav>
        <p className="mt-4 text-[10px] text-muted">© {new Date().getFullYear()} Herfree. All rights reserved.</p>
      </div>
    </footer>
  );
}
