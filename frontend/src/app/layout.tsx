import type { Metadata } from 'next';
import { Providers } from '@/app/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Herfree | 헤르페스 이후의 삶을 돕는 익명 건강 커뮤니티',
  description:
    '익명 커뮤니티와 검증된 건강 정보로 헤르페스 이후의 일상을 함께 돌보는 플랫폼',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
