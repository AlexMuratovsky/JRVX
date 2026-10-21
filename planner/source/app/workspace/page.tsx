import { redirect } from 'next/navigation';
export const metadata = { title: 'JRVX Planner' };
export default async function Workspace({searchParams}:{searchParams:Promise<{view?:string}>}) { const {view}=await searchParams; redirect(view && ['today','schedule','tasks'].includes(view) ? '/?view='+view : '/'); }
