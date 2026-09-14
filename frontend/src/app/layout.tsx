import type { Metadata, Viewport } from 'next';
import { Providers } from '@/app/providers';
import './globals.css';

export const metadata: Metadata = {
  title: '헤르프리',
  description: '익명 커뮤니티와 검증된 건강 정보로 헤르페스 이후의 일상을 함께 돌보는 공간입니다.',
};

// Allow env(safe-area-inset-*) to report the real notch and home-indicator
// insets on iOS instead of falling back to zero.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
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
