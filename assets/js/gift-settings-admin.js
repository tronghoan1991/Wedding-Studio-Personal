(()=>{
  'use strict';
  const $=s=>document.querySelector(s),siteId=()=>window.Api?.cfg?.SITE_ID;
  const els={bank:$('#giftBankCode'),account:$('#giftAccountNo'),name:$('#giftAccountName'),note:$('#giftTransferNote'),save:$('#saveGiftBankBtn'),status:$('#giftBankStatus'),form:$('#siteForm'),siteStatus:$('#siteStatus')};
  if(!window.Api||!els.bank||!els.account)return;
  function session(){try{return JSON.parse(sessionStorage.getItem('adminSession')||'null')}catch{return null}}
  async function token(){const s=session();if(!s?.token)throw new Error('Hãy đăng nhập lại.');return Api.ensureAdminToken(s.token)}
  function values(){return{giftBankCode:String(els.bank.value||'').trim().toUpperCase(),giftAccountNo:String(els.account.value||'').replace(/\s+/g,''),giftAccountName:String(els.name.value||'').trim(),giftTransferNote:String(els.note.value||'').trim()}}
  function fill(d={}){els.bank.value=d.giftBankCode||'';els.account.value=d.giftAccountNo||'';els.name.value=d.giftAccountName||'';els.note.value=d.giftTransferNote||''}
  async function row(t){const r=await Api.table(`site_settings?id=eq.${encodeURIComponent(siteId())}&select=*`,t,{method:'GET'});if(!r?.length)throw new Error('Không tìm thấy cấu hình thiệp.');return r[0]}
  async function load(){try{const t=await token(),r=await row(t);fill(r.data||{})}catch{}}
  async function save(show=true){const t=await token(),r=await row(t),data={...(r.data||{}),...values()};await Api.publicCall('adminSaveSite',{payload:{data,is_public:!!r.is_public},adminToken:t});if(show)els.status.textContent='Đã lưu thông tin ngân hàng.'}
  els.save.onclick=async()=>{els.save.disabled=true;els.status.textContent='Đang lưu...';try{await save(true)}catch(e){els.status.textContent=e.message}finally{els.save.disabled=false}};
  let preserve=false;els.form?.addEventListener('submit',()=>{preserve=true},true);
  const observer=new MutationObserver(()=>{if(preserve&&/Đã lưu/.test(els.siteStatus?.textContent||'')){preserve=false;save(false).catch(()=>{})}});if(els.siteStatus)observer.observe(els.siteStatus,{childList:true,subtree:true,characterData:true});
  let tries=0;const timer=setInterval(()=>{tries++;if(!$('#dashboard')?.hidden){clearInterval(timer);load()}else if(tries>30)clearInterval(timer)},300);

  // Load the multi-invitation manager without changing the existing admin boot order.
  if(!document.querySelector('link[data-site-manager]')){const l=document.createElement('link');l.rel='stylesheet';l.href='assets/css/site-manager.css?v=20261005-17';l.dataset.siteManager='1';document.head.appendChild(l)}
  if(!document.querySelector('script[data-site-manager]')){const s=document.createElement('script');s.src='assets/js/site-manager.js?v=20261005-17';s.dataset.siteManager='1';document.body.appendChild(s)}
})();
