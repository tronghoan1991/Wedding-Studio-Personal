(()=>{
  'use strict';
  if(!window.ADMIN_DATA)return;
  if(!window.ADMIN_DATA.themes.some(([key])=>key==='minhanh'))window.ADMIN_DATA.themes.push(['minhanh','Hồng hoa']);
  const $=s=>document.querySelector(s);
  function ensure(){
    const select=$('#siteForm [name="theme"]');
    if(select&&!select.querySelector('option[value="minhanh"]')){const o=document.createElement('option');o.value='minhanh';o.textContent='Hồng hoa';select.appendChild(o)}
    const grid=$('#layoutPicker');
    if(grid&&!grid.querySelector('.layout-choice[data-theme="minhanh"]')){
      const b=document.createElement('button');b.type='button';b.className='layout-choice';b.dataset.theme='minhanh';b.style.setProperty('--lt-bg','#fff3f6');b.style.setProperty('--lt-ac','#d78398');b.innerHTML='<span class="layout-thumb"></span><span class="layout-name">Hồng hoa</span><span class="layout-desc">Pastel hoa · mobile-first</span>';
      b.onclick=()=>{if(!select)return;select.value='minhanh';select.dispatchEvent(new Event('change',{bubbles:true}));select.dispatchEvent(new Event('input',{bubbles:true}));document.querySelectorAll('.layout-choice').forEach(x=>x.classList.toggle('active',x.dataset.theme==='minhanh'))};
      grid.appendChild(b);
    }
  }
  const mo=new MutationObserver(ensure);mo.observe(document.documentElement,{subtree:true,childList:true});ensure();setInterval(ensure,1000);
})();
