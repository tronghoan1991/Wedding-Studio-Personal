(()=>{
  'use strict';
  const $=s=>document.querySelector(s);
  const btn=$('#uploadMusicBtn'), input=$('#musicFile'), hidden=$('#musicUrl'), status=$('#musicUploadStatus'), preview=$('#musicPreview');
  if(!btn||!input||!hidden||!status||!preview||!window.Api)return;

  function session(){
    try{return JSON.parse(sessionStorage.getItem('adminSession')||'null')}catch{return null}
  }
  function showPreview(url){
    if(/^https:\/\/.+\.supabase\.co\/storage\/v1\/object\/public\/site-public\//i.test(url||'')){
      preview.src=url;preview.hidden=false;
    }
  }
  setTimeout(()=>showPreview(hidden.value),1200);

  btn.addEventListener('click',async()=>{
    const s=session();
    if(!s?.token||!s?.user?.id){status.textContent='Hãy đăng nhập lại trước khi upload nhạc.';return;}
    const file=input.files?.[0];
    if(!file){status.textContent='Hãy chọn một file MP3 từ máy.';return;}
    if(!/\.mp3$/i.test(file.name)){status.textContent='Chỉ hỗ trợ file .mp3';return;}
    if(file.size>25*1024*1024){status.textContent='File MP3 tối đa 25 MB.';return;}

    btn.disabled=true;status.textContent='Đang upload MP3...';
    try{
      const mp3=(file.type==='audio/mpeg')?file:new File([file],file.name,{type:'audio/mpeg'});
      const path=`music/${s.user.id}/${Date.now()}-${crypto.randomUUID()}.mp3`;
      await Api.storageUpload('site-public',path,mp3,s.token);
      const publicUrl=`${Api.base}/storage/v1/object/public/site-public/${path.split('/').map(encodeURIComponent).join('/')}`;
      hidden.value=publicUrl;
      showPreview(publicUrl);
      status.textContent='Upload thành công. Bấm “Lưu nội dung” để áp dụng bài nhạc này.';
    }catch(e){
      console.error(e);status.textContent=`Upload thất bại: ${e.message}`;
    }finally{btn.disabled=false;}
  });
})();
