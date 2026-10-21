import { Fingerprint, CalendarDays, Club, Gamepad2, Sparkles, Compass } from 'lucide-react';
export function Mark({ className = '' }: { className?: string }) {
  return <svg className={className} width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true"><path d="M3 3h10v10H3zM17 3h10v10H17zM3 17h10v10H3z" fill="currentColor"/><path d="M17 17h10v10H17z" fill="currentColor" opacity=".35"/></svg>;
}
export function ProjectIcon({ name, size = 26 }: { name: string; size?: number }) {
  const Icon = ({ id: Fingerprint, planner: CalendarDays, cas: Club, arcade: Gamepad2, ai: Sparkles } as const)[name as 'id'] || Compass;
  return <Icon size={size} strokeWidth={1.6} aria-hidden="true"/>;
}
