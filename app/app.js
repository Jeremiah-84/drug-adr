/* ---------- 데이터 불러오기: 확장 프로그램 안 데이터 + 웹에 더 새 데이터가 있으면 그걸 사용 ---------- */
const CFG=window.ADR_CONFIG||{mode:'web',remote:''};
const IS_EXT=!!(window.chrome&&chrome.runtime&&chrome.runtime.id);
let BASE='data/', CACHE=null;
async function getJSON(path){
  const url=BASE+path;
  if(CACHE){try{const hit=await CACHE.match(url);if(hit)return hit.json()}catch(e){}}
  const r=await fetch(url,{cache:'no-cache'}); if(!r.ok)throw new Error(r.status);
  if(CACHE){try{await CACHE.put(url,r.clone())}catch(e){}}
  return r.json();
}
/* ---------- 익명 사용 통계 (시험 기간) ----------
   보내는 것: 설치별 임의 번호, 행동 종류, 성분 id, 문제 항목 id, 개수.
   절대 보내지 않는 것: 화면에서 읽은 글자, 직접 입력한 문장, 환자 정보.
   받는 곳은 웹의 stats.json 에서 정하므로 확장 프로그램을 다시 배포하지 않고 켜고 끌 수 있습니다. */
const STATS={cfg:null,q:[],sid:String(Date.now()),
  on(){try{const v=localStorage.getItem('adr.stats');return v==='1'||(v===null&&!!localStorage.getItem('adr.introOk'))}catch(e){return false}},
  cid(){try{let c=localStorage.getItem('adr.cid');if(!c){c=(crypto.randomUUID?crypto.randomUUID():String(Math.random()).slice(2));localStorage.setItem('adr.cid',c)}return c}catch(e){return 'anon'}},
  async load(){try{const u=IS_EXT?(CFG.remote?CFG.remote+'stats.json':''):'stats.json';if(!u)return;
    STATS.cfg=await (await fetch(u,{cache:'no-cache'})).json()}catch(e){}},
  flush(){const c=STATS.cfg;if(!c||!c.ga_id||!c.ga_secret||!STATS.q.length||!STATS.on()){STATS.q=[];return}
    while(STATS.q.length){const ev=STATS.q.splice(0,25);
      const url=`https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(c.ga_id)}&api_secret=${encodeURIComponent(c.ga_secret)}`;
      const body=JSON.stringify({client_id:STATS.cid(),user_properties:{app_mode:{value:IS_EXT?'ext':'web'}},events:ev});
      try{if(!(navigator.sendBeacon&&navigator.sendBeacon(url,body)))fetch(url,{method:'POST',body,mode:'no-cors',keepalive:true})}catch(e){}}}
};
function track(name,params){if(!STATS.on())return;STATS.q.push({name,params:Object.assign({session_id:STATS.sid,engagement_time_msec:100},params||{})});if(STATS.q.length>=20)STATS.flush()}
setInterval(()=>STATS.flush(),15000);
addEventListener('pagehide',()=>STATS.flush());
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')STATS.flush()});
async function boot(){
  STATS.load();
  let local=null; try{local=await (await fetch('data/version.json')).json()}catch(e){}
  if(IS_EXT&&CFG.remote){
    try{
      const ctl=new AbortController(); setTimeout(()=>ctl.abort(),4000);
      const rv=await (await fetch(CFG.remote+'data/version.json',{cache:'no-cache',signal:ctl.signal})).json();
      if(!local||rv.version>local.version){
        BASE=CFG.remote+'data/'; CACHE=await caches.open('adr-'+rv.version);
        for(const k of await caches.keys()) if(k!=='adr-'+rv.version) caches.delete(k);
      }
    }catch(e){}
  }
  const D=await getJSON('index.json'); start(D);
}
boot().catch(e=>{document.getElementById('items').innerHTML='<div class="none">데이터를 불러오지 못했습니다. 새로고침해 주세요.</div>'});
function start(D){
const byId=Object.fromEntries(D.drugs.map(d=>[d.id,d]));
const loading={};
function loadDrug(id){const d=byId[id]; if(!d)return Promise.resolve(); if(d.adr)return Promise.resolve(d);
  return loading[id]||(loading[id]=getJSON('d/'+d.f+'.json').then(x=>Object.assign(d,x)).catch(()=>Object.assign(d,{adr:{},organ:{renal:{t:[],e:[]},hepatic:{t:[],e:[]}},txt:[],product:'(불러오기 실패)'})))}
function ensure(ids){return Promise.all(ids.map(loadDrug))}
document.getElementById('dataver').textContent=`데이터 기준일 ${D.version}.`;
document.getElementById('counts').textContent=`${D.drugs.some(d=>d.form&&!d.form.includes('경구'))?'경구제·주사제·외용제 ':'경구제 '}${D.drugs.length.toLocaleString()}개 성분, 제품명 ${Object.keys(D.products).length.toLocaleString()}개를 인식합니다.`;
const PROB=Object.fromEntries(D.problems.map(p=>[p.id,p]));
const CATS=[...new Set(D.problems.map(p=>p.category))];
const LV={4:'높음',3:'가능성 있음',2:'낮음',1:'매우 드묾'};
const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
let sel=store.get('adr.drugs',[]).filter(id=>byId[id]);
let cat=store.get('adr.cat','신장'), prob=store.get('adr.prob','renal_fx'), organTab='renal', ftq='';
const ftag=d=>d.form&&!d.form.includes('경구')?` <small class="hint">(${d.form.join('·')})</small>`:'';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const norm=s=>String(s).toLowerCase().replace(/\s+/g,'');
const link=d=>`https://nedrug.mfds.go.kr/pbp/CCBBB01/getItemDetail?itemSeq=${d.seq}`;
const $=id=>document.getElementById(id);
const PRODS=Object.entries(D.products||{}).map(([name,ids])=>({name,n:norm(name),ids}));
function save(){store.set('adr.drugs',sel)}

/* ---------- 약 추가 ---------- */
const q=$('drugq'), sg=$('sugg'); let hits=[],hi=0,dup=false;
function search(){
  const t=norm(q.value); if(!t){sg.hidden=true;return}
  const all=D.drugs.filter(d=>[d.ko,d.en,d.brand].some(x=>norm(x).includes(t))).map(d=>({ids:[d.id],label:d.ko,sub:d.en,side:d.brand}));
  const pr=t.length>=2?PRODS.filter(p=>p.n.startsWith(t)||(t.length>=3&&p.n.includes(t))).slice(0,12).map(p=>({ids:p.ids,label:p.name,sub:'제품',side:p.ids.map(i=>byId[i].ko).join(' + ')})):[];
  const both=all.concat(pr);
  hits=both.filter(h=>h.ids.some(i=>!sel.includes(i))).slice(0,10); dup=both.length>0&&!hits.length; hi=0; renderSugg();
}
function renderSugg(){
  if(!hits.length){sg.innerHTML=`<button disabled><span>${dup?'이미 추가된 약입니다':'아직 DB에 없는 약입니다'}</span></button>`;sg.hidden=false;return}
  sg.innerHTML=hits.map((h,i)=>`<button type="button" data-i="${i}" class="${i===hi?'on':''}"><span>${esc(h.label)} <small>${esc(h.sub)}</small></span><small>${esc(h.side)}</small></button>`).join('');
  sg.hidden=false;
}
function add(ids){for(const id of ids)if(!sel.includes(id)){sel.push(id);track('drug_add',{drug:id,how:'search'})}save();q.value='';sg.hidden=true;render();q.focus()}
q.addEventListener('input',search);
q.addEventListener('keydown',e=>{if(sg.hidden)return;
  if(e.key==='ArrowDown'){hi=Math.min(hi+1,hits.length-1);renderSugg();e.preventDefault()}
  else if(e.key==='ArrowUp'){hi=Math.max(hi-1,0);renderSugg();e.preventDefault()}
  else if(e.key==='Enter'&&hits[hi]){add(hits[hi].ids);e.preventDefault()}
  else if(e.key==='Escape'){sg.hidden=true}});
sg.addEventListener('mousedown',e=>{const b=e.target.closest('button[data-i]');if(b){e.preventDefault();add(hits[+b.dataset.i].ids)}});
document.addEventListener('click',e=>{if(!e.target.closest('.search'))sg.hidden=true});

function findDrugs(text){
  const t=norm(text), found=[];
  for(const d of D.drugs){
    const keys=[d.ko,d.en,d.brand].filter(Boolean).map(norm).filter(k=>k.length>=2);
    if(d.id==='amoxicillin/clavulanate')keys.push('아목시실린','클라불란');
    if(keys.some(k=>t.includes(k)))found.push(d.id);
  }
  // 제품명(1만 4천 개)으로 찾기: 3글자 이상은 그대로, 2글자는 뒤에 제형(정·캡슐 등)이 붙을 때만
  for(const p of PRODS){
    if(p.n.length>=3?t.includes(p.n):new RegExp(p.n+'(정|캡슐|서방|시럽|산|액)').test(t)) for(const id of p.ids) if(!found.includes(id)) found.push(id);
  }
  return found;
}
function addFromText(text,how){const f=findDrugs(text),added=f.filter(id=>!sel.includes(id));sel=sel.concat(added);save();render();
  track('drugs_found',{how,found:f.length,added:added.length});for(const id of added)track('drug_add',{drug:id,how});return{f,added}}
$('pasteGo').onclick=()=>{const r=addFromText($('paste').value,'paste');
  $('pasteMsg').textContent=r.f.length?`${r.added.length}개 추가 (찾은 약 ${r.f.length}개)`:'아는 약을 찾지 못했습니다';$('paste').value=''};
$('clearAll').onclick=()=>{track('new_patient',{n:sel.length});sel=[];save();render();q.focus()};

/* 현재 탭 화면 글자 읽기: 복사가 막힌 화면도 글자로 되어 있으면 읽을 수 있음 */
$('scan').onclick=async()=>{
  const hint=$('drughint');
  if(!(window.chrome&&chrome.scripting)){hint.textContent='확장 프로그램 안에서만 동작합니다.';return}
  hint.textContent='화면을 읽는 중…';
  try{
    const [tab]=await chrome.tabs.query({active:true,lastFocusedWindow:true});
    if(!tab){hint.textContent='처방창 탭을 연 상태에서 눌러주세요.';return}
    if(tab.url&&!/^https?:/.test(tab.url)){hint.textContent='이 화면은 읽을 수 없습니다. 처방창 탭을 연 상태에서 눌러주세요.';return}
    const READ=()=>{
      const out=[]; if(document.body)out.push(document.body.innerText||'');
      document.querySelectorAll('input,textarea,select').forEach(e=>{if(e.value)out.push(e.value)});
      document.querySelectorAll('[title],[aria-label]').forEach(e=>{out.push(e.getAttribute('title')||'');out.push(e.getAttribute('aria-label')||'')});
      const walk=r=>r.querySelectorAll('*').forEach(el=>{if(el.shadowRoot){out.push(el.shadowRoot.textContent||'');walk(el.shadowRoot)}});walk(document);
      return out.join('\n')};
    let res;
    try{ res=await chrome.scripting.executeScript({target:{tabId:tab.id,allFrames:true},func:READ}); }
    catch(e1){
      // 아직 이 사이트 권한이 없으면 한 번만 허용을 요청 (처방창 사이트 주소를 알면 그 사이트만)
      const origins=tab.url?[new URL(tab.url).origin+'/*']:['https://*/*','http://*/*'];
      hint.textContent='처방창 화면을 읽도록 허용해 주세요.';
      const ok=await chrome.permissions.request({origins});
      if(!ok){track('scan_fail',{why:'perm_denied'});hint.textContent='허용하지 않아 화면을 읽지 못했습니다. 아이콘을 눌러 패널을 연 뒤 다시 시도하거나, 처방 목록 붙여넣기를 사용하세요.';return}
      res=await chrome.scripting.executeScript({target:{tabId:tab.id,allFrames:true},func:READ});
    }
    const text=res.map(r=>r.result||'').join('\n');
    const r=addFromText(text,'scan');
    hint.textContent=r.f.length?`화면에서 약 ${r.f.length}개를 찾아 ${r.added.length}개 추가했습니다.`:(text.trim().length<20?'화면에서 글자를 읽지 못했습니다. 처방창이 그림 형태일 수 있어요.':'화면에서 아는 약을 찾지 못했습니다.');
  }catch(e){track('scan_fail',{why:'error'});hint.textContent='화면을 읽지 못했습니다: '+(e&&e.message||e)}
};
function takePending(){
  if(!(window.chrome&&chrome.storage))return;
  chrome.storage.session.get('pending').then(o=>{if(!o.pending)return;chrome.storage.session.remove('pending');
    const r=addFromText(o.pending.text,'menu');
    $('drughint').textContent=r.f.length?`선택한 글에서 ${r.added.length}개 추가했습니다.`:`"${o.pending.text.slice(0,30)}"에서 아는 약을 찾지 못했습니다.`})}
if(window.chrome&&chrome.storage)chrome.storage.onChanged.addListener((c,a)=>{if(a==='session'&&c.pending&&c.pending.newValue)takePending()});

/* ---------- 문제 직접 입력 ---------- */
const ALIAS={renal_fx:'egfr,gfr,신기능,신장,콩팥,크레아티닌,creatinine,cr,bun,신부전,신손상,aki,사구체',hyperK:'고칼륨,칼륨상승,칼륨증가,포타슘,potassium,k상승,k증가',hypoK:'저칼륨,칼륨감소,칼륨저하',hypoNa:'나트륨,소디움,sodium,저나트륨,na',proteinuria:'단백뇨,혈뇨,소변에피',
lft:'간수치,ast,alt,got,gpt,간기능,간효소,alp,ggt,감마,lft,간검사',hepatitis:'간염,간손상,간독성,간부전',cholestasis:'황달,빌리루빈,bilirubin,담즙',anemia:'빈혈,헤모글로빈,hb,혈색소',thrombocytopenia:'혈소판,plt',leukopenia:'백혈구,호중구,wbc,anc',bleeding:'출혈,멍,코피,피가',
hypoglycemia:'저혈당',hyperglycemia:'고혈당,혈당상승,혈당증가,혈당이높',uric:'요산,통풍',ck:'ck,cpk,근육효소,횡문근',lipid:'중성지방,tg,콜레스테롤,지질',weight_gain:'체중,살이,몸무게',
dizziness:'어지러,어지럼,현기증,빙빙',headache:'두통,머리가아,머리아',edema:'부종,부음,붓기,부어,붓고,다리부',angioedema:'혈관부종,입술부,얼굴부,입술이부',cough:'기침,마른기침',myalgia:'근육통,쥐가,쥐남,근육경련,근육이아',arthralgia:'관절',fatigue:'피곤,피로,무기력,기운,무력',rash:'발진,두드러기,가려,소양,피부',sjs:'sjs,ten,dress,스티븐스,표피괴사',
nausea:'메스꺼,구역,구토,토해,울렁',diarrhea:'설사,묽은변',constipation:'변비',dyspepsia:'소화,속쓰림,복통,배가아,배아,위통,더부룩',insomnia:'불면,잠이안,잠을못',somnolence:'졸림,졸려,졸음,나른,진정',hypotension:'저혈압,기립,혈압이떨,혈압저하',bradycardia:'서맥,맥박이느,맥이느',palpitation:'두근,빈맥,심계항진,맥박이빠',
urinary:'빈뇨,소변,배뇨,오줌,요저류',sexual:'발기,성기능,성욕,사정',flushing:'홍조,얼굴이붉,화끈',hair:'탈모,머리카락,머리빠',tinnitus:'이명,귀에서,청력',vision:'시야,눈이침침,시력,흐릿',dry_mouth:'입마름,입이마,구강건조',mood:'우울,불안,기분,초조',uti:'요로감염,방광염,질염,생식기감염',gi_bleed:'흑변,위출혈,궤양,토혈,검은변',dyspnea:'숨참,호흡곤란,숨이차,숨차',neuropathy:'저림,저려,감각,손발저'};
for(const p of D.problems){const a=(ALIAS[p.id]||'').split(',').filter(Boolean);a.push(...p.name.split(/[·(),\s]+/).filter(x=>x.length>=2));p.alias=[...new Set(a.map(norm))]}
function matchProblems(text){
  const t=norm(text); if(t.length<1)return[];
  const sc=[];
  for(const p of D.problems){let best=0;for(const a of p.alias){
      if(a.length<2&&a!==t)continue;
      if(t===a)best=Math.max(best,100); else if(t.includes(a))best=Math.max(best,50+a.length); else if(a.startsWith(t)&&t.length>=2)best=Math.max(best,30+t.length)}
    if(best)sc.push([best,p.id])}
  return sc.sort((a,b)=>b[0]-a[0]).slice(0,5).map(x=>x[1]);
}
let probT=null;
function trackProb(via){clearTimeout(probT);probT=setTimeout(()=>{if(!sel.length)return;
  const m=via==='text'?matchProblems(ftq):[prob];
  const hits=sel.filter(id=>byId[id].adr&&byId[id].adr[prob]).length;
  track('problem_lookup',{problem:m.length?prob:'unmatched_text',via,n_drugs:sel.length,n_hits:m.length?hits:-1})},via==='text'?2000:300)}
const pq=$('probq');
pq.addEventListener('input',()=>{const m=matchProblems(pq.value);ftq=pq.value.trim();if(m.length){prob=m[0];store.set('adr.prob',prob)}renderPMatch(m);renderProbs();ensure(sel).then(renderResult);if(pq.value.trim())trackProb('text')});
function renderPMatch(m){
  $('pmatch').innerHTML=m.map(id=>`<button class="pb" aria-pressed="${id===prob}" data-p="${id}">${esc(PROB[id].name)}</button>`).join('')+(pq.value.trim()&&!m.length?'<span class="hint">목록에 맞는 항목이 없어 첨부문서 본문에서 찾습니다.</span>':'');
  $('pmatch').querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{prob=b.dataset.p;store.set('adr.prob',prob);renderPMatch(m);renderProbs();ensure(sel).then(renderResult);trackProb('suggest')});
}
function renderProbs(){
  const t=$('tabs');
  t.innerHTML=CATS.map(c=>`<button class="tab" role="tab" aria-selected="${c===cat}" data-c="${c}">${c}</button>`).join('');
  t.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{cat=b.dataset.c;store.set('adr.cat',cat);renderProbs()});
  $('probs').innerHTML=D.problems.filter(x=>x.category===cat).map(x=>{const n=sel.filter(id=>(byId[id].p||[]).includes(x.id)).length;
    return `<button class="pb" aria-pressed="${x.id===prob}" data-p="${x.id}">${esc(x.name)}${n?` · ${n}`:''}</button>`}).join('');
  $('probs').querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{prob=b.dataset.p;store.set('adr.prob',prob);pq.value='';ftq='';renderPMatch([]);renderProbs();ensure(sel).then(renderResult);trackProb('list')});
}

/* ---------- 첨부문서 본문 검색 ---------- */
const FREQ=[[/매우\s*(흔하게|자주|흔함)/g,5],[/흔하지\s*않[게음]/g,3],[/매우\s*드[물묾]게?/g,1],[/(?<!매우\s?)(흔하게|자주|흔함)/g,4],[/때때로/g,3],[/(?<!매우\s?)(드물게|드묾)/g,2],[/빈도\s*불명|시판\s*후|자발\s*보고/g,0]];
const S2L={5:4,4:4,3:3,2:2,1:1,0:3};
function freqAt(t,pos){let best=null;for(const [rx,s] of FREQ){rx.lastIndex=0;let m;while((m=rx.exec(t))&&m.index<pos){if(!best||m.index>best[0])best=[m.index,s]}}
  if(best)return best[1];const tail=t.slice(pos,pos+120).split(/\.\s/)[0];for(const [rx,s] of FREQ){rx.lastIndex=0;if(rx.test(tail))return s}return null}
const STOP=/(감소|상승|증가|저하|이상|높음|높아|낮음|낮아|생김|생겼|있음|했어요|해요|요$|됨$|함$)/g;
const LAY={'손떨림':'진전,떨림','떨림':'진전','떨려':'진전,떨림','부음':'부종','붓기':'부종','부어':'부종','가려':'가려움,소양','졸려':'졸음,졸림,기면','어지러':'어지러,현기증','숨차':'호흡곤란','숨이차':'호흡곤란','입마름':'구강건조,입마름','입이마':'구강건조','쥐가':'근육경련','쥐남':'근육경련','메스꺼':'구역,오심','울렁':'구역,오심','속쓰림':'소화불량,속쓰림','잠이안':'불면','기억':'기억,건망','헛것':'환각','넘어':'낙상','변이검':'흑색변','검은변':'흑색변','두근':'심계항진,두근','머리빠':'탈모','멍':'멍,자반','코피':'코피,비출혈','소변이안':'요저류,요폐','딸꾹':'딸꾹질','맛':'미각','냄새':'후각','혀':'혀,설염','잇몸':'치은'};
function ftRegex(text){
  let core=text.replace(STOP,' ').trim(); if(norm(core).length<2)core=text;
  const n=norm(text); const extra=[];for(const k in LAY){if(n.includes(k))extra.push(...LAY[k].split(','))}
  const words=core.split(/\s+/).filter(w=>w.length>=2).concat(extra); if(!words.length)return null;
  const parts=words.map(w=>[...w].map(c=>c.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('\\s*'));
  return new RegExp(parts.join('|'),'i');
}
function renderFT(){
  const box=$('ft'); if(!ftq||!sel.length){box.innerHTML='';return}
  const rx=ftRegex(ftq); if(!rx){box.innerHTML='';return}
  const rows=[];
  for(const id of sel){const d=byId[id];let hit=null;
    for(const t of d.txt||[]){const m=rx.exec(t);if(!m)continue;const s=freqAt(t,m.index);const lv=s==null?3:S2L[s];
      if(!hit||lv>hit.lv){const a=Math.max(0,m.index-70),b=Math.min(t.length,m.index+m[0].length+90);
        hit={lv,snip:(a?'…':'')+esc(t.slice(a,m.index))+'<mark>'+esc(m[0])+'</mark>'+esc(t.slice(m.index+m[0].length,b))+(b<t.length?'…':'')}}}
    rows.push({d,hit})}
  rows.sort((x,y)=>(y.hit?y.hit.lv:0)-(x.hit?x.hit.lv:0));
  const h=rows.filter(r=>r.hit), miss=rows.filter(r=>!r.hit);
  const open=!matchProblems(ftq).length;
  box.innerHTML=`<details ${open?'open':''}><summary>첨부문서 본문에서 "${esc(ftq)}" 직접 찾기 (${h.length}개 약)</summary><div class="items" style="margin-top:8px">`+
    h.map(({d,hit})=>`<div class="item"><div class="top"><span class="badge l${hit.lv}">${LV[hit.lv]}</span><span class="name">${esc(d.ko)}</span></div><blockquote style="margin:0;padding:8px 10px;background:var(--bg);border-radius:6px;font-size:.85rem;overflow-wrap:anywhere">${hit.snip}</blockquote><div class="hint">${esc(d.product)} · <a href="${link(d)}" target="_blank" rel="noopener">식약처 원문</a></div></div>`).join('')+
    (h.length?'':'<div class="none">선택한 약의 이상반응·경고 항목에서 이 말을 찾지 못했습니다.</div>')+
    (miss.length&&h.length?`<div class="none">언급 없음: ${miss.map(r=>esc(r.d.ko)).join(', ')}</div>`:'')+'</div></details>';
}

/* ---------- 결과 ---------- */
function renderResult(){
  const matched=!ftq||matchProblems(ftq).length;
  if(matched){
    const P=PROB[prob]; $('rtitle').textContent=`${P.name}: 원인 가능성이 있는 약`;
    const rows=sel.map(id=>({d:byId[id],a:byId[id].adr[prob]})).sort((x,y)=>(y.a?y.a[0]:0)-(x.a?x.a[0]:0));
    const hit=rows.filter(r=>r.a),miss=rows.filter(r=>!r.a);
    let h=hit.map(({d,a})=>`<div class="item"><div class="top"><span class="badge l${a[0]}">${LV[a[0]]}</span><span class="name">${esc(d.ko)}${ftag(d)}</span>${d.tier===2?'<span class="tier2">자동 선정 문서</span>':''}<span class="freq">첨부문서: ${esc(a[1])}</span></div>
      <details><summary>근거 문장 보기</summary><blockquote>${esc(a[2])}</blockquote><div class="hint">${esc(d.product)} · <a href="${link(d)}" target="_blank" rel="noopener">식약처 원문</a></div></details></div>`).join('');
    if(!sel.length)h='<div class="none">위에서 약을 먼저 추가하세요.</div>';
    else if(!hit.length)h+='<div class="none">선택한 약의 첨부문서에서 이 문제를 찾지 못했습니다.</div>';
    if(miss.length&&hit.length)h+=`<div class="none">첨부문서에 언급 없음: ${miss.map(r=>esc(r.d.ko)).join(', ')}</div>`;
    $('items').innerHTML=h;
  }else{$('rtitle').textContent=`"${ftq}": 원인 가능성이 있는 약`;$('items').innerHTML='<div class="hint">정리된 항목에 없는 말이라 첨부문서 원문에서 바로 찾았습니다. 근거 문장을 꼭 확인하세요.</div>'}
  renderFT();
}
const TAGCLS={'금기':'t-금기','용량 조절':'t-용량','주의':'t-주의','조절 불필요':'t-불필요'};
document.querySelectorAll('#otabs .tab').forEach(b=>b.onclick=()=>{organTab=b.dataset.o;track('organ_tab',{tab:organTab,n_drugs:sel.length});document.querySelectorAll('#otabs .tab').forEach(x=>x.setAttribute('aria-selected',x===b));renderOrgan()});
function renderOrgan(){
  $('organ').innerHTML=sel.map(id=>{const d=byId[id],g=d.organ[organTab];
    const tags=g.t.length?g.t.map(t=>`<span class="tag ${TAGCLS[t]}">${t}</span>`).join(''):'<span class="tag t-불필요">언급 없음</span>';
    const ev=g.e.length?`<details><summary>근거 문장 보기</summary>${g.e.map(e=>`<blockquote><b>${esc(e[0])}</b> · ${esc(e[1])}</blockquote>`).join('')}<div class="hint"><a href="${link(d)}" target="_blank" rel="noopener">식약처 원문</a></div></details>`:'';
    return `<div class="og"><div class="top"><span class="name"><b>${esc(d.ko)}</b></span>${tags}</div>${ev}</div>`}).join('')||'<span class="none">약을 추가하면 여기에 표시됩니다.</span>';
}
function renderChips(){
  const c=$('chips');
  c.innerHTML=sel.map(id=>`<span class="chip">${esc(byId[id].ko)}<button type="button" aria-label="${esc(byId[id].ko)} 빼기" data-rm="${id}">×</button></span>`).join('')||'<span class="none">약을 하나 이상 추가하세요.</span>';
  c.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{sel=sel.filter(x=>x!==b.dataset.rm);save();render()});
}
function render(){renderChips();renderProbs();ensure(sel).then(()=>{renderResult();renderOrgan()})}
if(!IS_EXT){$('scan').hidden=true}
try{if(!localStorage.getItem('adr.introOk')){$('intro').hidden=false}}catch(e){$('intro').hidden=false}
$('introOk').onclick=()=>{$('intro').hidden=true;try{localStorage.setItem('adr.introOk','1');localStorage.setItem('adr.stats',$('statsOk').checked?'1':'0')}catch(e){};renderStats();track('intro_ok')};
function renderStats(){const on=STATS.on();$('statsState').textContent=on?'익명 사용 통계 보내는 중':'사용 통계 꺼짐';$('statsToggle').textContent=on?'끄기':'켜기'}
$('statsToggle').onclick=()=>{const on=STATS.on();if(on){track('stats_off');STATS.flush()}try{localStorage.setItem('adr.stats',on?'0':'1')}catch(e){};renderStats()};
renderStats();
document.addEventListener('toggle',e=>{const d=e.target;if(d.tagName==='DETAILS'&&d.open&&d.closest('#items,#organ,#ft'))track('evidence_open',{where:d.closest('#items,#organ,#ft').id})},true);
document.addEventListener('click',e=>{const a=e.target.closest('a[href*="nedrug.mfds.go.kr"]');if(a)track('source_open')});
STATS.ready=(async()=>{for(let i=0;i<40&&!STATS.cfg;i++)await new Promise(r=>setTimeout(r,100));const c=STATS.cfg||{};
  if(c.feedback){const f=$('feedback');f.href=c.feedback;f.hidden=false;f.onclick=()=>track('feedback_open')}})();
track('app_open',{mode:IS_EXT?'ext':'web',n_saved:sel.length});
const adsrc=IS_EXT?(CFG.remote?CFG.remote+'ad.html':''):'ad.html';
if(adsrc){const f=$('adframe');f.src=adsrc;f.onload=()=>{$('adbox').hidden=false}
  // 광고 페이지는 노출·클릭 신호만 보낼 수 있고, 이쪽 내용은 볼 수 없습니다
  addEventListener('message',e=>{if(e.source!==f.contentWindow||!e.data||typeof e.data!=='object')return;
    const id=String(e.data.ad||'').slice(0,40);if(e.data.adr==='ad_view')track('ad_view',{ad:id});else if(e.data.adr==='ad_click')track('ad_click',{ad:id})})}
render();takePending();
}
