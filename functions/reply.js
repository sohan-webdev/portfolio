// Owner inbox API for the website chat.
// Needs Cloudflare Pages environment variables:
//   ADMIN_PASS            -> password used on /inbox.html and in the Gmail sync script
//   SUPABASE_SERVICE_KEY  -> Supabase "secret" key (never put this in frontend code)
const SUPA_URL = 'https://hmcszrysrjdcptiqcxin.supabase.co';
const BUCKET = 'chat-imgs';
const MAX_FILE = 8 * 1024 * 1024; // 8 MB

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

function supa(env, path, opts) {
  opts = opts || {};
  return fetch(SUPA_URL + '/rest/v1/' + path, {
    method: opts.method || 'GET',
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: 'Bearer ' + env.SUPABASE_SERVICE_KEY,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined
  }).then(r => r.json());
}

function authed(env, pass) {
  return env.ADMIN_PASS && env.SUPABASE_SERVICE_KEY && pass === env.ADMIN_PASS;
}

function b64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function uploadFile(env, file) {
  const bytes = b64ToBytes(String(file.data || '').replace(/^data:[^,]*,/, ''));
  if (!bytes.length) throw new Error('empty file');
  if (bytes.length > MAX_FILE) throw new Error('file too large (max 8 MB)');
  const safe = String(file.name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
  const path = 'owner/' + crypto.randomUUID() + '-' + safe;
  const r = await fetch(SUPA_URL + '/storage/v1/object/' + BUCKET + '/' + path, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: 'Bearer ' + env.SUPABASE_SERVICE_KEY,
      'Content-Type': file.type || 'application/octet-stream',
      'x-upsert': 'true'
    },
    body: bytes
  });
  if (!r.ok) throw new Error('upload failed: ' + (await r.text()).slice(0, 200));
  return SUPA_URL + '/storage/v1/object/public/' + BUCKET + '/' + path;
}

// GET /reply                 -> recent sessions
// GET /reply?session=ID      -> messages of one session
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (!authed(env, request.headers.get('x-admin-pass') || url.searchParams.get('pass'))) {
    return json({ error: 'unauthorized' }, 401);
  }
  const sid = url.searchParams.get('session');
  if (sid) {
    const msgs = await supa(env, 'chat_messages?session_id=eq.' + encodeURIComponent(sid) +
      '&select=id,role,content,image_url,created_at&order=created_at.asc');
    return json({ messages: msgs });
  }
  const sessions = await supa(env, 'chat_sessions?select=id,visitor_name,visitor_email,mode,status,page_url,created_at' +
    '&order=created_at.desc&limit=80');
  return json({ sessions: sessions });
}

// POST /reply  { session_id, text?, file?: { name, type, data(base64) } }  header x-admin-pass
export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch (e) { return json({ error: 'bad json' }, 400); }
  if (!authed(env, request.headers.get('x-admin-pass') || body.pass)) {
    return json({ error: 'unauthorized' }, 401);
  }
  const text = String(body.text || '').trim().slice(0, 8000);
  if (!body.session_id || (!text && !body.file)) return json({ error: 'missing fields' }, 400);

  let imageUrl = null, content = text;
  if (body.file) {
    let fileUrl;
    try { fileUrl = await uploadFile(env, body.file); }
    catch (e) { return json({ error: e.message }, 400); }
    if (/^image\//.test(body.file.type || '')) {
      imageUrl = fileUrl;
    } else {
      content = (text ? text + '\n\n' : '') + '📎 ' + (body.file.name || 'File') + '\n' + fileUrl;
    }
  }

  const row = await supa(env, 'chat_messages', {
    method: 'POST',
    body: { session_id: body.session_id, role: 'owner', content: content || '', image_url: imageUrl }
  });
  await supa(env, 'chat_sessions?id=eq.' + encodeURIComponent(body.session_id), {
    method: 'PATCH', body: { status: 'replied' }
  });
  return json({ ok: true, message: row && row[0] });
}
