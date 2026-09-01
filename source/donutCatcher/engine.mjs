export const ROUND_SECONDS = 60;
export const CATCH_Y = 1.65;
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export function createGame(random = Math.random) {
  const state = {phase:'ready',score:0,caught:0,turtles:0,level:1,time:ROUND_SECONDS,
    x:0,targetX:0,halfWidth:6,objects:[],spawn:0,elapsed:0,nextId:0};
  function start() {
    Object.assign(state,{phase:'playing',score:0,caught:0,turtles:0,level:1,time:ROUND_SECONDS,
      x:0,targetX:0,objects:[],spawn:0.4,elapsed:0,nextId:0});
  }
  function update(dt, direction = 0) {
    const events=[];
    if(state.phase!=='playing' || !Number.isFinite(dt) || dt<=0) return events;
    dt=Math.min(dt,state.time);
    const oldX=state.x;
    if(direction) state.targetX=state.x+direction*10*dt;
    state.targetX=clamp(state.targetX,-state.halfWidth+1.05,state.halfWidth-1.05);
    state.x=direction ? state.targetX : state.x+(state.targetX-state.x)*(1-Math.exp(-22*dt));
    state.elapsed+=dt;state.time=Math.max(0,state.time-dt);state.spawn-=dt;
    while(state.spawn<=0) {
      const type=random()<0.23?'turtle':'donut';
      const object={id:state.nextId++,type,x:(random()*2-1)*(state.halfWidth-0.8),
        y:10.8,speed:2.65+Math.min(state.level-1,8)*0.22+random()*0.7,
        variant:Math.floor(random()*4),rotation:random()*6.28};
      state.objects.push(object);events.push({type:'spawn',object});
      state.spawn+=Math.max(0.42,0.79-(state.level-1)*0.035);
    }
    for(let i=state.objects.length-1;i>=0;i--) {
      const o=state.objects[i], oldY=o.y;
      o.y-=o.speed*dt;
      if(oldY>=CATCH_Y && o.y<=CATCH_Y) {
        const fraction=(oldY-CATCH_Y)/(oldY-o.y);
        const catcherX=oldX+(state.x-oldX)*fraction;
        if(Math.abs(o.x-catcherX)<1.04) {
          state.score+=o.type==='donut'?1:-1;
          if(o.type==='donut')state.caught++;else state.turtles++;
          const nextLevel=1+Math.floor(state.caught/10);
          if(nextLevel>state.level){state.level=nextLevel;events.push({type:'level',level:nextLevel});}
          state.objects.splice(i,1);events.push({type:'catch',object:o,delta:o.type==='donut'?1:-1});continue;
        }
      }
      if(o.y<-1){state.objects.splice(i,1);events.push({type:'miss',object:o});}
    }
    if(state.time===0){state.phase='over';events.push({type:'end'});}
    return events;
  }
  return {state,start,update};
}
