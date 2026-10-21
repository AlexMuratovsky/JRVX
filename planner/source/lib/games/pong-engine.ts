export const PONG={width:800,height:480,paddleHeight:86,paddleWidth:12,left:28,right:760,radius:7,baseSpeed:330,maxSpeed:690,playerSpeed:620,winScore:7};
export const difficulties={easy:{label:"Легко",speed:195,reaction:.36,error:92,prediction:0},normal:{label:"Нормально",speed:285,reaction:.22,error:57,prediction:.55},hard:{label:"Сложно",speed:375,reaction:.14,error:34,prediction:.9}};
export type Difficulty=keyof typeof difficulties;
export type PongState={phase:"ready"|"playing"|"paused"|"finished",difficulty:Difficulty,playerY:number,aiY:number,playerScore:number,aiScore:number,ball:{x:number,y:number,vx:number,vy:number,speed:number},wait:number,aiTimer:number,aiTarget:number,winner:"player"|"ai"|null};
export type PongInput={direction:number,target:number|null};
export const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
export function newMatch(difficulty:Difficulty="normal"):PongState{return {phase:"ready",difficulty,playerY:240,aiY:240,playerScore:0,aiScore:0,ball:{x:400,y:240,vx:0,vy:0,speed:PONG.baseSpeed},wait:0,aiTimer:0,aiTarget:240,winner:null};}
function serve(s:PongState,direction:number,random:()=>number){const angle=(random()-.5)*.8;s.ball={x:400,y:240,vx:Math.cos(angle)*PONG.baseSpeed*direction,vy:Math.sin(angle)*PONG.baseSpeed,speed:PONG.baseSpeed};s.wait=1;s.aiTimer=0;}
export function startMatch(s:PongState,random=Math.random){s.phase="playing";serve(s,random()<.5?-1:1,random);}
export function pauseMatch(s:PongState){if(s.phase==="playing")s.phase="paused";}
export function resumeMatch(s:PongState){if(s.phase==="paused")s.phase="playing";}
function reflect(y:number){const span=PONG.height-2*PONG.radius,fold=((y-PONG.radius)%(2*span)+2*span)%(2*span);return PONG.radius+(fold<=span?fold:2*span-fold);}
function rebound(s:PongState,paddleY:number,direction:number){const b=s.ball,hit=clamp((b.y-paddleY)/(PONG.paddleHeight/2),-1,1),angle=hit*Math.PI/3;b.speed=Math.min(PONG.maxSpeed,b.speed*1.065);b.vx=Math.cos(angle)*b.speed*direction;b.vy=Math.sin(angle)*b.speed;b.x=direction>0?PONG.left+PONG.paddleWidth+PONG.radius:PONG.right-PONG.radius;}
function point(s:PongState,player:boolean,random:()=>number){if(player)s.playerScore++;else s.aiScore++;if(s.playerScore>=PONG.winScore||s.aiScore>=PONG.winScore){s.phase="finished";s.winner=player?"player":"ai";s.ball.vx=0;s.ball.vy=0;s.wait=0;return;}serve(s,player?1:-1,random);}
/** Fixed-size substeps avoid tunnelling. State mutates in the animation loop, outside React. */
export function advancePong(s:PongState,seconds:number,input:PongInput,random=Math.random){if(s.phase!=="playing"||seconds<=0)return;const dt=Math.min(seconds,.05),steps=Math.ceil(dt/(1/180)),h=dt/steps,half=PONG.paddleHeight/2;
  for(let i=0;i<steps&&s.phase==="playing";i++){
    const target=input.target,delta=target===null?input.direction*PONG.playerSpeed*h:clamp(target-s.playerY,-PONG.playerSpeed*h,PONG.playerSpeed*h);s.playerY=clamp(s.playerY+delta,half,PONG.height-half);
    const d=difficulties[s.difficulty],b=s.ball;s.aiTimer-=h;if(s.aiTimer<=0){const predicted=b.vx>0?reflect(b.y+b.vy*Math.max(0,(PONG.right-b.x)/b.vx)*d.prediction):PONG.height/2;s.aiTarget=clamp(predicted+(random()-.5)*2*d.error,half,PONG.height-half);s.aiTimer=d.reaction;}
    s.aiY=clamp(s.aiY+clamp(s.aiTarget-s.aiY,-d.speed*h,d.speed*h),half,PONG.height-half);
    if(s.wait>0){s.wait=Math.max(0,s.wait-h);continue;}
    const oldX=b.x;b.x+=b.vx*h;b.y+=b.vy*h;if(b.y<PONG.radius){b.y=2*PONG.radius-b.y;b.vy=Math.abs(b.vy);}else if(b.y>PONG.height-PONG.radius){b.y=2*(PONG.height-PONG.radius)-b.y;b.vy=-Math.abs(b.vy);}
    const leftFace=PONG.left+PONG.paddleWidth;if(b.vx<0&&oldX-PONG.radius>=leftFace&&b.x-PONG.radius<=leftFace&&Math.abs(b.y-s.playerY)<=half+PONG.radius)rebound(s,s.playerY,1);
    else if(b.vx>0&&oldX+PONG.radius<=PONG.right&&b.x+PONG.radius>=PONG.right&&Math.abs(b.y-s.aiY)<=half+PONG.radius)rebound(s,s.aiY,-1);
    if(b.x<-PONG.radius)point(s,false,random);else if(b.x>PONG.width+PONG.radius)point(s,true,random);
  }
}
