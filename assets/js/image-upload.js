(()=>{
  'use strict';
  const $=s=>document.querySelector(s);
  const coverInput=$('#coverFiles'),coverBtn=$('#uploadCoverBtn'),coverHidden=$('#coverImageUrls'),coverAdjust=$('#coverAdjustments'),coverStatus=$('#coverUploadStatus'),coverGrid=$('#coverUploadPreview');
  const qrInput=$('#giftQrFile'),qrBtn=$('#uploadGiftQrBtn'),qrHidden=$('#giftQrUrl'),qrStatus=$('#giftQrUploadStatus'),qrPreview=$('#giftQrAdminPreview');
  const albumInput=$('#albumFiles'),albumBtn=$('#uploadAlbumBtn'),albumHidden=$('#galleryUrls'),albumStatus=$('#albumUploadStatus'),albumGrid=$('#albumUploadPreview');
  if(!window.Api)return;
  const allowed=new Map([['image/jpeg','jpg'],['image/png','png'],['image/webp','webp']]),maxBytes=20*1024*1024;
  const defaultAdjust=()=>({x:0,y:0,scale:1,fit:'cover'});
  function session(){try{return JSON.parse(sessionStorage.getItem('adminSession')||'null')}catch{return null}}
  function publicUrl(path){return `${Api.base}/storage/v1/object/public/site-images/${path.split('/').map(encodeURIComponent).join('/')}`}
  function extFor(file){if(allowed.has(file.type))return allowed.get(file.type);const ext=(file.name.split('.').pop()||'').toLowerCase();return ['jpg','jpeg','png','webp'].includes(ext)?(ext==='jpeg'?'jpg':ext):''}
  function normalizedFile(file,ext){const type=ext==='jpg'?'image/jpeg':`image/${ext}`;return file.type===type?file:new File([file],file.name,{type})}
  function validate(file){const ext=extFor(file);if(!ext)throw new Error(`${file.name}: chỉ hỗ trợ JPG, PNG, WebP.`);if(file.size>maxBytes)throw new Error(`${file.name}: tối đa 20 MB/ảnh.`);return ext}
  function fire(el){el?.dispatchEvent(new Event('input',{bubbles:true}));el?.dispatchEvent(new Event('change',{bubbles:true}))}
  const lines=el=>String(el?.value||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0));
  function adjustments(){let arr=[];try{arr=JSON.parse(String(coverAdjust?.value||'[]'))}catch{}if(!Array.isArray(arr))arr=[];return [0,1,2].map(i=>{const a=arr[i]||{};return{x:clamp(a.x,-60,60),y:clamp(a.y,-60,60),scale:clamp(a.scale||1,.7,3),fit:a.fit==='contain'?'contain':'cover'}})}
  function saveAdjustments(arr){if(!coverAdjust)return;coverAdjust.value=JSON.stringify(arr.slice(0,3));fire(coverAdjust);applyPreviewTransforms(arr);window.AdminPreview?.render?.()}
  function applyImageStyle(img,a){if(!img)return;img.style.objectFit=a.fit;img.style.objectPosition='center';img.style.transformOrigin='center center';img.style.transform=`translate3d(${a.x}%,${a.y}%,0) scale(${a.scale})`}
  function applyPreviewTransforms(arr=adjustments()){
    const ids=['#pvCoverPhotoMain','#pvCoverPhotoLeft','#pvCoverPhotoRight'];
    ids.forEach((id,i)=>applyImageStyle($(id),arr[i]||defaultAdjust()));
  }
  function renderCards(grid,hidden,label){if(!grid)return;const urls=lines(hidden);grid.innerHTML='';urls.forEach((url,i)=>{const card=document.createElement('div');card.className='admin-media-card';const img=document.createElement('img');img.src=url;img.alt=`${label} ${i+1}`;img.loading='lazy';const del=document.createElement('button');del.type='button';del.className='admin-media-remove';del.textContent='×';del.title='Bỏ ảnh';del.onclick=()=>{hidden.value=lines(hidden).filter((_,idx)=>idx!==i).join('\n');fire(hidden);renderCards(grid,hidden,label);window.AdminPreview?.render?.()};card.append(img,del);grid.appendChild(card)});if(!urls.length){const empty=document.createElement('div');empty.className='admin-media-empty';empty.textContent=label==='Ảnh bìa'?'Chưa có ảnh bìa.':'Chưa có ảnh album.';grid.appendChild(empty)}}
  function renderCover(){
    if(!coverGrid)return;
    const urls=lines(coverHidden),arr=adjustments();coverGrid.innerHTML='';
    urls.slice(0,3).forEach((url,i)=>{
      const a=arr[i]||defaultAdjust(),card=document.createElement('div');card.className='cover-editor-card';
      const title=document.createElement('div');title.className='cover-editor-title';title.innerHTML=`<strong>Ảnh ${i+1}</strong><span>Kéo ảnh để căn vị trí</span>`;
      const stage=document.createElement('div');stage.className='cover-editor-stage';stage.title='Giữ chuột hoặc ngón tay rồi kéo ảnh';
      const img=document.createElement('img');img.src=url;img.alt=`Ảnh bìa ${i+1}`;img.draggable=false;applyImageStyle(img,a);stage.appendChild(img);
      let dragging=false,startX=0,startY=0,startAX=0,startAY=0;
      stage.addEventListener('pointerdown',e=>{dragging=true;startX=e.clientX;startY=e.clientY;startAX=a.x;startAY=a.y;stage.setPointerCapture?.(e.pointerId);stage.classList.add('is-dragging');e.preventDefault()});
      stage.addEventListener('pointermove',e=>{if(!dragging)return;const r=stage.getBoundingClientRect();a.x=clamp(startAX+(e.clientX-startX)/Math.max(1,r.width)*100,-60,60);a.y=clamp(startAY+(e.clientY-startY)/Math.max(1,r.height)*100,-60,60);applyImageStyle(img,a);arr[i]=a;saveAdjustments(arr)});
      const stop=e=>{if(!dragging)return;dragging=false;stage.classList.remove('is-dragging');try{stage.releasePointerCapture?.(e.pointerId)}catch{}};stage.addEventListener('pointerup',stop);stage.addEventListener('pointercancel',stop);
      stage.addEventListener('wheel',e=>{e.preventDefault();a.scale=clamp(a.scale+(e.deltaY<0?.08:-.08),.7,3);arr[i]=a;applyImageStyle(img,a);zoom.value=String(a.scale);zoomValue.textContent=`${Math.round(a.scale*100)}%`;saveAdjustments(arr)},{passive:false});
      const controls=document.createElement('div');controls.className='cover-editor-controls';
      const fit=document.createElement('button');fit.type='button';fit.className='btn ghost cover-fit-btn';fit.textContent=a.fit==='contain'?'Toàn ảnh':'Phủ khung';fit.onclick=()=>{a.fit=a.fit==='contain'?'cover':'contain';arr[i]=a;fit.textContent=a.fit==='contain'?'Toàn ảnh':'Phủ khung';applyImageStyle(img,a);saveAdjustments(arr)};
      const zoomWrap=document.createElement('label');zoomWrap.className='cover-zoom-control';const zoomLabel=document.createElement('span');zoomLabel.textContent='Zoom';const zoom=document.createElement('input');zoom.type='range';zoom.min='.7';zoom.max='3';zoom.step='.05';zoom.value=String(a.scale);const zoomValue=document.createElement('small');zoomValue.textContent=`${Math.round(a.scale*100)}%`;zoom.oninput=()=>{a.scale=clamp(zoom.value,.7,3);arr[i]=a;zoomValue.textContent=`${Math.round(a.scale*100)}%`;applyImageStyle(img,a);saveAdjustments(arr)};zoomWrap.append(zoomLabel,zoom,zoomValue);
      const reset=document.createElement('button');reset.type='button';reset.className='btn ghost';reset.textContent='Reset';reset.onclick=()=>{Object.assign(a,defaultAdjust());arr[i]=a;zoom.value='1';zoomValue.textContent='100%';fit.textContent='Phủ khung';applyImageStyle(img,a);saveAdjustments(arr)};
      const del=document.createElement('button');del.type='button';del.className='btn ghost danger-lite';del.textContent='Bỏ ảnh';del.onclick=()=>{const nextUrls=lines(coverHidden).filter((_,idx)=>idx!==i),nextArr=adjustments().filter((_,idx)=>idx!==i);coverHidden.value=nextUrls.join('\n');coverAdjust.value=JSON.stringify(nextArr);fire(coverHidden);fire(coverAdjust);renderCover();window.AdminPreview?.render?.()};
      controls.append(fit,zoomWrap,reset,del);card.append(title,stage,controls);coverGrid.appendChild(card);
    });
    if(!urls.length){const empty=document.createElement('div');empty.className='admin-media-empty';empty.textContent='Chưa có ảnh bìa.';coverGrid.appendChild(empty)}
    applyPreviewTransforms(arr);
  }
  function renderQr(){const url=(qrHidden?.value||'').trim();if(!qrPreview)return;if(/^https:\/\/.+\.supabase\.co\/storage\/v1\/object\/public\/site-images\//i.test(url)){qrPreview.src=url;qrPreview.hidden=false}else{qrPreview.removeAttribute('src');qrPreview.hidden=true}}
  function renderAlbum(){renderCards(albumGrid,albumHidden,'Ảnh album')}
  async function uploadOne(file,folder,userId,token){const ext=validate(file),safe=normalizedFile(file,ext),path=`${folder}/${userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;await Api.storageUpload('site-images',path,safe,token);return publicUrl(path)}
  coverBtn?.addEventListener('click',async()=>{const s=session();if(!s?.token||!s?.user?.id){coverStatus.textContent='Hãy đăng nhập lại trước khi upload.';return}const files=[...(coverInput.files||[])];if(!files.length){coverStatus.textContent='Hãy chọn từ 1 đến 3 ảnh bìa.';return}if(files.length>3){coverStatus.textContent='Bìa dùng tối đa 3 ảnh.';return}coverBtn.disabled=true;const added=[];try{for(let i=0;i<files.length;i++){coverStatus.textContent=`Đang upload ảnh bìa ${i+1}/${files.length}...`;added.push(await uploadOne(files[i],'album',s.user.id,s.token))}coverHidden.value=added.join('\n');coverAdjust.value=JSON.stringify(added.map(()=>defaultAdjust()));fire(coverHidden);fire(coverAdjust);renderCover();window.AdminPreview?.render?.();coverInput.value='';coverStatus.textContent='Đã upload. Kéo/zoom từng ảnh rồi bấm “Lưu nội dung”.'}catch(e){console.error(e);coverStatus.textContent=`Upload thất bại: ${e.message}`}finally{coverBtn.disabled=false}});
  qrBtn?.addEventListener('click',async()=>{const s=session();if(!s?.token||!s?.user?.id){qrStatus.textContent='Hãy đăng nhập lại trước khi upload.';return}const file=qrInput.files?.[0];if(!file){qrStatus.textContent='Hãy chọn ảnh QR từ máy.';return}qrBtn.disabled=true;qrStatus.textContent='Đang upload ảnh QR...';try{const url=await uploadOne(file,'qr',s.user.id,s.token);qrHidden.value=url;fire(qrHidden);renderQr();window.AdminPreview?.render?.();qrStatus.textContent='Upload QR thành công. Bấm “Lưu nội dung” để áp dụng.'}catch(e){console.error(e);qrStatus.textContent=`Upload thất bại: ${e.message}`}finally{qrBtn.disabled=false}});
  albumBtn?.addEventListener('click',async()=>{const s=session();if(!s?.token||!s?.user?.id){albumStatus.textContent='Hãy đăng nhập lại trước khi upload.';return}const files=[...(albumInput.files||[])];if(!files.length){albumStatus.textContent='Hãy chọn một hoặc nhiều ảnh.';return}if(files.length>30){albumStatus.textContent='Mỗi lần tối đa 30 ảnh.';return}albumBtn.disabled=true;const added=[];try{for(let i=0;i<files.length;i++){albumStatus.textContent=`Đang upload ${i+1}/${files.length}: ${files[i].name}`;added.push(await uploadOne(files[i],'album',s.user.id,s.token))}const all=[...lines(albumHidden),...added];albumHidden.value=[...new Set(all)].join('\n');fire(albumHidden);renderAlbum();window.AdminPreview?.render?.();albumInput.value='';albumStatus.textContent=`Đã upload ${added.length} ảnh chất lượng gốc. Bấm “Lưu nội dung” để áp dụng.`}catch(e){console.error(e);albumStatus.textContent=`Upload dừng do lỗi: ${e.message}`}finally{albumBtn.disabled=false}});
  let lastState='';function syncRender(){const state=`${coverHidden?.value||''}\n--adj--${coverAdjust?.value||''}\n--qr--${qrHidden?.value||''}\n--album--${albumHidden?.value||''}`;if(state!==lastState){lastState=state;renderCover();renderQr();renderAlbum()}}
  window.AdminImageUpload={render(){lastState='';syncRender()},applyPreviewTransforms};syncRender();setInterval(syncRender,700);
})();
