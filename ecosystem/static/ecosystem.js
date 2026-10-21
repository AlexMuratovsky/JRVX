(() => {
  const menuButton = document.querySelector('.eco-menu-toggle');
  const header = document.querySelector('.eco-header');
  const closeMenu = () => {
    document.getElementById('eco-mobile-menu')?.remove();
    menuButton?.setAttribute('aria-expanded','false');
    menuButton?.setAttribute('aria-label','Открыть меню');
  };
  menuButton?.addEventListener('click', () => {
    if (document.getElementById('eco-mobile-menu')) {closeMenu();return;}
    const menu = document.createElement('nav');
    menu.id='eco-mobile-menu';menu.className='eco-mobile-menu';
    menu.setAttribute('aria-label','Мобильная навигация');
    for (const [href,text] of [['/#about','Об экосистеме'],['/#projects','Все проекты'],['/#faq','Вопросы и ответы'],['https://id.jrvx.ru/','Открыть JRVX ID ↗']]) {
      const link=document.createElement('a');link.href=href;link.textContent=text;link.addEventListener('click',closeMenu);menu.append(link);
    }
    header.append(menu);menuButton.setAttribute('aria-expanded','true');menuButton.setAttribute('aria-label','Закрыть меню');
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){closeMenu();menuButton?.focus();}});
  const buttons=[...document.querySelectorAll('.eco-filters button')];
  const groups=[null,['id','planner'],['cas','arcade'],['ai']];
  buttons.forEach((button,index)=>button.addEventListener('click',()=>{
    buttons.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    for(const card of document.querySelectorAll('.eco-project-grid>article')) {
      card.hidden=!!groups[index]&&!groups[index].some(slug=>card.classList.contains('eco-project-'+slug));
    }
  }));
})();
