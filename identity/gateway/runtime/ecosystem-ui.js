/* Progressive JRVX ID presentation. Does not change authentication or link accounts. */
(() => {
  'use strict';
  const projects = Object.freeze([
    Object.freeze({key:'planner',name:'JRVX Planner',url:'https://planner.jrvx.ru/',description:'Расписание, задачи и планы. Освободи время для важного.'}),
    Object.freeze({key:'cas',name:'JRVX CAS',url:'https://cas.jrvx.ru/',description:'Игровое пространство с виртуальными единицами MS и MG.',age:'18+'})
  ]);
  const byId = id => document.getElementById(id);
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  function mark() {
    const node=el('span','id-eco-mark');node.setAttribute('aria-hidden','true');
    for(let i=0;i<4;i++)node.append(el('i'));
    return node;
  }
  function link(href,text,className) {
    const node=el('a',className,text);node.href=href;return node;
  }
  function icon(key) {
    const node=el('span','id-project-icon');node.setAttribute('aria-hidden','true');
    if(key==='cas'){node.textContent='♣';return node;}
    const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
    svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill','none');
    svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.5');
    for(const [tag,attributes] of [['rect',{x:'3',y:'5',width:'18',height:'16',rx:'2'}],['path',{d:'M7 3v4m10-4v4M3 11h18m-14 4h3m4 0h3m-10 3h3'}]]){
      const child=document.createElementNS(ns,tag);
      for(const [name,value] of Object.entries(attributes))child.setAttribute(name,value);
      svg.append(child);
    }
    node.append(svg);return node;
  }
  function header() {
    const skip=link('#id-main','Перейти к содержимому','id-eco-skip');
    const head=el('header','id-eco-header'),brand=link('https://jrvx.ru/','', 'id-eco-brand');
    brand.setAttribute('aria-label','JRVX — главная');brand.append(mark(),el('span','', 'JRVX'),el('small','','Identity'));
    const nav=el('nav','id-eco-nav');nav.setAttribute('aria-label','Экосистема JRVX');
    nav.append(link('https://jrvx.ru/#about','Об экосистеме'),link('https://jrvx.ru/#projects','Все проекты ↗'));
    head.append(brand,nav);document.body.prepend(skip,head);
  }
  function welcome(card) {
    const intro=el('aside','id-welcome');intro.setAttribute('aria-label','О JRVX ID');
    intro.append(el('span','id-welcome-label','ТВОЙ АККАУНТ · ТВОИ ПРОЕКТЫ'),el('h2','','Один аккаунт.\nТвоя экосистема.'),el('p','','Управляй профилем, подтверждай почту и переходи в свои проекты. Ты выбираешь сервисы — JRVX ID связывает их между собой.'));
    const points=el('div','id-welcome-points');points.append(el('span','','Личный профиль'),el('span','','Вход в сервисы'),el('span','','Подтверждённая почта'));
    intro.append(points);card.insertBefore(intro,byId('auth'));
  }
  function footer(card) {
    const foot=card.querySelector('.foot');if(!foot)return;
    const label=el('span','','JRVX ID · часть экосистемы JRVX'),links=el('div','id-legal-links');
    links.append(link('/terms','Условия'),link('/privacy','Конфиденциальность'),link('https://jrvx.ru/','Экосистема ↗'));
    foot.replaceChildren(label,links);
  }
  function accessibleMessages() {
    for(const id of ['authMsg','accountMsg','message']){
      const node=byId(id);if(!node)continue;
      node.setAttribute('role','status');node.setAttribute('aria-live','polite');
      // The existing email script uses inline colors. Keep its success/error meaning
      // while replacing pale colors designed for the previous dark background.
      const update=()=>{
        const color=node.style.color.replace(/\s/g,'').toLowerCase();
        if(['#ff9aa8','rgb(255,154,168)'].includes(color))node.setAttribute('data-jrvx-tone','error');
        else if(['#91ebd0','rgb(145,235,208)'].includes(color))node.setAttribute('data-jrvx-tone','success');
        else node.removeAttribute('data-jrvx-tone');
      };
      new MutationObserver(update).observe(node,{attributes:true,attributeFilter:['style']});update();
    }
  }
  function projectCard(project,registry,linked) {
    const registered=registry.get(project.key),association=linked.get(project.key);
    const enabled=registered&&String(registered.status).toLowerCase()==='active';
    // /api/identity/apps returns the catalog separately from this user's links.
    // Catalog membership alone never produces a connected badge.
    const connected=enabled&&association&&String(association.status).toLowerCase()==='active';
    const card=el('article','id-project-card');card.setAttribute('data-project',project.key);
    const top=el('div','id-project-top'),state=el('span','id-project-state',connected?'Подключён':enabled?'Ещё не подключён':'Подключение недоступно');
    state.setAttribute('data-connected',connected?'true':'false');top.append(icon(project.key),state);
    const title=el('h3','',project.name);if(project.age)title.append(el('small','',project.age));
    card.append(top,title,el('p','',project.description));
    // Destinations are pinned constants; no API-supplied URL enters the DOM.
    if(enabled)card.append(link(project.url,'Открыть '+(project.key==='cas'?'CAS':'Planner')+' ↗','id-project-open'));
    return card;
  }
  function setupLauncher(account,originalApps) {
    if(!originalApps)return;
    const section=el('section','id-project-launcher');section.id='id-projects';
    section.setAttribute('aria-label','Твои проекты JRVX');originalApps.after(section);
    let controller=null,requestVersion=0,pending=false,refreshQueued=false,lastSuccess=0;
    const active=()=>account.classList.contains('active');
    const message=text=>el('p','id-project-launcher-message',text);
    function render(data) {
      const registry=new Map(data.apps.filter(row=>row&&typeof row.app_key==='string').map(row=>[row.app_key,row]));
      const linked=new Map(data.linked.filter(row=>row&&typeof row.app_key==='string').map(row=>[row.app_key,row]));
      const count=projects.filter(p=>registry.get(p.key)?.status==='active'&&linked.get(p.key)?.status==='active').length;
      const grid=el('div','id-project-grid');
      for(const project of projects)grid.append(projectCard(project,registry,linked));
      const summary=count?'Твои подключённые проекты — под рукой.':'Выбери проект и открой его со своим аккаунтом JRVX ID.';
      section.replaceChildren(message(summary),grid);
      const other=data.linked.filter(row=>row&&typeof row.app_key==='string'&&!projects.some(p=>p.key===row.app_key));
      if(other.length)section.append(el('p','id-project-other','Другие подключения: '+other.map(row=>String(row.name||row.app_key).slice(0,100)).join(', ')));
      originalApps.hidden=true;lastSuccess=Date.now();
    }
    async function refresh(force=false) {
      document.body.classList.toggle('id-signed-in',active());
      if(!active()){
        requestVersion++;controller?.abort();section.replaceChildren();section.hidden=true;originalApps.hidden=false;lastSuccess=0;return;
      }
      section.hidden=false;
      if(pending){refreshQueued=refreshQueued||force;return;}
      if(!force&&lastSuccess&&Date.now()-lastSuccess<30000)return;
      pending=true;const version=++requestVersion;
      controller=new AbortController();
      const timer=setTimeout(()=>controller?.abort(),10000);
      if(!lastSuccess)section.replaceChildren(message('Проверяем подключённые проекты…'));
      try{
        const response=await fetch('/api/identity/apps',{method:'GET',credentials:'same-origin',cache:'no-store',signal:controller.signal,headers:{Accept:'application/json'}});
        if(!response.ok)throw new Error('unavailable');
        const data=await response.json();
        if(data?.ok!==true||!Array.isArray(data.apps)||!Array.isArray(data.linked))throw new Error('incomplete');
        if(version!==requestVersion||!active())return;
        render(data);
      }catch{
        if(version!==requestVersion||!active())return;
        // Leave the original authenticated app list available on enhancement failure.
        originalApps.hidden=false;lastSuccess=0;
        const retry=el('button','btn secondary id-project-retry','Повторить проверку');retry.type='button';retry.addEventListener('click',()=>{void refresh(true);});
        section.replaceChildren(message('Не удалось проверить подключения. Повтори проверку.'),retry);
      }finally{
        clearTimeout(timer);pending=false;
        if(refreshQueued){refreshQueued=false;void refresh(true);}
      }
    }
    new MutationObserver(()=>{void refresh(true);}).observe(account,{attributes:true,attributeFilter:['class']});
    new MutationObserver(()=>{void refresh(true);}).observe(originalApps,{childList:true});
    window.addEventListener('focus',()=>{void refresh();});
    window.addEventListener('online',()=>{void refresh(true);});
    void refresh(true);
  }
  function start() {
    if(document.body.classList.contains('jrvx-id-ui'))return;
    const card=document.querySelector('main.card'),emailPage=!!byId('purpose');
    if(!card&&!emailPage)return;
    document.body.classList.add('jrvx-id-ui');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content','#f3f5ef');
    const main=card||document.querySelector('main');main.id=main.id||'id-main';
    header();accessibleMessages();
    if(emailPage){document.body.classList.add('id-email-page');return;}
    card.classList.add('id-main-card');
    const brand=card.querySelector('.brand');if(brand)brand.textContent='ОБЩАЯ ТОЧКА ВХОДА · JRVX';
    welcome(card);footer(card);
    const account=byId('account');if(account)setupLauncher(account,byId('apps'));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
