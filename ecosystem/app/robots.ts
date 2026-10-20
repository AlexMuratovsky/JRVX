import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots { return { rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/workspace', '/confirm/', '/ai-settings'] }, sitemap: 'https://jrvx.ru/sitemap.xml' }; }
