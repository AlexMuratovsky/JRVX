import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./planner-theme.css";
export const metadata: Metadata = {
 title: {default:"JRVX Planner — время для важного",template:"%s · JRVX Planner"},
 description:"Расписание, задачи, планы и заметки в одном пространстве JRVX. Планируй день и переключайся на Arcade, когда нужна пауза.",
 applicationName:"JRVX Planner",metadataBase:new URL("https://planner.jrvx.ru"),
 openGraph:{title:"JRVX Planner",description:"Дела по порядку. Время для важного.",siteName:"JRVX Planner",locale:"ru_RU",type:"website"},
 manifest:"/manifest.webmanifest",appleWebApp:{capable:true,title:"JRVX Planner",statusBarStyle:"default"},
 icons:{icon:"/favicon.svg",apple:"/apple-touch-icon.png"}
};
export const viewport: Viewport={width:"device-width",initialScale:1,viewportFit:"cover",themeColor:"#f3f5ef"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ru"><body className="ai-disabled">{children}</body></html>;}
