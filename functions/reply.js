// Owner inbox API for the website chat.
// Needs Cloudflare Pages environment variables:
//   ADMIN_PASS            -> any password you choose (used on /inbox.html)
//   SUPABASE_SERVICE_KEY  -> Supabase "secret" key (never put this in frontend code)
const SUPA_URL = 'https://hmcszrysrjdcptiqcxin.supabase.co';

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

// GET /reply?pass=...               -> recent sessions
// GET /reply?pass=...&session=ID    -> messages of one session
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
    '&order=created_at.desc&limit=60');
  return json({ sessions: sessions });
}

// POST /reply  { session_id, text }  with header x-admin-pass
export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch (e) { return json({ error: 'bad json' }, 400); }
  if (!authed(env, request.headers.get('x-admin-pass') || body.pass)) {
    return json({ error: 'unauthorized' }, 401);
  }
  if (!body.session_id || !body.text) return json({ error: 'missing fields' }, 400);
  const row = await supa(env, 'chat_messages', {
    method: 'POST',
    body: { session_id: body.session_id, role: 'owner', content: String(body.text).slice(0, 4000) }
  });
  await supa(env, 'chat_sessions?id=eq.' + encodeURIComponent(body.session_id), {
    method: 'PATCH', body: { status: 'replied' }
  });
  return json({ ok: true, message: row && row[0] });
}
