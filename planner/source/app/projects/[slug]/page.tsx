import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check } from 'lucide-react';
import { projects } from '@/lib/ecosystem';
import { EcosystemHeader } from '@/components/ecosystem/header';
import { EcosystemFooter } from '@/components/ecosystem/footer';
import { ProjectIcon } from '@/components/ecosystem/brand';
import '../../ecosystem.css';
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params, project = projects.find(p => p.slug === slug);
  return project ? { title: `${project.name} — экосистема JRVX`, description: project.description, alternates: { canonical: `https://jrvx.ru/projects/${slug}` }, openGraph: { title: `${project.name} — экосистема JRVX`, description: project.description, url: `https://jrvx.ru/projects/${slug}`, siteName: 'JRVX', locale: 'ru_RU', type: 'website' } } : {};
}
export default async function ProjectPage({ params }: Props) {
  const { slug } = await params, project = projects.find(p => p.slug === slug);
  if (!project) notFound();
  const next = projects[(projects.indexOf(project) + 1) % projects.length];
  return <div className="eco"><a className="eco-skip" href="#main">Перейти к содержимому</a><EcosystemHeader/><main id="main" className="eco-container eco-detail"><a className="eco-link eco-back" href="/#projects"><ArrowLeft size={17}/> Все проекты</a><div className="eco-detail-hero"><div><p className="eco-overline">ЭКОСИСТЕМА JRVX / {project.label}</p><span className={'eco-status ' + (project.category === 'lab' ? 'eco-status-lab' : '')}>{project.status}</span><h1>{project.name}</h1><p className="eco-detail-tagline">{project.short}</p><p className="eco-detail-intro">{project.intro}</p>{project.url ? <a className="eco-button eco-button-dark" href={project.url}>{project.action}<ArrowUpRight size={18}/></a> : <a className="eco-button eco-button-outline" href="/#projects">Посмотреть доступные проекты<ArrowRight size={18}/></a>}</div><div className={'eco-detail-symbol eco-project-' + project.icon} aria-hidden="true"><ProjectIcon name={project.icon} size={150}/><span>{project.name}</span></div></div><section className="eco-detail-features"><p className="eco-overline">ЧТО ВНУТРИ</p><div>{project.features.map(feature => <article key={feature}><Check size={21}/><h2>{feature}</h2></article>)}</div></section>{project.note && <aside className="eco-detail-note"><span>Полезно знать</span><p>{project.note}</p></aside>}<section className="eco-detail-next"><div><p className="eco-overline">ДАЛЬШЕ ПО ЭКОСИСТЕМЕ</p><h2>{next.name}</h2><p>{next.short}</p></div><a href={'/projects/' + next.slug} className="eco-circle-link" aria-label={'Узнать о ' + next.name}><ArrowUpRight size={28}/></a></section></main><EcosystemFooter/></div>;
}
