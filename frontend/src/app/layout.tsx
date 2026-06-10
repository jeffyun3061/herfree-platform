import type { Metadata } from 'next';
import { Providers } from '@/app/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Herfree',
  description: '여성 건강 커뮤니티 플랫폼',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
