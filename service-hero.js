(() => {
  const hero = document.querySelector('[data-service-hero] #hero');
  if (!hero) return;
  // Disclosures and proof reveals remain active even when the optional hero
  // product cards are not part of the composition.
  function openLinkedPanel(){
    const id=decodeURIComponent(location.hash.slice(1));
    const el=id ? document.getElementById(id) : null;
    const panel=el?.closest('details');
    if(panel){panel.open=true;window.ScrollTrigger?.refresh();el.scrollIntoView({block:'start'});}
  }
  addEventListener('hashchange',openLinkedPanel);
  document.querySelectorAll('.service-disclosure').forEach(d=>d.addEventListener('toggle',()=>window.ScrollTrigger?.refresh()));
  document.querySelectorAll('.service-proof figure').forEach(e=>e.classList.add('service-reveal'));
  const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-revealed');observer.unobserve(e.target);}}),{threshold:.12});
  document.querySelectorAll('.service-reveal').forEach(e=>observer.observe(e));
  openLinkedPanel();

  const scene = hero.querySelector('.service-scene');
  if (!scene) return;
  const booth = document.getElementById('serviceBoothImage');
  const caption = document.getElementById('serviceCaption');
  const stageCaption = scene.querySelector('.service-stage-caption');
  const buttons = [...scene.querySelectorAll('[data-service-look]')];
  const simple = matchMedia('(max-width:900px), (hover:none) and (pointer:coarse), (prefers-reduced-motion:reduce)');
  let manual = false, raf = 0, progress = 0, target = 0, lastStage = -1, lastFrame = -1, loading = false;
  const frames = new Map();
  const path = i => `photos/booth/frames/b_${String(i).padStart(4,'0')}.webp`;
  const captions = {original:'Your moment, just as it happened.',film:'Warm film colour. A little nostalgia.',ai:'Your portrait, reimagined as art.'};
  function look(value) {
    scene.style.setProperty('--art-opacity',value === 'ai' ? 1 : 0);
    scene.style.setProperty('--film-filter',value === 'film' ? 'sepia(.45) saturate(.8) contrast(1.08)' : 'none');
    caption.textContent = captions[value];
    buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.serviceLook===value)));
  }
  buttons.forEach(b=>b.addEventListener('click',()=>{manual=true;look(b.dataset.serviceLook);}));
  function updateTarget() {
    const r=hero.getBoundingClientRect();
    target=Math.max(0,Math.min(1,-r.top/Math.max(1,hero.offsetHeight-innerHeight)));
  }
  function draw() {
    raf=0;
    if(simple.matches) return;
    progress += (target-progress)*.18;
    if(Math.abs(target-progress)<.0005) progress=target;
    const frame=1+Math.round(Math.min(1,progress/.72)*120);
    let nearest=frame;
    if(!frames.has(frame) && frames.size) nearest=[...frames.keys()].reduce((a,b)=>Math.abs(b-frame)<Math.abs(a-frame)?b:a);
    if(frames.has(nearest)&&nearest!==lastFrame) {booth.src=frames.get(nearest);lastFrame=nearest;}
    scene.style.setProperty('--print-rise',`${24*(1-Math.min(1,progress*3))}px`);
    const stage=progress<.28?0:progress<.65?1:2;
    if(stage!==lastStage){lastStage=stage;stageCaption.textContent=['Step in. Make a memory.','A photo becomes a keepsake.','Your moment. A work of art.'][stage];if(!manual)look(['original','film','ai'][stage]);}
    if(progress!==target) schedule();
  }
  function schedule(){if(!raf&&!simple.matches&&!document.hidden)raf=requestAnimationFrame(draw);}
  async function preload() {
    if(loading||simple.matches)return;
    loading=true;
    // Spread initial coverage across the full sequence, then fill every gap.
    const coarse=Array.from({length:16},(_,i)=>1+i*8);
    const queue=[...coarse,...Array.from({length:121},(_,i)=>i+1).filter(i=>!coarse.includes(i))].filter(i=>!frames.has(i));
    async function worker(){while(queue.length&&!simple.matches){const i=queue.shift();const image=new Image();image.decoding='async';image.src=path(i);try{await image.decode();frames.set(i,image.src);schedule();}catch(_){}}}
    await Promise.all([worker(),worker(),worker(),worker()]);loading=false;
  }
  function responsive(){
    if(simple.matches){if(raf)cancelAnimationFrame(raf);raf=0;booth.src=path(120);scene.style.removeProperty('--print-rise');}
    else{booth.src=path(1);lastFrame=-1;updateTarget();schedule();preload();}
  }
  addEventListener('scroll',()=>{updateTarget();schedule();},{passive:true});
  addEventListener('resize',()=>{updateTarget();schedule();},{passive:true});
  simple.addEventListener('change',responsive);
  document.addEventListener('visibilitychange',schedule);
  new IntersectionObserver(([e])=>{if(e.isIntersecting){preload();schedule();}}).observe(hero);
  requestAnimationFrame(()=>requestAnimationFrame(()=>scene.classList.add('scene-ready')));
  look(simple.matches ? 'ai' : 'original');responsive();
})();

// The mobile demo only loads its small photo set when a phone layout is active.
(() => {
 const root=document.querySelector('.pocket-booth'); if(!root)return;
 const mobile=matchMedia('(max-width:900px), (hover:none) and (pointer:coarse)');
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 const photos=root.querySelector('.pocket-photos');
 const buttons=[...root.querySelectorAll('[data-pocket-look]')];
 const status=document.getElementById('pocket-status');
 const originals=['jenmike.webp','myra.webp','co.webp'];
 const artworks=['jenmike-vangogh.webp','myra-monet1.webp','co-picasso.webp'];
 let initialized=false, timer, generation=0;
 function print(look='film') {
  const run=++generation; clearTimeout(timer);
  root.classList.remove('is-printed');root.dataset.look=look;
  buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.pocketLook===look)));
  status.textContent='Developing your strip…';
  const files=look==='ai'?artworks:originals;
  const images=files.map((file,i)=>{const img=new Image();img.alt=['Wedding portrait','Event portrait','Studio portrait'][i]+(look==='ai'?' reimagined as art':'');img.src='photos/spark/'+file;img.decoding='async';return img;});
  // Put the images in the document immediately. Some mobile WebKit versions
  // leave Image.decode() pending for detached images, which stalled the strip.
  photos.replaceChildren(...images);
  let settled=false;
  let loadFallback;
  const reveal=()=>{
   if(settled||run!==generation)return;
   settled=true;
   clearTimeout(loadFallback);
   requestAnimationFrame(()=>requestAnimationFrame(()=>{
   if(run!==generation)return;
   root.classList.add('is-printed');
   timer=setTimeout(()=>{status.textContent=look==='ai'?'Same people. Unexpected art.':look==='film'?'A little nostalgia. Yours to keep.':'Your people. Just as they are.';},reduced.matches?0:1400);
   }));
  };
  let remaining=images.length;
  images.forEach(img=>{
   const done=()=>{remaining-=1;if(remaining<=0)reveal();};
   if(img.complete)done(); else {img.addEventListener('load',done,{once:true});img.addEventListener('error',done,{once:true});}
  });
  loadFallback=setTimeout(reveal,1200);
 }
 function start(){if(mobile.matches&&!initialized){initialized=true;print();}}
 buttons.forEach(b=>b.addEventListener('click',()=>print(b.dataset.pocketLook)));
 new IntersectionObserver(([e])=>{if(e.isIntersecting)start();},{threshold:.15}).observe(root);
 mobile.addEventListener('change',start);
})();

// Play the AI examples only while they are visible.
(() => {
 const videos=[...document.querySelectorAll('.ai-motion video')];
 if(!videos.length)return;
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 if(reduced.matches){
  videos.forEach(video=>{video.controls=true;});
  return;
 }
 const observer=new IntersectionObserver(entries=>{
  entries.forEach(({isIntersecting,target})=>{
   if(isIntersecting)target.play().catch(()=>{});
   else target.pause();
  });
 },{threshold:.2});
 videos.forEach(video=>observer.observe(video));
})();
