(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.Poker59Core=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const TABLES=[
    {id:'1-2',sb:1,bb:2,min:20},{id:'2-4',sb:2,bb:4,min:40},{id:'5-10',sb:5,bb:10,min:100},
    {id:'10-20',sb:10,bb:20,min:200},{id:'25-50',sb:25,bb:50,min:500},{id:'50-100',sb:50,bb:100,min:1000},{id:'100-200',sb:100,bb:200,min:2000}
  ];
  const RANKS='23456789TJQKA', SUITS='SHDC';
  const RANK_WORD={2:'двоек',3:'троек',4:'четвёрок',5:'пятёрок',6:'шестёрок',7:'семёрок',8:'восьмёрок',9:'девяток',10:'десяток',11:'валетов',12:'дам',13:'королей',14:'тузов'};
  const HAND_NAMES=['Старшая карта','Пара','Две пары','Тройка','Стрит','Флеш','Фулл-хаус','Каре','Стрит-флеш'];
  const clone=x=>JSON.parse(JSON.stringify(x));
  function tableById(id){return TABLES.find(t=>t.id===id)||TABLES[0]}
  function makeDeck(random=Math.random){const d=[];for(const r of RANKS)for(const s of SUITS)d.push(r+s);for(let i=d.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[d[i],d[j]]=[d[j],d[i]]}return d}
  function compareScore(a,b){for(let i=0;i<Math.max(a?.length||0,b?.length||0);i++){const d=(a?.[i]||0)-(b?.[i]||0);if(d)return d}return 0}
  function score5(cards){
    const vals=cards.map(c=>RANKS.indexOf(c[0])+2).sort((a,b)=>b-a),cnt={}; vals.forEach(v=>cnt[v]=(cnt[v]||0)+1);
    const groups=Object.entries(cnt).map(([v,n])=>[Number(n),Number(v)]).sort((a,b)=>b[0]-a[0]||b[1]-a[1]);
    const flush=cards.every(c=>c[1]===cards[0][1]); let uniq=[...new Set(vals)]; if(uniq[0]===14)uniq.push(1); let straight=0;
    for(let i=0;i<=uniq.length-5;i++) if(uniq[i]-uniq[i+4]===4){straight=uniq[i];break}
    if(flush&&straight)return[8,straight]; if(groups[0][0]===4)return[7,groups[0][1],groups[1][1]];
    if(groups[0][0]===3&&groups[1]?.[0]>=2)return[6,groups[0][1],groups[1][1]]; if(flush)return[5,...vals]; if(straight)return[4,straight];
    if(groups[0][0]===3)return[3,groups[0][1],...groups.slice(1).map(g=>g[1]).sort((a,b)=>b-a)];
    const pairs=groups.filter(g=>g[0]===2); if(pairs.length>=2)return[2,pairs[0][1],pairs[1][1],groups.find(g=>g[0]===1)?.[1]||0];
    if(pairs.length===1)return[1,pairs[0][1],...groups.filter(g=>g[0]===1).map(g=>g[1]).sort((a,b)=>b-a)]; return[0,...vals];
  }
  function bestHand(cards){if(cards.length<5)return null;let best=null;for(let a=0;a<cards.length-4;a++)for(let b=a+1;b<cards.length-3;b++)for(let c=b+1;c<cards.length-2;c++)for(let d=c+1;d<cards.length-1;d++)for(let e=d+1;e<cards.length;e++){const s=score5([cards[a],cards[b],cards[c],cards[d],cards[e]]);if(!best||compareScore(s,best)>0)best=s}return best}
  function handName(hole=[],community=[]){
    const cards=[...hole,...community].filter(c=>c&&c!=='??'); if(!cards.length)return'';
    if(cards.length>=5){const s=bestHand(cards);if(!s)return'';if(s[0]===1)return`Пара ${RANK_WORD[s[1]]||''}`.trim();if(s[0]===2)return`Две пары: ${RANK_WORD[s[1]]||''} и ${RANK_WORD[s[2]]||''}`.trim();if(s[0]===3)return`Тройка ${RANK_WORD[s[1]]||''}`.trim();if(s[0]===7)return`Каре ${RANK_WORD[s[1]]||''}`.trim();return HAND_NAMES[s[0]]||''}
    const cnt={};cards.forEach(c=>{const v=RANKS.indexOf(c[0])+2;cnt[v]=(cnt[v]||0)+1});const groups=Object.entries(cnt).map(([v,n])=>[Number(v),n]).sort((a,b)=>b[1]-a[1]||b[0]-a[0]);const pairs=groups.filter(x=>x[1]===2).map(x=>x[0]);
    if(groups[0]?.[1]===4)return`Каре ${RANK_WORD[groups[0][0]]||''}`.trim();if(groups[0]?.[1]===3)return`Тройка ${RANK_WORD[groups[0][0]]||''}`.trim();if(pairs.length>=2)return`Две пары: ${RANK_WORD[pairs[0]]||''} и ${RANK_WORD[pairs[1]]||''}`.trim();if(pairs.length===1)return`Пара ${RANK_WORD[pairs[0]]||''}`.trim();return'Старшая карта';
  }
    function pokerUnit(){try{return window.JRVXCasEconomy?.get?.().currency==='MG'?'MG':'MS'}catch{return'MS'}}
class HeadsUpGame{
    constructor(opts={}){
      this.table=tableById(opts.tableId); this.random=opts.random||Math.random; this.playerSeat=Number(opts.seat)===1?1:0; this.botSeat=this.playerSeat===0?1:0;
      const buyIn=Math.max(this.table.min,Math.floor(Number(opts.buyIn)||this.table.min)); this.buyIn=buyIn;
      this.players={
        [this.playerSeat]:{id:String(opts.playerId||'player'),nickname:String(opts.nickname||'Вы'),stack:buyIn,bet:0,hole:[],folded:false,lastAction:'',wonLast:0},
        [this.botSeat]:{id:'jarvis-v59',nickname:'JRVX',stack:buyIn,bet:0,hole:[],folded:false,lastAction:'Готов',wonLast:0}
      };
      this.dealerSeat=this.botSeat; this.smallBlindSeat=-1;this.bigBlindSeat=-1;this.handNo=0;this.street='waiting';this.active=false;this.deck=[];this.community=[];this.pot=0;this.currentBet=0;this.lastRaiseSize=this.table.bb;this.turnSeat=null;this.pending=new Set();this.log=[];this.lastResult=null;
    }
    player(){return this.players[this.playerSeat]} bot(){return this.players[this.botSeat]} other(seat){return seat===this.playerSeat?this.botSeat:this.playerSeat}
    post(seat,amount,label){const p=this.players[seat],pay=Math.min(p.stack,Math.max(0,Math.floor(amount)));p.stack-=pay;p.bet+=pay;this.pot+=pay;p.lastAction=label||'';if(label)this.log.push({kind:'bet',street:this.street,text:`${p.nickname}: ${label}${pay?` ${pay} ${pokerUnit()}`:''}`});return pay}
    startHand(){
      if(this.active)return{ok:false,error:'Раздача уже идёт'}; if(this.player().stack<this.table.bb)return{ok:false,error:'Недостаточный стек для большого блайнда'}; if(this.bot().stack<this.table.bb)return{ok:false,error:'У JRVX недостаточно фишек для следующей раздачи'};
      this.handNo++;this.deck=makeDeck(this.random);this.community=[];this.pot=0;this.currentBet=0;this.lastRaiseSize=this.table.bb;this.street='preflop';this.active=true;this.lastResult=null;this.dealerSeat=this.other(this.dealerSeat);this.smallBlindSeat=this.dealerSeat;this.bigBlindSeat=this.other(this.dealerSeat);
      for(const p of Object.values(this.players)){p.hole=[this.deck.pop(),this.deck.pop()];p.bet=0;p.folded=false;p.lastAction='';p.wonLast=0}
      this.post(this.smallBlindSeat,this.table.sb,'SB');this.post(this.bigBlindSeat,this.table.bb,'BB');this.currentBet=this.table.bb;this.pending=new Set([this.playerSeat,this.botSeat]);this.turnSeat=this.dealerSeat;this.log.push({kind:'deal',street:'preflop',text:`Раздача #${this.handNo}`});return{ok:true,state:this.state()};
    }
    minRaiseTo(){const p=this.players[this.turnSeat??this.playerSeat];const max=(p?.stack||0)+(p?.bet||0);return Math.min(max,Math.max(this.currentBet+this.lastRaiseSize,this.currentBet+this.table.bb,this.table.bb))}
    act(seat,action,amount){
      if(!this.active||this.turnSeat!==seat)return{ok:false,error:'Сейчас не Ваш ход'};const p=this.players[seat],other=this.players[this.other(seat)],toCall=Math.max(0,this.currentBet-p.bet);
      if(action==='fold'){p.folded=true;p.lastAction='Фолд';return this.finishByFold(this.other(seat))}
      if(action==='check'&&toCall>0)return{ok:false,error:`Нужно уравнять ${toCall} ${pokerUnit()}`};
      if(action==='check'){p.lastAction='Чек';this.log.push({kind:'check',street:this.street,text:`${p.nickname}: чек`});this.pending.delete(seat)}
      else if(action==='call'){const paid=this.post(seat,toCall,'Колл');if(paid<toCall&&p.stack===0)p.lastAction='ALL-IN';this.pending.delete(seat)}
      else if(action==='raise'||action==='bet'){
        const max=p.stack+p.bet;if(max<=this.currentBet){this.post(seat,toCall,'Колл');this.pending.delete(seat)}else{let target=Math.floor(Number(amount)||this.minRaiseTo());const min=this.minRaiseTo();target=Math.min(max,Math.max(target,min));const old=this.currentBet;this.post(seat,target-p.bet,`Рейз до ${target}`);this.currentBet=p.bet;this.lastRaiseSize=Math.max(this.table.bb,this.currentBet-old);this.pending=new Set(other.stack>0?[this.other(seat)]:[])}
      } else return{ok:false,error:'Неизвестное действие'};
      return this.afterAction(seat);
    }
    afterAction(lastSeat){
      if(!this.active)return{ok:true,state:this.state()};
      if(this.player().stack===0||this.bot().stack===0){const betsMatch=this.player().bet===this.bot().bet||this.player().stack===0||this.bot().stack===0;if(betsMatch&&this.pending.size===0)return this.runout()}
      if(this.pending.size===0)return this.advanceStreet();
      const next=this.other(lastSeat);if(this.pending.has(next)&&this.players[next].stack>0)this.turnSeat=next;else{for(const s of this.pending){if(this.players[s].stack>0){this.turnSeat=s;return{ok:true,state:this.state()}}}return this.advanceStreet()}
      return{ok:true,state:this.state()};
    }
    botAct(){if(!this.active||this.turnSeat!==this.botSeat)return{ok:false,error:'JRVX сейчас не ходит'};const p=this.bot(),toCall=Math.max(0,this.currentBet-p.bet);return this.act(this.botSeat,toCall>0?'call':'check')}
    resetBets(){for(const p of Object.values(this.players))p.bet=0;this.currentBet=0;this.lastRaiseSize=this.table.bb}
    advanceStreet(){
      if(!this.active)return{ok:false,error:'Раздача завершена'}; if(this.player().stack===0||this.bot().stack===0)return this.runout(); if(this.street==='river')return this.showdown(); this.resetBets();
      if(this.street==='preflop'){this.community.push(this.deck.pop(),this.deck.pop(),this.deck.pop());this.street='flop'}else if(this.street==='flop'){this.community.push(this.deck.pop());this.street='turn'}else if(this.street==='turn'){this.community.push(this.deck.pop());this.street='river'}
      if(this.player().stack===0||this.bot().stack===0)return this.runout();this.pending=new Set([this.playerSeat,this.botSeat].filter(s=>this.players[s].stack>0&&!this.players[s].folded));this.turnSeat=this.bigBlindSeat;if(!this.pending.has(this.turnSeat))this.turnSeat=[...this.pending][0]??null;this.log.push({kind:'street',street:this.street,text:this.street.toUpperCase()});return{ok:true,state:this.state()};
    }
    reconcileUncalled(){const a=this.player(),b=this.bot();if(a.bet===b.bet)return;const high=a.bet>b.bet?a:b,low=a.bet>b.bet?b:a,diff=high.bet-low.bet;if(diff>0){high.bet-=diff;high.stack+=diff;this.pot=Math.max(0,this.pot-diff);this.log.push({kind:'refund',street:this.street,text:`${high.nickname}: возврат ${diff} ${pokerUnit()}`})}}
    runout(){this.reconcileUncalled();while(this.community.length<5){if(this.community.length===0){this.community.push(this.deck.pop(),this.deck.pop(),this.deck.pop());this.street='flop'}else if(this.community.length===3){this.community.push(this.deck.pop());this.street='turn'}else{this.community.push(this.deck.pop());this.street='river'}}return this.showdown()}
    finishByFold(winnerSeat){const w=this.players[winnerSeat],amount=this.pot;w.stack+=amount;w.wonLast=amount;this.lastResult={type:'fold',text:`${w.nickname==='JRVX'?'JRVX':w.nickname||'Вы'} забирает банк ${amount} ${pokerUnit()}`,winners:[w.id],winnerNickname:w.nickname||'Игрок',pot:amount,winningHand:'Победа после фолда'};this.log.push({kind:'result',street:this.street,text:this.lastResult.text});this.pot=0;this.active=false;this.street='showdown';this.turnSeat=null;this.pending.clear();return{ok:true,state:this.state(),result:this.lastResult}}
    showdown(){
      const a=bestHand([...this.player().hole,...this.community]),b=bestHand([...this.bot().hole,...this.community]),cmp=compareScore(a,b),amount=this.pot;let winners=[];
      const playerHand=handName(this.player().hole,this.community),botHand=handName(this.bot().hole,this.community);
      if(cmp>0){this.player().stack+=amount;this.player().wonLast=amount;winners=[this.player().id];this.lastResult={type:'showdown',text:`${this.player().nickname||'Вы'} выиграл банк ${amount} ${pokerUnit()}`,winners,winnerNickname:this.player().nickname||'Вы',pot:amount,winningHand:playerHand}}
      else if(cmp<0){this.bot().stack+=amount;this.bot().wonLast=amount;winners=[this.bot().id];this.lastResult={type:'showdown',text:`JRVX выиграл банк ${amount} ${pokerUnit()}`,winners,winnerNickname:'JRVX',pot:amount,winningHand:botHand}}
      else{const h=Math.floor(amount/2);this.player().stack+=h;this.bot().stack+=amount-h;winners=[this.player().id,this.bot().id];this.lastResult={type:'showdown',text:`Банк разделён: ${amount} ${pokerUnit()}`,winners,winnerNickname:'Ничья',pot:amount,winningHand:playerHand||botHand||'Равные комбинации'}}
      this.log.push({kind:'result',street:'showdown',text:this.lastResult.text});this.pot=0;this.active=false;this.street='showdown';this.turnSeat=null;this.pending.clear();return{ok:true,state:this.state(),result:this.lastResult};
    }
    cashout(){return Math.max(0,Math.floor(this.player().stack))}
    state(){
      const seats=Array(2).fill(null);for(const [k,p] of Object.entries(this.players)){const seat=Number(k),mine=seat===this.playerSeat;seats[seat]={id:p.id,nickname:p.nickname,seat,stack:p.stack,bet:p.bet,inHand:this.active,folded:p.folded,lastAction:p.lastAction,wonLast:p.wonLast,hole:mine?p.hole:(this.street==='showdown'?p.hole:(p.hole.length?['??','??']:[]))}}
      const me=seats[this.playerSeat];me.toCall=this.active?Math.max(0,this.currentBet-this.player().bet):0;me.yourTurn=this.active&&this.turnSeat===this.playerSeat;me.currentHandName=this.player().hole.length?handName(this.player().hole,this.community):'';
      return{mode:'jarvis',tableId:this.table.id,seats,community:[...this.community],pot:this.pot,street:this.street,handNo:this.handNo,you:me,turnSeat:this.turnSeat,dealerSeat:this.dealerSeat,smallBlindSeat:this.smallBlindSeat,bigBlindSeat:this.bigBlindSeat,smallBlind:this.table.sb,bigBlind:this.table.bb,currentBet:this.currentBet,minRaiseTo:this.active?this.minRaiseTo():this.table.bb*2,minBuyIn:this.table.min,minRebuy:this.table.bb*19,lastResult:this.lastResult,actionLog:clone(this.log.slice(-30)),canStart:!this.active,needsBotAction:this.active&&this.turnSeat===this.botSeat};
    }
  }
  return{TABLES,tableById,makeDeck,score5,bestHand,compareScore,handName,HeadsUpGame};
});
