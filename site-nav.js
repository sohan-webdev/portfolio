/* Shared header, search and mobile menu for blog and reviews pages. Edit this file to change them; no Publish needed. */
(function(){
var st=document.createElement('style');st.textContent="\nheader .w{max-width:1240px}\nheader nav.dsk{flex:1;justify-content:center;gap:2px}\nheader nav.dsk a{font-family:var(--sans);font-weight:500;font-size:14px;padding:8px 11px}\nheader nav.dsk a.cta{display:none}\n.nr{display:flex;align-items:center;gap:10px}\n.srch{display:inline-flex;align-items:center;gap:10px;height:40px;padding:0 10px 0 12px;border-radius:10px;border:1px solid var(--line2);background:rgba(255,255,255,.03);color:var(--fg2);font-family:var(--mono);font-size:12px;cursor:pointer;transition:.2s}\n.srch:hover{color:var(--fg);border-color:rgba(var(--vr),.5)}\n.srch kbd{font-family:var(--mono);font-size:10px;border:1px solid var(--line2);border-radius:5px;padding:2px 6px;color:var(--fg3)}\n.nr .cta2{font-family:var(--mono);font-weight:600;font-size:13px;color:var(--v2);height:40px;display:inline-flex;align-items:center;gap:8px;padding:0 16px;border-radius:10px;border:1px solid rgba(var(--vr),.45);background:rgba(var(--vr),.1);white-space:nowrap}\n.sm{position:fixed;inset:0;z-index:300;background:rgba(3,5,10,.72);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:flex;justify-content:center;align-items:flex-start;padding:min(14vh,120px) 16px 16px;opacity:0;pointer-events:none;transition:opacity .25s}\n.sm.open{opacity:1;pointer-events:auto}\n.sm-box{width:min(100%,640px);background:#0d121c;border:1px solid var(--line2);border-radius:18px;box-shadow:0 40px 100px -20px rgba(0,0,0,.9);overflow:hidden;display:flex;flex-direction:column;max-height:min(70vh,560px)}\n.sm-in{display:flex;align-items:center;gap:12px;padding:16px 18px;border-bottom:1px solid var(--line);color:var(--v2)}\n.sm-in input{flex:1;background:none;border:0;outline:0;color:var(--fg);font:16px var(--sans);min-width:0}\n.sm-in button{font-family:var(--mono);font-size:11px;border:1px solid var(--line2);border-radius:6px;padding:3px 8px;color:var(--fg3);background:none;cursor:pointer}\n.sm-res{overflow-y:auto;padding:8px}\n.sm-g{font-family:var(--mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--fg3);padding:10px 12px 6px}\n.sm-r{display:block;padding:10px 12px;border-radius:10px;color:var(--fg)}\n.sm-r:hover,.sm-r.on{background:rgba(var(--vr),.12)}\n.sm-r small{display:block;color:var(--fg3);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.sm-r mark{background:rgba(var(--vr),.35);color:#fff;border-radius:3px}\n.sm-empty{padding:30px;text-align:center;color:var(--fg3)}\n@media(max-width:1100px){.srch .t,.srch kbd{display:none}.srch{width:40px;padding:0;justify-content:center}header nav.dsk a{padding:8px 7px;font-size:13px}}\n.drw{padding:8px 24px 32px}.drw.open{display:flex;flex-direction:column}\n.drw nav{gap:0}\n.drw nav a{display:flex;align-items:center;justify-content:space-between;font-family:var(--display);font-size:1.12rem;font-weight:500;padding:15px 4px;color:var(--fg);border:0;border-bottom:1px solid var(--line);border-radius:0;background:none}\n.drw nav a:hover,.drw nav a:active{background:none;border-color:var(--line);color:#fff}\n.drw nav a svg{color:var(--fg3)}.drw nav a.ds{border:1px solid var(--line2);border-radius:12px;padding:13px 16px;margin-bottom:12px;background:rgba(255,255,255,.03);flex-direction:row-reverse;justify-content:flex-end;gap:12px;font-family:var(--sans);font-size:15px;color:var(--fg3)}.drw nav a.ds svg{color:var(--v2)}\n.dfoot{margin-top:auto;padding-top:28px;display:grid;gap:18px;justify-items:center}\n.dbtn{width:100%;display:flex;justify-content:center;align-items:center;gap:10px;font-family:var(--display);font-size:1.12rem;font-weight:500;padding:14px 24px;border-radius:12px;background:linear-gradient(135deg,var(--v),var(--v2));color:#fff;box-shadow:0 10px 30px -10px rgba(var(--vr),.7),inset 0 1px 0 rgba(255,255,255,.2)}\n.dsoc{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}\n.dsoc a{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;border:1px solid var(--line2);background:rgba(255,255,255,.03);color:var(--fg2);transition:.25s}\n.dsoc a:active,.dsoc a:hover{color:#fff;background:var(--v);border-color:var(--v)}\n@keyframes blink{50%{opacity:0}}\n.logo{display:flex;align-items:center;gap:2px}.logo .cur{display:inline-block;width:8px;height:16px;background:var(--v2);margin-left:4px;animation:blink 1s steps(1) infinite}\n.hbg{width:42px;height:42px;padding:11px;border-radius:10px}\n@media(max-width:760px){header nav.dsk{display:none}.hbg{display:flex}.srch{display:none}.nr{margin-left:auto}.nr .cta2{font-size:12px;height:auto;padding:8px 12px}.nr .cta2 .ar{display:none}header .w{gap:8px}.logo{font-size:14px;min-width:0}}\n";document.head.appendChild(st);
document.body.insertAdjacentHTML('beforeend',"<div class=\"sm\" id=\"sm\"><div class=\"sm-box\"><div class=\"sm-in\"><svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"><circle cx=\"11\" cy=\"11\" r=\"8\"/><line x1=\"21\" y1=\"21\" x2=\"16.65\" y2=\"16.65\"/></svg><input id=\"smIn\" type=\"search\" placeholder=\"Search services, projects, articles...\" autocomplete=\"off\"><button id=\"smX\" type=\"button\">Esc</button></div><div class=\"sm-res\" id=\"smRes\"></div></div></div>");
})();

(function(){
  var SEC=['about','services','experience','skills','projects'];
  var SVG='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
  var hw=document.querySelector('header .w'),hb=document.getElementById('hbg');
  var lg=document.querySelector('header .logo');if(lg&&!lg.querySelector('.cur')){var cu=document.createElement('span');cu.className='cur';lg.appendChild(cu)}
  if(hw&&!document.querySelector('.nr')){
    var nr=document.createElement('div');nr.className='nr';
    nr.innerHTML='<button class="srch" id="srchBtn" type="button" aria-label="Search">'+SVG+'<span class="t">Search</span><kbd>Ctrl K</kbd></button><a class="cta2" href="/#contact">hire_me() <span class="ar">&rarr;</span></a>';
    if(hb)hw.insertBefore(nr,hb);else hw.appendChild(nr);
  }
  var IC={"fiverr":"<path d=\"M9 20V9.5A3.5 3.5 0 0 1 12.5 6H14\"/><path d=\"M6.5 11H13\"/><path d=\"M17 11v9\"/><circle cx=\"17\" cy=\"7\" r=\"1.1\" fill=\"currentColor\" stroke=\"none\"/>","upwork":"<path d=\"M3 6v5a4 4 0 0 0 8 0V6\"/><path d=\"M11 11c1 4 3 6 5.5 6a4 4 0 0 0 0-8C13 9 12 15 10 21\"/>","linkedin":"<path d=\"M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z\"/><rect x=\"2\" y=\"9\" width=\"4\" height=\"12\"/><circle cx=\"4\" cy=\"4\" r=\"2\"/>","github":"<path d=\"M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.1-1.3-.3-2.5-1-3.5.3-1.2.3-2.4 0-3.5 0 0-1 0-3 1.5a10.3 10.3 0 0 0-5.5 0C6.5 2 5.5 2 5.5 2c-.3 1.1-.3 2.3 0 3.5A5.4 5.4 0 0 0 4.5 9c0 3.5 3 5.5 6 5.5-.4.5-.7 1-.8 1.6-.2.6-.3 1.2-.2 1.9v4\"/><path d=\"M9 18c-4.5 2-5-2-7-2\"/>","whatsapp":"<path d=\"M3 21l1.7-5A9 9 0 1 1 8 19.3z\"/><path d=\"M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1\"/>","facebook":"<path d=\"M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z\"/>","instagram":"<rect x=\"2\" y=\"2\" width=\"20\" height=\"20\" rx=\"5\"/><circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M17.5 6.5h.01\"/>","x":"<path d=\"M4 4l16 16M20 4 4 20\" stroke-width=\"0\"/><path d=\"M4 4h4.5L20 20h-4.5z\"/><path d=\"M20 4l-6.6 7.3M10.6 12.7 4 20\"/>","youtube":"<path d=\"M2.5 17a24 24 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.6 49.6 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24 24 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.6 49.6 0 0 1-16.2 0A2 2 0 0 1 2.5 17\"/><path d=\"m10 15 5-3-5-3z\"/>","arrow":"<line x1=\"5\" y1=\"12\" x2=\"19\" y2=\"12\"/><polyline points=\"12 5 19 12 12 19\"/>","external":"<path d=\"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6\"/><polyline points=\"15 3 21 3 21 9\"/><line x1=\"10\" y1=\"14\" x2=\"21\" y2=\"3\"/>","search":"<circle cx=\"11\" cy=\"11\" r=\"8\"/><line x1=\"21\" y1=\"21\" x2=\"16.65\" y2=\"16.65\"/>"};
  function ico(k,z){return '<svg width="'+z+'" height="'+z+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+(IC[k]||'')+'</svg>'}
  var IDX=[],hits=[],sel=0;
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function add(g,t,sub,txt,url){IDX.push({g:g,t:String(t||''),sub:String(sub||''),hay:(t+' '+(sub||'')+' '+(txt||'')).toLowerCase(),url:url})}
  function build(c,h,o){
    IDX=[];
    o.forEach(function(id){if(SEC.indexOf(id)>-1&&!h[id])add('Sections',id[0].toUpperCase()+id.slice(1),'','',  '/#'+id)});
    if(!h.reviews)add('Pages','All reviews','Client video and text reviews','reviews testimonials','/reviews/');
    if(!h.blog)add('Pages','Blog','All articles','blog articles posts','/blog/');
    (c.services||[]).forEach(function(x){add('Services',x.title,x.desc,(x.items||[]).join(' '),'/#services')});
    (c.projects||[]).forEach(function(x){add('Projects',x.name,x.tag,(x.desc||'')+' '+(x.tech||[]).join(' '),'/#projects')});
    (c.skills||[]).forEach(function(x){add('Skills',x.name,x.desc,'','/#skills')});
    (c.blog||[]).filter(function(b){return !b.draft&&b.title&&b.slug}).forEach(function(b){add('Articles',b.title,b.excerpt,(b.tags||[]).join(' ')+' '+String(b.text||'').slice(0,3000),'/blog/'+encodeURIComponent(b.slug)+'/')});
  }
  function hl(t,qs){var r=esc(t);qs.forEach(function(q){if(q.length<2)return;var e=esc(q),lo=r.toLowerCase(),out='',i=0,j;while((j=lo.indexOf(e,i))>-1){out+=r.slice(i,j)+'<mark>'+r.slice(j,j+e.length)+'</mark>';i=j+e.length}r=out+r.slice(i)});return r}
  var sm=document.getElementById('sm'),inp=document.getElementById('smIn'),box=document.getElementById('smRes');
  function run(){
    var q=inp.value.trim().toLowerCase(),qs=q.split(' ').filter(Boolean);
    hits=qs.length?IDX.filter(function(x){return qs.every(function(w){return x.hay.indexOf(w)>-1})}).slice(0,24):IDX.filter(function(x){return x.g==='Sections'||x.g==='Pages'||x.g==='Articles'}).slice(0,12);
    sel=0;
    if(!hits.length){box.innerHTML='<div class="sm-empty">No results for "'+esc(q)+'"</div>';return}
    var g='',out='';hits.forEach(function(x,i){if(x.g!==g){g=x.g;out+='<div class="sm-g">'+g+'</div>'}out+='<a class="sm-r'+(i===0?' on':'')+'" href="'+x.url+'"><b>'+hl(x.t,qs)+'</b>'+(x.sub?'<small>'+hl(x.sub,qs)+'</small>':'')+'</a>'});
    box.innerHTML=out;
  }
  function mark(i){var rs=box.querySelectorAll('.sm-r');if(!rs.length)return;sel=(i+rs.length)%rs.length;rs.forEach(function(r,k){r.classList.toggle('on',k===sel)});rs[sel].scrollIntoView({block:'nearest'})}
  function open(){sm.classList.add('open');document.body.style.overflow='hidden';inp.value='';run();setTimeout(function(){inp.focus()},40)}
  function close(){sm.classList.remove('open');document.body.style.overflow=''}
  var sb=document.getElementById('srchBtn');if(sb)sb.onclick=open;
  document.getElementById('smX').onclick=close;
  sm.onclick=function(e){if(e.target===sm)close()};
  inp.oninput=run;
  inp.onkeydown=function(e){if(e.key==='ArrowDown'){e.preventDefault();mark(sel+1)}else if(e.key==='ArrowUp'){e.preventDefault();mark(sel-1)}else if(e.key==='Enter'){var r=box.querySelectorAll('.sm-r')[sel];if(r)location.href=r.href}};
  addEventListener('keydown',function(e){if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();sm.classList.contains('open')?close():open()}else if(e.key==='Escape')close()});
  if(/Mac|iPhone|iPad/.test(navigator.platform)){var k=document.querySelector('.srch kbd');if(k)k.textContent='⌘ K'}
  fetch('/content.json',{cache:'no-store'}).then(function(r){return r.json()}).then(function(c){
    var h=(c.design&&c.design.hide)||{};
    var o=(c.design&&c.design.order&&c.design.order.length)?c.design.order:SEC.concat(['reviews','faq','blog']);
    var links=o.filter(function(id){return SEC.indexOf(id)>-1&&!h[id]}).map(function(id){return '<a href="/#'+id+'">'+id[0].toUpperCase()+id.slice(1)+'</a>'}).join('');
    var rv=h.reviews?'':'<a href="/reviews/">Reviews</a>';
    var bl=h.blog?'':'<a href="/blog/">Blog</a>';
    document.querySelectorAll('nav.dsk').forEach(function(n){n.innerHTML=links+rv+bl});
    var drw=document.getElementById('drw');
    if(drw){
      var LB={about:'About',services:'Services',experience:'Experience',skills:'Skills',projects:'Projects',faq:'FAQ',contact:'Contact'};
      var items='<a href="#" class="ds" id="dSearch">Search services, projects, articles...'+ico('search',17)+'</a>';
      o.concat(['contact']).forEach(function(id){if(LB[id]&&!h[id])items+='<a href="/#'+id+'">'+LB[id]+ico('arrow',16)+'</a>'});
      if(!h.reviews)items+='<a href="/reviews/">All reviews'+ico('external',15)+'</a>';
      if(!h.blog)items+='<a href="/blog/">Blog'+ico('external',15)+'</a>';
      var k=c.contact||{},soc='';['fiverr','upwork','linkedin','github','whatsapp','facebook','instagram','x','youtube'].forEach(function(i){if(k[i])soc+='<a href="'+esc(k[i])+'" target="_blank" rel="noopener" aria-label="'+i+'">'+ico(i,17)+'</a>'});
      drw.innerHTML='<nav>'+items+'</nav><div class="dfoot"><a class="dbtn" href="/#contact">Hire me '+ico('arrow',16)+'</a><div class="dsoc">'+soc+'</div></div>';
      var shut=function(){drw.classList.remove('open');if(hb)hb.classList.remove('open')};
      drw.querySelectorAll('a').forEach(function(a){a.addEventListener('click',shut)});
      document.getElementById('dSearch').addEventListener('click',function(e){e.preventDefault();shut();open()});
    }
    build(c,h,o);
  }).catch(function(){});
})();
