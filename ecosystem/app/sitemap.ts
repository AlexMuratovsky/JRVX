import type { MetadataRoute } from 'next';
import { projects } from '@/lib/ecosystem';
export default function sitemap(): MetadataRoute.Sitemap { return [{ url: 'https://jrvx.ru/', changeFrequency: 'weekly', priority: 1 }, ...projects.map(project => ({ url: `https://jrvx.ru/projects/${project.slug}`, changeFrequency: 'monthly' as const, priority: .7 }))]; }
