window.Api=(()=>{
  const rawCfg=window.APP_CONFIG||{};
  const base=String(rawCfg.SUPABASE_URL||'').replace(/\/$/,'');
  const key=rawCfg.SUPABASE_PUBLISHABLE_KEY||'';
  const fn=rawCfg.API_FUNCTION||'bright-worker';
  const uuidRe=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const urlSite=(()=>{try{return new URLSearchParams(location.search).get('site')||''}catch{return ''}})();
  let activeSiteId=uuidRe.test(urlSite)?urlSite:String(rawCfg.SITE_ID||'');
  let refreshPromise=null;
  let cachedPublicSite=null;

  const cfg={...rawCfg};
  Object.defineProperty(cfg,'SITE_ID',{enumerable:true,configurable:true,get(){return activeSiteId}});
  const ready=()=>/^https:\/\/.+\.supabase\.co$/i.test(base)&&key&&!key.startsWith('YOUR_')&&uuidRe.test(activeSiteId);
  const siteId=()=>activeSiteId;
  function setSiteId(id){const v=String(id||'').trim();if(!uuidRe.test(v))throw new Error('SITE_ID không hợp lệ');activeSiteId=v;cachedPublicSite=null;return activeSiteId}

  async function jsonFetch(url,opt={}){
    const r=await fetch(url,opt);let d=null;
    try{d=await r.json()}catch{d={error:await r.text()}}
    if(!r.ok){const msg=typeof d?.error==='string'?d.error:(d?.message||`HTTP ${r.status}`);const e=new Error(msg);e.status=r.status;e.payload=d;throw e}
    return d;
  }
  function h(token){const out={apikey:key,'Content-Type':'application/json'};if(token)out.Authorization=`Bearer ${token}`;return out}
  function readSession(){try{return JSON.parse(sessionStorage.getItem('adminSession')||'null')}catch{return null}}
  function writeSession(s){sessionStorage.setItem('adminSession',JSON.stringify(s));window.dispatchEvent(new CustomEvent('admin-session-refreshed',{detail:s}))}
  function jwtExp(token){try{const p=String(token||'').split('.')[1];if(!p)return 0;const b=p.replace(/-/g,'+').replace(/_/g,'/'),pad=b+'='.repeat((4-b.length%4)%4);return Number(JSON.parse(atob(pad)).exp||0)}catch{return 0}}
  function validFor(token,seconds=60){const exp=jwtExp(token);return !!exp&&(exp-Math.floor(Date.now()/1000)>seconds)}

  async function refreshSession(){
    if(refreshPromise)return refreshPromise;
    refreshPromise=(async()=>{
      const s=readSession();
      if(!s?.refreshToken)throw new Error('Phiên đăng nhập đã hết hạn. Hãy đăng xuất và đăng nhập lại một lần để bật tự gia hạn phiên.');
      const r=await jsonFetch(`${base}/auth/v1/token?grant_type=refresh_token`,{method:'POST',headers:h(),body:JSON.stringify({refresh_token:s.refreshToken})});
      const next={token:r.access_token,refreshToken:r.refresh_token||s.refreshToken,user:r.user||s.user};
      writeSession(next);return next.token;
    })().finally(()=>{refreshPromise=null});
    return refreshPromise;
  }

  async function ensureAdminToken(token){
    const s=readSession(),stored=s?.token||'';
    if(validFor(stored))return stored;
    if(validFor(token))return token;
    if(!stored&&!token)throw new Error('Bạn chưa đăng nhập Admin.');
    return refreshSession();
  }

  async function publicSiteFallback(){
    const data=await jsonFetch(`${base}/rest/v1/rpc/get_public_wedding_site`,{
      method:'POST',headers:h(),body:JSON.stringify({p_site_id:activeSiteId})
    });
    if(!data||typeof data!=='object')throw new Error('Thiệp chưa được công khai hoặc không tồn tại');
    cachedPublicSite=data;
    return {site:data,guest:null,accessToken:'',fallback:true};
  }

  async function publicCall(action,payload={},method='POST'){
    if(!ready())throw new Error('Backend chưa được cấu hình');
    const bodyPayload={...payload};let adminToken=bodyPayload.adminToken||'';delete bodyPayload.adminToken;
    if(adminToken)adminToken=await ensureAdminToken(adminToken);
    try{
      const result=await jsonFetch(`${base}/functions/v1/${fn}`,{method,headers:h(adminToken),body:method==='GET'?undefined:JSON.stringify({action,siteId:activeSiteId,...bodyPayload})});
      if(action==='site'&&result?.site)cachedPublicSite=result.site;
      return result;
    }catch(edgeError){
      if(!adminToken&&method==='POST'&&action==='site'){
        try{return await publicSiteFallback()}catch(fallbackError){
          const e=new Error(`Không tải được thiệp: ${edgeError.message}. Fallback: ${fallbackError.message}`);e.edgeError=edgeError;e.fallbackError=fallbackError;throw e;
        }
      }
      if(!adminToken&&method==='POST'&&action==='album'&&cachedPublicSite){
        return {urls:Array.isArray(cachedPublicSite.gallery)?cachedPublicSite.gallery.slice(0,100):[],fallback:true};
      }
      throw edgeError;
    }
  }

  async function login(email,password){return jsonFetch(`${base}/auth/v1/token?grant_type=password`,{method:'POST',headers:h(),body:JSON.stringify({email,password})})}
  function scopeTablePath(path,opt={}){
    const method=String(opt.method||'GET').toUpperCase();if(method!=='GET')return path;
    const m=String(path||'').match(/^(guests|rsvps|wishes|photos)(\?.*)?$/);if(!m||/([?&])site_id=/.test(path))return path;
    return `${path}${path.includes('?')?'&':'?'}site_id=eq.${encodeURIComponent(activeSiteId)}`;
  }
  async function table(path,token,opt={}){const actual=token?await ensureAdminToken(token):'';const scoped=scopeTablePath(path,opt);return jsonFetch(`${base}/rest/v1/${scoped}`,{...opt,headers:{...h(actual),Prefer:opt.prefer||'return=representation',...(opt.headers||{})}})}
  async function storageUpload(bucket,path,file,token){const actual=await ensureAdminToken(token);const r=await fetch(`${base}/storage/v1/object/${bucket}/${path}`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${actual}`,'Content-Type':file.type,'x-upsert':'true'},body:file});if(!r.ok){let msg=await r.text();try{const j=JSON.parse(msg);msg=j?.message||j?.error||msg}catch{}throw new Error(msg)}return r.json()}

  return{cfg,ready,publicCall,publicSiteFallback,login,table,storageUpload,ensureAdminToken,base,key,siteId,setSiteId};
})();