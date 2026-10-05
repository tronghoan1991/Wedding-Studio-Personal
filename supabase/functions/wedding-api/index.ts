import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type':'application/json' } });
const clean = (v: unknown, n = 1000) => String(v ?? '').trim().slice(0, n);

async function getUser(req: Request) {
  const auth = req.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: `Bearer ${token}` } }, auth:{ persistSession:false } });
  const { data } = await userClient.auth.getUser();
  return data.user || null;
}

async function siteRow(siteId: string) {
  const { data, error } = await admin.from('site_settings').select('*').eq('id', siteId).single();
  if (error || !data) throw new Error('Site not found');
  return data;
}

async function requireOwner(req: Request, site: any) {
  const user = await getUser(req);
  if (!user) throw new Error('Unauthorized');
  const ok = site.owner_id === user.id || (!site.owner_id && String(user.email || '').toLowerCase() === String(site.owner_email || '').toLowerCase());
  if (!ok) throw new Error('Forbidden');
  if (!site.owner_id) {
    const { error } = await admin.from('site_settings').update({ owner_id: user.id, updated_at: new Date().toISOString() }).eq('id', site.id);
    if (error) throw error;
    site.owner_id = user.id;
  }
  return user;
}

function honorificLabel(code: string) {
  return ({ban:'Bạn',anh:'Anh',chi:'Chị',em:'Em',co:'Cô',chu:'Chú','bac-trai':'Bác','bac-gai':'Bác',cau:'Cậu',mo:'Mợ',di:'Dì',duong:'Dượng',ong:'Ông',ba:'Bà','thay-co':'Thầy/Cô','gia-dinh':'Gia đình'} as Record<string,string>)[code] || '';
}

async function verifyHash(password: string, hash: string | null) {
  if (!hash) return true;
  const { data, error } = await admin.rpc('verify_password', { plain_text: password, password_hash: hash });
  if (error) throw error;
  return !!data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const body = await req.json();
    const action = clean(body.action, 64);
    const siteId = clean(body.siteId, 64);
    const site = await siteRow(siteId);

    if (action === 'site') {
      if (!site.is_public) return json({ error:'Thiệp chưa được công khai' }, 403);
      if (!(await verifyHash(clean(body.password, 200), site.page_password_hash))) return json({ error:'LOCKED' }, 401);
      let guest = null;
      const guestToken = clean(body.guestToken, 128);
      if (guestToken) {
        const { data:g } = await admin.from('guests').select('*').eq('site_id',siteId).eq('token',guestToken).maybeSingle();
        if (g) {
          guest = { name:g.name, honorific:g.honorific, honorificLabel:honorificLabel(g.honorific), message:g.message };
          await admin.from('guests').update({ view_count:(g.view_count||0)+1, last_viewed_at:new Date().toISOString() }).eq('id',g.id);
        }
      }
      const d = site.data || {};
      return json({ site:{ ...d, photoUploadCodePublic:d.photoUploadCode || '' }, guest });
    }

    if (action === 'album') {
      if (!site.is_public) return json({error:'Not public'},403);
      if (!(await verifyHash(clean(body.password,200), site.album_password_hash))) return json({error:'Album locked'},401);
      return json({ urls:Array.isArray(site.data?.gallery) ? site.data.gallery.slice(0,100) : [] });
    }

    if (action === 'wishes') {
      const { data, error } = await admin.from('wishes').select('name,message,created_at').eq('site_id',siteId).eq('approved',true).order('created_at',{ascending:false}).limit(100);
      if (error) throw error;
      return json({wishes:data||[]});
    }

    if (action === 'rsvp') {
      if (!site.is_public || !site.owner_id) return json({error:'Unavailable'},403);
      const guestToken = clean(body.guestToken,128); let guestId = null;
      if (guestToken) { const {data:g}=await admin.from('guests').select('id').eq('site_id',siteId).eq('token',guestToken).maybeSingle(); guestId=g?.id||null; }
      const attend = String(body.attend) === 'yes';
      const count = Math.max(1, Math.min(20, Number(body.guests||1)));
      const record = { owner_id:site.owner_id, site_id:siteId, guest_id:guestId, name:clean(body.name,120), attend, guests_count:count, note:clean(body.note,500) };
      const {error}=await admin.from('rsvps').insert(record); if(error)throw error;
      return json({ok:true});
    }

    if (action === 'wish') {
      if (!site.is_public || !site.owner_id) return json({error:'Unavailable'},403);
      const guestToken = clean(body.guestToken,128); let guestId = null;
      if (guestToken) { const {data:g}=await admin.from('guests').select('id').eq('site_id',siteId).eq('token',guestToken).maybeSingle(); guestId=g?.id||null; }
      const record={ owner_id:site.owner_id, site_id:siteId, guest_id:guestId, name:clean(body.name,120), message:clean(body.message,800), approved:false };
      if (!record.name || !record.message) return json({error:'Thiếu nội dung'},400);
      const {error}=await admin.from('wishes').insert(record); if(error)throw error;
      return json({ok:true});
    }

    if (action === 'photoUploadUrl') {
      if (!site.is_public || !site.owner_id) return json({error:'Unavailable'},403);
      const code = clean(body.uploadCode,200);
      if (!code || code !== String(site.data?.photoUploadCode || '')) return json({error:'Mã upload không đúng'},403);
      const mime = clean(body.mime,64); const size = Number(body.size||0);
      if (!['image/jpeg','image/png','image/webp'].includes(mime) || size < 1 || size > 10*1024*1024) return json({error:'File không hợp lệ'},400);
      const ext = mime==='image/png'?'png':mime==='image/webp'?'webp':'jpg';
      const path = `${siteId}/${crypto.randomUUID()}.${ext}`;
      const { data, error } = await admin.storage.from('guest-photos').createSignedUploadUrl(path);
      if (error) throw error;
      return json({ signedUrl:data.signedUrl, path });
    }

    if (action === 'photoUploaded') {
      if (!site.owner_id) return json({error:'Unavailable'},403);
      const code = clean(body.uploadCode,200);
      if (!code || code !== String(site.data?.photoUploadCode || '')) return json({error:'Mã upload không đúng'},403);
      const path = clean(body.path,500);
      if (!path.startsWith(`${siteId}/`)) return json({error:'Path không hợp lệ'},400);
      const {error}=await admin.from('photos').insert({owner_id:site.owner_id,site_id:siteId,path,approved:false}); if(error)throw error;
      return json({ok:true});
    }

    if (action === 'adminSaveSite') {
      await requireOwner(req,site);
      const payload = body.payload || {}; const update:any = { updated_at:new Date().toISOString() };
      if (payload.data && typeof payload.data==='object') update.data = payload.data;
      if (typeof payload.is_public === 'boolean') update.is_public = payload.is_public;
      if (payload.secrets?.pagePassword) { const {data,error}=await admin.rpc('hash_password',{plain_text:clean(payload.secrets.pagePassword,200)}); if(error)throw error; update.page_password_hash=data; }
      if (payload.secrets?.albumPassword) { const {data,error}=await admin.rpc('hash_password',{plain_text:clean(payload.secrets.albumPassword,200)}); if(error)throw error; update.album_password_hash=data; }
      const {error}=await admin.from('site_settings').update(update).eq('id',siteId); if(error)throw error;
      return json({ok:true});
    }

    if (action === 'adminPhotoUrls') {
      await requireOwner(req,site);
      const paths = Array.isArray(body.paths) ? body.paths.slice(0,200).map((x:unknown)=>clean(x,500)) : [];
      const urls:string[]=[];
      for (const p of paths) { if(!p.startsWith(`${siteId}/`)){urls.push('');continue;} const {data}=await admin.storage.from('guest-photos').createSignedUrl(p,3600); urls.push(data?.signedUrl||''); }
      return json({urls});
    }

    if (action === 'adminRestore') {
      const user = await requireOwner(req,site); const b = body.backup || {};
      if (b.site?.data) await admin.from('site_settings').update({data:b.site.data,is_public:!!b.site.is_public,owner_id:user.id,updated_at:new Date().toISOString()}).eq('id',siteId);
      for (const table of ['guests','rsvps','wishes'] as const) {
        const rows = Array.isArray(b[table]) ? b[table].slice(0,5000) : [];
        if (rows.length) {
          const safeRows = rows.map((r:any)=>({...r,owner_id:user.id,site_id:siteId}));
          const {error}=await admin.from(table).upsert(safeRows); if(error)throw error;
        }
      }
      return json({ok:true});
    }

    return json({error:'Unknown action'},400);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error';
    const status = /Unauthorized/.test(msg)?401:/Forbidden/.test(msg)?403:500;
    return json({error:msg},status);
  }
});
