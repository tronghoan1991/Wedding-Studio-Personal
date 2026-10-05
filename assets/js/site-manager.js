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
      const refreshLink=()=>{$('#activeSiteLink').textContent=publicUrl(picker.value)};refreshLink();
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
      status.textContent='';
    }catch(e){status.textContent=e.message||'Không tải được danh sách thiệp.'}
    finally{loading=false}
  }
  function watch(){const d=$('#dashboard');if(d&&!d.hidden&&session()?.token)listSites()}
  window.addEventListener('admin-session-refreshed',()=>setTimeout(listSites,0));
  setInterval(watch,600);watch();
})();
