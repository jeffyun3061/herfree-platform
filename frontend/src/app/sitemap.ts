import type { MetadataRoute } from 'next';

const siteUrl = 'https://www.herpfree.co.kr';

const publicRoutes = [
  '/',
  '/community',
  '/contents',
  '/consult',
  '/inquiry',
  '/notice',
  '/privacy',
  '/qna',
  '/terms',
  '/videos',
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    changeFrequency: route === '/' ? 'daily' : 'weekly',
    priority: route === '/' ? 1 : 0.6,
  }));
}
