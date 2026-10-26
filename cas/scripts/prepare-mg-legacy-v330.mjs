import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import cp from 'node:child_process';
const cas=path.resolve(import.meta.dirname,'..');
const workspace=path.resolve(cas,'../..');
const mirror=path.resolve(process.argv[2]||path.join(workspace,'.recovery/cas-audit-public'));
const paths=[
'modules/poker/legacy-runtime/02-v59-poker-runtime.js',
'modules/ui/legacy-runtime/05-v70-jarvis-cas-polish-script.js',
'modules/legacy/legacy-runtime/06-v71-final-overhaul-script.js',
'modules/ui/legacy-runtime/07-v72-premium-polish-script.js',
'modules/ui/legacy-runtime/08-v74-royal-wow-runtime.js',
'modules/ui/legacy-runtime/09-v76-royal-experience-runtime.js',
'modules/legacy/legacy-runtime/10-v83PatchScript.js',
'modules/poker/legacy-runtime/11-v84-poker-runtime.js',
'modules/core/legacy-runtime/15-v93-performance-runtime.js',
'modules/legacy/legacy-runtime/19-jrvx-cas-v101-live-script.js',
'modules/ui/legacy-runtime/25-v103-reference-lobby-script.js',
'modules/poker/legacy-runtime/27-v105-tablefix-script.js',
'modules/poker/legacy-runtime/42-v122-poker-completion-runtime.js',
'modules/legacy/legacy-runtime/49-v131-requested-fixes-runtime.js',
'modules/ui/legacy-runtime/51-v133-polish-runtime.js',
'modules/core/legacy-runtime/53-v137-maintenance-runtime.js',
'modules/core/runtime/release-v300.js',
'modules/ui/runtime/visual-v303.js',
'modules/blackjack/runtime/game-table-v318.js',
'assets/js-v304/group-03.js',
'assets/js-v304/group-04.js',
'modules/poker/runtime/poker-stability-v325.js'
];
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function replaceLine(s,name,body){const re=new RegExp('^[ \\t]*(?:async )?function '+name+'\\([^\\n]*$','m');if(!re.test(s))throw Error('Missing one-line function '+name);return s.replace(re,body)}
function block(s,start,end,body){const a=s.indexOf(start),b=s.indexOf(end,a);if(a<0||b<0)throw Error('Missing block '+start);return s.slice(0,a)+body+s.slice(b)}
function common(s){
 // Remove obsolete UI branches before translating current currency copy.
 for(const re of [/<button class="v70CurrencyBtn" data-v70-cur="MS">[\s\S]*?<\/button>/g,/<div class="v70ProfileWallet"><span>Mura Silver<\/span>[\s\S]*?<\/div>/g,/<div class="v69Stat"><span>Mura Silver<\/span>[\s\S]*?<\/div>/g,/<button class="v122Choice" data-v122-cur="MS">[\s\S]*?<\/button>/g,/<div class="v74HeroToken ms">MS<\/div>/g,/<div class="v133RoomChip ms">MS<\/div>/g,/<span id="v318WalletMS">0 MS<\/span>/g])s=s.replace(re,'');
 s=s.replace(/if\(\$\('(v70MsDock|v70ProfileMS|v71ProfileMS)'\)\)\$\('\1'\)\.textContent=`[^`]*`;/g,'');
 s=s.replace(/\$\('#v122MsBal',o\)\.textContent=`[^`]*`;/g,'');
 s=s.replace(/\{icon:'S',name:'Silver Start',desc:'[^']*',ok:e\.ms>=500\},?\s*/g,'');
 s=s.replaceAll('Mura Silver или Mura Gold','Mura Gold').replaceAll('Mura Silver / Mura Gold','Mura Gold').replaceAll('Mura Silver и Mura Gold','Mura Gold').replaceAll('Mura Silver / Gold','Mura Gold').replaceAll('MS или MG','MG').replaceAll('MS / MG','MG').replaceAll('MS/MG','MG').replaceAll('MG/MS','MG').replaceAll('MS и MG','MG').replaceAll('MS + MG','MG').replaceAll('MS → MG','MG').replaceAll('Mura Silver','Mura Gold');
 s=s.replace(/\bMS\b/g,'MG').replaceAll("'jarvisCasEconomyV69'","'jrvxCasMGDevelopmentV330'");
 // No old browser currency selection is financial authority.
 for(const name of ['unit','activeCur','activeCurrency','blackjackUnit']){
  const re=new RegExp('^[ \\t]*function '+name+'\\([^\\n]*$','m');if(re.test(s))s=s.replace(re,'function '+name+"(){return 'MG'}");
 }
 s=s.replace(/(const fmt\s*=\s*)n=>Math\.max\(0,Math\.floor\(Number\(n\)\|\|0\)\)\.toLocaleString\('ru-RU'\)/g,"$1n=>window.JRVXCASMoneyV330.formatCompact(Number.isSafeInteger(n)?n:0,{currency:false})");
 s=s.replace(/function fmt\(n\)\{return Math\.max\(0,Math\.floor\(Number\(n\)\|\|0\)\)\.toLocaleString\('ru-RU'\)\}/g,"function fmt(n){return window.JRVXCASMoneyV330.formatCompact(Number.isSafeInteger(n)?n:0,{currency:false})}");
 return s;
}
function transform(file,s){
 s=s.replace(/\r/g,'');
 if(file.includes('05-v70')){
  s=replaceLine(s,'eco',"function eco(){return {mg:(window.JRVXCasEconomy||window.JVRXCasEconomy)?.balance?.()||0}}");
  s=replaceLine(s,'renderV70Admin',"function renderV70Admin(){window.JRVXAdminV270?.refresh?.()}");
 }
 if(file.includes('06-v71')){
  s=replaceLine(s,'eco',"function eco(){return {mg:(window.JRVXCasEconomy||window.JVRXCasEconomy)?.balance?.()||0}}");
  s=replaceLine(s,'setEco',"function setEco(value){return window.JRVXCasEconomy?.set?.({mg:value.mg})}");
  s=replaceLine(s,'renderAdminV71',"function renderAdminV71(){window.JRVXAdminV270?.refresh?.()}");
  s=replaceLine(s,'currentBalance',"function currentBalance(){return window.JRVXCasEconomy?.balance?.()||0}");
  s=replaceLine(s,'setFlowCopy',"function setFlowCopy(){const title=$('v69TablesScreen')?.querySelector('.v69PanelHead h2'),sub=$('v69TableSubtitle');if(title)title.textContent=flow==='jarvis'?'Играть с JRVX':flow==='private'?'Частная игра':'Столы JRVX CAS';if(sub)sub.textContent='Все ставки в MG. Выберите формат и стол.'}");
  s=replaceLine(s,'openFlow',"function openFlow(kind){flow=kind||'tables';if(nativeTables)nativeTables.call(tableBtn);else{document.querySelectorAll('.v69Screen,.v69PanelScreen').forEach(x=>x.classList.remove('active'));$('v69TablesScreen')?.classList.add('active')}ROOT.hidden=false;ROOT.style.display='block';window.JRVXCasEconomy?.setCurrency?.('MG');setFlowCopy();$('v69CurrencyStep').hidden=true;$('v69TableStep').hidden=false;afterCurrency();window.scrollTo(0,0)}");
  s=replaceLine(s,'simpleCurrencyFlow',"function simpleCurrencyFlow(game){flow=game;window.JRVXCasEconomy?.setCurrency?.('MG');window.JVRXRoutes?.launchSimpleGame?.(game)}");
 }
 if(file.includes('09-v76'))s=s.replace("if(a==='shop'){if(typeof window.openShop==='function')window.openShop();else $('v69BalanceShop')?.click()}","if(a==='shop'){if(typeof window.JRVXCASWalletV330?.openShop==='function')window.JRVXCASWalletV330.openShop();else $('v69BalanceShop')?.click()}");
 if(file.includes('08-v74')){
  s=s.replace('<span class="v74Step active" data-v74-step="currency"><b>1</b>Валюта</span><i class="v74StepLine"></i>','').replace('data-v74-step="variant"><b>2</b>','data-v74-step="variant"><b>1</b>').replace('data-v74-step="room"><b>3</b>','data-v74-step="room"><b>2</b>');
  s=replaceLine(s,'syncSteps',"function syncSteps(){qa('.v74Step').forEach(step=>step.classList.add('active'))}");
 }
 if(file.includes('07-v72')){
  s=block(s,'function readDaily()','function addStatusRail()',"function syncDaily(){const daily=window.JRVXCASWalletV330?.diagnostics?.().daily,state=$('v72DailyState'),orb=$('v72DailyOrb');if(state)state.textContent=daily?.claimed?'Получено сегодня':daily?'10K MG доступны':'Проверка сервера…';if(orb){orb.textContent=daily?.claimed?'✓':'MG';orb.className='v72StatusOrb mg'}const streak=$('v72DailyStreak');if(streak)streak.textContent='Один раз за день сервера'}\nfunction trackDailyClaim(){}\n");
  s=s.replaceAll('800 MS доступны','10K MG доступны').replaceAll('>800</div>','>MG</div>');
  s=replaceLine(s,'decorateStore',"function decorateStore(){/* The authoritative catalog and payment availability are rendered by wallet-v330. */}");
 }
 if(file.includes('42-v122')){
  s=replaceLine(s,'setCurrency',"function setCurrency(){chooser.currency='MG';window.JRVXCasEconomy?.setCurrency?.('MG');renderChooser()}");
  s=replaceLine(s,'readLocalRecovery',"function readLocalRecovery(){let value=null;try{value=JSON.parse(sessionStorage.getItem(LOCAL_RECOVERY)||localStorage.getItem(LOCAL_RECOVERY)||'null')}catch{}return value?.currency==='MG'&&Date.now()-Number(value.at||0)<=1800000?value:null}");
  // Old local recovery from an earlier economy is retained as data, never credited as MG.
 }
 if(file.includes('game-table-v318')){
  s=block(s,'function syncWallet(){','function syncLabels(){',"function syncWallet(){const value=(window.JRVXCasEconomy||window.JVRXCasEconomy)?.balance?.()||0,node=$('v318WalletMG');setText(node,window.JRVXCASMoneyV330.formatCompact(value));if(node)node.title=window.JRVXCASMoneyV330.formatExact(value)}\n");
 }
 s=common(s);
 // Any leftover legacy property reads are retired, not redirected to old balances.
 s=s.replace(/\b(ms|costMS|rewardMs)\s*:\s*[^,}\n]+,?/g,'').replace(/\.ms\b/g,'.mg');
 // Exact old-slot labels no longer exist and never read an old wallet.
 s=s.replace(/\bconst ms=q\('.v69CurrencyCard.silver .v69CoinBig'\),mg=/g,'const mg=').replace(/if\(ms\)ms\.textContent='MG';/g,'');
 if(file.includes('06-v71'))s=s.replace(/function rowEco\([^\n]*\n/g,'');
 if(file.includes('release-v300'))s=s.replace('Серверный обмен MG, усиленная','Единая валюта MG, усиленная');
 s=s.replace(/(?:cur|activeCur\(\)|window\.JVRXCasEconomy\?\.get\?\.\(\)\.currency|pref\.currency|r\.currency)==='MG'\?'MG':'MG'/g,"'MG'").replaceAll("cur==='MG'?'mg':'ms'","'mg'");
 s=s.replaceAll("?'MG':'MG'","?'MG':'MG'").replaceAll("cur==='MG'?'Mura Gold • MG':'Mura Gold • MG'","'Mura Gold • MG'").replaceAll("cur==='MG'?'Mura Gold':'Mura Gold'","'Mura Gold'");
 s=s.replaceAll('v72StatusOrb ms','v72StatusOrb mg').replaceAll('<div class="v105Chip ms">MG</div>','');
 s=s.replaceAll('Перед покерным столом валюту также можно изменить.','Все игровые операции выполняются в MG.').replaceAll('Выберите валюту и лимит перед посадкой за стол.','Выберите лимит MG перед посадкой за стол.');
 s=s.replaceAll('Выберите стол, валюту и формат.','Выберите стол и формат игры на MG.').replaceAll('с выбранной валютой кошелька','на MG').replaceAll('с выбранной валютой','на MG').replaceAll('с другом и выбранной игровой валютой','с другом на MG');
 s=s.replaceAll('Texas Hold’em запускается online; если SERVER LINK недоступен, можно открыть тот же стол локально с JRVX.','Texas Hold’em работает через сервер. Если связь недоступна, восстановите подключение перед входом за стол.');
 s=s.replace(/const mins=\{MG:\[[^\]]*\],MG:\[[^\]]*\]\};/, 'const mins={MG:[20,40,100,200,500,1000,2000]};');
 s=s.replaceAll("wallet().toLocaleString('ru-RU')","window.JRVXCASMoneyV330.formatCompact(wallet(),{currency:false})").replaceAll("Math.floor(Number(p.stack)||0).toLocaleString('ru-RU')","window.JRVXCASMoneyV330.formatCompact(Number(p.stack)||0,{currency:false})").replaceAll("Math.floor(Number(state.pot)||0).toLocaleString('ru-RU')","window.JRVXCASMoneyV330.formatCompact(Number(state.pot)||0,{currency:false})").replaceAll("Math.floor(Number(e.mg)||0).toLocaleString('ru-RU')","window.JRVXCASMoneyV330.formatCompact(Number(e.mg)||0,{currency:false})").replaceAll("pot.toLocaleString('ru-RU')","window.JRVXCASMoneyV330.formatCompact(pot,{currency:false})").replaceAll("best.toLocaleString('ru-RU')","window.JRVXCASMoneyV330.formatCompact(best,{currency:false})");
 if(file.includes('poker-stability-v325'))s=replaceLine(s,'history',"function history(){const key=historyKey();if(!key)return[];let rows=[];try{rows=JSON.parse(localStorage.getItem(key)||'[]')}catch{}return Array.isArray(rows)?rows.filter(row=>row?.currency==='MG'):[]}");
 if(file.includes('05-v70'))s=s.replace("let lastDaily='';try{lastDaily=localStorage.getItem('jarvisCasDailyV69')||''}catch{}", "const lastDaily=window.JRVXCASWalletV330?.diagnostics?.().daily?.claimed===true;");
 if(file.includes('06-v71'))s=s.replaceAll('Шаг 2 — выберите формат и пролистайте столы.','Выберите формат и пролистайте столы.').replaceAll('Валюта выбрана — раздел турниров пока в разработке.','Турнирный режим пока в разработке.');
 if(file.includes('02-v59')){
  s=replaceLine(s,'unit59',"function unit59(){return 'MG'}");
  s=replaceLine(s,'refreshWallet',"function refreshWallet(){const el=$('p59Wallet'),value=wallet();if(el){const text=window.JRVXCASMoneyV330.formatCompact(value);if(el.textContent!==text)el.textContent=text;el.title=window.JRVXCASMoneyV330.formatExact(value)}}");
  s=s.replaceAll('ставка ${p.bet}','ставка ${window.JRVXCASMoneyV330.formatCompact(Number(p.bet)||0,{currency:false})}').replaceAll('+${p.wonLast} ${unit59()}','+${window.JRVXCASMoneyV330.formatCompact(Number(p.wonLast)||0)}');
  s=s.replaceAll('Колл ${toCall} ${unit59()}','Колл ${window.JRVXCASMoneyV330.formatCompact(toCall)}');
  s=s.replace("v85Text($('p59Pot'),potText);", "v85Text($('p59Pot'),potText);for(const id of ['p59Pot','p59PotTop']){const node=$(id);if(node){node.title=window.JRVXCASMoneyV330.formatExact(Number(state.pot)||0);node.setAttribute('aria-label',node.title)}}");
  s=s.replace("v93Bool(startEl,'disabled'", "if(callEl){callEl.title=toCall?'Колл '+window.JRVXCASMoneyV330.formatExact(toCall):'Чек';callEl.setAttribute('aria-label',callEl.title)}v93Bool(startEl,'disabled'");
  s=s.replace("if(meta[1])v85Text(meta[1],", "if(meta[0])meta[0].title=window.JRVXCASMoneyV330.formatExact(Number(p.stack)||0);if(meta[1])meta[1].title=window.JRVXCASMoneyV330.formatExact(Number(p.bet)||0);if(meta[1])v85Text(meta[1],");
  s=s.replace('<div class="p59SeatMeta"><span>${window.JRVXCASMoneyV330.formatCompact', '<div class="p59SeatMeta"><span title="${window.JRVXCASMoneyV330.formatExact(Number(p.stack)||0)}">${window.JRVXCASMoneyV330.formatCompact');
 }
 if(file.includes('02-v59')){
  s=replaceLine(s,'wallet',"function wallet(){try{const value=(window.JRVXCasEconomy||window.JVRXCasEconomy)?.balance?.();return Number.isSafeInteger(value)&&value>=0?value:0}catch{return 0}}");
  s=replaceLine(s,'setWallet',"function setWallet(value){if(window.JRVXCASIdentityV300?.state?.().mode!=='development')return wallet();if(!Number.isSafeInteger(value)||value<0)return wallet();(window.JRVXCasEconomy||window.JVRXCasEconomy)?.set?.({mg:value});return wallet()}");
  s=s.replace("const t=table(),buy=Math.max(t.min,Math.floor(Number($('p59BuyIn').value)||t.min));", "const t=table(),buy=Number($('p59BuyIn').value);if(!Number.isSafeInteger(buy)||buy<t.min){showArcadeToast('Poker','Введите целую сумму MG не ниже минимального входа.','!');return}");
  s=s.replace("amount:Math.floor(Number($('p59Bet').value)||0)","amount:Number($('p59Bet').value)");
 }
 if(file.includes('11-v84')){
  s=replaceLine(s,'wallet',"function wallet(){const value=(window.JRVXCasEconomy||window.JVRXCasEconomy)?.balance?.();return Number.isSafeInteger(value)&&value>=0?value:0}");
  s=s.replace("$('v84RebuyBalance').textContent=`${Math.floor(bal)} ${u}`;$('v84RebuyMinLabel').textContent=`${min} ${u}`;", "$('v84RebuyBalance').textContent=window.JRVXCASMoneyV330.formatCompact(bal);$('v84RebuyBalance').title=window.JRVXCASMoneyV330.formatExact(bal);$('v84RebuyMinLabel').textContent=window.JRVXCASMoneyV330.formatCompact(min);$('v84RebuyMinLabel').title=window.JRVXCASMoneyV330.formatExact(min);");
 }
 if(/\bMS\b|Mura Silver|\/api\/wallet\/exchange|\.ms\b/.test(s))throw Error('Legacy currency remains: '+file);
 return s.replace(/[ \t]+$/gm,'').trimEnd()+'\n';
}
const entries=[];
for(const oldPath of paths){
 const local=path.join(cas,'public',oldPath),input=fs.existsSync(local)?local:path.join(mirror,oldPath);
 if(!fs.existsSync(input))throw Error('Missing captured source '+oldPath);
 const original=fs.readFileSync(input),outputPath=oldPath.replace(/\.js$/,'-mg-v330.js');
 const output=path.join(cas,'public',outputPath);fs.mkdirSync(path.dirname(output),{recursive:true});const source=transform(oldPath,original.toString('utf8'));fs.writeFileSync(output,source);
 cp.execFileSync(process.execPath,['--check',output]);
 entries.push({oldPath,newPath:outputPath,sourceSha256:digest(original),sha256:digest(source)});
}
const manifest={version:'v330',preserveModeCarousel:'modules/ui/legacy-runtime/29-v108-mode-carousel.js unchanged',entries};
fs.writeFileSync(path.join(cas,'mg-legacy-v330-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({generated:entries.length,manifest:'cas/mg-legacy-v330-manifest.json'}));
