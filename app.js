const $=s=>document.querySelector(s),V=$('#v');let S=null,lv=0,Q={},F={},G={};
const esc=s=>String(s).replace(/[&<>"]/g,c=({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const sh=a=>{a=[...a];for(let i=a.length;i>1;i--){const j=Math.random()*i|0;[a[i-1],a[j]]=[a[j],a[i-1]]}return a};
const norm=s=>String(s).toLowerCase().replace(/\(.*?\)/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\b(the|a|an)\b/g,'').replace(/\b1\b/g,'i').replace(/\b2\b/g,'ii').replace(/\s+/g,' ').trim();
function lev(a,b){const d=[...Array(b.length+1).keys()];for(let i=1;i<=a.length;i++){let p=d[0];d[0]=i;for(let j=1;j<=b.length;j++){const t=d[j];d[j]=Math.min(d[j]+1,d[j-1]+1,p+(a[i-1]==b[j-1]?0:1));p=t}}return d[b.length]}
const forms=t=>[t.term,...(t.aliases||[])].map(norm);
const same=(a,b)=>a==b||a.replace(/ /g,'')==b.replace(/ /g,'');
const sig=s=>(s.match(/\d+|\b(?:i|ii|iii|iv)\b/g)||[]).join(',');
/* Exact match wins. A typo is only forgiven if it is not exactly another term (G1 vs G2, BRCA1 vs BRCA2)
   and keeps the same numerals (Prophase vs Prophase I). */
const ok=(v,t)=>{const n=norm(v);if(!n)return false;const F=forms(t);
if(F.some(f=>same(f,n)))return true;
if(S&&S.all.some(x=>x!==t&&forms(x).some(f=>same(f,n))))return false;
return F.some(f=>f.length>=5&&sig(f)==sig(n)&&lev(f,n)<=(f.length>9?2:1))};
const rx=x=>x.replace(/[.*+?^$()|[\]\\{}]/g,'\\$&');
const mask=t=>{let s=t.definition;const v=new Set([t.term,t.term.replace(/\s*\(.*?\)/g,'').trim(),...(t.aliases||[]).filter(a=>a.length>=5)]);
[...v].filter(Boolean).sort((a,b)=>b.length-a.length).forEach(x=>{s=s.replace(new RegExp('(?<![A-Za-z0-9])'+rx(x)+'(?![A-Za-z0-9])','gi'),'_____')});return esc(s)};
const decoys=(t,n)=>{const src=S.pool.length>=6?S.pool:S.all,f=forms(t),o=src.filter(x=>x!==t&&!forms(x).some(y=>f.includes(y)));return[...sh(o.filter(x=>x.category==t.category)),...sh(o.filter(x=>x.category!=t.category))].slice(0,n)};

function nav(){$('#nav').innerHTML=['Setup','1 Flashcards','2 Shooter','3 Multiple choice','4 Free response'].map((n,i)=>`<button class="${i==lv?'on':''}" ${S||i==0?'':'disabled'} onclick="go(${i})">${n}</button>`).join('')}
function go(l){lv=l;nav();[setup,flash,shoot,mcq,free][l]()}
function setup(){V.innerHTML=`<div class="drop" id="dz"><p><b>Drop your study JSON here</b></p><p class="mute">Format: {"title": "...", "terms": [{"term", "definition", "category", "aliases"}]}. Only <code>term</code> and <code>definition</code> are required.</p><input type="file" id="fi" accept=".json,application/json" aria-label="Choose JSON file"><p class="err" id="er"></p></div><div id="info"></div>`;
const dz=$('#dz');dz.ondragover=e=>{e.preventDefault();dz.classList.add('over')};dz.ondragleave=()=>dz.classList.remove('over');
dz.ondrop=e=>{e.preventDefault();rd(e.dataTransfer.files[0])};$('#fi').onchange=e=>rd(e.target.files[0]);info()}
function rd(f){if(!f)return;const r=new FileReader();r.onload=()=>load(r.result);r.readAsText(f)}
function load(txt){try{const j=JSON.parse(txt);let a=Array.isArray(j)?j:j.terms;if(!Array.isArray(a))throw'Expected a "terms" array.';
a=a.filter(t=>t&&t.term&&t.definition).map(t=>({...t,category:t.category||'General'}));if(a.length<5)throw'Need at least 5 entries that have both "term" and "definition".';
S={title:j.title||'Study set',all:a,cats:new Set(a.map(t=>t.category))};pl();$('#sub').textContent=S.title;nav();info()}catch(e){$('#er').textContent='Could not load file: '+(e.message||e)}}
const pl=()=>S.pool=S.all.filter(t=>S.cats.has(t.category));
function info(){if(!S)return;const cs=[...new Set(S.all.map(t=>t.category))];
$('#info').innerHTML=`<div class="q"><h2>${esc(S.title)}</h2><p>${S.pool.length} of ${S.all.length} terms selected. Choose what to study:</p><div class="cats">${cs.map(c=>`<label><input type="checkbox" ${S.cats.has(c)?'checked':''} onchange="tc('${esc(c).replace(/'/g,"\\'")}',this.checked)"> ${esc(c)} (${S.all.filter(t=>t.category==c).length})</label>`).join('')}</div><button class="pri" ${S.pool.length<5?'disabled':''} onclick="go(1)">Start with flashcards</button> ${S.pool.length<5?'<span class="err">Select at least 5 terms.</span>':''}</div>`}
function tc(c,on){on?S.cats.add(c):S.cats.delete(c);pl();info()}

/* Level 1 */
function flash(){F={d:sh(S.pool),i:0,b:false};fr()}
function fr(){const t=F.d[F.i];V.innerHTML=`<div class="flip ${F.b?'b':''}" onclick="F.b=!F.b;fr()" tabindex="0" role="button" aria-label="Flip card"><div class="in"><div class="f"><b>${esc(t.term)}</b><span class="tag">${esc(t.category)} · click to flip</span></div><div class="f bk">${esc(t.definition)}</div></div></div>
<div class="row"><button onclick="fn(-1)" ${F.i?'':'disabled'}>Previous</button><span class="mute">${F.i+1} / ${F.d.length}</span><button class="pri" onclick="fn(1)" ${F.i<F.d.length-1?'':'disabled'}>Next</button></div><div class="row"><button onclick="flash()">Shuffle again</button><button onclick="go(2)">Level 2</button></div>`}
function fn(d){F.i+=d;F.b=false;fr()}
document.addEventListener('keydown',e=>{if(lv!=1||e.target.tagName=='INPUT')return;if(e.key=='ArrowRight'&&F.i<F.d.length-1)fn(1);if(e.key=='ArrowLeft'&&F.i>0)fn(-1);if(e.key==' '){e.preventDefault();F.b=!F.b;fr()}});

/* shared results */
function done(title,right,total,miss,next){const pct=Math.round(100*right/total);V.innerHTML=`<div class="q"><h2>${title}</h2><p><b>${right} / ${total}</b> (${pct}%)</p>${miss.length?'<p>Review these:</p>'+miss.map(m=>`<p><b>${esc(m.term)}</b><br><span class="mute">${esc(m.definition)}</span></p>`).join(''):'<p>Perfect run.</p>'}<div class="row"><button class="pri" onclick="go(lv)">Play again</button>${next?`<button onclick="go(${lv+1})">Next level</button>`:''}</div></div>`}

/* Level 2 */
function shoot(){G={q:sh(S.pool).slice(0,12),i:0,lives:3,score:0};ship()}
function ship(){const t=G.q[G.i];G.t=t;G.dc=0;G.busy=false;G.w=sh([{x:t,c:1},...decoys(t,4).map(x=>({x}))]);sr()}
function sr(msg){V.innerHTML=`<div class="hud"><span>Ship ${G.i+1} / ${G.q.length} · Score ${G.score}</span><span class="lives" aria-label="${G.lives} lives">${'♥'.repeat(G.lives)}${'♡'.repeat(3-G.lives)}</span></div><div class="q"><b>Type the word on the ship that matches:</b><p>${mask(G.t)}</p></div>
<div class="arena"><div class="ship" id="sp">${G.w.map(w=>`<span class="w ${w.dead?'dead':''} ${w.hit?'hit':''}">${esc(w.x.term)}</span>`).join('')}</div><div class="gun">🔫</div></div>
<form onsubmit="return fire()" class="row" style="margin-bottom:0"><input type="text" id="ty" autocomplete="off" placeholder="Type a word and press Enter" aria-label="Your answer"><button class="pri">Fire</button></form><p id="ms" class="mute">${msg||'Shoot decoys by mistake and you will lose lives. Typing a word not on the ship does nothing.'}</p>`;$('#ty').focus()}
function fire(){if(G.busy)return false;const v=$('#ty').value,c=G.w.find(w=>w.c);
if(ok(v,G.t)){G.busy=true;c.hit=true;G.score++;$('#sp').classList.add('boom');setTimeout(()=>{G.i++;G.i>=G.q.length?done('Mission complete',G.score,G.q.length,[],true):ship()},650);return false}
const d=G.w.find(w=>!w.c&&!w.dead&&ok(v,w.x));
if(d){d.dead=true;G.dc++;let m='Decoy hit. Try again.';if(G.dc>=2){G.lives--;m=G.dc==2?'Two decoys: you lost a life.':'Three decoys: you lost another life. You still need the right word.'}
if(G.lives<=0){V.innerHTML='';return done('Game over — answer was “'+esc(G.t.term)+'”',G.score,G.q.length,[G.t]),false}sr(m)}
else{$('#ty').classList.add('shake');$('#ms').textContent='No target by that name.';$('#ty').select()}return false}

/* Level 3 */
function mcq(){Q={l:sh(S.pool).slice(0,20).map(t=>({t,rev:Math.random()<.5,o:sh([t,...decoys(t,3)])})),i:0,r:0,m:[]};mr()}
function mr(){const q=Q.l[Q.i];Q.a=false;V.innerHTML=`<div class="hud"><span>Question ${Q.i+1} / ${Q.l.length}</span><span>Correct ${Q.r}</span></div><div class="q"><p class="mute">${q.rev?'Which definition matches this term?':'Which term matches this definition?'}</p><h2>${q.rev?esc(q.t.term):mask(q.t)}</h2>${q.o.map((o,k)=>`<button class="opt" id="o${k}" onclick="pk(${k})">${q.rev?esc(o.definition):esc(o.term)}</button>`).join('')}<div class="row" id="nx"></div></div>`}
function pk(k){if(Q.a)return;Q.a=true;const q=Q.l[Q.i],g=q.o.indexOf(q.t);q.o.forEach((_,j)=>{$('#o'+j).disabled=true});$('#o'+g).classList.add('good');if(k==g)Q.r++;else{$('#o'+k).classList.add('no');Q.m.push(q.t)}
$('#nx').innerHTML=`<button class="pri" onclick="Q.i++;Q.i<Q.l.length?mr():done('Multiple choice complete',Q.r,Q.l.length,Q.m,true)">${Q.i<Q.l.length-1?'Next':'Finish'}</button>`;$('#nx button').focus()}

/* Level 4 */
function free(){Q={l:sh(S.pool).slice(0,20),i:0,r:0,m:[]};fq()}
function fq(){const t=Q.l[Q.i];V.innerHTML=`<div class="hud"><span>Question ${Q.i+1} / ${Q.l.length}</span><span>Correct ${Q.r}</span></div><div class="q"><p class="mute">Type the term that matches this definition:</p><h2 style="font-size:1.1rem">${mask(t)}</h2><form onsubmit="return fc()"><input type="text" id="ty" autocomplete="off" aria-label="Your answer"><div class="row"><button class="pri" id="sb">Check</button></div></form><div id="fb"></div></div>`;$('#ty').focus()}
function fc(){const t=Q.l[Q.i];if(Q.done){fnx();return false}const good=ok($('#ty').value,t);Q.done=true;Q.cur=good;if(good)Q.r++;else Q.m.push(t);
$('#ty').disabled=true;$('#sb').textContent=Q.i<Q.l.length-1?'Next':'Finish';$('#fb').innerHTML=good?'<p style="color:var(--ok)"><b>Correct.</b></p>':`<p style="color:var(--bad)"><b>Not quite.</b> Answer: <b>${esc(t.term)}</b></p><button type="button" onclick="ov()">My answer was right, count it</button>`;$('#sb').focus();return false}
function ov(){const t=Q.l[Q.i];Q.m=Q.m.filter(x=>x!==t);Q.r++;Q.cur=true;$('#fb').innerHTML='<p style="color:var(--ok)"><b>Counted as correct.</b></p>'}
function fnx(){Q.done=false;Q.i++;Q.i<Q.l.length?fq():done('Free response complete',Q.r,Q.l.length,Q.m,false)}
nav();setup();
