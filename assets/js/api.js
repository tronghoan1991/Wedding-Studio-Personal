window.Api=(()=>{
  const cfg=window.APP_CONFIG||{};
  const base=String(cfg.SUPABASE_URL||'').replace(/\/$/,'');
  const key=cfg.SUPABASE_PUBLISHABLE_KEY||'';
  const fn=cfg.API_FUNCTION||'wedding-api';
  let refreshPromise=null;

  const ready=()=>/^https:\/\/.+\.supabase\.co$/i.test(base)&&key&&!key.startsWith('YOUR_');
  async function jsonFetch(url,opt={}){const r=await fetch(url,opt);let d=null;try{d=await r.json()}catch{d={error:await r.text()}}if(!r.ok)throw new Error(typeof d?.error==='string'?d.error:(d?.message||`HTTP ${r.status}`));return d}
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
      writeSession(next);
      return next.token;
    })().finally(()=>{refreshPromise=null});
    return refreshPromise;
  }

  async function ensureAdminToken(token){
    const s=readSession();
    const stored=s?.token||'';
    if(validFor(stored))return stored;
    if(validFor(token))return token;
    if(!stored&&!token)throw new Error('Bạn chưa đăng nhập Admin.');
    return refreshSession();
  }

  async function publicCall(action,payload={},method='POST'){
    if(!ready())throw new Error('Backend chưa được cấu hình');
    const bodyPayload={...payload};
    let adminToken=bodyPayload.adminToken||'';
    delete bodyPayload.adminToken;
    if(adminToken)adminToken=await ensureAdminToken(adminToken);
    return jsonFetch(`${base}/functions/v1/${fn}`,{method,headers:h(adminToken),body:method==='GET'?undefined:JSON.stringify({action,siteId:cfg.SITE_ID,...bodyPayload})});
  }
  async function login(email,password){return jsonFetch(`${base}/auth/v1/token?grant_type=password`,{method:'POST',headers:h(),body:JSON.stringify({email,password})})}
  async function table(path,token,opt={}){const actual=token?await ensureAdminToken(token):'';return jsonFetch(`${base}/rest/v1/${path}`,{...opt,headers:{...h(actual),Prefer:opt.prefer||'return=representation',...(opt.headers||{})}})}
  async function storageUpload(bucket,path,file,token){const actual=await ensureAdminToken(token);const r=await fetch(`${base}/storage/v1/object/${bucket}/${path}`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${actual}`,'Content-Type':file.type,'x-upsert':'true'},body:file});if(!r.ok){let msg=await r.text();try{const j=JSON.parse(msg);msg=j?.message||j?.error||msg}catch{}throw new Error(msg)}return r.json()}
  return{cfg,ready,publicCall,login,table,storageUpload,ensureAdminToken,base,key};
})();
