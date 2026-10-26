(function(){
  const TABLES=[
    {name:'Royal Ace', sb:1, bb:2, mood:'Мягкий старт для heads-up и тренировки ритма.', players:'2 seats', buy:'от 100', c1:'A♠', c2:'K♥', rail:'#c28b43', felt:'#15684f', tA:'#071223', tB:'#09111e'},
    {name:'Mura King', sb:2, bb:5, mood:'Уверенный темп для регулярных сессий Hold’em.', players:'2 seats', buy:'от 300', c1:'Q♣', c2:'Q♥', rail:'#d0a246', felt:'#17634d', tA:'#0b1630', tB:'#09111c'},
    {name:'Neon River', sb:5, bb:10, mood:'Живой экшен и заметный рост банка с первых кругов.', players:'2 seats', buy:'от 600', c1:'J♠', c2:'10♥', rail:'#b9853d', felt:'#135d48', tA:'#10162b', tB:'#0a1120'},
    {name:'Velvet Storm', sb:10, bb:20, mood:'Средние лимиты для серьёзной дуэли с плотным темпом.', players:'2 seats', buy:'от 1 200', c1:'A♦', c2:'A♣', rail:'#c89544', felt:'#105741', tA:'#10172f', tB:'#08101d'},
    {name:'Obsidian Pro', sb:20, bb:50, mood:'Премиальный стол для глубоких стеков и агрессии.', players:'2 seats', buy:'от 3 000', c1:'K♠', c2:'Q♠', rail:'#c99641', felt:'#125540', tA:'#11192f', tB:'#09101c'},
    {name:'Royal Crown', sb:50, bb:100, mood:'Высокие ставки, быстрые решения и горячие банки.', players:'2 seats', buy:'от 8 000', c1:'A♥', c2:'K♣', rail:'#d2a448', felt:'#165844', tA:'#11182e', tB:'#08101b'},
    {name:'Imperial X', sb:100, bb:200, mood:'Максимальный лимит для финального уровня JRVX CAS.', players:'2 seats', buy:'от 20 000', c1:'A♠', c2:'Q♣', rail:'#e0b458', felt:'#145742', tA:'#141a30', tB:'#09101c'}
  ];
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const text=(el,v)=>{if(el) el.textContent=v};
  function currentIndex(){
    const m=(($('#v69TableCounter')?.textContent||'1 / 7').match(/(\d+)/)||[])[1];
    let idx=Math.max(0,(parseInt(m||'1',10)-1));
    if(idx>=TABLES.length) idx=0;
    return idx;
  }
  function currentVariant(){return $('.v69VariantToggle button.active')?.dataset.variant==='omaha'?'omaha':'holdem'}
  function currentCurrency(){return ($('#v69ActiveCurrencyLabel')?.textContent||'MG').trim()||'MG'}
  function markup(t,variant,currency){
    const sub = variant==='omaha' ? 'Omaha format' : 'Texas Hold’em';
    return `<div class="v105Left">
      <div>
        <div class="v105Kicker">${sub} • JRVX CAS</div>
        <h3 class="v105TableTitle">${t.name}</h3>
        <p class="v105Desc">${t.mood}</p>
        <div class="v105Meta"><span>${variant==='omaha'?'4 hole cards':'classic heads-up'}</span><span>${t.players}</span><span>${currency}</span><span>buy-in ${t.buy} ${currency}</span></div>
      </div>
      <div class="v105Bottom">
        <div class="v105Min"><span>Минимальный вход</span><strong>${t.buy} ${currency}</strong></div>
        <div class="v105Live">Блайнды ${t.sb} / ${t.bb} ${currency}</div>
      </div>
    </div>
    <div class="v105Right"><div class="v105Scene"><div class="v105Glow"></div><div class="v105Dealer">JX<small>DEALER</small></div><i class="v105Seat s1"></i><i class="v105Seat s2"></i><i class="v105Seat s3"></i><i class="v105Seat s4"></i><i class="v105Seat s5"></i><div class="v105Table" style="--rail:${t.rail};--felt:${t.felt};"></div><div class="v105Cards"><div class="v105CardFace">${t.c1}</div><div class="v105CardFace red">${t.c2}</div></div><div class="v105Blind">PUBLIC TABLE • ${currency}</div><div class="v105Chips"><div class="v105Chip mg">MG</div></div></div></div>`;
  }
  function paint(){
    const step=$('#v69TableStep');
    const track=$('#v69TableTrack');
    if(!step||step.hidden||!track) return;
    const idx=currentIndex();
    const variant=currentVariant();
    const currency=currentCurrency();
    if(track.dataset.v105Variant!==variant||track.dataset.v105Currency!==currency||track.children.length!==TABLES.length||!track.firstElementChild?.querySelector('.v105TableCard,.v133RoomCard')){track.innerHTML = TABLES.map((t,i)=>`<div class="v69TableSlide"><article class="v69TableCard v105TableCard" style="--tA:${t.tA};--tB:${t.tB};--tGlow:rgba(72,172,142,.15)" data-v105-index="${i}">${markup(t,variant,currency)}</article></div>`).join('');track.dataset.v105Variant=variant;track.dataset.v105Currency=currency;}
    track.style.transform=`translateX(-${idx*100}%)`;
    text($('#v69TableCounter'), `${idx+1} / ${TABLES.length}`);
  }
  function after(cb){return (...args)=>setTimeout(()=>cb(...args),30)}
  function bind(){
    paint();
    $$('.v69CurrencyCard').forEach(el=>{if(el.dataset.v105Bound) return; el.dataset.v105Bound='1'; el.addEventListener('click', after(paint));});
    $$('.v69VariantToggle button').forEach(el=>{if(el.dataset.v105Bound) return; el.dataset.v105Bound='1'; el.addEventListener('click', after(paint));});
    ['v69PrevTable','v69NextTable','v69ChangeCurrency','v69OpenTablesBtn'].forEach(id=>{const el=document.getElementById(id); if(!el||el.dataset.v105Bound) return; el.dataset.v105Bound='1'; el.addEventListener('click', after(paint));});
    const enter=document.getElementById('v69EnterTable'); if(enter){ enter.style.position='relative'; enter.style.zIndex='4'; }
    const obsTarget=$('#v69TableStep');
    if(obsTarget && !obsTarget.__v105Obs){
      const mo=new MutationObserver(()=>setTimeout(paint,10));
      mo.observe(obsTarget,{attributes:true,attributeFilter:['hidden']});
      obsTarget.__v105Obs=true;
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>{bind(); setTimeout(bind,250); setTimeout(bind,1000);},{once:true});
  else {bind(); setTimeout(bind,250); setTimeout(bind,1000);}
})();
