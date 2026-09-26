import type { MetadataRoute } from 'next';

const siteUrl = 'https://www.herpfree.co.kr';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/forgot-password',
          '/journal/',
          '/login',
          '/mypage/',
          '/record/',
          '/reset-password',
          '/routine/',
          '/signup',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
