(()=>{
  'use strict';
  if(!window.ADMIN_DATA)return;
  if(!window.ADMIN_DATA.themes.some(([key])=>key==='minhanh'))window.ADMIN_DATA.themes.push(['minhanh','Hồng hoa']);
  const $=s=>document.querySelector(s),dows=['T2','T3','T4','T5','T6','T7','CN'];
  function previewCalendar(){
    const root=$('#weddingPreview'),select=$('#siteForm [name="theme"]'),host=$('#pvSecEvent');if(!root||!select||!host)return;
    let cal=$('#pvMinhAnhCalendar');
    if(select.value!=='minhanh'){if(cal)cal.hidden=true;return}
    const raw=String($('#siteForm [name="eventDate"]')?.value||'');const date=raw?new Date(raw):null;if(!date||Number.isNaN(date.getTime())){if(cal)cal.hidden=true;return}
    if(!cal){cal=document.createElement('div');cal.id='pvMinhAnhCalendar';cal.className='preview-minhanh-calendar';host.appendChild(cal)}
    const year=date.getFullYear(),month=date.getMonth(),day=date.getDate(),last=new Date(year,month+1,0).getDate(),offset=(new Date(year,month,1).getDay()+6)%7;
    const cells=[];dows.forEach(x=>cells.push(`<span>${x}</span>`));for(let i=0;i<offset;i++)cells.push('<span></span>');for(let n=1;n<=last;n++)cells.push(`<span${n===day?' class="active"':''}>${n}</span>`);
    cal.innerHTML=`<strong>Tháng ${month+1} · ${year}</strong><div>${cells.join('')}</div>`;cal.hidden=false;
  }
  function ensure(){
    const select=$('#siteForm [name="theme"]');
    if(select&&!select.querySelector('option[value="minhanh"]')){const o=document.createElement('option');o.value='minhanh';o.textContent='Hồng hoa';select.appendChild(o)}
    const grid=$('#layoutPicker');
    if(grid&&!grid.querySelector('.layout-choice[data-theme="minhanh"]')){
      const b=document.createElement('button');b.type='button';b.className='layout-choice';b.dataset.theme='minhanh';b.style.setProperty('--lt-bg','#fff3f6');b.style.setProperty('--lt-ac','#d78398');b.innerHTML='<span class="layout-thumb"></span><span class="layout-name">Hồng hoa</span><span class="layout-desc">Pastel hoa · mobile-first</span>';
      b.onclick=()=>{if(!select)return;select.value='minhanh';select.dispatchEvent(new Event('change',{bubbles:true}));select.dispatchEvent(new Event('input',{bubbles:true}));document.querySelectorAll('.layout-choice').forEach(x=>x.classList.toggle('active',x.dataset.theme==='minhanh'));previewCalendar()};
      grid.appendChild(b);
    }
    previewCalendar();
  }
  document.addEventListener('input',e=>{if(e.target?.closest?.('#siteForm'))previewCalendar()});document.addEventListener('change',e=>{if(e.target?.closest?.('#siteForm'))previewCalendar()});
  const mo=new MutationObserver(ensure);mo.observe(document.documentElement,{subtree:true,childList:true});ensure();setInterval(ensure,1000);
})();
