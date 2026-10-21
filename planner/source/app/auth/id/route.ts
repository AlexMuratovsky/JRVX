import {sessionCookie} from '@/lib/password-auth';
export function GET(){return new Response(null,{status:303,headers:{Location:'https://id.jrvx.ru/?next=https%3A%2F%2Fplanner.jrvx.ru%2F','Set-Cookie':sessionCookie('',0),'Cache-Control':'no-store'}});}
