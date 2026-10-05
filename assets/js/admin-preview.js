(()=>{
  'use strict';
  const $=s=>document.querySelector(s);
  const form=$('#siteForm'), root=$('#weddingPreview');
  if(!form||!root||!window.ADMIN_DATA)return;

  const palettes={
    mint:{bg:'#f0f7f1',paper:'#ffffff',ink:'#24362d',muted:'#6c7f73',accent:'#527b68',accent2:'#b9d8c7'},
    lavender:{bg:'#f5f0fa',paper:'#ffffff',ink:'#3b3048',muted:'#766881',accent:'#8064a2',accent2:'#cdbce0'},
    sunset:{bg:'#fff3ed',paper:'#fffaf7',ink:'#4a2c2b',muted:'#86625d',accent:'#c35f4d',accent2:'#f2b69f'},
    wedding:{bg:'#faf6f2',paper:'#ffffff',ink:'#2f2927',muted:'#776c68',accent:'#9a7568',accent2:'#dbc6bd'},
    gold:{bg:'#13110d',paper:'#1d1912',ink:'#f5e8c9',muted:'#c9b98f',accent:'#c7a657',accent2:'#6e5829'},
    songhy:{bg:'#fff4ef',paper:'#fffaf6',ink:'#5e1717',muted:'#8e4b45',accent:'#b51f1f',accent2:'#e5ad55'},
    magazine:{bg:'#f5f5f3',paper:'#ffffff',ink:'#111111',muted:'#666666',accent:'#111111',accent2:'#dddddd'},
    garden:{bg:'#f7f4f2',paper:'#fffdfb',ink:'#31402e',muted:'#72806f',accent:'#71885f',accent2:'#d8c9d8'},
    stars:{bg:'#080d1b',paper:'#111a2f',ink:'#eef3ff',muted:'#a8b4d5',accent:'#8fa9ff',accent2:'#485b94'},
    terracotta:{bg:'#f7eee8',paper:'#fffaf6',ink:'#492e26',muted:'#80675f',accent:'#a85e43',accent2:'#d9a68e'}
  };
  const themeNames=Object.fromEntries(ADMIN_DATA.themes);
  const cardNames=Object.fromEntries(ADMIN_DATA.cards);

  function text(name,fallback=''){
    const el=form.elements[name];
    return String(el?.value||'').trim()||fallback;
  }
  function fmtDate(value){
    if(!value)return 'Ngày cưới của chúng mình';
    const d=new Date(value);
    if(Number.isNaN(d.getTime()))return value;
    return new Intl.DateTimeFormat('vi-VN',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(d);
  }
  function set(id,value){const el=$(id);if(el)el.textContent=value}

  function render(){
    const theme=text('theme','mint'),card=text('cardStyle','classic'),p=palettes[theme]||palettes.mint;
    root.dataset.theme=theme;root.dataset.card=card;
    root.style.setProperty('--pv-bg',p.bg);root.style.setProperty('--pv-paper',p.paper);root.style.setProperty('--pv-ink',p.ink);root.style.setProperty('--pv-muted',p.muted);root.style.setProperty('--pv-accent',p.accent);root.style.setProperty('--pv-accent2',p.accent2);
    set('#pvBride',text('brideName','Cô dâu'));set('#pvGroom',text('groomName','Chú rể'));
    set('#pvInvitation',text('invitationLine','Trân trọng kính mời bạn đến chung vui trong ngày trọng đại của chúng mình.'));
    set('#pvDate',fmtDate(text('eventDate')));set('#pvVenue',text('venueName','Địa điểm tổ chức'));
    set('#pvAddress',text('venueAddress','Địa chỉ sẽ hiển thị tại đây'));
    const story=text('storyText','');set('#pvStory',story.length>220?story.slice(0,217)+'…':story);
    set('#pvThemeName',themeNames[theme]||theme);set('#pvCardName',cardNames[card]||card);
    document.querySelectorAll('.preview-swatch').forEach(b=>b.classList.toggle('active',b.dataset.theme===theme));
  }

  const palette=$('#previewPalette');
  if(palette){
    ADMIN_DATA.themes.forEach(([key,label])=>{
      const p=palettes[key]||palettes.mint,b=document.createElement('button');
      b.type='button';b.className='preview-swatch';b.dataset.theme=key;b.title=label;b.setAttribute('aria-label',`Chọn giao diện ${label}`);
      b.innerHTML=`<span style="--c1:${p.accent};--c2:${p.accent2};--c3:${p.bg}"></span><small>${label}</small>`;
      b.onclick=()=>{form.elements.theme.value=key;form.elements.theme.dispatchEvent(new Event('change',{bubbles:true}));};palette.appendChild(b);
    });
  }

  if(window.Api?.publicCall){
    const originalCall=window.Api.publicCall.bind(window.Api);
    window.Api.publicCall=(action,payload={},method='POST')=>{
      if(action==='adminSaveSite'&&payload?.payload?.data){
        payload={...payload,payload:{...payload.payload,data:{...payload.payload.data,invitationLine:text('invitationLine','')}}};
      }
      return originalCall(action,payload,method);
    };
  }

  if(window.Api?.table){
    const originalTable=window.Api.table.bind(window.Api);
    window.Api.table=async(path,token,opt={})=>{
      const result=await originalTable(path,token,opt);
      if(String(path).startsWith('site_settings'))setTimeout(render,0);
      return result;
    };
  }

  form.addEventListener('input',render);form.addEventListener('change',render);
  window.AdminPreview={render};
  render();
})();
