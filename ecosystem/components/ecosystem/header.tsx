'use client';
import { useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { Mark } from './brand';
export function EcosystemHeader() {
  const [open, setOpen] = useState(false);
  return <header className="eco-header"><a href="/" className="eco-brand" aria-label="JRVX — главная"><Mark/><span>JRVX</span><small>экосистема</small></a>
    <nav className="eco-nav" aria-label="Основная навигация"><a href="/#about">Об экосистеме</a><a href="/#projects">Проекты</a><a href="/#faq">Вопросы</a></nav>
    <a className="eco-account" href="https://id.jrvx.ru/">JRVX ID <ArrowUpRight size={17}/></a>
    <button className="eco-menu-toggle" aria-label={open ? 'Закрыть меню' : 'Открыть меню'} aria-expanded={open} aria-controls="eco-mobile-menu" onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button>
    {open && <nav className="eco-mobile-menu" id="eco-mobile-menu" aria-label="Мобильная навигация" onClick={() => setOpen(false)}><a href="/#about">Об экосистеме</a><a href="/#projects">Все проекты</a><a href="/#faq">Вопросы и ответы</a><a href="https://id.jrvx.ru/">Открыть JRVX ID ↗</a></nav>}
  </header>;
}
