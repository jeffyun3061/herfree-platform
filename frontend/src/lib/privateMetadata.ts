import type { Metadata } from 'next';

// Private areas never expose page-specific content to crawlers.
export const privateMetadata: Metadata = {
  title: { absolute: '헤르프리' },
  description: '로그인 후 이용할 수 있는 헤르프리 서비스입니다.',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  openGraph: { title: '헤르프리', description: '로그인 후 이용할 수 있는 헤르프리 서비스입니다.', type: 'website' },
  twitter: { card: 'summary', title: '헤르프리', description: '로그인 후 이용할 수 있는 헤르프리 서비스입니다.' },
};
