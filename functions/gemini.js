export async function onRequestPost(context) {
  const GEMINI_KEY = context.env.GEMINI_KEY;
  if (!GEMINI_KEY) {
    return new Response(JSON.stringify({ error: { code: 500, message: 'API key not configured' } }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
  let body;
  try { body = await context.request.json(); } catch (e) {
    return new Response(JSON.stringify({ error: { code: 400, message: 'Invalid JSON' } }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  // Fast models first; if one is busy (503/429) or missing (404), try the next.
  const models = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-3.5-flash'
  ];
  const retryable = [404, 429, 500, 503];
  let resp, data;

  for (let round = 0; round < 2; round++) {
    if (round > 0) await new Promise(r => setTimeout(r, 1200));
    for (const model of models) {
      let payload = body;
      for (let attempt = 0; attempt < 2; attempt++) {
        resp = await fetch(
          'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + GEMINI_KEY,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
        );
        data = await resp.json();
        // Some models reject thinkingConfig: retry once without it
        if (data.error && data.error.code === 400 && payload.generationConfig && payload.generationConfig.thinkingConfig) {
          payload = JSON.parse(JSON.stringify(body));
          delete payload.generationConfig.thinkingConfig;
          continue;
        }
        break;
      }
      if (!data.error) {
        return json(data, 200);
      }
      if (retryable.indexOf(data.error.code) < 0) {
        return json(data, resp.status);
      }
    }
  }
  return json(data, resp ? resp.status : 503);
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status,
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
