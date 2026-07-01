import Link from 'next/link';
import { BrandMark } from '@/components/brand/BrandMark';
import { PRIVATE_BOARD_META } from '@/domain/board/privateBoard';

export function SiteFooter() {
  return (
    <footer className="border-t border-[#ECE5D8] bg-[#F3EDE3] px-4 py-8 lg:hidden">
      <div className="mx-auto max-w-app">
        <BrandMark size="sm" />
        <p className="mt-2 text-xs leading-relaxed text-[#5C645A]">
          Herpfree는 익명 기반 건강 커뮤니티입니다. 의료 진단이나 처방을 대신하지 않습니다.
        </p>
        <nav className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs">
          <Link href="/terms" className="text-[#5C645A] hover:text-[#0B3B36]">
            이용약관
          </Link>
          <Link href="/privacy" className="text-[#5C645A] hover:text-[#0B3B36]">
            개인정보처리방침
          </Link>
          <Link href="/forgot-password" className="text-[#5C645A] hover:text-[#0B3B36]">
            비밀번호 찾기
          </Link>
          <Link href={PRIVATE_BOARD_META.INQUIRY.writePath} className="text-[#5C645A] hover:text-[#0B3B36]">
            문의하기
          </Link>
        </nav>
        <p className="mt-4 text-[10px] text-[#8A9089]">© {new Date().getFullYear()} Herpfree. All rights reserved.</p>
      </div>
    </footer>
  );
}
