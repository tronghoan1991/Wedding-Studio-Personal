(()=>{
  'use strict';
  const $=s=>document.querySelector(s);
  const monthNames=['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
  const dows=['T2','T3','T4','T5','T6','T7','CN'];
  let lastKey='';
  function parseDate(){
    const raw=String($('#coverDate')?.textContent||'').trim();
    const m=raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if(!m)return null;
    const d=new Date(Number(m[3]),Number(m[2])-1,Number(m[1]));
    return Number.isNaN(d.getTime())?null:d;
  }
  function renderCalendar(){
    const active=document.body.dataset.theme==='minhanh',host=$('#event .panel');
    let cal=$('#minhAnhCalendar');
    if(!active){if(cal)cal.hidden=true;lastKey='';return}
    const date=parseDate();if(!host||!date)return;
    const key=`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    if(cal&&lastKey===key){cal.hidden=false;return}
    if(!cal){cal=document.createElement('div');cal.id='minhAnhCalendar';cal.className='minhanh-calendar';host.appendChild(cal)}
    const year=date.getFullYear(),month=date.getMonth(),day=date.getDate();
    const first=new Date(year,month,1),last=new Date(year,month+1,0).getDate();
    const mondayOffset=(first.getDay()+6)%7;
    const cells=[];dows.forEach(x=>cells.push(`<span class="dow">${x}</span>`));
    for(let i=0;i<mondayOffset;i++)cells.push('<span class="empty">0</span>');
    for(let n=1;n<=last;n++)cells.push(`<span${n===day?' class="wedding-day"':''}>${n}</span>`);
    cal.innerHTML=`<div class="minhanh-calendar-head">${monthNames[month]} · ${year}</div><div class="minhanh-calendar-grid">${cells.join('')}</div>`;
    cal.hidden=false;lastKey=key;
  }
  const observer=new MutationObserver(renderCalendar);
  observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['data-theme']});
  window.addEventListener('load',renderCalendar,{once:true});
  setInterval(renderCalendar,1200);
})();
