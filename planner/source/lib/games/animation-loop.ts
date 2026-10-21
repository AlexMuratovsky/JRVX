/** One owned animation loop, stopped when paused or unmounted. */
export function createFrameLoop(step:(seconds:number)=>boolean,scheduler={request:(fn:FrameRequestCallback)=>requestAnimationFrame(fn),cancel:(id:number)=>cancelAnimationFrame(id)}){
  let running=false,frame:number|null=null,previous:number|null=null;
  const tick=(time:number)=>{frame=null;if(!running)return;const elapsed=previous===null?0:Math.min(.05,Math.max(0,(time-previous)/1000));previous=time;const again=step(elapsed);if(again&&running)frame=scheduler.request(tick);else{running=false;previous=null;}};
  return {start(){if(running)return;running=true;previous=null;frame=scheduler.request(tick);},stop(){running=false;previous=null;if(frame!==null)scheduler.cancel(frame);frame=null;}};
}
