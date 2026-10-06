window.WeddingEffects=(()=>{
  let timer=null,layer=null;
  const charsMap={hearts:['♥','♡'],petals:['✿','❀','❁'],snow:['❄','•'],glitter:['✦','✧','⋆'],stars:['★','✦','☆']};
  function ensureLayer(){
    layer=document.getElementById('fxLayer');
    if(!layer){layer=document.createElement('div');layer.id='fxLayer';layer.className='fx-layer';document.body.appendChild(layer)}
    if(layer.parentElement!==document.body)document.body.appendChild(layer);
    Object.assign(layer.style,{position:'fixed',inset:'0',zIndex:'28',pointerEvents:'none',overflow:'hidden',display:'block'});
    return layer;
  }
  function stop(){if(timer)clearInterval(timer);timer=null;document.querySelectorAll('.fx').forEach(x=>x.remove())}
  function spawn(type){
    const host=ensureLayer(),chars=charsMap[type]||charsMap.glitter,e=document.createElement('span');
    e.className='fx';e.textContent=chars[Math.floor(Math.random()*chars.length)];
    e.style.left=Math.random()*100+'vw';e.style.fontSize=(13+Math.random()*22)+'px';e.style.setProperty('--drift',(-90+Math.random()*180)+'px');e.style.animationDuration=(5+Math.random()*7)+'s';e.style.opacity=String(.48+Math.random()*.42);
    e.style.color='var(--accent)';e.style.textShadow='0 0 10px color-mix(in srgb,var(--accent2) 70%,transparent)';
    host.appendChild(e);setTimeout(()=>e.remove(),13000);
  }
  function start(type){
    stop();if(!type||type==='none')return;ensureLayer();
    for(let i=0;i<7;i++)setTimeout(()=>spawn(type),i*90);
    timer=setInterval(()=>spawn(type),320);
  }
  return{start,stop};
})();
