(()=>{
  'use strict';
  let observer=null;
  const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const enabled=()=>document.body?.dataset.motion!=='off'&&!reduced();
  const targets=[
    ['#story > .eyebrow, #story > h2, #story > #lunarText','title'],
    ['#story > .countdown, #story > .story-text','panel'],
    ['#event .panel','panel'],
    ['#gallery > .eyebrow, #gallery > h2','title'],
    ['#galleryGrid > img, #galleryGrid > .gallery-more-tile, #galleryGrid > .gallery-collapse','image'],
    ['#rsvp .panel, #wishes .panel, #photos .panel, #gift .panel, #thankYou .panel','panel'],
    ['#wishList > .wish','panel'],
    ['.footer','title']
  ];
  function reveal(el){el.classList.add('motion-visible');observer?.unobserve(el)}
  function ensureObserver(){
    if(observer||!enabled()||!('IntersectionObserver'in window))return;
    observer=new IntersectionObserver(entries=>{
      for(const entry of entries)if(entry.isIntersecting)reveal(entry.target);
    },{threshold:.12,rootMargin:'0px 0px -8% 0px'});
  }
  function prepare(el,kind,index){
    if(!el||el.dataset.motionReady==='1')return;
    el.dataset.motionReady='1';
    el.dataset.motionKind=kind;
    el.classList.add('motion-item');
    const stagger=kind==='image'?Math.min(index%6,5)*85:Math.min(index%4,3)*70;
    el.style.setProperty('--motion-delay',`${stagger}ms`);
    if(!enabled()||!('IntersectionObserver'in window)){el.classList.add('motion-visible');return}
    ensureObserver();
    observer?.observe(el);
  }
  function refresh(){
    let i=0;
    for(const [selector,kind] of targets){
      document.querySelectorAll(selector).forEach(el=>prepare(el,kind,i++));
    }
    if(!enabled())document.querySelectorAll('.motion-item').forEach(el=>el.classList.add('motion-visible'));
  }
  function enterContent(){
    const content=document.getElementById('content');if(!content)return;
    if(!enabled()){content.classList.remove('motion-content-enter');return}
    content.classList.remove('motion-content-enter');
    requestAnimationFrame(()=>content.classList.add('motion-content-enter'));
    setTimeout(()=>content.classList.remove('motion-content-enter'),1000);
  }
  function syncMode(){
    if(!enabled()){
      observer?.disconnect();observer=null;
      document.querySelectorAll('.motion-item').forEach(el=>el.classList.add('motion-visible'));
      return;
    }
    document.querySelectorAll('.motion-item').forEach(el=>{
      if(el.getBoundingClientRect().top<innerHeight*.9)el.classList.add('motion-visible');
      else el.classList.remove('motion-visible');
    });
    observer=null;refresh();
  }
  window.WeddingMotion={refresh,enterContent,syncMode};
  const boot=()=>{refresh();syncMode()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  new MutationObserver(syncMode).observe(document.body,{attributes:true,attributeFilter:['data-motion']});
})();
