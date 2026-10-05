import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const PRIMARY_SITE_ID = '00000000-0000-0000-0000-000000000001';

function firstNamedKey(envName: string) {
  const raw = Deno.env.get(envName) || '';
  if (!raw) return '';
  try {
    const parsed = JSON.parse(raw);
    return parsed?.default || Object.values(parsed || {})[0] || '';
  } catch {
    return raw;
  }
}

const PUBLISHABLE_KEY = firstNamedKey('SUPABASE_PUBLISHABLE_KEYS') || Deno.env.get('SUPABASE_ANON_KEY') || '';
const SECRET_KEY = firstNamedKey('SUPABASE_SECRET_KEYS') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
if (!SUPABASE_URL || !PUBLISHABLE_KEY || !SECRET_KEY) throw new Error('Missing Supabase environment keys');

const admin = createClient(SUPABASE_URL, SECRET_KEY, { auth: { persistSession: false } });

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type':'application/json' } });
const clean = (v: unknown, n = 1000) => String(v ?? '').trim().slice(0, n);
const isPublicSite = (site: any) => site?.id === PRIMARY_SITE_ID || site?.is_public === true;

async function getUser(req: Request) {
  const auth = req.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const userClient = createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth:{ persistSession:false }
  });
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const body = await req.json();
    const action = clean(body.action, 64);
    const siteId = clean(body.siteId, 64);
    const site = await siteRow(siteId);

    if (action === 'site') {
      if (!isPublicSite(site)) return json({ error:'Thiệp chưa được công khai' }, 403);
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
      return json({ site:{ ...d, photoUploadCodePublic:d.photoUploadCode || '' }, guest, accessToken:'' });
    }

    if (action === 'album') {
      if (!isPublicSite(site)) return json({error:'Not public'},403);
      return json({ urls:Array.isArray(site.data?.gallery) ? site.data.gallery.slice(0,100) : [] });
    }

    if (action === 'wishes') {
      if (!isPublicSite(site)) return json({error:'Not public'},403);
      const { data, error } = await admin.from('wishes').select('name,message,created_at').eq('site_id',siteId).eq('approved',true).order('created_at',{ascending:false}).limit(100);
      if (error) throw error;
      return json({wishes:data||[]});
    }

    if (action === 'rsvp') {
      if (!isPublicSite(site) || !site.owner_id) return json({error:'Unavailable'},403);
      const guestToken = clean(body.guestToken,128); let guestId = null;
      if (guestToken) {
        const {data:g}=await admin.from('guests').select('id').eq('site_id',siteId).eq('token',guestToken).maybeSingle();
        guestId=g?.id||null;
      }
      const attend = String(body.attend) === 'yes';
      const count = Math.max(1, Math.min(20, Number(body.guests||1)));
      const record = { owner_id:site.owner_id, site_id:siteId, guest_id:guestId, name:clean(body.name,120), attend, guests_count:count, note:clean(body.note,500) };
      const {error}=await admin.from('rsvps').insert(record); if(error)throw error;
      return json({ok:true});
    }

    if (action === 'wish') {
      if (!isPublicSite(site) || !site.owner_id) return json({error:'Unavailable'},403);
      const guestToken = clean(body.guestToken,128); let guestId = null;
      if (guestToken) {
        const {data:g}=await admin.from('guests').select('id').eq('site_id',siteId).eq('token',guestToken).maybeSingle();
        guestId=g?.id||null;
      }
      const record={ owner_id:site.owner_id, site_id:siteId, guest_id:guestId, name:clean(body.name,120), message:clean(body.message,800), approved:false };
      if (!record.name || !record.message) return json({error:'Thiếu nội dung'},400);
      const {error}=await admin.from('wishes').insert(record); if(error)throw error;
      return json({ok:true});
    }

    if (action === 'photoUploadUrl') {
      if (!isPublicSite(site) || !site.owner_id) return json({error:'Unavailable'},403);
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
      const payload = body.payload || {};
      const update:any = { updated_at:new Date().toISOString(), page_password_hash:null, album_password_hash:null };
      if (payload.data && typeof payload.data==='object') update.data = payload.data;
      if (siteId === PRIMARY_SITE_ID) update.is_public = true;
      else if (typeof payload.is_public === 'boolean') update.is_public = payload.is_public;
      const {error}=await admin.from('site_settings').update(update).eq('id',siteId); if(error)throw error;
      return json({ok:true});
    }

    if (action === 'adminPhotoUrls') {
      await requireOwner(req,site);
      const paths = Array.isArray(body.paths) ? body.paths.slice(0,200).map((x:unknown)=>clean(x,500)) : [];
      const urls:string[]=[];
      for (const p of paths) {
        if(!p.startsWith(`${siteId}/`)){urls.push('');continue;}
        const {data}=await admin.storage.from('guest-photos').createSignedUrl(p,3600);
        urls.push(data?.signedUrl||'');
      }
      return json({urls});
    }

    if (action === 'adminRestore') {
      const user = await requireOwner(req,site); const b = body.backup || {};
      if (b.site?.data) {
        await admin.from('site_settings').update({
          data:b.site.data,
          is_public:siteId===PRIMARY_SITE_ID?true:!!b.site.is_public,
          owner_id:user.id,
          page_password_hash:null,
          album_password_hash:null,
          updated_at:new Date().toISOString()
        }).eq('id',siteId);
      }
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
    const status = /Unauthorized/.test(msg)?401:/Forbidden/.test(msg)?403:/Site not found/.test(msg)?404:500;
    return json({error:msg},status);
  }
});
