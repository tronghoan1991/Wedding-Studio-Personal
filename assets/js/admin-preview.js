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
  const themeNames=Object.fromEntries(ADMIN_DATA.themes), cardNames=Object.fromEntries(ADMIN_DATA.cards);
  let fxTimer=null,lastEffect='',lastCard='';

  root.innerHTML=`
    <div class="phone-preview-frame">
      <div class="phone-preview-notch"></div>
      <div id="previewPhoneScreen" class="phone-preview-screen">
        <section id="pvSecCover" class="phone-section phone-cover">
          <div class="phone-cover-card">
            <span class="preview-kicker">TRÂN TRỌNG KÍNH MỜI</span>
            <h3><span id="pvBride">Cô dâu</span><i>&amp;</i><span id="pvGroom">Chú rể</span></h3>
            <p id="pvInvitation" class="preview-invitation">Trân trọng kính mời bạn đến chung vui trong ngày trọng đại của chúng mình.</p>
            <div class="preview-seal">♥</div>
          </div>
        </section>
        <section id="pvSecDate" class="phone-section phone-date-section">
          <span class="phone-eyebrow">SAVE THE DATE</span>
          <strong id="pvDate" class="phone-big-date">Ngày cưới của chúng mình</strong>
          <div class="phone-mini-countdown"><span>Ngày</span><span>Giờ</span><span>Phút</span><span>Giây</span></div>
        </section>
        <section id="pvSecStory" class="phone-section">
          <span class="phone-eyebrow">CÂU CHUYỆN</span>
          <h4>Chuyện của chúng mình</h4>
          <p id="pvStory" class="phone-copy">Nội dung câu chuyện sẽ xuất hiện ở đây.</p>
        </section>
        <section id="pvSecEvent" class="phone-section phone-event-section">
          <span class="phone-eyebrow">HÔN LỄ</span>
          <h4 id="pvVenue">Địa điểm tổ chức</h4>
          <p id="pvEventTime" class="phone-event-time"></p>
          <p id="pvAddress" class="phone-copy">Địa chỉ sẽ hiển thị tại đây</p>
          <span class="phone-map-pill">Mở bản đồ</span>
        </section>
        <section id="pvSecGallery" class="phone-section">
          <span class="phone-eyebrow">ALBUM</span>
          <h4 id="pvGalleryTitle">Khoảnh khắc của chúng tôi</h4>
          <div id="pvGalleryGrid" class="phone-gallery-grid"></div>
        </section>
        <section id="pvSecGift" class="phone-section phone-gift-section">
          <span class="phone-eyebrow">MỪNG CƯỚI</span>
          <h4 id="pvGiftTitle">Mừng cưới</h4>
          <p id="pvGiftText" class="phone-copy">Thông tin mừng cưới sẽ xuất hiện tại đây.</p>
          <img id="pvGiftQr" class="phone-gift-qr" alt="QR mừng cưới" hidden>
          <div id="pvGiftPlaceholder" class="phone-qr-placeholder">QR</div>
        </section>
        <footer class="phone-preview-footer"><strong id="pvFooterNames">Cô dâu & Chú rể</strong><small>Bản xem trước trực tiếp</small></footer>
      </div>
      <div id="pvFxLayer" class="phone-preview-fx-layer" aria-hidden="true"></div>
    </div>`;

  function normalizeText(v){return String(v??'').normalize('NFC').replace(/[\u200B-\u200D\uFEFF]/g,'').replace(/[ \t]+/g,' ').replace(/ *\n */g,'\n')}
  function text(name,fallback=''){const el=form.elements[name];return normalizeText(el?.value||'').trim()||fallback}
  function set(id,value){const el=$(id);if(el)el.textContent=normalizeText(value)}
  function dateObject(){const raw=text('eventDate','');if(!raw)return null;const d=new Date(raw);return Number.isNaN(d.getTime())?null:d}
  function fmtDate(d){return d?new Intl.DateTimeFormat('vi-VN',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'}).format(d):'Ngày cưới của chúng mình'}
  function fmtTime(d){return d?new Intl.DateTimeFormat('vi-VN',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit',year:'numeric'}).format(d):''}
  function allowedMediaUrl(raw){const v=String(raw||'').trim();if(!v)return '';try{if(v.startsWith('data:image/'))return v;const u=new URL(v,location.href);if(u.origin===location.origin||/\.supabase\.co$/i.test(u.hostname))return u.href}catch{}return ''}

  function renderGallery(){const grid=$('#pvGalleryGrid');if(!grid)return;const urls=String(form.elements.gallery?.value||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean).slice(0,4);grid.innerHTML='';for(let i=0;i<4;i++){const url=allowedMediaUrl(urls[i]||''),cell=document.createElement('div');cell.className='phone-gallery-cell';if(url){const img=document.createElement('img');img.src=url;img.alt=`Ảnh ${i+1}`;cell.appendChild(img)}else cell.textContent=urls[i]?'Ảnh':'+';grid.appendChild(cell)}}
  function renderGiftQr(){const img=$('#pvGiftQr'),ph=$('#pvGiftPlaceholder'),url=allowedMediaUrl(text('giftQrUrl',''));if(url){img.src=url;img.hidden=false;ph.hidden=true}else{img.removeAttribute('src');img.hidden=true;ph.hidden=false}}

  function stopEffect(){if(fxTimer)clearInterval(fxTimer);fxTimer=null;const layer=$('#pvFxLayer');if(layer)layer.replaceChildren()}
  function startEffect(type){
    stopEffect();lastEffect=type;
    if(!type||type==='none')return;
    const layer=$('#pvFxLayer');if(!layer)return;
    const chars={hearts:['♥','♡'],petals:['✿','❀','❁'],snow:['❄','•'],glitter:['✦','✧','⋆'],stars:['★','✦','☆']}[type]||['✦'];
    const spawn=()=>{const e=document.createElement('span');e.className='preview-fx';e.textContent=chars[Math.floor(Math.random()*chars.length)];e.style.left=(4+Math.random()*92)+'%';e.style.fontSize=(12+Math.random()*17)+'px';e.style.setProperty('--pv-drift',(-50+Math.random()*100)+'px');e.style.animationDuration=(3.8+Math.random()*4.2)+'s';layer.appendChild(e);setTimeout(()=>e.remove(),8500)};
    for(let i=0;i<7;i++)setTimeout(spawn,i*90);
    fxTimer=setInterval(spawn,330);
  }
  function replayCard(card){if(card===lastCard)return;lastCard=card;const el=root.querySelector('.phone-cover-card');if(!el?.animate)return;el.animate([{opacity:.25,transform:'scale(.965)'},{opacity:1,transform:'scale(1)'}],{duration:420,easing:'ease-out'});}

  function render(){
    const theme=text('theme','mint'),card=text('cardStyle','classic'),effect=text('effect','none'),p=palettes[theme]||palettes.mint;
    root.dataset.theme=theme;root.dataset.card=card;root.style.setProperty('--pv-bg',p.bg);root.style.setProperty('--pv-paper',p.paper);root.style.setProperty('--pv-ink',p.ink);root.style.setProperty('--pv-muted',p.muted);root.style.setProperty('--pv-accent',p.accent);root.style.setProperty('--pv-accent2',p.accent2);
    const bride=text('brideName','Cô dâu'),groom=text('groomName','Chú rể'),d=dateObject();
    set('#pvBride',bride);set('#pvGroom',groom);set('#pvFooterNames',`${bride} & ${groom}`);set('#pvInvitation',text('invitationLine','Trân trọng kính mời bạn đến chung vui trong ngày trọng đại của chúng mình.'));set('#pvDate',fmtDate(d));set('#pvEventTime',fmtTime(d));set('#pvStory',text('storyText','Nội dung câu chuyện sẽ xuất hiện ở đây.'));set('#pvVenue',text('venueName','Địa điểm tổ chức'));set('#pvAddress',text('venueAddress','Địa chỉ sẽ hiển thị tại đây'));set('#pvGalleryTitle',text('galleryTitle','Khoảnh khắc của chúng tôi'));set('#pvGiftTitle',text('giftTitle','Mừng cưới'));set('#pvGiftText',text('giftText','Thông tin mừng cưới sẽ xuất hiện tại đây.'));set('#pvThemeName',themeNames[theme]||theme);set('#pvCardName',cardNames[card]||card);renderGallery();renderGiftQr();document.querySelectorAll('.preview-swatch').forEach(b=>b.classList.toggle('active',b.dataset.theme===theme));
    if(effect!==lastEffect)startEffect(effect);replayCard(card);
  }

  const palette=$('#previewPalette');if(palette){palette.innerHTML='';ADMIN_DATA.themes.forEach(([key,label])=>{const p=palettes[key]||palettes.mint,b=document.createElement('button');b.type='button';b.className='preview-swatch';b.dataset.theme=key;b.title=label;b.setAttribute('aria-label',`Chọn giao diện ${label}`);b.innerHTML=`<span style="--c1:${p.accent};--c2:${p.accent2};--c3:${p.bg}"></span><small>${label}</small>`;b.onclick=()=>{form.elements.theme.value=key;form.elements.theme.dispatchEvent(new Event('change',{bubbles:true}))};palette.appendChild(b)})}

  const focusMap={brideName:'pvSecCover',groomName:'pvSecCover',invitationLine:'pvSecCover',theme:'pvSecCover',cardStyle:'pvSecCover',effect:'pvSecCover',eventDate:'pvSecDate',storyText:'pvSecStory',venueName:'pvSecEvent',venueAddress:'pvSecEvent',mapUrl:'pvSecEvent',galleryTitle:'pvSecGallery',gallery:'pvSecGallery',giftTitle:'pvSecGift',giftText:'pvSecGift',giftQrUrl:'pvSecGift'};
  form.addEventListener('focusin',e=>{const id=focusMap[e.target?.name];if(!id)return;const screen=$('#previewPhoneScreen'),target=$('#'+id);if(!screen||!target)return;screen.scrollTo({top:Math.max(0,target.offsetTop-10),behavior:'smooth'})});
  form.addEventListener('input',render);form.addEventListener('change',render);
  window.AdminPreview={render,startEffect,stopEffect};render();
})();