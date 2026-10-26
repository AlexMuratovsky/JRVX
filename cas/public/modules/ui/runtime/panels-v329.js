(()=>{
'use strict';
if(window.JRVXCASPanelsV329?.version==='v329')return;
const controller=new AbortController(),shielded=new WeakSet();let current=null,destroyed=false;
const visible=node=>{if(!node?.isConnected||node.hidden||!node.getClientRects().length)return false;const style=window.getComputedStyle?.(node);return !style||style.visibility!=='hidden'&&style.visibility!=='collapse'&&style.display!=='none'};
const rootOf=panel=>typeof panel==='string'?document.getElementById(panel):panel;
function controls(root){return [...root.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(node=>visible(node)&&node.getAttribute('aria-disabled')!=='true')}
function otherModal(root){return [...document.querySelectorAll('[aria-modal="true"]')].some(node=>visible(node)&&node.getAttribute('aria-hidden')!=='true'&&!root.contains(node)&&!current?.root.contains(node))}
function close(panel=current?.root,{restoreFocus=true}={}){
 const root=rootOf(panel);if(!current||root!==current.root)return false;
 const previous=current;current=null;root.hidden=true;root.setAttribute('aria-hidden','true');document.body.classList.remove('jrvxPanelOpenV329');
 if(restoreFocus&&visible(previous.opener)&&!previous.opener.disabled)previous.opener.focus();
 if(root.contains(document.activeElement))document.activeElement?.blur?.();
 try{previous.onClose?.()}catch{}
 return true;
}
function open(panel,{opener=document.activeElement,initialFocus,onClose}={}){
 const root=rootOf(panel);if(destroyed||!root?.isConnected||otherModal(root))return false;
 if(current?.root===root)return true;
 if(!shielded.has(root)){root.addEventListener('keydown',event=>{if(current?.root===root)event.stopPropagation()},{signal:controller.signal});shielded.add(root)}
 const returnTo=current?.root.contains(opener)?current.opener:opener;
 if(current)close(current.root,{restoreFocus:false});
 current={root,opener:returnTo,onClose};root.hidden=false;root.setAttribute('aria-hidden','false');document.body.classList.add('jrvxPanelOpenV329');
 const preferred=typeof initialFocus==='string'?root.querySelector(initialFocus):initialFocus;
 const target=[preferred,root.querySelector('[data-jrvx-panel-close]'),controls(root)[0]].find(node=>node&&root.contains(node)&&visible(node)&&!node.disabled);
 if(target)target.focus();else{const card=root.querySelector('[role="dialog"]')||root;card.setAttribute('tabindex','-1');card.focus()}
 return true;
}
function keydown(event){
 if(!current)return;
 if(!visible(current.root)){close(current.root,{restoreFocus:false});return}
 if(otherModal(current.root)){close(current.root,{restoreFocus:false});return}
 if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close();return}
 if(!current.root.contains(document.activeElement)){event.preventDefault();event.stopImmediatePropagation();const nodes=controls(current.root);(event.shiftKey?nodes.at(-1):nodes[0])?.focus();return}
 if(event.key!=='Tab')return;
 const root=current.root,nodes=controls(root),first=nodes[0],last=nodes.at(-1);
 if(!nodes.length||!root.contains(document.activeElement)||event.shiftKey&&document.activeElement===first||!event.shiftKey&&document.activeElement===last){
  event.preventDefault();event.stopImmediatePropagation();(event.shiftKey?last:first)?.focus();
 }
}
window.addEventListener('keydown',keydown,{capture:true,signal:controller.signal});
document.addEventListener('click',event=>{if(!current)return;const root=current.root,button=event.target.closest?.('[data-jrvx-panel-close]');if(event.target===root||button&&root.contains(button))close(root)},{signal:controller.signal});
window.addEventListener('pagehide',()=>close(current?.root,{restoreFocus:false}),{signal:controller.signal});
const api={version:'v329',open,close,active:()=>current?.root||null,destroy(){if(destroyed)return;close(current?.root,{restoreFocus:false});destroyed=true;controller.abort();if(window.JRVXCASPanelsV329===api)delete window.JRVXCASPanelsV329;}};
window.JRVXCASPanelsV329=api;
})();
