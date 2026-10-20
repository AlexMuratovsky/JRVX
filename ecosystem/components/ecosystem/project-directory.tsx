'use client';
import { useState } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { projects } from '@/lib/ecosystem';
import { ProjectIcon } from './brand';
const filters = [{ key: 'all', label: 'Все проекты' }, { key: 'apps', label: 'Приложения' }, { key: 'games', label: 'Игры' }, { key: 'lab', label: 'Лаборатория' }];
export function ProjectDirectory() {
  const [filter, setFilter] = useState('all');
  const shown = projects.filter(project => filter === 'all' || project.category === filter);
  return <><div className="eco-filters" role="group" aria-label="Фильтр проектов">{filters.map(item => <button key={item.key} onClick={() => setFilter(item.key)} aria-pressed={filter === item.key}>{item.label}<span>{item.key === 'all' ? projects.length : projects.filter(p => p.category === item.key).length}</span></button>)}</div><div className="eco-project-grid" aria-live="polite">{shown.map(project => <article className={'eco-project eco-project-' + project.icon} key={project.slug}><div className="eco-project-top"><span className="eco-project-icon"><ProjectIcon name={project.icon}/></span><span className={'eco-status ' + (project.category === 'lab' ? 'eco-status-lab' : '')}>{project.status}</span></div><span className="eco-overline">{project.label}</span><h3><a href={'/projects/' + project.slug}>{project.name}</a></h3><p>{project.description}</p><div className="eco-project-bottom"><a href={'/projects/' + project.slug}>О проекте <ArrowRight size={17}/></a>{project.url && <a href={project.url} className="eco-project-open" aria-label={project.action}><ArrowUpRight size={22}/></a>}</div></article>)}</div></>;
}
