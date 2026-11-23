/*
 * Live Chat Widget  v2.0  —  sohan-webdev.pages.dev
 *
 * ⚠️  IMPORTANT: Your old Gemini API key was exposed in public GitHub.
 *     Google will DELETE it. Get a NEW key at:
 *     https://aistudio.google.com/app/apikey
 *     Restrict it to HTTP referrer: https://sohan-webdev.pages.dev/*
 *     Then update GEMINI_KEY below.
 *
 * Features:
 *  - Two modes: AI Agent + Direct Message
 *  - Suggested message chips
 *  - Escalation to WhatsApp/Email when AI doesn't know
 *  - Contact form with image attachment
 *  - Chat history stored in Supabase (optional, free at supabase.com)
 *  - Admin panel at /admin.html
 */
(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════════
     CONFIG  —  update these values
  ═══════════════════════════════════════════════════════════ */
  var CFG = {
    GEMINI_KEY:  '',  // key stored in Cloudflare env, not here

    // 📧 Web3Forms — email notifications to owner
    W3F_KEY:     '4a36a48e-1581-4fb8-86f9-245c2769a4d6',
    OWNER_EMAIL: 'mdsohanhossain337@gmail.com',

    // 💬 WhatsApp number with country code (e.g. 8801XXXXXXXXX)
    //    Leave empty — auto-read from /content.json contact.whatsapp
    WHATSAPP:    '',

    // 🗄  Supabase — enables /admin.html chat history (free at supabase.com)
    //    Leave empty to skip (chat + email still work without this)
    SUPA_URL:    'https://hmcszrysrjdcptiqcxin.supabase.co',   // e.g. https://xyz.supabase.co
    SUPA_ANON:   'sb_publishable_gM19SHNk-nV0jMGqVntLUg_11kyn-cZ',   // anon/public key

    // 🎨 Colors
    PRIMARY:     '#16122A',  // panel background
    ACCENT:      '#8B5CF6',  // buttons and highlights
  };
  /* ═══════════════════════════════════════════════════════════ */

  /* — Variables — */
  var chatbotCfg = {};
  var siteData  = null;
  var waNum     = CFG.WHATSAPP;
  var chatHist  = [];           // {r: 'user'|'model', t: '...'}
  var visitor   = null;         // {name, email, init}
  var sessionId = null;
  var isOpen    = false;
  var chatMode  = null;         // 'ai' | 'contact'
  var imgAttach = null;         // {file, dataUrl}

  /* — Load /content.json — */
  fetch('/content.json')
    .then(function (r) { return r.json(); })
    .then(function (d) {
      siteData = d;
      if (!waNum && d.contact && d.contact.whatsapp) {
        waNum = String(d.contact.whatsapp).replace(/\D/g, '');
      }
      if (d.chatbot_whatsapp) waNum = String(d.chatbot_whatsapp);
      if (d.chatbot_wa_msg) chatbotCfg.wa_msg = d.chatbot_wa_msg;
      if (d.chatbot_email) chatbotCfg.email = d.chatbot_email;
      if (d.chatbot_chips && d.chatbot_chips.length) chatbotCfg.chips = d.chatbot_chips.map(function(c){return c.text;}).filter(Boolean);
      if (d.chatbot_greeting) chatbotCfg.greeting = d.chatbot_greeting;
    })
    .catch(function () { siteData = {}; });

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     SUPABASE HELPERS
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  function dbInsert(table, data) {
    if (!CFG.SUPA_URL || !CFG.SUPA_ANON) return Promise.resolve(null);
    return fetch(CFG.SUPA_URL + '/rest/v1/' + table, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': CFG.SUPA_ANON,
        'Authorization': 'Bearer ' + CFG.SUPA_ANON,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(data)
    }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }

  function dbUploadFile(file) {
    if (!CFG.SUPA_URL || !CFG.SUPA_ANON) return Promise.resolve(null);
    var path = 'chat-imgs/' + genUUID() + '-' + file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    return fetch(CFG.SUPA_URL + '/storage/v1/object/' + path, {
      method: 'POST',
      headers: {
        'apikey': CFG.SUPA_ANON,
        'Authorization': 'Bearer ' + CFG.SUPA_ANON,
        'Content-Type': file.type
      },
      body: file
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        return d.error ? null : CFG.SUPA_URL + '/storage/v1/object/public/' + path;
      })
      .catch(function () { return null; });
  }

  function genUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 3 | 8)).toString(16);
    });
  }

  function logMsg(role, text, imgUrl) {
    if (!sessionId || !CFG.SUPA_URL) return;
    dbInsert('chat_messages', {
      session_id: sessionId,
      role: role,
      content: text,
      image_url: imgUrl || null
    });
  }

  function openSession(m) {
    sessionId = genUUID();
    if (!CFG.SUPA_URL) return Promise.resolve();
    return dbInsert('chat_sessions', {
      visitor_name: visitor.name,
      visitor_email: visitor.email,
      mode: m,
      page_url: location.href,
      status: 'new'
    }).then(function (d) {
      if (d && d[0] && d[0].id) sessionId = d[0].id;
    });
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     AI — GEMINI
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  function buildSystemPrompt() {
    var d = siteData || {};
    var name = [d.name_prefix, d.name_first, d.name_last].filter(Boolean).join(' ') || 'Sohan';
    var role = (d.roles || [])[0] || 'Shopify Developer';
    var about = (d.about || []).join(' ');
    var services = (d.services || []).map(function (s) {
      return '- ' + s.title + ': ' + s.desc +
        ((s.items || []).length ? '\n  Includes: ' + s.items.join(', ') : '');
    }).join('\n');
    var skills = (d.skills || []).map(function (s) { return s.name; }).join(', ');
    var faqs = (d.faq || []).map(function (f) { return 'Q: ' + f.q + '\nA: ' + f.a; }).join('\n\n');
    var contact = d.contact || {};
    var avail = d.available ? 'Currently AVAILABLE for new projects' : 'Not currently taking new projects';

    return 'You are a smart, friendly AI assistant for ' + name + ', a ' + role + ' based in ' + (d.location || 'Bangladesh') + '.\n\n'
      + 'ABOUT:\n' + about + '\n\n'
      + 'SERVICES:\n' + services + '\n\n'
      + 'SKILLS: ' + skills + '\n\n'
      + 'CONTACT:\nEmail: ' + (contact.email || CFG.OWNER_EMAIL) + '\nWhatsApp: ' + (contact.whatsapp || '') + '\n\n'
      + 'FAQ:\n' + faqs + '\n\n'
      + 'AVAILABILITY: ' + avail + '\n\n'
      + 'INSTRUCTIONS:\n'
      + '- Give detailed, helpful replies. Explain fully what Sohan can do — no need to be brief.\n- Sohan is highly skilled and can handle almost any Shopify or web development task, so confidently say yes to most things.\n'
      + '- For pricing: say it depends on project scope and suggest contacting ' + name + ' directly.\n'
      + '- Only use [ESCALATE] if the question is completely unrelated to web/Shopify development or if you truly cannot answer. For anything related to Shopify, web dev, or Sohan's work — answer confidently. If the question is outside your knowledge about ' + name + ', start your reply ONLY with [ESCALATE] then write a brief friendly note (e.g. "[ESCALATE] Great question! For this Sohan would be better placed to help.").\n'
      + '- Match the visitor\'s language (Bangla → reply in Bangla, English → reply in English).\n'
      + '- Never invent information.';
  }

  function askAI(text, callback) {
    var contents = chatHist.map(function (m) {
      return { role: m.r === 'user' ? 'user' : 'model', parts: [{ text: m.t }] };
    });
    contents.push({ role: 'user', parts: [{ text: text }] });

    fetch(
      '/gemini',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: buildSystemPrompt() }] },
          contents: contents,
          generationConfig: { maxOutputTokens: 1200, temperature: 0.7 }
        })
      }
    )
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var reply = (d.candidates && d.candidates[0] &&
          d.candidates[0].content && d.candidates[0].content.parts &&
          d.candidates[0].content.parts[0].text) || '[ESCALATE]';
        callback(reply);
      })
      .catch(function () { callback('[ESCALATE]'); });
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     EMAIL — Web3Forms
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  function sendEmail(data) {
    return fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({ access_key: CFG.W3F_KEY, botcheck: '' }, data))
    }).catch(function () {});
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     CSS
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  function injectStyles() {
    var P = CFG.PRIMARY, A = CFG.ACCENT;
    var css = [
      '#_lc,#_lc *{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}',
      /* floating button */
      '#_lc-btn{position:fixed;bottom:24px;right:24px;width:58px;height:58px;border-radius:50%;border:2.5px solid ' + A + ';',
      'background:' + P + ';cursor:pointer;display:flex;align-items:center;justify-content:center;',
      'box-shadow:0 4px 20px rgba(139,92,246,.3);z-index:2147483646;',
      'transition:transform .2s,box-shadow .2s;animation:_lc-pulse 3.5s ease infinite}',
      '#_lc-btn:hover{transform:scale(1.08);box-shadow:0 6px 28px rgba(139,92,246,.5)}',
      '@keyframes _lc-pulse{0%,100%{box-shadow:0 4px 20px rgba(139,92,246,.3),0 0 0 0 rgba(139,92,246,.35)}',
      '60%{box-shadow:0 4px 20px rgba(139,92,246,.3),0 0 0 10px rgba(139,92,246,0)}}',
      '#_lc-btn svg{width:26px;height:26px;fill:' + A + '}',
      '#_lc-btn .ic-open{display:block}#_lc-btn .ic-close{display:none;fill:#fff!important}',
      '#_lc-btn.on .ic-open{display:none}#_lc-btn.on .ic-close{display:block}',
      /* badge */
      '#_lc-badge{position:absolute;top:-4px;right:-4px;width:18px;height:18px;background:#ef4444;',
      'border-radius:50%;font-size:10px;font-weight:700;color:#fff;',
      'display:none;align-items:center;justify-content:center;border:2px solid ' + P + '}',
      /* panel */
      '#_lc-panel{position:fixed;bottom:94px;right:24px;width:375px;max-height:580px;',
      'background:' + P + ';border:1px solid rgba(139,92,246,.18);border-radius:22px;overflow:hidden;',
      'display:flex;flex-direction:column;z-index:2147483645;',
      'box-shadow:0 24px 64px rgba(0,0,0,.7),0 0 0 1px rgba(139,92,246,.08);',
      'transform:translateY(16px) scale(.96);opacity:0;pointer-events:none;',
      'transition:transform .28s cubic-bezier(.34,1.56,.64,1),opacity .2s}',
      '#_lc-panel.on{transform:none;opacity:1;pointer-events:all}',
      '@media(max-width:420px){#_lc-panel{width:calc(100vw - 20px);right:10px;bottom:82px}}',
      /* header */
      '#_lc-hd{padding:15px 18px;background:linear-gradient(135deg,' + P + ' 0%,rgba(26,22,50,1) 100%);',
      'display:flex;align-items:center;gap:11px;flex-shrink:0;border-bottom:1px solid rgba(139,92,246,.12)}',
      '#_lc-hd .av{width:40px;height:40px;background:' + A + ';border-radius:50%;overflow:hidden;display:flex;',
      'align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:14px;flex-shrink:0}',
      '#_lc-hd .inf{flex:1;overflow:hidden}',
      '#_lc-hd .inf b{color:#fff;font-size:14px;font-weight:600;display:block}',
      '#_lc-hd .inf small{color:rgba(255,255,255,.55);font-size:11px;display:flex;align-items:center;gap:5px}',
      '#_lc-hd .dot{width:7px;height:7px;background:#22c55e;border-radius:50%;flex-shrink:0;',
      'animation:_lc-blink 2s ease infinite;box-shadow:0 0 5px #22c55e}',
      '@keyframes _lc-blink{0%,100%{opacity:1}50%{opacity:.4}}',
      '#_lc-close{background:none;border:none;cursor:pointer;color:rgba(255,255,255,.4);',
      'width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;',
      'flex-shrink:0;transition:all .2s}',
      '#_lc-close:hover{background:rgba(255,255,255,.1);color:#fff}',
      '#_lc-close svg{width:16px;height:16px;fill:currentColor}',
      /* body */
      '#_lc-body{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;',
      'max-height:400px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.08) transparent}',
      '#_lc-body::-webkit-scrollbar{width:4px}',
      '#_lc-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:2px}',
      /* form typography */
      '._lc-title{color:#fff;font-size:14.5px;font-weight:600;line-height:1.5}',
      '._lc-sub{color:rgba(255,255,255,.5);font-size:12.5px;line-height:1.55;margin-top:3px}',
      /* inputs */
      '._lcfi{width:100%!important;padding:10px 16px!important;background:rgba(255,255,255,.06)!important;',
      'border:1px solid rgba(255,255,255,.1)!important;border-radius:12px!important;color:#fff!important;font-size:14px!important;',
      'outline:none!important;transition:border-color .2s;font-family:inherit!important;box-sizing:border-box!important;min-height:44px!important}',
      '._lcfi:focus{border-color:' + A + '!important}._lcfi::placeholder{color:rgba(255,255,255,.28)!important}',
      '._lcft{width:100%!important;padding:10px 14px!important;background:rgba(255,255,255,.06)!important;',
      'border:1px solid rgba(255,255,255,.1)!important;border-radius:12px!important;color:#fff!important;font-size:14px!important;',
      'outline:none!important;transition:border-color .2s;font-family:inherit!important;resize:vertical!important;min-height:100px!important;line-height:1.6!important;box-sizing:border-box!important}',
      '._lcft:focus{border-color:' + A + '!important}._lcft::placeholder{color:rgba(255,255,255,.28)!important}',
      /* buttons */
      '._lcfb{padding:12px 24px!important;border-radius:12px!important;font-size:14px!important;font-weight:600!important;cursor:pointer!important;',
      'transition:opacity .2s,transform .1s;font-family:inherit!important;width:100%!important;border:none!important;min-height:46px!important;box-sizing:border-box!important;display:block!important}',
      '._lcfb:active{transform:scale(.98)}._lcfb:hover{opacity:.88}',
      '._lcfbp{background:' + A + '!important;color:#fff!important}',
      '._lcfbs{background:rgba(255,255,255,.07)!important;color:rgba(255,255,255,.75)!important;border:1px solid rgba(255,255,255,.1)!important}',
      /* mode cards */
      '._lc-modes{display:flex;flex-direction:column;gap:9px;padding:4px 0}',
      '._lc-card{padding:14px 16px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.08);',
      'border-radius:14px;cursor:pointer;display:flex;align-items:center;gap:13px;transition:all .2s}',
      '._lc-card:hover{background:rgba(139,92,246,.1);border-color:rgba(139,92,246,.35)}',
      '._lc-card .ico{width:42px;height:42px;border-radius:50%;background:rgba(139,92,246,.12);',
      'display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}',
      '._lc-card b{color:#fff;font-size:14px;display:block;margin-bottom:3px}',
      '._lc-card span{color:rgba(255,255,255,.45);font-size:12px}',
      /* suggestions */
      '._lc-sugg{display:flex;flex-direction:column;gap:9px}',
      '._lc-slbl{color:rgba(255,255,255,.35);font-size:11px;text-transform:uppercase;letter-spacing:.5px}',
      '._lc-chips{display:flex;flex-wrap:wrap;gap:7px}',
      '._lc-chip{padding:7px 14px;background:rgba(139,92,246,.1);border:1px solid rgba(139,92,246,.22);',
      'border-radius:20px;color:rgba(255,255,255,.85);font-size:13.5px;cursor:pointer;',
      'transition:all .15s;white-space:nowrap;font-family:inherit}',
      '._lc-chip:hover{background:rgba(139,92,246,.22);color:#fff;border-color:rgba(139,92,246,.5)}',
      /* messages */
      '._lc-msg{display:flex;gap:8px;align-items:flex-end}._lc-msg.u{flex-direction:row-reverse}',
      '._lc-msg .bbl{max-width:80%;padding:10px 14px;border-radius:18px;font-size:14px;line-height:1.6;word-break:break-word}',
      '._lc-msg.b .bbl{background:rgba(255,255,255,.07);color:rgba(255,255,255,.88);border-bottom-left-radius:5px}',
      '._lc-msg.u .bbl{background:' + A + ';color:#fff;border-bottom-right-radius:5px}',
      '._lc-msg .av{width:28px;height:28px;border-radius:50%;overflow:hidden;display:flex;align-items:center;',
      'justify-content:center;font-size:10px;color:#fff;font-weight:700;flex-shrink:0}',
      '._lc-msg.b .av{background:rgba(139,92,246,.18);color:' + A + '}._lc-msg.u .av{background:rgba(255,255,255,.12)}',
      /* typing indicator */
      '.lc-tyd{display:flex;gap:5px;align-items:center;padding:3px 0}',
      '.lc-tyd span{width:7px;height:7px;background:rgba(139,92,246,.5);border-radius:50%;animation:_lc-t 1.2s infinite}',
      '.lc-tyd span:nth-child(2){animation-delay:.2s}.lc-tyd span:nth-child(3){animation-delay:.4s}',
      '@keyframes _lc-t{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}',
      /* escalation card */
      '._lc-esc{background:rgba(139,92,246,.07);border:1px solid rgba(139,92,246,.18);',
      'border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:10px;max-width:85%}',
      '._lc-esc p{color:rgba(255,255,255,.65);font-size:13px;line-height:1.55}',
      '._lc-esc-row{display:flex;gap:8px}',
      '._lc-esc-row>*{flex:1;padding:8px 12px;border-radius:10px;font-size:13px;font-weight:600;',
      'cursor:pointer;text-decoration:none;text-align:center;display:flex;align-items:center;',
      'justify-content:center;gap:5px;transition:opacity .2s;border:none;font-family:inherit}',
      '._lc-wa{background:#25D366;color:#fff!important}',
      '._lc-em{background:rgba(255,255,255,.1);color:rgba(255,255,255,.85)!important;',
      'border:1px solid rgba(255,255,255,.12)!important}',
      '._lc-esc-row>*:hover{opacity:.85}',
      /* footer chat input */
      '#_lc-ft{padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);',
      'display:none;gap:8px;align-items:flex-end;flex-shrink:0}',
      '#_lc-in{flex:1;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);',
      'border-radius:22px;padding:12px 16px;color:#fff;font-size:14px;outline:none;',
      'transition:border-color .2s;font-family:inherit;resize:none;max-height:120px;line-height:1.5;overflow-y:hidden}',
      '#_lc-in:focus{border-color:' + A + '}#_lc-in::placeholder{color:rgba(255,255,255,.3)}',
      '#_lc-send{width:42px;height:42px;background:' + A + ';border:none;border-radius:50%;',
      'cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;',
      'transition:opacity .2s;padding:0}',
      '#_lc-send:hover{opacity:.85}#_lc-send svg{width:18px;height:18px;fill:#fff}',
      /* brand footer */
      '#_lc-brand{text-align:center;font-size:11px;color:rgba(139,92,246,.55);padding:5px 0 9px;letter-spacing:.3px}',
      /* image attach */
      '._lc-attach{padding:9px 14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);',
      'border-radius:10px;color:rgba(255,255,255,.6);font-size:13px;cursor:pointer;',
      'transition:all .2s;font-family:inherit;text-align:center;width:100%}',
      '._lc-attach:hover{background:rgba(255,255,255,.1)}',
      '._lc-preview{border-radius:10px;overflow:hidden;position:relative;max-width:160px}',
      '._lc-preview img{width:100%;display:block;border-radius:10px}',
      '._lc-preview .rm{position:absolute;top:5px;right:5px;background:rgba(0,0,0,.7);border:none;',
      'border-radius:50%;width:22px;height:22px;color:#fff;cursor:pointer;font-size:14px;',
      'display:flex;align-items:center;justify-content:center;line-height:1}',
      /* success */
      '._lc-ok{text-align:center;padding:24px 16px;display:flex;flex-direction:column;align-items:center;gap:14px}',
      '._lc-ok .ck{font-size:44px}._lc-ok h3{color:#fff;font-size:15px}',
      '._lc-ok p{color:rgba(255,255,255,.5);font-size:13px;line-height:1.55}',
    ].join('');

    var el = document.createElement('style');
    el.id = '_lc-style';
    el.textContent = css;
    document.head.appendChild(el);
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     BUILD DOM
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  function buildDOM() {
    var wrap = document.createElement('div');
    wrap.id = '_lc';
    wrap.innerHTML =
      '<button id="_lc-btn" aria-label="Open Live Chat">' +
        '<svg class="ic-open" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 10H6v-2h12v2zm0-3H6V7h12v2z"/></svg>' +
        '<svg class="ic-close" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>' +
        '<span id="_lc-badge" style="display:none">0</span>' +
      '</button>' +
      '<div id="_lc-panel" role="dialog" aria-label="Live Chat">' +
        '<div id="_lc-hd">' +
          '<div class="av" id="_lc-av">' + (localStorage.getItem("_lc_avatar") ? '<img src="'+localStorage.getItem("_lc_avatar")+'" style="width:100%;height:100%;border-radius:50%;object-fit:cover">' : 'SH') + '</div>' +
          '<div class="inf">' +
            '<b>Live Chat</b>' +
            '<small><span class="dot"></span>Online &middot; AI &amp; Direct Support</small>' +
          '</div>' +
          '<button id="_lc-close" aria-label="Close chat">' +
            '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>' +
          '</button>' +
        '</div>' +
        '<div id="_lc-body"></div>' +
        '<div id="_lc-ft">' +
          '<textarea id="_lc-in" rows="1" placeholder="Type a message…"></textarea>' +
          '<button id="_lc-send"><svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>' +
        '</div>' +
        '<div id="_lc-brand">Powered by ' + ((siteData && siteData.name_first) ? esc(siteData.name_first) + ' ' + esc(siteData.name_last || '') : 'Sohan Hossain') + '</div>' +
      '</div>';
    document.body.appendChild(wrap);
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     RENDER SCREENS
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  function $b() { return document.getElementById('_lc-body'); }
  function $f() { return document.getElementById('_lc-ft'); }

  function showIntroForm() {
    $f().style.display = 'none';
    $b().innerHTML =
      '<div style="display:flex;flex-direction:column;gap:12px">' +
        '<p class="_lc-title">👋 Hello! Nice to meet you.</p>' +
        '<p class="_lc-sub">Share your name and email so Sohan can follow up if needed.</p>' +
        '<input id="_lc-nm" class="_lcfi" type="text" placeholder="Your name" autocomplete="name" />' +
        '<input id="_lc-em" class="_lcfi" type="email" placeholder="Your email address" autocomplete="email" />' +
        '<button class="_lcfb _lcfbp" id="_lc-go">Continue →</button>' +
      '</div>';
    var go = function () {
      var nm = val('_lc-nm'), em = val('_lc-em');
      if (!nm) { flash('_lc-nm'); return; }
      if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { flash('_lc-em'); return; }
      visitor = { name: nm, email: em, init: nm[0].toUpperCase() };
      showModeSelector();
    };
    document.getElementById('_lc-go').onclick = go;
    document.getElementById('_lc-em').onkeypress = function (e) { if (e.key === 'Enter') go(); };
    setTimeout(function () { var el = document.getElementById('_lc-nm'); if (el) el.focus(); }, 100);
  }

  function showModeSelector() {
    $b().innerHTML =
      '<div style="display:flex;flex-direction:column;gap:12px">' +
        '<p class="_lc-title">Hi ' + esc(visitor.name.split(' ')[0]) + '!</p>' +
        '<p class="_lc-sub">How can I help you today?</p>' +
        '<div class="_lc-modes">' +
          '<div class="_lc-card" id="_lc-pick-ai">' +
            '<div class="ico"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="9" cy="16" r="1" fill="currentColor"/><circle cx="15" cy="16" r="1" fill="currentColor"/><path d="M12 2v3"/></svg></div>' +
            '<div><b>Chat with AI Agent</b><span>Instant answers about Sohan\'s work</span></div>' +
          '</div>' +
          '<div class="_lc-card" id="_lc-pick-contact">' +
            '<div class="ico"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>' +
            '<div><b>Send a Direct Message</b><span>Message Sohan personally</span></div>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.getElementById('_lc-pick-ai').onclick = function () { chooseMode('ai'); };
    document.getElementById('_lc-pick-contact').onclick = function () { chooseMode('contact'); };
  }

  function chooseMode(m) {
    chatMode = m;
    openSession(m);
    if (m === 'ai') {
      showAIMode();
    } else {
      showContactForm();
    }
  }

  function showAIMode() {
    $f().style.display = 'flex';
    if (chatHist.length === 0) showSuggestions();
    setTimeout(function () { var inp = document.getElementById('_lc-in'); if (inp) inp.focus(); }, 100);
  }

  function showSuggestions() {
    $b().innerHTML =
      '<div class="_lc-sugg">' +
        '<p class="_lc-slbl">Suggested questions</p>' +
        '<div class="_lc-chips">' +
          (function(){var dChips=['What services do you offer?','Are you available for work?','How much do you charge?','Tell me about your Shopify experience'];var chips=(chatbotCfg.chips&&chatbotCfg.chips.length)?chatbotCfg.chips:dChips;return chips.map(function(t){return mkChip(t);}).join('');})() +
        '</div>' +
      '</div>';
    $b().querySelectorAll('._lc-chip').forEach(function (c) {
      c.onclick = function () { sendAIMsg(c.textContent); };
    });
  }

  function mkChip(txt) { return '<button class="_lc-chip">' + esc(txt) + '</button>'; }

  function showContactForm() {
    $f().style.display = 'none';
    $b().innerHTML =
      '<div style="display:flex;flex-direction:column;gap:12px">' +
        '<p class="_lc-title">✉️ Send Sohan a Message</p>' +
        '<input id="_lc-ct-nm" class="_lcfi" type="text" placeholder="Your name" value="' + esc(visitor.name) + '" />' +
        '<input id="_lc-ct-em" class="_lcfi" type="email" placeholder="Your email" value="' + esc(visitor.email) + '" />' +
        '<textarea id="_lc-ct-msg" class="_lcft" placeholder="Write your message…"></textarea>' +
        '<input type="file" id="_lc-file" accept="image/*" style="display:none">' +
        '<button class="_lc-attach" id="_lc-att"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:5px"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>Attach Image (optional)</button>' +
        '<div id="_lc-prev-wrap"></div>' +
        '<button class="_lcfb _lcfbp" id="_lc-ct-send">Send Message →</button>' +
        '<button class="_lcfb _lcfbs" id="_lc-ct-back">← Back</button>' +
      '</div>';

    document.getElementById('_lc-att').onclick = function () { document.getElementById('_lc-file').click(); };
    document.getElementById('_lc-file').onchange = handleImgSelect;
    document.getElementById('_lc-ct-send').onclick = submitContact;
    document.getElementById('_lc-ct-back').onclick = function () {
      chatMode = null; chatHist = []; imgAttach = null;
      $f().style.display = 'none';
      showModeSelector();
    };
    setTimeout(function () { var el = document.getElementById('_lc-ct-msg'); if (el) el.focus(); }, 100);
  }

  function handleImgSelect(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (ev) {
      imgAttach = { file: file, dataUrl: ev.target.result };
      var wrap = document.getElementById('_lc-prev-wrap');
      wrap.innerHTML =
        '<div class="_lc-preview">' +
          '<img src="' + ev.target.result + '" alt="Preview">' +
          '<button class="rm" id="_lc-rm">\xD7</button>' +
        '</div>';
      document.getElementById('_lc-rm').onclick = function () {
        imgAttach = null;
        wrap.innerHTML = '';
        document.getElementById('_lc-file').value = '';
      };
    };
    reader.readAsDataURL(file);
  }

  function submitContact() {
    var nm = val('_lc-ct-nm'), em = val('_lc-ct-em'), msg = val('_lc-ct-msg');
    if (!nm || !em || !msg) return;
    var btn = document.getElementById('_lc-ct-send');
    btn.textContent = 'Sending…'; btn.disabled = true;

    var imgUpload = (imgAttach && CFG.SUPA_URL) ? dbUploadFile(imgAttach.file) : Promise.resolve(null);

    imgUpload.then(function (imgUrl) {
      openSession('contact').then(function () {
        logMsg('user', msg, imgUrl);
        var body = 'Name: ' + nm + '\nEmail: ' + em + '\nPage: ' + location.href + '\n\nMessage:\n' + msg;
        if (imgUrl) body += '\n\nAttachment: ' + imgUrl;
        return sendEmail({ subject: 'Direct message from ' + nm + ' on your portfolio', from_name: nm, email: em, message: body });
      }).then(function () {
        imgAttach = null;
        try{var _inbox=JSON.parse(localStorage.getItem('_lc_inbox')||'[]');_inbox.unshift({id:genUUID(),name:nm,email:em,message:msg,time:new Date().toISOString(),read:false});localStorage.setItem('_lc_inbox',JSON.stringify(_inbox));localStorage.setItem('_lc_unread',String(_inbox.filter(function(x){return!x.read;}).length));}catch(_e){}
        showSuccess();
      });
    });
  }

  function showSuccess() {
    $f().style.display = 'none';
    $b().innerHTML =
      '<div class="_lc-ok">' +
        '<div class="ck"><svg viewBox="0 0 24 24" width="48" height="48" fill="none"><circle cx="12" cy="12" r="11" stroke="#22c55e" stroke-width="1.5"/><polyline points="7,12.5 10.5,16 17,9" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
        '<h3>Message Sent!</h3>' +
        '<p>Thanks ' + esc(visitor.name.split(' ')[0]) + '! Sohan will reply to<br>' +
        '<strong style="color:#8B5CF6">' + esc(visitor.email) + '</strong> shortly.</p>' +
        '<button class="_lcfb _lcfbs"class="_lcfb _lcfbs" style="width:auto!important;padding:9px 20px!important;font-size:13px!important" id="_lc-another">Send another →</button>' +
      '</div>';
    document.getElementById('_lc-another').onclick = showContactForm;
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     AI CHAT ACTIONS
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  function sendAIMsg(text) {
    text = text.trim();
    if (!text) return;

    // Remove suggestions if present
    var sugg = $b().querySelector('._lc-sugg');
    if (sugg) sugg.remove();

    addBubble('u', text, visitor.init);
    chatHist.push({ r: 'user', t: text });
    logMsg('user', text);

    // Notify owner on first message
    if (chatHist.length === 1) {
      sendEmail({
        subject: 'New AI chat from ' + visitor.name + ' on your portfolio',
        from_name: visitor.name,
        email: visitor.email,
        message: 'Name: ' + visitor.name + '\nEmail: ' + visitor.email + '\nPage: ' + location.href + '\n\nFirst message:\n' + text
      });
    }

    showTyping();
    askAI(text, function (reply) {
      removeTyping();
      if (reply.indexOf('[ESCALATE]') === 0) {
        var note = reply.replace('[ESCALATE]', '').trim();
        if (note) addBubble('b', note, 'SH');
        addEscCard();
      } else {
        chatHist.push({ r: 'model', t: reply });
        logMsg('ai', reply);
        addBubble('b', reply, 'SH');
      }
    });
  }

  function addEscCard() {
    var body = $b();
    var d = document.createElement('div');
    d.className = '_lc-msg b';
    var waLink = waNum
      ? '<a href="https://wa.me/' + waNum.replace(/\D/g, '') + '?text=' + encodeURIComponent(chatbotCfg.wa_msg||"Hi Sohan! I'd like to discuss a project.") + '" target="_blank" rel="noopener" class="_lc-wa"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="vertical-align:middle;margin-right:5px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>WhatsApp</a>'
      : '';
    d.innerHTML =
      '<div class="av">SH</div>' +
      '<div class="_lc-esc">' +
        '<p>For this, I\'d recommend reaching out to Sohan directly — he\'ll be better placed to help!</p>' +
        '<div class="_lc-esc-row">' +
          waLink +
          '<button class="_lc-em" id="_lc-esc-em"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:5px"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>Send Email</button>' +
        '</div>' +
      '</div>';
    body.appendChild(d);
    body.scrollTop = body.scrollHeight;
    d.querySelector('#_lc-esc-em').onclick = function () { chooseMode('contact'); };
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     BUBBLE / TYPING
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  function addBubble(type, text, init) {
    var body = $b();
    var d = document.createElement('div');
    d.className = '_lc-msg ' + type;
    d.innerHTML =
      '<div class="av">' + (init === 'SH' && localStorage.getItem("_lc_avatar") ? '<img src="'+localStorage.getItem("_lc_avatar")+'" style="width:100%;height:100%;object-fit:cover">' : esc(init || 'SH')) + '</div>' +
      '<div class="bbl">' + esc(text).replace(/\n/g, '<br>') + '</div>';
    body.appendChild(d);
    body.scrollTop = body.scrollHeight;
  }

  function showTyping() {
    var body = $b();
    var d = document.createElement('div');
    d.className = '_lc-msg b'; d.id = '_lc-ty';
    d.innerHTML = '<div class="av">SH</div><div class="bbl"><div class="lc-tyd"><span></span><span></span><span></span></div></div>';
    body.appendChild(d);
    body.scrollTop = body.scrollHeight;
  }

  function removeTyping() { var el = document.getElementById('_lc-ty'); if (el) el.remove(); }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     TOGGLE + INIT
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  function toggle() {
    isOpen = !isOpen;
    document.getElementById('_lc-panel').classList.toggle('on', isOpen);
    document.getElementById('_lc-btn').classList.toggle('on', isOpen);
    document.getElementById('_lc-badge').style.display = 'none';

    if (isOpen) {
      if (!visitor) showIntroForm();
      else if (!chatMode) showModeSelector();
      else if (chatMode === 'ai') {
        setTimeout(function () { var inp = document.getElementById('_lc-in'); if (inp) inp.focus(); }, 100);
      }
    }
  }

  /* — Utils — */
  function val(id) { var el = document.getElementById(id); return el && el.value ? el.value.trim() : ''; }
  function esc(t) { return String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function flash(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.style.borderColor = '#ef4444'; el.focus();
    setTimeout(function () { el.style.borderColor = ''; }, 2000);
  }

  /* — Init — */
  function init() {
    injectStyles();
    buildDOM();

    // Show badge after 5s
    setTimeout(function () {
      if (!isOpen) {
        var _u=0;try{_u=parseInt(localStorage.getItem('_lc_unread')||'0',10);}catch(_e){}
        if(_u>0){var _b=document.getElementById('_lc-badge');_b.textContent=_u>9?'9+':String(_u);_b.style.display='flex';}
      }
    }, 5000);

    document.getElementById('_lc-btn').onclick = toggle;
    document.getElementById('_lc-close').onclick = toggle;

    var sendBtn = document.getElementById('_lc-send');
    var inp = document.getElementById('_lc-in');

    sendBtn.onclick = function () {
      if (!inp.value.trim()) return;
      sendAIMsg(inp.value);
      inp.value = ''; inp.style.height = '';
    };

    inp.addEventListener('input', function () {
      this.style.height = '';
      this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });

    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendBtn.click(); }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
