export async function onRequestPost(context) {
  const GEMINI_KEY = context.env.GEMINI_KEY;
  if (!GEMINI_KEY) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
  let body;
  try { body = await context.request.json(); } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }
  const resp = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=' + GEMINI_KEY,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );
  const data = await resp.json();
  return new Response(JSON.stringify(data), {
    status: resp.status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}
export async function onRequestOptions() {
  return new Response(null, { headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }});
}
