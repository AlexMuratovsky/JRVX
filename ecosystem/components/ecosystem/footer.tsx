import { ArrowUpRight } from 'lucide-react';
import { Mark } from './brand';
export function EcosystemFooter() {
  return <footer className="eco-footer"><div className="eco-footer-top"><a className="eco-brand" href="/" aria-label="JRVX — главная"><Mark/><span>JRVX</span></a><p>Разные проекты.<br/>Одна экосистема.</p><div><a href="/#projects">Все проекты</a><a href="https://id.jrvx.ru/">JRVX ID <ArrowUpRight size={15}/></a><a href="https://planner.jrvx.ru/">Planner <ArrowUpRight size={15}/></a><a href="https://cas.jrvx.ru/">CAS · 18+ <ArrowUpRight size={15}/></a></div></div><div className="eco-footer-bottom"><span>© {new Date().getFullYear()} JRVX</span><span>Сделано, чтобы быть связанным.</span><a href="/workspace">Прежний планировщик ↗</a></div></footer>;
}
