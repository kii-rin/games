import * as THREE from 'three';
import {createGame,clamp,CATCH_Y} from './engine.mjs';

// Owns the WebGL scene and simulation. Svelte owns all DOM, screens and HUD.
export function createDonutScene(canvas,art,callbacks={}) {
 const game=createGame(),s=game.state;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const abort=new AbortController(),listenerOptions={signal:abort.signal};
 const textures=new Set(),materials=new Set(),geometries=new Set(),keys=new Set();
 const visuals=new Map(),pools=Array.from({length:5},()=>[]),effects=[],particles=[];
 let scene,camera,renderer,catcher,basket,leftHand,rightHand,ready=false,disposed=false,failed=false;
 let frameId=0,last=0,bounce=0,best=0,popupId=0,lastSnapshot='',resizeObserver;
 const itemMaps=[];
 try{best=Math.max(0,Number.parseInt(localStorage.getItem('flowerpunch.donutCatcher.best')||'0',10)||0);}catch{}

 function emit(){
  if(disposed)return;
  const snapshot={phase:s.phase,score:s.score,time:Math.ceil(s.time),level:s.level,best,caught:s.caught,turtles:s.turtles};
  const key=JSON.stringify(snapshot);if(key===lastSnapshot)return;lastSnapshot=key;callbacks.onChange?.(snapshot);
 }
 function fail(message,error){
  if(disposed||failed)return;failed=true;ready=false;s.phase='error';cancelAnimationFrame(frameId);frameId=0;
  console.error(error);emit();callbacks.onError?.(message);
 }
 async function texture(src){
  const image=new Image();image.src=src;await image.decode();
  const map=new THREE.Texture(image);map.colorSpace=THREE.SRGBColorSpace;map.needsUpdate=true;
  if(disposed||failed){map.dispose();return null;}
  textures.add(map);return map;
 }
 function sprite(map,size,parent=scene,order=2){
  const material=new THREE.SpriteMaterial({map,transparent:true,depthWrite:false,depthTest:false,toneMapped:false});materials.add(material);
  const mesh=new THREE.Sprite(material);mesh.scale.set(size,size,1);mesh.renderOrder=order;parent.add(mesh);return mesh;
 }
 function take(o){
  const pool=o.type==='turtle'?4:o.variant;
  let v=pools[pool].pop();
  if(!v)v=sprite(itemMaps[pool],1);
  v.userData.pool=pool;v.userData.base=o.type==='turtle'?1.43:1.26;
  v.material.opacity=1;v.material.rotation=0;v.scale.setScalar(v.userData.base);v.position.set(o.x,o.y,0);
  scene.add(v);visuals.set(o.id,v);return v;
 }
 function recycle(v){scene.remove(v);v.material.opacity=1;pools[v.userData.pool].push(v);}
 function release(o){const v=visuals.get(o.id);if(v){visuals.delete(o.id);recycle(v);}}
 function celebrate(o,delta){
  const v=visuals.get(o.id);if(!v)return;visuals.delete(o.id);
  if(reduced)recycle(v);else effects.push({mesh:v,age:0,duration:delta>0?.2:.43,delta,x:o.x,y:CATCH_Y,sign:o.x<s.x?-1:1});
  bounce=1;
  const p=new THREE.Vector3(o.x,CATCH_Y,0).project(camera);
  callbacks.onCatch?.({id:popupId++,delta,x:(p.x*.5+.5)*100,y:(-.5*p.y+.5)*100});
  if(reduced)return;
  for(let i=0;i<7;i++){
   const color=delta<0?0x9bd980:[0xff6ca6,0xffe18a,0xffffff,0x65d9ee][i%4];
   let geo=confettiGeometry;if(!geo){geo=new THREE.PlaneGeometry(.055,.13);geometries.add(geo);confettiGeometry=geo;}
   let mat=confettiMaterials.get(color);if(!mat){mat=new THREE.MeshBasicMaterial({color,depthWrite:false,depthTest:false});materials.add(mat);confettiMaterials.set(color,mat);}
   const mesh=new THREE.Mesh(geo,mat);mesh.position.set(o.x,CATCH_Y,.2);mesh.rotation.z=Math.random()*6.28;mesh.renderOrder=8;scene.add(mesh);
   particles.push({mesh,vx:(Math.random()-.5)*3.4,vy:Math.random()*2.4+1,age:0});
  }
 }
 let confettiGeometry;const confettiMaterials=new Map();
 function clear(){
  for(const v of visuals.values())recycle(v);visuals.clear();
  effects.splice(0).forEach(e=>recycle(e.mesh));particles.splice(0).forEach(p=>scene.remove(p.mesh));
 }
 function start(){
  if(!ready||disposed)return;clear();game.start();bounce=0;keys.clear();catcher.position.x=0;emit();last=0;schedule();
 }
 function pause(){keys.clear();if(s.phase==='playing'){s.phase='paused';emit();}}
 function resume(){if(s.phase==='paused'&&ready){s.phase='playing';emit();last=0;schedule();}}
 function finish(){best=Math.max(best,s.score);try{localStorage.setItem('flowerpunch.donutCatcher.best',String(best));}catch{}emit();}
 function resize(){
  if(!renderer||!camera||disposed)return;
  const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;
  const ratio=w/h,halfHeight=ratio<.75?8:6,center=ratio<.75?6.1:5.0;
  camera.left=-halfHeight*ratio;camera.right=halfHeight*ratio;camera.top=halfHeight;camera.bottom=-halfHeight;
  camera.position.set(0,center,20);camera.lookAt(0,center,0);camera.updateProjectionMatrix();
  renderer.setSize(w,h,false);s.halfWidth=Math.min(6.7,camera.right);
  s.x=clamp(s.x,-s.halfWidth+1.05,s.halfWidth-1.05);s.targetX=clamp(s.targetX,-s.halfWidth+1.05,s.halfWidth-1.05);
  if(catcher)catcher.position.x=s.x;
  renderer.render(scene,camera);
 }
 function pointer(e){
  if(!ready||s.phase!=='playing')return;
  const rect=canvas.getBoundingClientRect();s.targetX=((e.clientX-rect.left)/rect.width*2-1)*camera.right;
 }
 function schedule(){if(!frameId&&!disposed&&ready&&!document.hidden)frameId=requestAnimationFrame(frame);}
 function frame(now){
  frameId=0;if(disposed||!ready)return;
  const dt=last?Math.min((now-last)/1000,.1):0;last=now;
  const active=s.phase==='playing';
  if(active){
   const direction=(keys.has('arrowright')||keys.has('d')?1:0)-(keys.has('arrowleft')||keys.has('a')?1:0);
   let remaining=dt;
   while(remaining>0&&s.phase==='playing'){
    const step=Math.min(1/60,remaining);remaining-=step;
    for(const event of game.update(step,direction)){
     if(event.type==='spawn')take(event.object);
     else if(event.type==='miss')release(event.object);
     else if(event.type==='catch')celebrate(event.object,event.delta);
     else if(event.type==='level')callbacks.onLevel?.(event.level);
     else if(event.type==='end')finish();
    }
   }
   emit();
  }
  if(s.phase!=='paused'){
   const movement=s.x-catcher.position.x;catcher.position.x=s.x;
   bounce=Math.max(0,bounce-dt*4);
   const bump=reduced?0:Math.sin(bounce*Math.PI)*.09;
   basket.position.y=.65+bump;basket.scale.set(3+(reduced?0:bounce*.06),3-(reduced?0:bounce*.06),1);
   if(!reduced){
    const tilt=clamp(-movement*.19,-.075,.075);
    basket.material.rotation=THREE.MathUtils.damp(basket.material.rotation,tilt,12,dt);
    leftHand.position.y=.31+bump*.75;rightHand.position.y=.31+bump*.75;
    leftHand.material.rotation=tilt+Math.sin(bounce*Math.PI)*.035;rightHand.material.rotation=tilt-Math.sin(bounce*Math.PI)*.035;
   }
   for(const o of s.objects){
    const v=visuals.get(o.id);if(!v)continue;v.position.set(o.x,o.y,0);
    const turn=o.type==='turtle'?.11:.22;
    v.material.rotation=reduced?0:Math.sin(s.elapsed*1.8+o.rotation)*turn;
   }
   for(let i=effects.length-1;i>=0;i--){
    const e=effects[i];e.age+=dt;const t=Math.min(1,e.age/e.duration);
    if(e.delta>0){e.mesh.position.y=e.y-t*.5;const scale=e.mesh.userData.base*(1-t*.6);e.mesh.scale.set(scale,scale,1);}
    else{e.mesh.position.x=e.x+t*e.sign*.9;e.mesh.position.y=e.y+Math.sin(t*Math.PI)*.75;e.mesh.material.rotation=e.sign*t*.6;}
    e.mesh.material.opacity=1-t;
    if(t===1){recycle(e.mesh);effects.splice(i,1);}
   }
   for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.age+=dt;p.vy-=5*dt;p.mesh.position.x+=p.vx*dt;p.mesh.position.y+=p.vy*dt;p.mesh.rotation.z+=dt*3;p.mesh.scale.setScalar(Math.max(0,1-p.age/.65));if(p.age>=.65){scene.remove(p.mesh);particles.splice(i,1);}}
  }
  renderer.render(scene,camera);
  if(s.phase==='playing'||(s.phase!=='paused'&&(effects.length||particles.length)))schedule();
 }
 function input(){
  canvas.addEventListener('pointerdown',e=>{pointer(e);canvas.setPointerCapture(e.pointerId);},listenerOptions);
  canvas.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'||canvas.hasPointerCapture(e.pointerId))pointer(e);},listenerOptions);
  canvas.addEventListener('pointerup',e=>{if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);},listenerOptions);
  window.addEventListener('keydown',e=>{
   if(e.target instanceof HTMLButtonElement||e.target instanceof HTMLAnchorElement)return;
   const key=e.key.toLowerCase();
   if(['arrowleft','arrowright','a','d'].includes(key)){keys.add(key);e.preventDefault();}
   if(e.code==='Space'&&ready){e.preventDefault();if(s.phase==='ready'||s.phase==='over')start();else if(s.phase==='paused')resume();}
  },listenerOptions);
  window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()),listenerOptions);
  window.addEventListener('blur',pause,listenerOptions);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();cancelAnimationFrame(frameId);frameId=0;}else{last=0;schedule();}},listenerOptions);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fail('The graphics connection was interrupted. Reload to start a fresh round.',new Error('WebGL context lost'));},listenerOptions);
 }
 async function init(){
  try{
   renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
   renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.65));renderer.outputColorSpace=THREE.SRGBColorSpace;
   renderer.setClearColor(0x000000,0);scene=new THREE.Scene();camera=new THREE.OrthographicCamera(-7,7,6,-6,.1,50);
  }catch(error){fail('This game needs WebGL 2. Try a current browser with graphics acceleration enabled.',error);return;}
  try{
   const maps=await Promise.all([...art.donuts,art.turtle,art.basket,art.handLeft,art.handRight].map(texture));
   if(disposed||failed)return;
   itemMaps.push(...maps.slice(0,5));catcher=new THREE.Group();scene.add(catcher);
   leftHand=sprite(maps[6],2.38,catcher,4);leftHand.position.set(-1.62,.31,.05);
   rightHand=sprite(maps[7],2.38,catcher,4);rightHand.position.set(1.62,.31,.05);
   basket=sprite(maps[5],3,catcher,6);basket.position.set(0,.65,.1);
   input();resizeObserver=new ResizeObserver(resize);resizeObserver.observe(canvas);
   resize();ready=true;s.phase='ready';emit();callbacks.onReady?.();
  }catch(error){fail('One of the game images could not load. Please reload to try again.',error);}
 }
 function destroy(){
  if(disposed)return;disposed=true;ready=false;abort.abort();resizeObserver?.disconnect();cancelAnimationFrame(frameId);
  textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());
  renderer?.dispose();scene?.clear();visuals.clear();effects.length=particles.length=0;pools.forEach(p=>p.length=0);
 }
 init();return{start,pause,resume,destroy};
}
