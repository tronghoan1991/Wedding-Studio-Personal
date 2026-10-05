window.Api=(()=>{
  const cfg=window.APP_CONFIG||{}; const base=String(cfg.SUPABASE_URL||'').replace(/\/$/,''); const key=cfg.SUPABASE_ANON_KEY||''; const fn=cfg.API_FUNCTION||'wedding-api';
  const ready=()=>/^https:\/\/.+\.supabase\.co$/i.test(base)&&key&&!key.startsWith('YOUR_');
  async function jsonFetch(url,opt={}){const r=await fetch(url,opt);let d=null;try{d=await r.json()}catch{d={error:await r.text()}}if(!r.ok)throw new Error(d?.error||d?.message||`HTTP ${r.status}`);return d}
  function h(token){const out={apikey:key,'Content-Type':'application/json'};if(token)out.Authorization=`Bearer ${token}`;return out}
  async function publicCall(action,payload={},method='POST'){if(!ready())throw new Error('Backend chưa được cấu hình');const bodyPayload={...payload};const adminToken=bodyPayload.adminToken||'';delete bodyPayload.adminToken;return jsonFetch(`${base}/functions/v1/${fn}`,{method,headers:h(adminToken),body:method==='GET'?undefined:JSON.stringify({action,siteId:cfg.SITE_ID,...bodyPayload})})}
  async function login(email,password){return jsonFetch(`${base}/auth/v1/token?grant_type=password`,{method:'POST',headers:h(),body:JSON.stringify({email,password})})}
  async function table(path,token,opt={}){return jsonFetch(`${base}/rest/v1/${path}`,{...opt,headers:{...h(token),Prefer:opt.prefer||'return=representation',...(opt.headers||{})}})}
  async function storageUpload(bucket,path,file,token){const r=await fetch(`${base}/storage/v1/object/${bucket}/${path}`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${token}`,'Content-Type':file.type,'x-upsert':'true'},body:file});if(!r.ok)throw new Error(await r.text());return r.json()}
  return{cfg,ready,publicCall,login,table,storageUpload,base,key};
})();
