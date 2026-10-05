(()=>{
  'use strict';
  const $=s=>document.querySelector(s);
  if(!window.Api)return;
  let mounted=false,loading=false;
  const session=()=>{try{return JSON.parse(sessionStorage.getItem('adminSession')||'null')}catch{return null}};
  const currentId=()=>Api.siteId?.()||Api.cfg.SITE_ID;
  const rootUrl=()=>`${location.origin}${location.pathname.replace(/admin\.html$/,'')}`;
  const publicUrl=id=>id===String(window.APP_CONFIG?.SITE_ID||'')?rootUrl():`${rootUrl()}?site=${encodeURIComponent(id)}`;
  const labelFor=row=>{
    const d=row?.data||{},label=String(d.siteLabel||'').trim();
    if(label)return label;
    const b=String(d.brideName||'').trim(),g=String(d.groomName||'').trim();
    if(b||g)return [b,g].filter(Boolean).join(' & ');
    return `Thiệp ${String(row.id||'').slice(0,8)}`;
  };
  async function copy(text){try{await navigator.clipboard.writeText(text);return true}catch{window.prompt('Copy link:',text);return false}}
  function ensureLayoutAssets(){
    if(!document.querySelector('link[data-theme-layouts]')){const l=document.createElement('link');l.rel='stylesheet';l.href='assets/css/theme-layouts.css?v=20261005-17';l.dataset.themeLayouts='1';document.head.appendChild(l)}
    if(!document.querySelector('style[data-layout-picker]')){const s=document.createElement('style');s.dataset.layoutPicker='1';s.textContent=`
      .layout-picker-wrap{grid-column:1/-1;margin-top:-4px}.layout-picker-title{display:flex;justify-content:space-between;gap:12px;align-items:end;margin-bottom:10px}.layout-picker-title small{color:#85756f}.layout-picker{display:grid;grid-template-columns:repeat(5,minmax(110px,1fr));gap:10px}.layout-choice{appearance:none;border:1px solid #e6d8d1;background:#fff;border-radius:16px;padding:8px;text-align:left;cursor:pointer;transition:.18s ease}.layout-choice:hover{transform:translateY(-2px);box-shadow:0 10px 26px rgba(88,55,43,.10)}.layout-choice.active{outline:2px solid #aa6f61;border-color:transparent}.layout-thumb{height:70px;border-radius:11px;overflow:hidden;position:relative;background:var(--lt-bg);border:1px solid rgba(0,0,0,.06)}.layout-thumb:before,.layout-thumb:after{content:"";position:absolute;background:var(--lt-ac);opacity:.72}.layout-thumb:before{width:38%;height:72%;left:8%;top:14%;border-radius:var(--lt-r,8px)}.layout-thumb:after{width:42%;height:16%;right:8%;top:25%;border-radius:999px;box-shadow:0 18px 0 color-mix(in srgb,var(--lt-ac) 45%,transparent),0 36px 0 color-mix(in srgb,var(--lt-ac) 25%,transparent)}.layout-choice[data-theme="magazine"] .layout-thumb:before{width:52%;height:100%;left:0;top:0;border-radius:0}.layout-choice[data-theme="gold"] .layout-thumb{background:#13110d}.layout-choice[data-theme="songhy"] .layout-thumb{background:#fff4ef;box-shadow:inset 0 0 0 3px #b51f1f}.layout-choice[data-theme="garden"] .layout-thumb:before{border-radius:48% 52% 45% 55%}.layout-choice[data-theme="terracotta"] .layout-thumb:before{border-radius:50% 50% 10px 10px}.layout-choice[data-theme="stars"] .layout-thumb{background:radial-gradient(circle,#fff 0 1px,transparent 1.4px),#080d1b;background-size:16px 16px}.layout-name{display:block;font-weight:700;font-size:12px;margin:7px 2px 1px}.layout-desc{display:block;font-size:10px;color:#8a7a74;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}@media(max-width:900px){.layout-picker{grid-template-columns:repeat(2,minmax(120px,1fr))}}
    `;document.head.appendChild(s)}
  }
  const layoutMeta={
    mint:['#f0f7f1','#527b68','Botanical lệch trái'],lavender:['#f5f0fa','#8064a2','Romantic card'],sunset:['#fff3ed','#c35f4d','Bất đối xứng'],wedding:['#faf6f2','#9a7568','Thiệp in cổ điển'],gold:['#13110d','#c7a657','Luxury điện ảnh'],songhy:['#fff4ef','#b51f1f','Lễ cưới Song hỷ'],magazine:['#f5f5f3','#111111','Tạp chí thời trang'],garden:['#f7f4f2','#71885f','Vườn hoa organic'],stars:['#080d1b','#8fa9ff','Đêm sao glass'],terracotta:['#f7eee8','#a85e43','Đất nung mái vòm']
  };
  function mountLayoutPicker(){
    ensureLayoutAssets();
    const select=$('#siteForm [name="theme"]');if(!select||$('#layoutPickerWrap'))return;
    const wrap=document.createElement('div');wrap.id='layoutPickerWrap';wrap.className='layout-picker-wrap';wrap.innerHTML='<div class="layout-picker-title"><strong>Chọn layout toàn trang</strong><small>Đổi layout không làm mất hoặc thay ảnh đã upload.</small></div><div id="layoutPicker" class="layout-picker"></div>';
    select.closest('label')?.insertAdjacentElement('afterend',wrap);
    const grid=$('#layoutPicker');
    (window.ADMIN_DATA?.themes||[]).forEach(([key,label])=>{const [bg,ac,desc]=layoutMeta[key]||['#eee','#666',''];const b=document.createElement('button');b.type='button';b.className='layout-choice';b.dataset.theme=key;b.style.setProperty('--lt-bg',bg);b.style.setProperty('--lt-ac',ac);b.innerHTML=`<span class="layout-thumb"></span><span class="layout-name">${label}</span><span class="layout-desc">${desc}</span>`;b.onclick=()=>{select.value=key;select.dispatchEvent(new Event('change',{bubbles:true}));select.dispatchEvent(new Event('input',{bubbles:true}));syncLayoutPicker()};grid.appendChild(b)});
    select.addEventListener('change',syncLayoutPicker);syncLayoutPicker();
  }
  function syncLayoutPicker(){const v=$('#siteForm [name="theme"]')?.value;document.querySelectorAll('.layout-choice').forEach(b=>b.classList.toggle('active',b.dataset.theme===v))}
  function val(name){return String($('#siteForm')?.elements?.[name]?.value||'').trim()}
  function couple(){const b=val('brideName'),g=val('groomName');return b&&g?`${b} & ${g}`:(b||g||'chúng mình')}
  function eventPhrase(){const raw=val('eventDate'),venue=val('venueName'),address=val('venueAddress');let out='';if(raw){const d=new Date(raw);if(!Number.isNaN(d.getTime()))out+=` vào ${new Intl.DateTimeFormat('vi-VN',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit',year:'numeric'}).format(d)}`}let where=venue||address;if(venue&&address)where=`${venue} (${address})`;if(where)out+=` tại ${where}`;return out}
  function activeMessage(){return `Chúng mình sắp chính thức về chung một nhà rồi 😊\n\nTrân trọng mời bạn tới chung vui cùng ${couple()}${eventPhrase()}. Sự hiện diện của bạn sẽ làm ngày vui của chúng mình thêm trọn vẹn!`}
  function activeShareUrl(){return publicUrl(currentId())}
  function activeShareText(){return `${activeMessage()}\n\n💌 Xem thiệp mời tại:\n${activeShareUrl()}`}
  function setShareStatus(text){const s=$('#commonShareStatus')||$('#siteManagerStatus');if(s){s.textContent=text;setTimeout(()=>{if(s.textContent===text)s.textContent=''},1800)}}
  function fixShareButtons(){
    const share=$('#shareCommonBtn'),copyAll=$('#copyCommonBtn'),copyLink=$('#copyCommonLinkBtn');
    if(share&&!share.dataset.siteAware){share.dataset.siteAware='1';share.onclick=async()=>{const data={title:`Thiệp cưới ${couple()}`,text:activeMessage(),url:activeShareUrl()};if(navigator.share){try{await navigator.share(data);return}catch(e){if(e?.name==='AbortError')return}}await copy(activeShareText());setShareStatus('Đã copy lời mời + link của thiệp đang chỉnh.')}}
    if(copyAll&&!copyAll.dataset.siteAware){copyAll.dataset.siteAware='1';copyAll.onclick=async()=>{await copy(activeShareText());setShareStatus('Đã copy lời mời + đúng link thiệp này.')}}
    if(copyLink&&!copyLink.dataset.siteAware){copyLink.dataset.siteAware='1';copyLink.onclick=async()=>{await copy(activeShareUrl());setShareStatus('Đã copy đúng link thiệp này.')}}
  }
  function ui(){
    if(mounted)return $('#siteManager');
    const head=$('.admin-head');if(!head)return null;
    const box=document.createElement('section');box.id='siteManager';box.className='site-manager panel';box.innerHTML=`
      <div class="site-manager-main">
        <div><strong>Thiệp đang chỉnh</strong><small>Mỗi thiệp có dữ liệu và link riêng.</small></div>
        <select id="sitePicker" aria-label="Chọn thiệp"></select>
        <button class="btn ghost" id="openSiteBtn" type="button">Mở link</button>
        <button class="btn ghost" id="copySiteBtn" type="button">Copy link</button>
        <button class="btn" id="createSiteBtn" type="button">+ Tạo thiệp mới</button>
      </div>
      <div class="site-link-row"><span>Link:</span><code id="activeSiteLink"></code></div>
      <small id="siteManagerStatus" class="status"></small>`;
    head.insertAdjacentElement('afterend',box);mounted=true;return box;
  }
  async function listSites(){
    if(loading)return;loading=true;
    const box=ui();if(!box){loading=false;return}
    const s=session();if(!s?.token){loading=false;return}
    const status=$('#siteManagerStatus');
    try{
      const token=await Api.ensureAdminToken(s.token);
      const rows=await Api.table('site_settings?select=id,data,is_public,created_at&order=created_at.asc',token,{method:'GET'});
      const picker=$('#sitePicker'),active=currentId();picker.innerHTML='';
      for(const row of rows){const o=document.createElement('option');o.value=row.id;o.textContent=`${labelFor(row)}${row.is_public?'':' · chưa công khai'}`;picker.appendChild(o)}
      if(rows.some(x=>x.id===active))picker.value=active;else if(rows[0])picker.value=rows[0].id;
      const refreshLink=()=>{
        const link=publicUrl(picker.value);$('#activeSiteLink').textContent=link;
        const headerView=$('.admin-head a[href^="index.html"],.admin-head a[href*="Wedding-Studio-Personal"]');if(headerView)headerView.href=link;
      };refreshLink();
      picker.onchange=()=>{location.href=`admin.html?site=${encodeURIComponent(picker.value)}`};
      $('#openSiteBtn').onclick=()=>window.open(publicUrl(picker.value),'_blank','noopener');
      $('#copySiteBtn').onclick=async()=>{await copy(publicUrl(picker.value));status.textContent='Đã copy link thiệp.';setTimeout(()=>status.textContent='',1500)};
      $('#createSiteBtn').onclick=async()=>{
        const name=prompt('Tên để quản lý thiệp mới (ví dụ: Thiệp nhà gái - Ngọc):','Thiệp mới');
        if(name===null)return;
        const id=crypto.randomUUID(),user=s.user||{},now=new Date();
        const data={siteLabel:String(name||'Thiệp mới').trim()||'Thiệp mới',brideName:'Cô dâu',groomName:'Chú rể',eventDate:'',venueName:'',venueAddress:'',mapUrl:'',theme:'mint',cardStyle:'classic',effect:'hearts',musicUrl:'',invitationLine:'Trân trọng kính mời bạn đến chung vui trong ngày trọng đại của chúng mình.',storyText:'',galleryTitle:'Khoảnh khắc của chúng tôi',gallery:[],coverImages:[],coverAdjustments:[],languages:['vi'],photoUploadCode:`WEDDING-${now.getTime().toString(36).toUpperCase()}`};
        status.textContent='Đang tạo thiệp mới...';
        try{
          await Api.table('site_settings',token,{method:'POST',body:JSON.stringify({id,owner_id:user.id,owner_email:user.email||'',is_public:false,data})});
          location.href=`admin.html?site=${encodeURIComponent(id)}`;
        }catch(e){status.textContent=`Không tạo được: ${e.message}. Nếu đây là lần đầu bật nhiều thiệp, hãy chạy supabase/06_multi_site.sql.`}
      };
      status.textContent='';mountLayoutPicker();fixShareButtons();syncLayoutPicker();
    }catch(e){status.textContent=e.message||'Không tải được danh sách thiệp.'}
    finally{loading=false}
  }
  function watch(){const d=$('#dashboard');if(d&&!d.hidden&&session()?.token){listSites();mountLayoutPicker();fixShareButtons();syncLayoutPicker()}}
  window.addEventListener('admin-session-refreshed',()=>setTimeout(listSites,0));
  setInterval(watch,700);watch();
})();
