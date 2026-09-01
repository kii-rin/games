import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from './engine.mjs';
function fresh(){const game=createGame(()=>.5);game.start();game.state.spawn=100;return game;}
function item(type,id=1,x=0){return{id,type,x,y:1.7,speed:4,variant:0,rotation:0};}
test('donuts add one; turtles deduct one, even at zero; each is caught only once',()=>{
 const g=fresh();g.state.objects=[item('turtle')];g.update(.1);assert.equal(g.state.score,-1);assert.equal(g.state.turtles,1);
 g.update(.1);assert.equal(g.state.score,-1);g.state.objects=[item('donut',2)];g.update(.1);assert.equal(g.state.score,0);assert.equal(g.state.caught,1);
});
test('misses do not affect score and objects outside the basket are not caught',()=>{
 const g=fresh();g.state.objects=[item('donut',1,3),{...item('turtle',2,3),y:-.99}];
 g.update(.1);assert.equal(g.state.score,0);assert.equal(g.state.objects.length,1);assert.equal(g.state.caught,0);
});
test('swept collision catches a fast object crossing the basket between frames',()=>{
 const g=fresh();g.state.objects=[{...item('donut'),y:2.1,speed:100}];g.update(.02);assert.equal(g.state.score,1);
});
test('round ends after sixty active seconds and ignores input and score changes afterward',()=>{
 const g=fresh();g.state.time=.05;g.update(.1);assert.equal(g.state.phase,'over');assert.equal(g.state.time,0);
 const x=g.state.x;g.state.objects=[item('donut')];g.update(1,1);assert.equal(g.state.x,x);assert.equal(g.state.score,0);
});
test('pause freezes time, movement, and objects',()=>{
 const g=fresh();g.state.phase='paused';g.state.objects=[item('donut')];g.update(5,1);assert.equal(g.state.time,60);assert.equal(g.state.x,0);assert.equal(g.state.objects[0].y,1.7);
});
test('movement and falling are consistent at 30 and 120 fps',()=>{
 function run(hz){const g=fresh();g.state.objects=[{...item('donut',1,-4),y:8}];for(let i=0;i<hz;i++)g.update(1/hz,1);return g.state;}
 const a=run(30),b=run(120);assert.ok(Math.abs(a.x-b.x)<1e-9);assert.ok(Math.abs(a.objects[0].y-b.objects[0].y)<1e-9);assert.ok(Math.abs(a.time-b.time)<1e-9);
});
test('level unlocks track donuts caught and do not revert when a turtle deducts score',()=>{
 const g=fresh();g.state.caught=9;g.state.score=9;g.state.objects=[item('donut')];g.update(.1);assert.equal(g.state.level,2);
 g.state.objects=[item('turtle',2)];g.update(.1);assert.equal(g.state.score,9);assert.equal(g.state.level,2);
});
test('restart clears all state while retaining responsive lane width',()=>{
 const g=fresh();Object.assign(g.state,{halfWidth:3,score:12,caught:14,turtles:2,level:2,time:2,objects:[item('donut')],x:2});g.start();
 assert.equal(g.state.score,0);assert.equal(g.state.level,1);assert.equal(g.state.time,60);assert.deepEqual(g.state.objects,[]);assert.equal(g.state.halfWidth,3);
 g.state.targetX=100;g.update(.2);assert.ok(g.state.x<=1.95);
});
