import type { MetadataRoute } from 'next';
export default function sitemap(): MetadataRoute.Sitemap { return [{ url: 'https://planner.jrvx.ru/', changeFrequency: 'weekly', priority: 1 },{ url:'https://planner.jrvx.ru/games',changeFrequency:'monthly',priority:.6 }]; }
