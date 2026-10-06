(()=>{
  'use strict';
  const $=s=>document.querySelector(s);
  const grid=$('#coverUploadPreview'),urlsEl=$('#coverImageUrls'),adjEl=$('#coverAdjustments');
  if(!grid||!urlsEl||!adjEl)return;
  const lines=()=>String(urlsEl.value||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean).slice(0,3);
  const adjusts=()=>{let a=[];try{a=JSON.parse(adjEl.value||'[]')}catch{};if(!Array.isArray(a))a=[];return [0,1,2].map(i=>a[i]||{x:0,y:0,scale:1,fit:'cover'})};
  const fire=el=>{el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))};
  let busy=false;
  function reorder(from,to){
    if(from===to||from<0||to<0)return;
    const u=lines(),a=adjusts();if(from>=u.length||to>=u.length)return;
    const [iu]=u.splice(from,1),[ia]=a.splice(from,1);u.splice(to,0,iu);a.splice(to,0,ia);
    urlsEl.value=u.join('\n');adjEl.value=JSON.stringify(a.slice(0,u.length));fire(urlsEl);fire(adjEl);
    window.AdminImageUpload?.render?.();window.AdminPreview?.render?.();
  }
  function enhance(){
    if(busy)return;busy=true;
    try{
      const cards=[...grid.querySelectorAll('.cover-editor-card')];
      cards.forEach((card,i)=>{
        card.dataset.coverIndex=String(i);card.draggable=false;
        if(card.querySelector('.cover-order-controls'))return;
        const controls=document.createElement('div');controls.className='cover-order-controls';
        const drag=document.createElement('span');drag.className='cover-drag-handle';drag.textContent='↕ Kéo đổi vị trí';drag.title='Giữ tại đây rồi kéo sang ô khác';drag.draggable=true;
        drag.addEventListener('dragstart',e=>{card.classList.add('is-sorting');e.dataTransfer?.setData('text/plain',String(i));if(e.dataTransfer)e.dataTransfer.effectAllowed='move'});
        drag.addEventListener('dragend',()=>card.classList.remove('is-sorting'));
        const left=document.createElement('button');left.type='button';left.className='btn ghost cover-order-btn';left.textContent='←';left.title='Chuyển sang trái';left.disabled=i===0;left.onclick=e=>{e.stopPropagation();reorder(i,i-1)};
        const right=document.createElement('button');right.type='button';right.className='btn ghost cover-order-btn';right.textContent='→';right.title='Chuyển sang phải';right.disabled=i===cards.length-1;right.onclick=e=>{e.stopPropagation();reorder(i,i+1)};
        controls.append(drag,left,right);card.querySelector('.cover-editor-title')?.appendChild(controls);
        card.addEventListener('dragover',e=>{e.preventDefault();card.classList.add('is-drop-target');if(e.dataTransfer)e.dataTransfer.dropEffect='move'});
        card.addEventListener('dragleave',()=>card.classList.remove('is-drop-target'));
        card.addEventListener('drop',e=>{e.preventDefault();card.classList.remove('is-drop-target');const from=Number(e.dataTransfer?.getData('text/plain'));if(Number.isInteger(from))reorder(from,i)});
      });
    }finally{busy=false}
  }
  const mo=new MutationObserver(()=>requestAnimationFrame(enhance));mo.observe(grid,{childList:true,subtree:false});
  enhance();setInterval(enhance,900);
})();
