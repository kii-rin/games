import * as THREE from 'three';

// Hide & Seek forest asset pass 01.
// No texture maps or external models. Build once, then clone prototypes so geometry/materials stay shared.
const C={leaf:0x4cb358,leafLight:0x6fcd60,leafDark:0x2f8547,leafBlue:0x439a67,trunk:0x855535,trunkLight:0xab7044,barkDark:0x663e2b,rock:0x9aa6b1,rockLight:0xbec9d3,rockDark:0x74808c,pink:0xf476a0,yellow:0xf4cb53,purple:0xa771e0,white:0xf7f4ec,red:0xe75b52,cream:0xf5dea9,hoodie:0x3b7dd5,hoodieDark:0x2e548c,skin:0xf4c961,hair:0x684029};
const mat=color=>new THREE.MeshLambertMaterial({color,flatShading:true});
export const createForestMaterials=()=>Object.fromEntries(Object.entries(C).map(([k,v])=>[k,mat(v)]));
const mesh=(geometry,material,x=0,y=0,z=0)=>{const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=false;m.receiveShadow=true;return m};
const ico=(material,radius,x,y,z,sx=1,sy=1,sz=1,detail=1)=>{const m=mesh(new THREE.IcosahedronGeometry(radius,detail),material,x,y,z);m.scale.set(sx,sy,sz);return m};
const cylinder=(material,rt,rb,h,segments,x,y,z)=>mesh(new THREE.CylinderGeometry(rt,rb,h,segments,1,false),material,x,y,z);
const box=(material,xs,ys,zs,x,y,z)=>mesh(new THREE.BoxGeometry(xs,ys,zs),material,x,y,z);
const group=(name,collider,hideAnchor)=>{const g=new THREE.Group();g.name=name;g.userData.assetId=name;if(collider)g.userData.collider=collider;if(hideAnchor)g.userData.hideAnchor=new THREE.Vector3(...hideAnchor);return g};

function oak(M){const g=group('tree_oak',{type:'cylinder',radius:.42,height:2.2},[0,0,-.72]);g.add(cylinder(M.trunk,.26,.30,2.15,7,0,1.075,0),ico(M.leafDark,.9,-.26,2.25,.05,1,.85,1),ico(M.leaf,.95,.33,2.35,.02,1,.9,1),ico(M.leafLight,.72,0,2.75,-.08,1,.85,1));return g}
function pine(M){const g=group('tree_pine',{type:'cylinder',radius:.38,height:2.2},[0,0,-.62]);g.add(cylinder(M.trunk,.22,.26,2.25,7,0,1.125,0));for(const [material,r,h,y] of [[M.leafDark,.95,1.15,1.55],[M.leaf,.78,1.05,2.1],[M.leafLight,.6,.92,2.6]])g.add(mesh(new THREE.ConeGeometry(r,h,7,1,false),material,0,y+h*.5,0));return g}
function bushRound(M){const g=group('bush_round',{type:'cylinder',radius:.75,height:1.15},[0,0,-.72]);g.add(ico(M.leafDark,.72,-.34,.55,0,1,.78,1),ico(M.leaf,.78,.25,.62,.07,1,.8,1),ico(M.leafLight,.55,0,.93,-.06,1,.78,1));return g}
function bushTall(M){const g=group('bush_tall',{type:'cylinder',radius:.55,height:1.8},[0,0,-.62]);g.add(ico(M.leafBlue,.58,0,.55,0,.95,1.25,.8),ico(M.leaf,.52,-.23,1.05,0,.88,1.15,.78),ico(M.leafLight,.46,.2,1.38,0,.82,1,.72));return g}
function rockCluster(M){const g=group('rock_cluster',{type:'box',size:[1.45,.78,1.15]},[0,0,-.68]);g.add(ico(M.rock,.62,-.25,.36,.05,1.1,.72,.9),ico(M.rockDark,.48,.35,.3,.18,1,.65,.9),ico(M.rockLight,.32,.12,.22,-.42,1,.72,.85));return g}
function stump(M){const g=group('tree_stump',{type:'cylinder',radius:.5,height:.72});g.add(cylinder(M.trunk,.43,.47,.68,8,0,.34,0),cylinder(M.cream,.38,.38,.025,8,0,.69,0));for(let i=0;i<4;i++){const a=i*Math.PI*.5,r=box(M.barkDark,.46,.18,.18,Math.cos(a)*.4,.1,Math.sin(a)*.4);r.rotation.y=-a;g.add(r)}return g}
function fallenLog(M){const g=group('fallen_log',{type:'box',size:[1.9,.68,.72]},[0,0,-.52]);const body=cylinder(M.trunk,.3,.3,1.85,8,0,.34,0);body.rotation.z=Math.PI*.5;const a=cylinder(M.cream,.24,.24,.025,8,-.93,.34,0);a.rotation.z=Math.PI*.5;const b=a.clone();b.position.x=.93;g.add(body,a,b,cylinder(M.trunkLight,.11,.11,.5,6,.38,.52,0));return g}
function mushroomCluster(M){const g=group('mushroom_cluster');for(const [x,z,s,cap] of [[-.22,.03,1,M.red],[.22,.1,.78,M.pink],[.03,-.22,.62,M.purple]])g.add(cylinder(M.cream,.055,.07,.33*s,6,x,.165*s,z),ico(cap,.19*s,x,.35*s,z,1.2,.52,1.2));return g}
function flowerPatch(M){const g=group('flower_patch');for(const [x,z,petal] of [[-.27,.04,M.pink],[.16,.14,M.yellow],[.33,-.19,M.purple],[-.03,-.24,M.white]]){g.add(cylinder(M.leafBlue,.022,.028,.3,5,x,.15,z));for(let k=0;k<5;k++){const a=k/5*Math.PI*2;g.add(ico(petal,.07,x+Math.cos(a)*.07,.34,z+Math.sin(a)*.07,1.2,.55,1,0))}g.add(ico(M.yellow,.045,x,.34,z,1,1,1,0))}return g}
function fernPatch(M){const g=group('fern_patch');for(let i=0;i<7;i++){const a=i*.9,b=box(M.leafBlue,.11,.03,.62,Math.cos(a)*.23,.3,Math.sin(a)*.23);b.rotation.set(-.45,-a,0);g.add(b)}return g}
function reedClump(M){const g=group('reed_clump');[[-.18,0,.85],[.02,.06,1],[.18,-.03,.78],[.28,.06,.9],[-.3,.1,.72]].forEach(([x,z,h],i)=>{g.add(cylinder(M.leafBlue,.02,.025,h,5,x,h*.5,z));if(i%2===0)g.add(cylinder(M.barkDark,.05,.05,.18,6,x,h+.08,z))});return g}
function friendPlaceholder(M){const g=group('friend_placeholder',{type:'capsule',radius:.25,height:1.35});g.userData.note='Non-rigged blockout for scale/camera/seek testing. Replace with final character GLB.';g.add(box(M.hoodie,.62,.68,.34,0,.66,0),box(M.skin,.52,.52,.52,0,1.25,0),box(M.hoodie,.18,.56,.18,-.24,.62,0),box(M.hoodie,.18,.56,.18,.24,.62,0),box(M.hoodieDark,.2,.54,.2,-.18,.25,0),box(M.hoodieDark,.2,.54,.2,.18,.25,0),ico(M.hair,.33,0,1.48,-.02,1,.55,1));return g}

export function buildForestPrototypeLibrary(M=createForestMaterials()){
  const library={tree_oak:oak(M),tree_pine:pine(M),bush_round:bushRound(M),bush_tall:bushTall(M),rock_cluster:rockCluster(M),tree_stump:stump(M),fallen_log:fallenLog(M),mushroom_cluster:mushroomCluster(M),flower_patch:flowerPatch(M),fern_patch:fernPatch(M),reed_clump:reedClump(M),friend_placeholder:friendPlaceholder(M)};
  Object.values(library).forEach(o=>o.traverse(n=>{if(n.isMesh)n.geometry.computeBoundingSphere()}));
  return library;
}
export function cloneForestProp(library,id){const source=library[id];if(!source)throw new Error(`Unknown forest prop: ${id}`);return source.clone(true)}
export const FOREST_ASSET_IDS=['tree_oak','tree_pine','bush_round','bush_tall','rock_cluster','tree_stump','fallen_log','mushroom_cluster','flower_patch','fern_patch','reed_clump','friend_placeholder'];
