import type { Metadata } from 'next';

// These pages never derive metadata from an authenticated user's data.
export const privatePageMetadata: Metadata = {
  title: { absolute: '헤르프리' },
  description: '로그인 후 이용할 수 있는 헤르프리 페이지입니다.',
  alternates: { canonical: '/' },
  openGraph: {
    title: '헤르프리', description: '로그인 후 이용할 수 있는 헤르프리 페이지입니다.',
    type: 'website', url: '/', images: [],
  },
  twitter: { card: 'summary', title: '헤르프리', description: '로그인 후 이용할 수 있는 헤르프리 페이지입니다.', images: [] },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false, nosnippet: true } },
};
