"use client";
import { useEffect,useState } from "react";
import { ExternalLink, LoaderCircle, LockKeyhole } from "lucide-react";

type Session={signedIn:boolean,mode:"password"|"chatgpt"|"jrvx"|null,username:string|null,hasPassword:boolean,standalone?:boolean};
export default function AccountPanel({onChange}:{onChange:()=>void}) {
  const [session,setSession]=useState<Session|null>(null),[mode,setMode]=useState<"login"|"register"|"change-password">("login"),[busy,setBusy]=useState(false),[error,setError]=useState(""),[success,setSuccess]=useState("");
  const reload=async()=>{const r=await fetch("/api/auth/session",{cache:"no-store"});if(r.ok)setSession(await r.json());};
  useEffect(()=>{void reload();},[]);
  async function submit(e:React.FormEvent<HTMLFormElement>) {
    e.preventDefault();const form=e.currentTarget;const fields=Object.fromEntries(new FormData(form));
    if(mode!=="login"&&fields.password!==fields.confirmPassword){setError("Пароли не совпадают");return;}
    setBusy(true);setError("");setSuccess("");
    const body=mode==="change-password"?{currentPassword:fields.currentPassword,newPassword:fields.password}:{username:fields.username,password:fields.password,...(mode==="register"?{linkExisting:fields.linkExisting==="on"}:{})};
    try{const r=await fetch(`/api/auth/${mode}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const data=await r.json() as {error?:{message?:string}};if(!r.ok)throw new Error(data.error?.message??"Не удалось выполнить вход");form.reset();await reload();onChange();setSuccess(mode==="change-password"?"Пароль изменён. Остальные входы по паролю завершены.":"Вы вошли в свой аккаунт.");}
    catch(e){setError(e instanceof Error?e.message:"Проверьте соединение");}finally{setBusy(false);}
  }
  async function logout(){setBusy(true);try{await fetch("/api/auth/logout",{method:"POST"});await reload();onChange();setMode("login");setSuccess("");}finally{setBusy(false);}}
  const signed=!!session?.signedIn;
  return <section className="account-panel"><div className="integration-heading"><LockKeyhole size={19}/><h3>{signed?"Вход в аккаунт":"Войти в планировщик"}</h3></div>
    {signed&&<p className="muted">{session?.username?`Логин: ${session.username}`:session?.mode==="jrvx"?"Вы вошли через JRVX ID.":"Вы вошли через ChatGPT."}</p>}
    <div className="account-options">{(!signed||!session?.hasPassword)&&<><button type="button" className={`button small ${mode==="login"?"primary":"soft"}`} onClick={()=>{setMode("login");setError("");}}>Войти</button><button type="button" className={`button small ${mode==="register"?"primary":"soft"}`} onClick={()=>{setMode("register");setError("");}}>{signed?"Добавить логин и пароль":"Регистрация"}</button></>}{signed&&session?.hasPassword&&<button type="button" className="button soft small" onClick={()=>setMode(mode==="change-password"?"login":"change-password")}>Изменить пароль</button>}{signed&&<button type="button" className="button soft small" disabled={busy} onClick={()=>void logout()}>Выйти</button>}</div>
    {(!signed||!session?.hasPassword||mode==="change-password")&&<form className="account-form" onSubmit={submit}>
      {mode!=="change-password"&&<div className="field"><label htmlFor="account-username">Имя пользователя</label><input id="account-username" name="username" autoComplete="username" required minLength={3} maxLength={32} pattern="[a-zA-Z0-9_]{3,32}" placeholder="alemura"/><small className="muted">Латинские буквы, цифры и _ · 3–32 символа</small></div>}
      {mode==="change-password"&&<div className="field"><label htmlFor="current-password">Текущий пароль</label><input id="current-password" name="currentPassword" type="password" autoComplete="current-password" required maxLength={128}/></div>}
      <div className="field"><label htmlFor="account-password">{mode==="change-password"?"Новый пароль":"Пароль"}</label><input id="account-password" name="password" type="password" autoComplete={mode==="login"?"current-password":"new-password"} required minLength={12} maxLength={128} placeholder="Не менее 12 символов"/></div>
      {mode!=="login"&&<div className="field"><label htmlFor="confirm-password">Повторите пароль</label><input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" required minLength={12} maxLength={128}/></div>}
      {mode==="register"&&["chatgpt","jrvx"].includes(session?.mode??"")&&<label className="account-link-choice"><input type="checkbox" name="linkExisting" defaultChecked/>Использовать мои текущие записи</label>}
      {mode==="register"&&<p className="settings-footnote">Сохраните пароль в менеджере паролей. Восстановление по email в этой версии не подключено.</p>}
      <button type="submit" className="button primary" disabled={busy}>{busy&&<LoaderCircle size={16} className="spin"/>}{mode==="register"?"Зарегистрироваться":mode==="change-password"?"Сохранить пароль":"Войти"}</button>
    </form>}
    {error&&<p className="form-error" role="alert">{error}</p>}{success&&<p role="status" className="account-success">{success}</p>}
    {!signed&&(session?.standalone?<a href="/auth/id" target="_top" className="button soft full-width">Войти через JRVX ID ↗</a>:<a href="/auth/chatgpt" target="_top" className="text-button">Войти в аккаунт</a>)}
    {session?.mode==="password"&&<form className="account-form" onSubmit={async e=>{e.preventDefault();const password=new FormData(e.currentTarget).get("password");setBusy(true);setError("");try{const r=await fetch(session?.standalone?"/api/auth/link-id":"/api/auth/link-chatgpt",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password,confirmed:true})});const v=await r.json() as {error?:{message:string}};if(!r.ok)throw new Error(v.error?.message??"Не удалось связать аккаунты");setSuccess("Аккаунт связан с этим пространством JRVX.");}catch(e){setError(e instanceof Error?e.message:"Нет соединения");}finally{setBusy(false);}}}><p className="settings-footnote">{session?.standalone?"Чтобы открывать эти же записи через JRVX ID, войдите в JRVX ID и подтвердите пароль Planner. Пространства с уже сохранёнными данными не объединяются.":"Чтобы использовать эти же записи через внешнее приложение ChatGPT, свяжите его аккаунт с текущим пространством. Существующие пространства не объединяются."}</p><div className="field"><label htmlFor="link-password">Подтвердите пароль JRVX</label><input id="link-password" name="password" type="password" autoComplete="current-password" required maxLength={128}/></div><button className="button soft" disabled={busy}>{session?.standalone?"Связать с JRVX ID":"Связать с текущим ChatGPT"}</button></form>}
    <a href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer" className="button soft full-width chatgpt-link"><ExternalLink size={17}/>Открыть ChatGPT</a>
  </section>;
}
