import { sessionCookie } from "@/lib/password-auth";
export async function GET(request:Request) {
  const url=new URL("/signin-with-chatgpt?return_to=%2F",request.url);
  return new Response(null,{status:302,headers:{Location:url.toString(),"Set-Cookie":sessionCookie("",0),"Cache-Control":"no-store"}});
}
