// JRVX ID OIDC integration boundary. Never trust unsigned identity headers.
const decodeBase64Url=(input)=>{const base64=input.replace(/-/g,'+').replace(/_/g,'/');const decoded=atob(base64.padEnd(Math.ceil(base64.length/4)*4,'='));return Uint8Array.from(decoded,c=>c.charCodeAt(0));};
const decodeJSON=input=>JSON.parse(new TextDecoder().decode(decodeBase64Url(input)));
export async function authenticate(request,env,now=Date.now(),loadKeys=fetch){
 const auth=request.headers.get('authorization')||'';
 if(!auth.startsWith('Bearer '))throw Object.assign(new Error('Требуется JRVX ID'),{status:401});
 if(!env.JRVX_ID_ISSUER||!env.JRVX_ID_AUDIENCE||!env.JRVX_ID_JWKS_URL)throw Object.assign(new Error('Сервис идентификации ещё не настроен'),{status:503});
 const jwt=auth.slice(7),parts=jwt.split('.');if(parts.length!==3||parts.some(p=>!p||p.length>8192))throw Object.assign(new Error('Недействительный токен'),{status:401});
 let head,claims;try{head=decodeJSON(parts[0]);claims=decodeJSON(parts[1]);}catch{throw Object.assign(new Error('Недействительный токен'),{status:401});}
 if(head.alg!=='RS256'||!head.kid||typeof head.kid!=='string')throw Object.assign(new Error('Алгоритм подписи не разрешён'),{status:401});
 const audience=claims.aud;
 if(claims.iss!==env.JRVX_ID_ISSUER||(Array.isArray(audience)?!audience.includes(env.JRVX_ID_AUDIENCE):audience!==env.JRVX_ID_AUDIENCE)||!claims.sub||typeof claims.sub!=='string'||claims.sub.length>160||!Number.isFinite(claims.exp)||claims.exp*1000<=now||claims.nbf*1000>now+60000)throw Object.assign(new Error('Токен отклонён'),{status:401});
 const u=new URL(env.JRVX_ID_JWKS_URL);if(u.protocol!=='https:'||u.username||u.password)throw Object.assign(new Error('Некорректная настройка JWKS'),{status:503});
 const response=await loadKeys(u.toString(),{headers:{Accept:'application/json'}});if(!response.ok)throw Object.assign(new Error('Служба JRVX ID временно недоступна'),{status:503});
 const keys=await response.json();const key=(keys.keys||[]).find(k=>k.kid===head.kid&&k.kty==='RSA'&&k.use!=='enc'&&(!k.alg||k.alg==='RS256'));if(!key)throw Object.assign(new Error('Подписывающий ключ не найден'),{status:401});
 const publicKey=await crypto.subtle.importKey('jwk',key,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
 const valid=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',publicKey,decodeBase64Url(parts[2]),new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
 if(!valid)throw Object.assign(new Error('Недействительная подпись'),{status:401});
 return {userId:claims.sub,displayId:claims.preferred_username||null};
}
