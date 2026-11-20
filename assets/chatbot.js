(function(){
'use strict';
var CONFIG={
  GEMINI_API_KEY:'AQ.Ab8RN6Je0mkux99dmHI1FX9A4wrlplWhF3gh3TyMhWyBCgM8Dg',
  WEB3FORMS_KEY:'4a36a48e-1581-4fb8-86f9-245c2769a4d6',
  OWNER_EMAIL:'mdsohanhossain337@gmail.com',
  COLOR:'#2897FF',
  TITLE:"Chat with Sohan's AI",
  SUBTITLE:'AI Assistant - Replies instantly'
};
var siteData=null,history=[],user=null,opened=false;
function loadData(){fetch('/content.json').then(function(r){return r.json()}).then(function(d){siteData=d}).catch(function(){siteData={}})}
function systemPrompt(){var c=siteData||{};var name=[c.name_prefix,c.name_first,c.name_last].filter(Boolean).join(' ');var role=(c.roles||[])[0]||'Shopify Developer';var about=(c.about||[]).join(' ');var services=(c.services||[]).map(function(s){return'- '+s.title+': '+s.desc}).join('
');var skills=(c.skills||[]).map(function(s){return s.name}).join(', ');var faqs=(c.faq||[]).map(function(f){return'Q: '+f.q+'
A: '+f.a}).join('

');var contact=c.contact||{};var avail=c.available?'AVAILABLE for new projects':'Currently busy';return'You are an AI assistant for '+name+', a '+role+' based in '+(c.location||'Bangladesh')+'.

ABOUT:
'+about+'

SERVICES:
'+services+'

SKILLS: '+skills+'

CONTACT:
Email: '+(contact.email||'')+'
WhatsApp: '+(contact.whatsapp||'')+'

FAQ:
'+faqs+'

STATUS: '+avail+'

INSTRUCTIONS:
- Answer questions about services, skills, experience and availability.
- Keep replies SHORT 2-4 sentences.
- For pricing: depends on scope, suggest contacting directly.
- Always nudge to get in touch.
- Reply in the SAME LANGUAGE as visitor.
- Never invent info not listed above.'}
function askGemini(text,cb){var contents=history.map(function(m){return{role:m.role,parts:[{text:m.text}]}});contents.push({role:'user',parts:[{text:text}]});fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key='+CONFIG.GEMINI_API_KEY,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({system_instruction:{parts:[{text:systemPrompt()}]},contents:contents,generationConfig:{maxOutputTokens:300,temperature:0.75}})}).then(function(r){return r.json()}).then(function(d){var reply=(d.candidates&&d.candidates[0]&&d.candidates[0].content&&d.candidates[0].content.parts&&d.candidates[0].content.parts[0].text)||'Sorry, something went wrong. Please contact Sohan directly.';cb(null,reply)}).catch(function(){cb('error')})}
function notifyEmail(nm,em,msg){if(!CONFIG.WEB3FORMS_KEY||CONFIG.WEB3FORMS_KEY==='YOUR_WEB3FORMS_KEY')return;fetch('https://api.web3forms.com/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({access_key:CONFIG.WEB3FORMS_KEY,subject:'New chat from '+nm+' - portfolio',from_name:nm,email:em,message:'Name: '+nm+'\nEmail: '+em+'\n\nMessage: '+msg+'\nPage: '+location.href,botcheck:''})}).catch(function(){})}
function addStyles(){var s=document.createElement('style');s.textContent='#_cb *{box-sizing:border-box;margin:0;padding:0;font-family:inherit}#_cb-btn{position:fixed;bottom:24px;right:24px;width:56px;height:56px;background:'+CONFIG.COLOR+';border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 24px rgba(40,151,255,.45);z-index:9999;transition:transform .2s,box-shadow .2s}#_cb-btn:hover{transform:scale(1.1)}#_cb-btn svg{width:26px;height:26px;fill:#fff}#_cb-btn .ic-open{display:block}#_cb-btn .ic-close{display:none}#_cb-btn.on .ic-open{display:none}#_cb-btn.on .ic-close{display:block}#_cb-badge{position:absolute;top:-3px;right:-3px;width:17px;height:17px;background:#ef4444;border-radius:50%;font-size:10px;font-weight:700;color:#fff;display:none;align-items:center;justify-content:center}#_cb-panel{position:fixed;bottom:90px;right:24px;width:360px;max-height:530px;background:#0d1117;border:1px solid rgba(255,255,255,.08);border-radius:20px;overflow:hidden;display:flex;flex-direction:column;z-index:9998;box-shadow:0 20px 60px rgba(0,0,0,.55);transform:translateY(16px) scale(.96);opacity:0;pointer-events:none;transition:transform .25s cubic-bezier(.34,1.56,.64,1),opacity .2s}#_cb-panel.on{transform:translateY(0) scale(1);opacity:1;pointer-events:all}@media(max-width:400px){#_cb-panel{width:calc(100vw - 24px);right:12px;bottom:78px}}#_cb-hd{padding:14px 18px;background:'+CONFIG.COLOR+';display:flex;align-items:center;gap:11px;flex-shrink:0}#_cb-hd .av{width:36px;height:36px;background:rgba(255,255,255,.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:14px;flex-shrink:0}#_cb-hd .inf{flex:1}#_cb-hd .inf b{color:#fff;font-size:13.5px;display:block}#_cb-hd .inf small{color:rgba(255,255,255,.75);font-size:11px}#_cb-hd .dot{width:7px;height:7px;background:#22c55e;border-radius:50%;display:inline-block;margin-right:3px;vertical-align:middle}#_cb-body{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.08) transparent}#_cb-form{display:flex;flex-direction:column;gap:11px;padding:4px 0}#_cb-form p{color:rgba(255,255,255,.65);font-size:13px;line-height:1.55}#_cb-form input{width:100%;padding:10px 13px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;color:#fff;font-size:13.5px;outline:none;transition:border-color .2s;font-family:inherit}#_cb-form input:focus{border-color:'+CONFIG.COLOR+'}#_cb-form input::placeholder{color:rgba(255,255,255,.3)}#_cb-form button{padding:11px;background:'+CONFIG.COLOR+';color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit}._cm{display:flex;gap:7px;align-items:flex-end}._cm.u{flex-direction:row-reverse}._cm .bbl{max-width:82%;padding:9px 13px;border-radius:16px;font-size:13px;line-height:1.55}._cm.b .bbl{background:rgba(255,255,255,.07);color:rgba(255,255,255,.88);border-bottom-left-radius:4px}._cm.u .bbl{background:'+CONFIG.COLOR+';color:#fff;border-bottom-right-radius:4px}._cm .av{width:24px;height:24px;background:'+CONFIG.COLOR+';border-radius:50%;font-size:9px;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0}._cm.u .av{background:rgba(255,255,255,.12)}.tyd{display:flex;gap:4px;padding:3px 0}.tyd span{width:6px;height:6px;background:rgba(255,255,255,.35);border-radius:50%;animation:_b 1.2s infinite}.tyd span:nth-child(2){animation-delay:.2s}.tyd span:nth-child(3){animation-delay:.4s}@keyframes _b{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}#_cb-ft{padding:10px 14px;border-top:1px solid rgba(255,255,255,.06);display:none;gap:8px;align-items:center;flex-shrink:0}#_cb-in{flex:1;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);border-radius:22px;padding:8px 15px;color:#fff;font-size:13px;outline:none;font-family:inherit}#_cb-in:focus{border-color:'+CONFIG.COLOR+'}#_cb-in::placeholder{color:rgba(255,255,255,.28)}#_cb-send{width:34px;height:34px;background:'+CONFIG.COLOR+';border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}#_cb-send svg{width:15px;height:15px;fill:#fff}#_cb-pw{text-align:center;font-size:10px;color:rgba(255,255,255,.18);padding:3px 0 7px}';document.head.appendChild(s)}
function buildHTML(){var w=document.createElement('div');w.id='_cb';w.innerHTML='<button id="_cb-btn" aria-label="Open chat"><svg class="ic-open" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 10H6v-2h12v2zm0-3H6V7h12v2z"/></svg><svg class="ic-close" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg><span id="_cb-badge">1</span></button><div id="_cb-panel"><div id="_cb-hd"><div class="av">SH</div><div class="inf"><b>Chat with Sohan AI</b><small><span class="dot"></span>AI Assistant - Replies instantly</small></div></div><div id="_cb-body"></div><div id="_cb-ft"><input id="_cb-in" type="text" placeholder="Type a message..." autocomplete="off"/><button id="_cb-send"><svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button></div><div id="_cb-pw">Powered by Google Gemini AI</div></div>';document.body.appendChild(w)}
function showForm(){var body=document.getElementById('_cb-body');body.innerHTML='<div id="_cb-form"><p>Hi! Please introduce yourself before we chat.</p><input id="_cb-nm" type="text" placeholder="Your name"/><input id="_cb-em" type="email" placeholder="Your email address"/><input id="_cb-fm" type="text" placeholder="What can I help you with?"/><button id="_cb-go">Start Chat</button></div>';document.getElementById('_cb-go').onclick=startChat;document.getElementById('_cb-fm').onkeypress=function(e){if(e.key==='Enter')startChat()}}
function startChat(){var nm=val('_cb-nm'),em=val('_cb-em'),msg=val('_cb-fm');if(!nm||!em||!msg){alert('Please fill in all fields.');return}if(!/^[^s@]+@[^s@]+.[^s@]+$/.test(em)){alert('Please enter a valid email.');return}user={name:nm,email:em,initial:nm[0].toUpperCase()};document.getElementById('_cb-body').innerHTML='';document.getElementById('_cb-ft').style.display='flex';notifyEmail(nm,em,msg);addMsg('u',msg,user.initial);getReply(msg)}
function getReply(text){history.push({role:'user',text:text});showTyping();askGemini(text,function(err,reply){removeTyping();if(err){reply='Having a moment! Please contact Sohan at '+CONFIG.OWNER_EMAIL}history.push({role:'model',text:reply});addMsg('b',reply,'SH')})}
function addMsg(type,text,initial){var body=document.getElementById('_cb-body');var d=document.createElement('div');d.className='_cm '+type;d.innerHTML='<div class="av">'+esc(initial||'SH')+'</div><div class="bbl">'+esc(text).replace(/
/g,'<br>')+'</div>';body.appendChild(d);body.scrollTop=body.scrollHeight}
function showTyping(){var body=document.getElementById('_cb-body');var d=document.createElement('div');d.className='_cm b';d.id='_cb-ty';d.innerHTML='<div class="av">SH</div><div class="bbl"><div class="tyd"><span></span><span></span><span></span></div></div>';body.appendChild(d);body.scrollTop=body.scrollHeight}
function removeTyping(){var el=document.getElementById('_cb-ty');if(el)el.remove()}
function toggle(){opened=!opened;document.getElementById('_cb-panel').classList.toggle('on',opened);document.getElementById('_cb-btn').classList.toggle('on',opened);document.getElementById('_cb-badge').style.display='none';if(opened&&!user)showForm();if(opened&&user){var inp=document.getElementById('_cb-in');if(inp)setTimeout(function(){inp.focus()},50)}}
function sendMsg(){var inp=document.getElementById('_cb-in');var text=inp.value.trim();if(!text||!user)return;inp.value='';addMsg('u',text,user.initial);getReply(text)}
function val(id){var el=document.getElementById(id);return el&&el.value.trim()}
function esc(t){return String(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function init(){addStyles();buildHTML();loadData();setTimeout(function(){if(!opened){var b=document.getElementById('_cb-badge');if(b)b.style.display='flex'}},4000);document.getElementById('_cb-btn').onclick=toggle;document.getElementById('_cb-send').onclick=sendMsg;document.addEventListener('keypress',function(e){if(e.key==='Enter'&&opened&&user){var inp=document.getElementById('_cb-in');if(document.activeElement===inp)sendMsg()}})}
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init)}else{init()}
})();
