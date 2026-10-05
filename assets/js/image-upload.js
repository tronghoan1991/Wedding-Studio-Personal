(()=>{
  'use strict';
  const $=s=>document.querySelector(s);
  const qrInput=$('#giftQrFile'),qrBtn=$('#uploadGiftQrBtn'),qrHidden=$('#giftQrUrl'),qrStatus=$('#giftQrUploadStatus'),qrPreview=$('#giftQrAdminPreview');
  const albumInput=$('#albumFiles'),albumBtn=$('#uploadAlbumBtn'),albumHidden=$('#galleryUrls'),albumStatus=$('#albumUploadStatus'),albumGrid=$('#albumUploadPreview');
  if(!window.Api)return;

  const allowed=new Map([['image/jpeg','jpg'],['image/png','png'],['image/webp','webp']]);
  const maxBytes=20*1024*1024;
  function session(){try{return JSON.parse(sessionStorage.getItem('adminSession')||'null')}catch{return null}}
  function publicUrl(path){return `${Api.base}/storage/v1/object/public/site-images/${path.split('/').map(encodeURIComponent).join('/')}`}
  function extFor(file){if(allowed.has(file.type))return allowed.get(file.type);const ext=(file.name.split('.').pop()||'').toLowerCase();return ['jpg','jpeg','png','webp'].includes(ext)?(ext==='jpeg'?'jpg':ext):''}
  function normalizedFile(file,ext){const type=ext==='jpg'?'image/jpeg':`image/${ext}`;return file.type===type?file:new File([file],file.name,{type})}
  function validate(file){const ext=extFor(file);if(!ext)throw new Error(`${file.name}: chỉ hỗ trợ JPG, PNG, WebP.`);if(file.size>maxBytes)throw new Error(`${file.name}: tối đa 20 MB/ảnh.`);return ext}
  function fire(el){el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))}

  function renderQr(){const url=(qrHidden?.value||'').trim();if(!qrPreview)return;if(/^https:\/\/.+\.supabase\.co\/storage\/v1\/object\/public\/site-images\//i.test(url)){qrPreview.src=url;qrPreview.hidden=false}else{qrPreview.removeAttribute('src');qrPreview.hidden=true}}
  function albumUrls(){return String(albumHidden?.value||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean)}
  function renderAlbum(){if(!albumGrid)return;const urls=albumUrls();albumGrid.innerHTML='';urls.forEach((url,i)=>{const card=document.createElement('div');card.className='admin-media-card';const img=document.createElement('img');img.src=url;img.alt=`Ảnh album ${i+1}`;img.loading='lazy';const del=document.createElement('button');del.type='button';del.className='admin-media-remove';del.textContent='×';del.title='Bỏ ảnh khỏi album';del.onclick=()=>{const next=albumUrls().filter((_,idx)=>idx!==i);albumHidden.value=next.join('\n');fire(albumHidden);renderAlbum()};card.append(img,del);albumGrid.appendChild(card)});if(!urls.length){const empty=document.createElement('div');empty.className='admin-media-empty';empty.textContent='Chưa có ảnh album.';albumGrid.appendChild(empty)}}

  async function uploadOne(file,folder,userId,token){const ext=validate(file);const safe=normalizedFile(file,ext);const path=`${folder}/${userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;await Api.storageUpload('site-images',path,safe,token);return publicUrl(path)}

  qrBtn?.addEventListener('click',async()=>{
    const s=session();if(!s?.token||!s?.user?.id){qrStatus.textContent='Hãy đăng nhập lại trước khi upload.';return}
    const file=qrInput.files?.[0];if(!file){qrStatus.textContent='Hãy chọn ảnh QR từ máy.';return}
    qrBtn.disabled=true;qrStatus.textContent='Đang upload ảnh QR...';
    try{const url=await uploadOne(file,'qr',s.user.id,s.token);qrHidden.value=url;fire(qrHidden);renderQr();window.AdminPreview?.render?.();qrStatus.textContent='Upload QR thành công. Bấm “Lưu nội dung” để áp dụng.'}catch(e){console.error(e);qrStatus.textContent=`Upload thất bại: ${e.message}`}finally{qrBtn.disabled=false}
  });

  albumBtn?.addEventListener('click',async()=>{
    const s=session();if(!s?.token||!s?.user?.id){albumStatus.textContent='Hãy đăng nhập lại trước khi upload.';return}
    const files=[...(albumInput.files||[])];if(!files.length){albumStatus.textContent='Hãy chọn một hoặc nhiều ảnh.';return}
    if(files.length>30){albumStatus.textContent='Mỗi lần tối đa 30 ảnh.';return}
    albumBtn.disabled=true;const added=[];
    try{
      for(let i=0;i<files.length;i++){albumStatus.textContent=`Đang upload ${i+1}/${files.length}: ${files[i].name}`;added.push(await uploadOne(files[i],'album',s.user.id,s.token))}
      const all=[...albumUrls(),...added];albumHidden.value=[...new Set(all)].join('\n');fire(albumHidden);renderAlbum();window.AdminPreview?.render?.();albumInput.value='';albumStatus.textContent=`Đã upload ${added.length} ảnh chất lượng gốc. Bấm “Lưu nội dung” để áp dụng.`
    }catch(e){console.error(e);albumStatus.textContent=`Upload dừng do lỗi: ${e.message}`}finally{albumBtn.disabled=false}
  });

  window.AdminImageUpload={render(){renderQr();renderAlbum()}};
  setTimeout(()=>window.AdminImageUpload.render(),1000);
})();
