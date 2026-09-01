import * as THREE from 'three';
import {createGame,clamp,CATCH_Y} from './engine.mjs';

const $=id=>document.getElementById(id);
const canvas=$('scene'),game=createGame(),s=game.state;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer,scene,camera,turtleTexture,frameId,last=0,ready=false,best=0;
let player,head,eyes,basket,shadow,catchBounce=0,flash=0,toastTimer,shownScore=-999,shownSeconds=-1,shownUrgent=false;
const keys=new Set(),visuals=new Map(),pools=Array.from({length:6},()=>[]),particles=[];
const friends=[['Peanut the Hamster',0xeab477],['Mochi the Bunny',0xfff6f4],['Pip the Chick',0xffdb72],['Berry the Kitten',0xc6a0ec],['Star the Pup',0xe8a173]];
const donutColors=[0xff639f,0x73d7ef,0xae91ea,0xffd273,0x87513c];
const prototypes=[],decorations=[],clouds=[];
const sphere=new THREE.SphereGeometry(1,24,16),box=new THREE.BoxGeometry(1,1,1);
const mats=new Map();
const material=(color,roughness=.38)=>{
 const key=`${color}:${roughness}`;
 if(!mats.has(key))mats.set(key,new THREE.MeshStandardMaterial({color,roughness,metalness:0}));
 return mats.get(key);
};
function mesh(geo,mat,parent,x=0,y=0,z=0,sx=1,sy=sx,sz=sx){
 const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;
}
function ball(parent,color,x,y,z,sx,sy=sx,sz=sx){return mesh(sphere,material(color),parent,x,y,z,sx,sy,sz);}
function tube(parent,points,r,color){
 const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
 return mesh(new THREE.TubeGeometry(curve,Math.max(8,points.length*5),r,7,false),material(color),parent);
}
function ring(parent,r,t,color,x,y,z,sx=1,sy=1,sz=1){
 return mesh(new THREE.TorusGeometry(r,t,10,56),material(color),parent,x,y,z,sx,sy,sz);
}
function makeFrosting(){
 const p=[],uv=[],idx=[],n=64,m=16,R=.36,r=.187;
 for(let i=0;i<=n;i++){
  const u=i/n*Math.PI*2;
  for(let j=0;j<=m;j++){
   const t=j/m,drip=.09+Math.pow(.5+.5*Math.sin(u*7+Math.cos(u*3)),4)*.28;
   const v=-drip+(Math.PI+drip+.04)*t;
   p.push((R+r*Math.cos(v))*Math.cos(u),(R+r*Math.cos(v))*Math.sin(u),r*Math.sin(v)+.014);
   uv.push(i/n,t);
   if(i<n&&j<m){const a=i*(m+1)+j,b=a+m+1;idx.push(a,b,a+1,b,b+1,a+1);}
  }
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
function makeDonuts(){
 const dough=new THREE.TorusGeometry(.36,.175,18,56),frost=makeFrosting();
 const sprinkleGeometry=new THREE.CapsuleGeometry(.018,.073,3,5);
 const matrix=new THREE.Object3D();
 for(let v=0;v<5;v++){
  const g=new THREE.Group();
  mesh(dough,material(0xe6a05a,.65),g);
  mesh(frost,material(donutColors[v],.23),g);
  const sprinkles=new THREE.InstancedMesh(sprinkleGeometry,material(0xffffff,.28),22);
  for(let i=0;i<22;i++){
   const u=i*2.39996+v,vv=.52+(Math.sin(i*5.6)*.5+.5)*1.9;
   matrix.position.set((.36+.19*Math.cos(vv))*Math.cos(u),(.36+.19*Math.cos(vv))*Math.sin(u),.19*Math.sin(vv)+.043);
   matrix.rotation.set(Math.cos(u)*.25,Math.sin(u)*.25,i*1.7);matrix.updateMatrix();
   sprinkles.setMatrixAt(i,matrix.matrix);sprinkles.setColorAt(i,new THREE.Color([0xffefaa,0xffffff,0x7cd5d8,0xea75b6,0xba97f0][i%5]));
  }
  sprinkles.instanceMatrix.needsUpdate=true;g.add(sprinkles);prototypes.push(g);
 }
}
function clothTexture(){
 const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');
 ctx.fillStyle='#ffe0e5';ctx.fillRect(0,0,128,128);ctx.fillStyle='#f794b0';ctx.fillRect(0,0,64,128);ctx.fillRect(0,0,128,64);
 ctx.fillStyle='#ef719a';ctx.fillRect(0,0,64,64);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(6,2);return t;
}
function makePlayer(){
 player=new THREE.Group();scene.add(player);
 head=new THREE.Group();player.add(head);head.position.set(0,1.9,-.38);
 ball(head,0xeab477,0,0,0,.65,.6,.46).name='fur';
 for(const side of [-1,1]){
  const ear=ball(head,0xeab477,side*.44,.48,-.04,.2,.25,.13);ear.name='ear';
  ball(ear,0xf7afad,0,.08,.65,.55,.55,.4);
  ball(head,0xffded0,side*.29,-.11,.395,.15,.09,.035);
 }
 eyes=new THREE.Group();head.add(eyes);
 for(const side of [-1,1]){
  ball(eyes,0x3f272b,side*.235,.025,.445,.07,.094,.04);
  ball(eyes,0xffffff,side*.235-.02,.06,.483,.024);
 }
 ball(head,0xf67f9c,0,-.12,.475,.059,.045,.03);
 tube(head,[[-.1,-.21,.435],[-.05,-.245,.447],[0,-.21,.47],[.05,-.245,.447],[.1,-.21,.435]],.014,0x794850);
 basket=new THREE.Group();player.add(basket);basket.position.y=.65;
 const points=[new THREE.Vector2(.01,0),new THREE.Vector2(.67,0),new THREE.Vector2(.75,.06),new THREE.Vector2(.84,.3),new THREE.Vector2(.94,.75),new THREE.Vector2(.99,.88),new THREE.Vector2(.88,.88),new THREE.Vector2(.79,.25),new THREE.Vector2(.01,.22)];
 const body=mesh(new THREE.LatheGeometry(points,48),material(0xca8b4b,.64),basket);body.scale.z=.64;
 for(let i=0;i<7;i++){
  const r=.72+i*.038,y=.1+i*.11;
  const row=ring(basket,r,.025,i%2?0xe4ab62:0xa96d38,0,y,0,1,1,.64);row.rotation.x=Math.PI/2;row.scale.set(1,.64,1);
 }
 for(let i=0;i<24;i++){
  const a=i/24*Math.PI*2;
  tube(basket,[[Math.cos(a)*.7,.05,Math.sin(a)*.7*.64],[Math.cos(a)*.82,.43,Math.sin(a)*.82*.64],[Math.cos(a)*.98,.86,Math.sin(a)*.98*.64]],.018,0xe5ac65);
 }
 const rim=ring(basket,.99,.078,0xf5bbcd,0,.87,0);rim.rotation.x=Math.PI/2;rim.scale.y=.64;
 // Scalloped gingham lining wraps the open basket lip.
 const pos=[],uv=[],indices=[],N=80;
 for(let i=0;i<=N;i++){
  const a=i/N*Math.PI*2;
  for(let j=0;j<2;j++){
   const y=j===0?.86:.65-.08*Math.sin(a*10);
   pos.push(Math.cos(a)*1.018,y,Math.sin(a)*.655);uv.push(i/N,j);
  }
  if(i<N){const q=i*2;indices.push(q,q+2,q+1,q+2,q+3,q+1);}
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
 mesh(geo,new THREE.MeshStandardMaterial({map:clothTexture(),roughness:.9,side:THREE.DoubleSide}),basket);
 for(const side of [-1,1])ball(player,0xeab477,side*.93,1.4,.12,.18,.22,.18).name='paw';
 const c=document.createElement('canvas');c.width=c.height=64;const cx=c.getContext('2d'),grad=cx.createRadialGradient(32,32,0,32,32,32);
 grad.addColorStop(0,'rgba(99,51,68,.28)');grad.addColorStop(1,'rgba(99,51,68,0)');cx.fillStyle=grad;cx.fillRect(0,0,64,64);
 shadow=new THREE.Mesh(new THREE.PlaneGeometry(3,1),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false}));
 shadow.position.set(0,.45,.04);scene.add(shadow);
}
function setFriend(level){
 const idx=Math.min(4,level-1),[name,color]=friends[idx];$('friend-name').textContent=name;$('level').textContent=String(level).padStart(2,'0');
 head.children.forEach(o=>{if(o.name==='fur'||o.name==='ear')o.material=material(color);if(o.name==='ear'){
  o.scale.set(.2,idx===1?.49:idx===3?.27:.25,.13);o.position.y=idx===1?.64:.48;
 }});
 player.children.filter(o=>o.name==='paw').forEach(o=>o.material=material(color));
}
function makeBakery(x,base,roof){
 const g=new THREE.Group();g.position.set(x,-.35,-5);scene.add(g);
 mesh(box,material(base,.9),g,0,2.4,0,3.7,4.8,2.8);
 mesh(box,material(0xfff2d6,.9),g,0,4.8,0,4.1,.24,3);
 const dome=ball(g,roof,0,4.7,0,2.2,1.15,1.7);dome.material=material(roof,.56);
 for(let i=-1;i<=1;i++){
  mesh(box,material(0xc57b6d),g,i*1.15,2.8,1.44,.82,1.85,.06);
  mesh(box,material(0x9bb7ca,.4),g,i*1.15,2.86,1.49,.64,1.55,.05);
  mesh(box,material(0xffe1c4),g,i*1.15,2.85,1.56,.055,1.66,.06);
 }
 for(let i=0;i<10;i++){
  const awning=mesh(box,material(i%2?0xfff0d6:roof,.65),g,-1.8+i*.4,2.18,1.96,.4,.13,1.24);awning.rotation.x=.25;
  ball(g,i%2?0xfff0d6:roof,-1.8+i*.4,1.95,2.53,.205,.18,.09);
 }
 mesh(box,material(0xffe4c6),g,0,.43,1.65,4,.25,.48);
 const mini=prototypes[0].clone();mini.position.set(0,4.85,1.63);mini.scale.setScalar(1.1);g.add(mini);
}
function environment(){
 const ground=mesh(new THREE.PlaneGeometry(90,65),material(0xf6d6bf,.9),scene,0,-.08,-12);ground.rotation.x=-Math.PI/2;
 // Low distant scenery leaves the middle of the catching lane clear.
 makeBakery(-8.2,0xffddb0,0xf8a3ba);makeBakery(8.2,0xffcdd5,0xdca1d5);
 makeBakery(-12.6,0xffe7c0,0xf3c37d);makeBakery(12.6,0xe2e4ff,0xaab5dd);
 for(let i=0;i<8;i++){
  const g=new THREE.Group();g.position.set((i-3.5)*4.5,6.2+(i%3)*1.4,-10-i%2*3);
  for(let j=0;j<3;j++)ball(g,0xfffcf3,(j-1)*.7,j===1?.2:0,0,.74,j===1?.55:.35,.5);
  scene.add(g);clouds.push(g);
 }
 for(let i=0;i<5;i++){
  const g=prototypes[i].clone();g.position.set((i-2)*3.6,6.8+(i%2)*1.7,-8);g.scale.setScalar(.65);g.rotation.set(.35,0,i);scene.add(g);decorations.push(g);
 }
}
function takeVisual(object){
 const index=object.type==='turtle'?5:object.variant;
 let v=pools[index].pop();
 if(!v){
  v=object.type==='turtle'?new THREE.Sprite(new THREE.SpriteMaterial({map:turtleTexture,transparent:true,depthWrite:false})):prototypes[index].clone();
 }
 v.userData.pool=index;v.position.set(object.x,object.y,.5);v.scale.setScalar(object.type==='turtle'?1.6:1.0);
 v.visible=true;scene.add(v);visuals.set(object.id,v);
}
function release(object){
 const v=visuals.get(object.id);if(!v)return;scene.remove(v);visuals.delete(object.id);pools[v.userData.pool].push(v);
}
const particleGeo=new THREE.IcosahedronGeometry(.06,0);
function burst(x,y,bad){
 if(reduced)return;
 for(let i=0;i<9;i++){
  const m=new THREE.Mesh(particleGeo,material(bad?0x8ecea6:[0xffc86b,0xff79a7,0xffffff][i%3]));
  m.position.set(x,y,.85);scene.add(m);particles.push({mesh:m,vx:(Math.random()-.5)*3.8,vy:Math.random()*2.8+1,life:.65});
 }
}
function floatingScore(object,delta){
 const p=new THREE.Vector3(object.x,CATCH_Y,.6).project(camera),div=document.createElement('span');
 div.className='float-score'+(delta<0?' bad':'');div.textContent=delta>0?'+1':'−1';div.style.left=(p.x*.5+.5)*canvas.clientWidth+'px';div.style.top=(-p.y*.5+.5)*canvas.clientHeight+'px';
 $('feedback').append(div);setTimeout(()=>div.remove(),900);
}
function updateHUD(){
 const seconds=Math.ceil(s.time),urgent=s.time<=10&&s.phase==='playing';
 if(shownScore!==s.score){shownScore=s.score;$('score').textContent=s.score;}
 if(shownSeconds!==seconds){shownSeconds=seconds;$('time').innerHTML=seconds+'<span>s</span>';}
 if(shownUrgent!==urgent){shownUrgent=urgent;$('time').parentElement.classList.toggle('urgent',urgent);}
}
function toast(text){clearTimeout(toastTimer);$('level-toast').textContent=text;$('level-toast').classList.add('show');toastTimer=setTimeout(()=>$('level-toast').classList.remove('show'),2200);}
function clearRound(){
 for(const [id,v] of visuals){scene.remove(v);pools[v.userData.pool].push(v);}visuals.clear();
 particles.splice(0).forEach(p=>scene.remove(p.mesh));$('feedback').replaceChildren();$('level-toast').classList.remove('show');clearTimeout(toastTimer);
}
function start(){
 if(!ready)return;clearRound();game.start();setFriend(1);catchBounce=flash=0;keys.clear();
 $('welcome').hidden=true;$('result').hidden=true;$('resume-panel').hidden=true;updateHUD();canvas.focus({preventScroll:true});last=0;
}
function finish(){
 best=Math.max(best,s.score);try{localStorage.setItem('flowerpunch.donutCatcher.best',String(best));}catch{}
 $('best').textContent=best;$('final-score').textContent=s.score;
 $('summary').textContent=`${s.caught} donut${s.caught===1?'':'s'} caught · ${s.turtles} turtle${s.turtles===1?'':'s'} scooped`;
 $('best-result').textContent=`Your best batch: ${best}`;$('result').hidden=false;$('again').focus({preventScroll:true});
}
function pause(){keys.clear();if(s.phase==='playing'){s.phase='paused';$('resume-panel').hidden=false;}}
function resume(){if(s.phase==='paused'){s.phase='playing';$('resume-panel').hidden=true;last=0;canvas.focus({preventScroll:true});}}
function resize(){
 const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;
 const ratio=w/h,halfH=ratio<.7?8:6;
 camera.left=-halfH*ratio;camera.right=halfH*ratio;camera.top=halfH;camera.bottom=-halfH;
 const center=ratio<.7?6.2:5.1;
 camera.position.set(0,center+3.2,24);camera.lookAt(0,center,0);camera.updateProjectionMatrix();
 renderer.setSize(w,h,false);
 s.halfWidth=Math.min(6.7,camera.right);s.x=clamp(s.x,-s.halfWidth+1.05,s.halfWidth-1.05);s.targetX=clamp(s.targetX,-s.halfWidth+1.05,s.halfWidth-1.05);
}
function pointer(e){if(!ready||s.phase!=='playing')return;const rect=canvas.getBoundingClientRect();s.targetX=((e.clientX-rect.left)/rect.width*2-1)*camera.right;}
canvas.addEventListener('pointerdown',e=>{pointer(e);canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'||canvas.hasPointerCapture(e.pointerId))pointer(e);});
canvas.addEventListener('pointerup',e=>{if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);});
window.addEventListener('keydown',e=>{
 if(e.target instanceof HTMLButtonElement||e.target instanceof HTMLAnchorElement)return;
 const key=e.key.toLowerCase();if(['arrowleft','arrowright','a','d'].includes(key)){keys.add(key);e.preventDefault();}
 if(e.code==='Space'&&ready){e.preventDefault();if(s.phase==='ready'||s.phase==='over')start();else if(s.phase==='paused')resume();}
});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',pause);
document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();cancelAnimationFrame(frameId);frameId=0;}else if(ready&&!frameId){last=0;frameId=requestAnimationFrame(frame);}});
window.addEventListener('resize',()=>{if(ready)resize();});
$('start').addEventListener('click',start);$('again').addEventListener('click',start);$('resume').addEventListener('click',resume);$('reload').addEventListener('click',()=>location.reload());
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();pause();cancelAnimationFrame(frameId);showError('The graphics connection was interrupted. Reload to start a fresh round.');});
function showError(message){ready=false;$('welcome').hidden=true;$('result').hidden=true;$('resume-panel').hidden=true;$('error').hidden=false;$('error-message').textContent=message;}
function frame(now){
 frameId=requestAnimationFrame(frame);if(!ready)return;
 const dt=last?Math.min((now-last)/1000,.1):0;last=now;
 if(s.phase==='playing'){
  const direction=(keys.has('arrowright')||keys.has('d')?1:0)-(keys.has('arrowleft')||keys.has('a')?1:0);
  // Fixed-size substeps make collisions independent of refresh rate.
  let remaining=dt;
  while(remaining>0){
   const step=Math.min(remaining,1/60);remaining-=step;
   for(const event of game.update(step,direction)){
    if(event.type==='spawn')takeVisual(event.object);
    if(event.type==='miss')release(event.object);
    if(event.type==='catch'){
     release(event.object);burst(event.object.x,CATCH_Y,event.delta<0);floatingScore(event.object,event.delta);catchBounce=1;flash=event.delta<0?1:0;
    }
    if(event.type==='level'){setFriend(event.level);toast(event.level<=5?`${friends[event.level-1][0]} is here!`:`Level ${event.level}`);}
    if(event.type==='end')finish();
   }
  }
  updateHUD();
 }
 const frozen=s.phase==='paused',motion=frozen?0:dt;
 if(!frozen){catchBounce=Math.max(0,catchBounce-motion*4);flash=Math.max(0,flash-motion*3);}
 const diff=s.x-player.position.x;player.position.x=s.x;
 player.rotation.z=reduced?0:THREE.MathUtils.damp(player.rotation.z,clamp(-diff*.25,-.09,.09),9,motion);
 player.position.y=reduced?0:Math.sin(catchBounce*Math.PI)*.12;
 basket.scale.set(1+(reduced?0:catchBounce*.035),1-(reduced?0:catchBounce*.06),1);
 head.rotation.z=reduced?0:Math.sin(now*.035)*flash*.1;
 const blink=!frozen&&now%4300>4170;eyes.scale.y=blink?.12:1;shadow.position.x=s.x;
 for(const o of s.objects){const v=visuals.get(o.id);if(!v)continue;v.position.set(o.x,o.y,.5);
  if(o.type==='donut'){v.rotation.set(reduced?.08:Math.sin(s.elapsed*1.3+o.id)*.3,.12,reduced?o.rotation:o.rotation+s.elapsed*.5);}
  else v.material.rotation=reduced?0:Math.sin(s.elapsed*2.4+o.id)*.16;
 }
 for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=motion;p.mesh.position.x+=p.vx*motion;p.mesh.position.y+=p.vy*motion;p.vy-=6*motion;p.mesh.scale.setScalar(Math.max(0,p.life/.65));if(p.life<=0){scene.remove(p.mesh);particles.splice(i,1);}}
 if(!reduced&&!frozen){decorations.forEach((g,i)=>{g.rotation.z+=dt*.12;});clouds.forEach((g,i)=>{g.position.x+=dt*.04*(i%2?1:-1);if(g.position.x>20)g.position.x=-20;if(g.position.x<-20)g.position.x=20;});}
 renderer.render(scene,camera);
}
async function init(){
 try{
  best=Number.parseInt(localStorage.getItem('flowerpunch.donutCatcher.best')||'0',10);if(!Number.isFinite(best))best=0;
 }catch{best=0;}$('best').textContent=best;
 try{
  renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.65));renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
  scene=new THREE.Scene();camera=new THREE.OrthographicCamera(-7,7,6,-6,.1,100);
  scene.add(new THREE.HemisphereLight(0xfffcf7,0xb699c6,2.5));
  const key=new THREE.DirectionalLight(0xfff5e4,3.2);key.position.set(-5,10,10);scene.add(key);
  const fill=new THREE.DirectionalLight(0xc1e5ff,1.7);fill.position.set(6,4,-3);scene.add(fill);
  const turtleImage=document.querySelector('.turtle-icon');
  await turtleImage.decode();turtleTexture=new THREE.Texture(turtleImage);turtleTexture.colorSpace=THREE.SRGBColorSpace;turtleTexture.needsUpdate=true;
  makeDonuts();makePlayer();environment();resize();renderer.render(scene,camera);
  ready=true;$('start').textContent='Let’s catch! ↗';$('start').disabled=false;
  frameId=requestAnimationFrame(frame);
 }catch(error){console.error(error);showError('This game needs WebGL 2. Try an up-to-date browser with graphics acceleration enabled.');}
}
init();
