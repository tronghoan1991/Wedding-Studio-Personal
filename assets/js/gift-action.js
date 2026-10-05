(()=>{
  'use strict';
  const $=s=>document.querySelector(s);let site=null,appsLoaded=false,apps=[];
  function safe(v){return String(v||'').trim()}
  function removeLegacyPasswordUi(){
    const lock=$('#lockScreen'),form=$('#lockForm'),pass=$('#lockPassword'),submit=form?.querySelector('button[type="submit"]'),title=form?.querySelector('h1'),desc=form?.querySelector('p');
    if(pass){pass.type='hidden';pass.value=''}
    if(submit)submit.hidden=true;
    if(title)title.textContent='Thiệp chưa sẵn sàng';
    if(desc)desc.textContent='Thiệp đang chưa công khai hoặc tạm thời không tải được. Vui lòng mở lại sau.';
    const err=$('#lockError');if(err){err.hidden=false;err.textContent='';}
    if(lock)lock.dataset.passwordDisabled='true';
    const album=$('#albumLock');if(album){const p=album.querySelector('p');if(p)p.textContent='Album tạm thời chưa tải được.';const input=$('#albumPassword'),btn=$('#albumUnlock');if(input)input.hidden=true;if(btn)btn.hidden=true;}
  }
  function fallbackApps(){return[{appId:'vcb',appName:'Vietcombank'},{appId:'mb',appName:'MB Bank'},{appId:'bidv',appName:'BIDV SmartBanking'},{appId:'icb',appName:'VietinBank iPay'}]}
  function payUrl(appId){const bank=safe(site?.giftBankCode).toLowerCase(),acc=safe(site?.giftAccountNo),name=safe(site?.giftAccountName),note=safe(site?.giftTransferNote)||'Chuc mung hanh phuc';const q=new URLSearchParams({app:appId,ba:`${acc}@${bank}`,bn:name,tn:note});return `https://dl.vietqr.io/pay?${q.toString()}`}
  async function copyAccount(){const text=[site?.giftBankCode,site?.giftAccountNo,site?.giftAccountName].filter(Boolean).join(' · ');try{await navigator.clipboard.writeText(text);alert('Đã sao chép thông tin tài khoản.')}catch{window.prompt('Sao chép thông tin tài khoản:',text)}}
  async function loadApps(){if(appsLoaded)return apps;appsLoaded=true;try{const ios=/iPad|iPhone|iPod/.test(navigator.userAgent),url=ios?'https://api.vietqr.io/v2/ios-app-deeplinks':'https://api.vietqr.io/v2/android-app-deeplinks',r=await fetch(url,{cache:'force-cache'}),j=await r.json(),list=j?.apps||j?.data||[];apps=list.filter(x=>x?.appId&&x?.appName).sort((a,b)=>(b.monthlyInstall||0)-(a.monthlyInstall||0));if(!apps.length)apps=fallbackApps()}catch{apps=fallbackApps()}return apps}
  function ensureDialog(){let d=$('#bankPickerDialog');if(d)return d;d=document.createElement('dialog');d.id='bankPickerDialog';d.className='bank-picker-dialog';d.innerHTML=`<div class="bank-picker-body"><div class="bank-picker-head"><div><h3>Chọn app ngân hàng</h3><p>Chọn app bạn đang dùng để mở chuyển khoản.</p></div><button class="bank-picker-close" type="button" aria-label="Đóng">×</button></div><div id="bankAppGrid" class="bank-app-grid"></div><p class="bank-picker-note">Một số app hỗ trợ tự điền người nhận/nội dung; app khác có thể chỉ mở ứng dụng. Hãy kiểm tra thông tin trước khi xác nhận chuyển khoản.</p></div>`;document.body.appendChild(d);d.querySelector('.bank-picker-close').onclick=()=>d.close();d.addEventListener('click',e=>{if(e.target===d)d.close()});return d}
  async function openPicker(){const d=ensureDialog(),grid=d.querySelector('#bankAppGrid');grid.innerHTML='<p>Đang tải danh sách ngân hàng...</p>';d.showModal();const list=await loadApps();grid.innerHTML='';for(const a of list){const b=document.createElement('button');b.type='button';b.className='bank-app-btn';const span=document.createElement('span');span.textContent=a.appName;b.appendChild(span);b.onclick=()=>{location.href=payUrl(a.appId)};grid.appendChild(b)}}
  function mount(){const gift=$('#gift .panel');if(!gift||!site?.giftBankCode||!site?.giftAccountNo)return;let wrap=$('#giftCelebrate');if(wrap)return;wrap=document.createElement('div');wrap.id='giftCelebrate';wrap.className='gift-celebrate';wrap.innerHTML=`<p class="gift-celebrate-copy"><strong>Chạm vào đây để chúc mừng 🎁</strong>Một cú chạm nhỏ, niềm vui to — mở app ngân hàng và gửi lời chúc theo cách hiện đại nhất.</p><div class="gift-bank-actions"><button id="giftOpenBank" class="btn" type="button">Mở app ngân hàng</button><button id="giftCopyAccount" class="btn ghost" type="button">Copy số tài khoản</button></div>`;gift.appendChild(wrap);$('#giftOpenBank').onclick=openPicker;$('#giftCopyAccount').onclick=copyAccount}
  async function init(){removeLegacyPasswordUi();try{const r=await Api.publicCall('site',{});site=r.site||{};mount()}catch{removeLegacyPasswordUi()}}
  if(document.readyState==='loading')window.addEventListener('DOMContentLoaded',()=>setTimeout(init,0),{once:true});else setTimeout(init,0);
})();
