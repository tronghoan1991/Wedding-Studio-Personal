(()=>{
  'use strict';
  let itemObserver=null,sceneObserver=null,resizeRaf=0;
  const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const enabled=()=>document.body?.dataset.motion!=='off'&&!reduced();
  const itemTargets=[
    ['#story > .eyebrow, #story > h2, #story > #lunarText','title'],
    ['#story > .countdown, #story > .story-text','panel'],
    ['#event .panel','panel'],
    ['#weddingCalendar .wedding-calendar-card','panel'],
    ['#gallery > .eyebrow, #gallery > h2','title'],
    ['#galleryGrid > img, #galleryGrid > .gallery-more-tile, #galleryGrid > .gallery-collapse','image'],
    ['#rsvp .panel, #wishes .panel, #photos .panel, #gift .panel, #thankYou .panel','panel'],
    ['#wishList > .wish','panel'],
    ['.footer','title']
  ];
  const sceneList=()=>[...document.querySelectorAll('#content > .section')].filter(el=>!el.hidden);

  function reveal(el){
    el.classList.add('motion-visible');
    itemObserver?.unobserve(el);
  }
  function ensureItemObserver(){
    if(itemObserver||!enabled()||!('IntersectionObserver'in window))return;
    itemObserver=new IntersectionObserver(entries=>{
      for(const entry of entries)if(entry.isIntersecting)reveal(entry.target);
    },{threshold:.14,rootMargin:'0px 0px -10% 0px'});
  }
  function prepareItem(el,kind,index){
    if(!el||el.dataset.motionReady==='1')return;
    el.dataset.motionReady='1';
    el.dataset.motionKind=kind;
    el.classList.add('motion-item');
    const stagger=kind==='image'?Math.min(index%6,5)*90:Math.min(index%4,3)*75;
    el.style.setProperty('--motion-delay',`${stagger}ms`);
    if(!enabled()||!('IntersectionObserver'in window)){el.classList.add('motion-visible');return}
    ensureItemObserver();
    itemObserver?.observe(el);
  }

  function updateSceneStates(){
    const scenes=sceneList();
    if(!scenes.length)return;
    if(!enabled()){
      scenes.forEach(el=>{
        el.classList.add('motion-scene','scene-active');
        el.classList.remove('scene-past','scene-future');
      });
      return;
    }
    const mid=innerHeight/2;
    let active=null,best=Infinity;
    for(const el of scenes){
      const r=el.getBoundingClientRect();
      if(r.height<2)continue;
      const containsMid=r.top<=mid&&r.bottom>=mid;
      const dist=containsMid?0:Math.abs((r.top+r.bottom)/2-mid);
      if(dist<best){best=dist;active=el}
    }
    for(const el of scenes){
      el.classList.add('motion-scene');
      el.classList.toggle('scene-active',el===active);
      if(el===active){
        el.classList.remove('scene-past','scene-future');
        continue;
      }
      const r=el.getBoundingClientRect();
      if(r.bottom<=mid){
        el.classList.add('scene-past');
        el.classList.remove('scene-future');
      }else{
        el.classList.add('scene-future');
        el.classList.remove('scene-past');
      }
    }
  }
  function ensureSceneObserver(){
    if(sceneObserver||!enabled()||!('IntersectionObserver'in window))return;
    sceneObserver=new IntersectionObserver(()=>updateSceneStates(),{
      threshold:[0,.01,.2,.5,1],
      rootMargin:'-42% 0px -42% 0px'
    });
    sceneList().forEach(el=>sceneObserver.observe(el));
  }
  function refreshScenes(){
    sceneObserver?.disconnect();sceneObserver=null;
    sceneList().forEach(el=>el.classList.add('motion-scene'));
    if(enabled())ensureSceneObserver();
    updateSceneStates();
  }
  function refresh(){
    let i=0;
    for(const [selector,kind] of itemTargets){
      document.querySelectorAll(selector).forEach(el=>prepareItem(el,kind,i++));
    }
    if(!enabled())document.querySelectorAll('.motion-item').forEach(el=>el.classList.add('motion-visible'));
    refreshScenes();
  }
  function enterContent(){
    const content=document.getElementById('content');if(!content)return;
    if(!enabled()){content.classList.remove('motion-content-enter');return}
    content.classList.remove('motion-content-enter');
    requestAnimationFrame(()=>{
      content.classList.add('motion-content-enter');
      refreshScenes();
    });
    setTimeout(()=>content.classList.remove('motion-content-enter'),1000);
  }
  function syncMode(){
    if(!enabled()){
      itemObserver?.disconnect();itemObserver=null;
      sceneObserver?.disconnect();sceneObserver=null;
      document.querySelectorAll('.motion-item').forEach(el=>el.classList.add('motion-visible'));
      updateSceneStates();
      return;
    }
    itemObserver?.disconnect();itemObserver=null;
    document.querySelectorAll('.motion-item').forEach(el=>{
      if(el.getBoundingClientRect().top<innerHeight*.92)el.classList.add('motion-visible');
      else el.classList.remove('motion-visible');
    });
    refresh();
  }
  function onResize(){
    cancelAnimationFrame(resizeRaf);
    resizeRaf=requestAnimationFrame(updateSceneStates);
  }
  window.WeddingMotion={refresh,refreshScenes,enterContent,syncMode};
  const boot=()=>{refresh();syncMode()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  new MutationObserver(syncMode).observe(document.body,{attributes:true,attributeFilter:['data-motion']});
  window.addEventListener('resize',onResize,{passive:true});
})();