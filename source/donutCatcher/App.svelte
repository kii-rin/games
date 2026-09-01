<script>
 import {onMount} from 'svelte';
 import {art} from './assets.js';
 import {createDonutScene} from './scene.js';
 let canvas=$state(),controller;
 let ready=$state(false),error=$state(''),toast=$state(''),popups=$state([]);
 let state=$state({phase:'loading',score:0,time:60,level:1,best:0,caught:0,turtles:0});
 let resultButton=$state(),resumeButton=$state();
 let toastTimer;const popupTimers=new Set();
 const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 onMount(()=>{
  controller=createDonutScene(canvas,art,{
   onReady:()=>{ready=true;},
   onChange:next=>{state=next;},
   onError:message=>{error=message;ready=false;},
   onCatch:event=>{
    const id=event.id;popups=[...popups,{...event,id}];
    const timer=setTimeout(()=>{popups=popups.filter(p=>p.id!==id);popupTimers.delete(timer);},850);popupTimers.add(timer);
   },
   onLevel:level=>{clearTimeout(toastTimer);toast=`Level ${level} · A little faster!`;toastTimer=setTimeout(()=>toast='',2100);}
  });
  return()=>{controller.destroy();clearTimeout(toastTimer);popupTimers.forEach(clearTimeout);};
 });
 $effect(()=>{if(state.phase==='over')resultButton?.focus({preventScroll:true});if(state.phase==='paused')resumeButton?.focus({preventScroll:true});});
 function start(){popups=[];toast='';controller?.start();canvas.focus({preventScroll:true});}
 function resume(){controller?.resume();canvas.focus({preventScroll:true});}
</script>

<main class="game" class:playing={state.phase==='playing'}>
 <img class="backdrop" src={art.background} alt="" draggable="false" fetchpriority="high" />
 <div class="sky-shade"></div>
 <canvas bind:this={canvas} aria-label="Donut catching play area. Use arrow keys, A and D, mouse, or drag to move the basket." tabindex="0"></canvas>
 <header class="topbar">
  <a class="back" href="../index.html"><span aria-hidden="true">←</span><span class="back-label">Games</span></a>
  {#if state.phase!=='ready'&&state.phase!=='loading'}<img class="small-logo" src={art.logo} alt="Donut Catcher" draggable="false" />{/if}
  <div class="stats">
   <div class="stat score"><img src={art.donuts[0]} alt="" /><div><span>SCORE</span><strong>{state.score}</strong></div></div>
   <div class="stat timer" class:urgent={state.time<=10&&state.phase==='playing'}><span>TIME</span><strong>{Math.ceil(state.time)}<small>s</small></strong></div>
  </div>
 </header>
 {#if !error&&(state.phase==='ready'||state.phase==='loading')}
  <section class="start-screen" aria-label="Start Donut Catcher">
   <h1><img class="title-art" src={art.logo} alt="Donut Catcher" draggable="false" /></h1>
   <div class="start-card">
    <div class="rules"><span><img src={art.donuts[0]} alt="Donut" /><b>+1</b><span>Catch</span></span><i></i><span><img src={art.turtle} alt="Turtle" /><b>−1</b><span>Dodge</span></span></div>
    <button class="primary" onclick={start} disabled={!ready}>{ready?'Let’s catch!':'Opening the bakery…'}<span aria-hidden="true">{ready?'↗':''}</span></button>
    <p class="hint">60 seconds of sweet, sweet chaos.</p>
   </div>
  </section>
 {/if}
 {#if state.phase==='over'&&!error}
  <section class="panel" aria-labelledby="result-title">
   <span class="eyebrow">THAT’S A BATCH!</span><h2 id="result-title">Sweet catch.</h2>
   <strong class="final-score">{state.score}</strong><p class="summary">{state.caught} donuts caught · {state.turtles} turtles scooped</p>
   <button class="primary" bind:this={resultButton} onclick={start}>One more round <span aria-hidden="true">↗</span></button><p class="hint">Your best batch: {state.best}</p>
  </section>
 {/if}
 {#if state.phase==='paused'&&!error}
  <section class="panel compact" aria-label="Game paused"><h2>Take your time.</h2><button class="primary" bind:this={resumeButton} onclick={resume}>Keep catching</button></section>
 {/if}
 {#if error}
  <section class="panel compact" role="alert"><h2>A little oven trouble.</h2><p>{error}</p><button class="primary" onclick={()=>location.reload()}>Try again</button></section>
 {/if}
 <div class="toast" class:visible={toast} role="status">{toast}</div>
 <div class="feedback" aria-hidden="true">
  {#each popups as popup (popup.id)}<span class="float-score" class:bad={popup.delta<0} class:still={reduced} style:left={`${popup.x}%`} style:top={`${popup.y}%`}>{popup.delta>0?'+1':'−1'}</span>{/each}
 </div>
 <footer>
  <span class="level"><i></i>LEVEL <b>{String(state.level).padStart(2,'0')}</b></span>
  <span class="controls"><kbd>←</kbd><kbd>→</kbd><span>Move or drag to catch</span></span>
  <span class="best">BEST <b>{state.best}</b></span>
 </footer>
</main>
