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
/* ---------- 언어 (한국어/English) : 설정만 저장하고 검색 기록은 저장하지 않음 ---------- */
const LANG0=/^ko/i.test(navigator.language||'ko')?'ko':'en';  // 처음엔 브라우저 언어를 따름
let LANG=(()=>{try{return localStorage.getItem('adr.lang')||LANG0}catch(e){return LANG0}})();
const T=(k,...a)=>{const v=(I18N[LANG]&&I18N[LANG][k]!==undefined)?I18N[LANG][k]:I18N.ko[k];return typeof v==='function'?v(...a):v};
function applyStatic(){document.documentElement.lang=LANG==='en'?'en':'ko';
  document.querySelectorAll('[data-i18n]').forEach(e=>e.textContent=T(e.dataset.i18n));
  document.querySelectorAll('[data-i18n-ph]').forEach(e=>e.placeholder=T(e.dataset.i18nPh));
  document.querySelectorAll('[data-i18n-html]').forEach(e=>e.innerHTML=T(e.dataset.i18nHtml));
  document.querySelectorAll('.legend [data-lv]').forEach(e=>e.textContent=LANG==='en'?I18N_EN.lv[e.dataset.lv]:({4:'높음',3:'가능성 있음',2:'낮음',1:'매우 드묾'})[e.dataset.lv]);
  const lb=document.getElementById('langBtn');if(lb)lb.textContent=T('lang');
  document.querySelectorAll('.brand-en').forEach(e=>e.hidden=LANG==='en');
  document.title=LANG==='en'?'MediScan Pro':'메디스캔 프로 (MediScan Pro)'}
applyStatic();
boot().catch(e=>{document.getElementById('items').innerHTML='<div class="none">'+T('loadFail')+'</div>'});
function start(D){
const byId=Object.fromEntries(D.drugs.map(d=>[d.id,d]));
const loading={};
function loadDrug(id){const d=byId[id]; if(!d)return Promise.resolve(); if(d.adr)return Promise.resolve(d);
  return loading[id]||(loading[id]=getJSON('d/'+d.f+'.json').then(x=>Object.assign(d,x)).catch(()=>Object.assign(d,{adr:{},organ:{renal:{t:[],e:[]},hepatic:{t:[],e:[]}},txt:[],product:T('failLoad')})))}
function ensure(ids){return Promise.all(ids.map(loadDrug))}
function renderMeta(){document.getElementById('dataver').textContent=T('dataver',String(D.version).slice(0,10));
document.getElementById('counts').textContent=T('counts',D.drugs.some(d=>d.form&&!d.form.includes('경구')),D.drugs.length.toLocaleString(),Object.keys(D.products).length.toLocaleString())}
renderMeta();
const PROB=Object.fromEntries(D.problems.map(p=>[p.id,p]));
const CATS=[...new Set(D.problems.map(p=>p.category))];
const LVKO={4:'높음',3:'가능성 있음',2:'낮음',1:'매우 드묾'};
const LV=new Proxy({},{get:(_,k)=>LANG==='en'?I18N_EN.lv[k]:LVKO[k]});
const EN=()=>LANG==='en';
const cap=x=>x?x.charAt(0).toUpperCase()+x.slice(1):x;
const dn=d=>EN()&&d.en?cap(d.en):d.ko;                       // 약 이름
const pn=p=>EN()?(I18N_EN.prob[p.id]||p.name):p.name;         // 문제 이름
const cn=c=>EN()?(I18N_EN.cat[c]||c):c;                        // 분류 이름
const tn=t=>EN()?(I18N_EN.tag[t]||t):t;                        // 신·간 표시
const fq=f=>{if(!EN())return f;let x=f;for(const [rx,r] of I18N_EN.freq)x=x.replace(rx,r);return x};
const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
// 검색 기록(약·문제)은 저장하지 않음: 패널이나 창을 닫으면 사라짐. 예전 버전이 남긴 기록도 지움
try{['adr.drugs','adr.cat','adr.prob'].forEach(k=>localStorage.removeItem(k))}catch(e){}
let sel=[];
let cat='신장', prob='renal_fx', organTab='renal', ftq='';
const FEN={'경구':'oral','주사':'injection','외용':'topical','기타':'other'};
const ftag=d=>d.form&&!d.form.includes('경구')?` <small class="hint">(${d.form.map(f=>EN()?(FEN[f]||f):f).join('·')})</small>`:'';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const norm=s=>String(s).toLowerCase().replace(/\s+/g,'');
const link=d=>`https://nedrug.mfds.go.kr/pbp/CCBBB01/getItemDetail?itemSeq=${d.seq}`;
const $=id=>document.getElementById(id);
const PF=D.pform||{};
const PRODS=Object.entries(D.products||{}).map(([name,ids])=>({name,n:norm(name),ids,form:PF[name]?PF[name].split('·'):null}));
function save(){}

/* ---------- 약 추가 ---------- */
const q=$('drugq'), sg=$('sugg'); let hits=[],hi=0,dup=false;
function search(){
  const t=norm(q.value); if(!t){sg.hidden=true;return}
  const all=D.drugs.filter(d=>[d.ko,d.en,d.brand].some(x=>norm(x).includes(t))).map(d=>({ids:[d.id],label:dn(d),sub:EN()?d.ko:d.en,side:d.brand}));
  const pr=t.length>=2?PRODS.filter(p=>p.n.startsWith(t)||(t.length>=3&&p.n.includes(t))).slice(0,12).map(p=>({ids:p.ids,label:p.name,sub:p.form?p.form.map(f=>EN()?(FEN[f]||f):f).join('·'):T('product'),side:p.ids.map(i=>dn(byId[i])).join(' + ')})):[];
  const both=all.concat(pr);
  hits=both.filter(h=>h.ids.some(i=>!sel.includes(i))).slice(0,10); dup=both.length>0&&!hits.length; hi=0; renderSugg();
}
function renderSugg(){
  if(!hits.length){sg.innerHTML=`<button disabled><span>${dup?T('dupDrug'):T('noDrug')}</span></button>`;sg.hidden=false;return}
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

/* 화면·붙여넣기에서 찾을 제형 (기본: 먹는 약만) */
let FORMS=store.get('adr.forms',['경구']);
const fsel=$('formsel');
if(fsel){fsel.querySelectorAll('input').forEach(i=>{i.checked=FORMS.includes(i.value);i.onchange=()=>{
  FORMS=[...fsel.querySelectorAll('input:checked')].map(x=>x.value);store.set('adr.forms',FORMS);track('forms_set',{forms:FORMS.join(',')})}})}
const formOk=fs=>{const f=(fs&&fs.length?fs:['경구']).map(x=>x==='기타'?'주사':x);return f.some(x=>FORMS.includes(x))};
// 성분명 바로 뒤에 "주사·주·연고·점안" 등이 붙어 있으면 그 제형을 켰을 때만 인정
const SUF={주사:/^[가-힣]{0,6}?(주사|주\b|주\d|주[(\s,]|수액)/,외용:/^[가-힣]{0,6}?(연고|크림|겔|로션|패취|패치|플라스타|점안|점비|점이|좌제|외용|스프레이|흡입)/};
function hitKey(t,k){let i=t.indexOf(k);while(i>=0){const after=t.slice(i+k.length,i+k.length+12);
  const blocked=Object.entries(SUF).some(([f,rx])=>!FORMS.includes(f)&&rx.test(after));
  if(!blocked)return true; i=t.indexOf(k,i+1)}return false}
function findDrugs(text){
  const t=norm(text), found=[];
  for(const d of D.drugs){
    if(!formOk(d.form))continue;
    // 두 글자 이름(예: 미보)은 뒤에 정·캡슐 등 제형이 붙을 때만 인정 (다른 낱말 속 글자와 헷갈리지 않게)
    const keys=[d.ko,d.en,d.brand].filter(Boolean).map(norm).map(k=>k.replace(/\(.*\)$/,'')).filter(k=>k.length>=3||(k.length===2&&/[가-힣]/.test(k)));
    if(d.id==='amoxicillin/clavulanate')keys.push('아목시실린','클라불란');
    if(keys.some(k=>k.length>=3?hitKey(t,k):new RegExp(k+'(정|캡슐|서방|시럽|산|액|연고|크림|주)').test(t)))found.push(d.id);
  }
  // 제품명(1만 4천 개)으로 찾기: 3글자 이상은 그대로, 2글자는 뒤에 제형(정·캡슐 등)이 붙을 때만
  for(const p of PRODS){
    if(p.form&&!formOk(p.form))continue;
    if(p.n.length>=3?t.includes(p.n):new RegExp(p.n+'(정|캡슐|서방|시럽|산|액)').test(t)) for(const id of p.ids) if(!found.includes(id)) found.push(id);
  }
  return found;
}
function addFromText(text,how){const f=findDrugs(text),added=f.filter(id=>!sel.includes(id));sel=sel.concat(added);save();render();
  track('drugs_found',{how,found:f.length,added:added.length});for(const id of added)track('drug_add',{drug:id,how});return{f,added}}
$('pasteGo').onclick=()=>{const r=addFromText($('paste').value,'paste');
  $('pasteMsg').textContent=T('pasteMsg',r.added.length,r.f.length);$('paste').value=''};
$('clearAll').onclick=()=>{track('new_patient',{n:sel.length});sel=[];save();render();q.focus()};

/* 현재 탭 화면 글자 읽기: 복사가 막힌 화면도 글자로 되어 있으면 읽을 수 있음 */
$('scan').onclick=async()=>{
  const hint=$('drughint');
  if(!(window.chrome&&chrome.scripting)){hint.textContent=T('extOnly');return}
  hint.textContent=T('reading');
  try{
    const [tab]=await chrome.tabs.query({active:true,lastFocusedWindow:true});
    if(!tab){hint.textContent=T('openTab');return}
    if(tab.url&&!/^https?:/.test(tab.url)){hint.textContent=T('cantRead');return}
    // 지금 화면에 실제로 보이는 글자만 읽음 (접힌 지난 처방·숨은 메뉴·툴팁은 제외)
    const READ=()=>{
      const out=[], W=innerWidth, H=innerHeight;
      const shown=el=>{if(!el)return false;const r=el.getBoundingClientRect();
        if(r.width<1||r.height<1||r.bottom<0||r.right<0||r.top>H||r.left>W)return false;
        const cs=getComputedStyle(el);return cs.visibility!=='hidden'&&cs.display!=='none'&&+cs.opacity>0.05};
      const scan=root=>{
        const tw=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n,last=null,buf=[];
        while((n=tw.nextNode())){const v=n.nodeValue;if(!v||!v.trim())continue;const el=n.parentElement;
          if(!el||/^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE)$/.test(el.tagName))continue;
          if(el!==last){last=el;last.__ok=shown(el)}if(last.__ok)buf.push(v)}
        out.push(buf.join(' '));
        root.querySelectorAll('input,textarea,select').forEach(e=>{if(e.value&&shown(e))out.push(e.value)});
        root.querySelectorAll('*').forEach(el=>{if(el.shadowRoot)scan(el.shadowRoot)});
      };
      if(document.body)scan(document.body);
      return out.join('\n')};
    let res;
    try{ res=await chrome.scripting.executeScript({target:{tabId:tab.id,allFrames:true},func:READ}); }
    catch(e1){
      // 아직 이 사이트 권한이 없으면 한 번만 허용을 요청 (처방창 사이트 주소를 알면 그 사이트만)
      const origins=tab.url?[new URL(tab.url).origin+'/*']:['https://*/*','http://*/*'];
      hint.textContent=T('allow');
      const ok=await chrome.permissions.request({origins});
      if(!ok){track('scan_fail',{why:'perm_denied'});hint.textContent=T('denied');return}
      res=await chrome.scripting.executeScript({target:{tabId:tab.id,allFrames:true},func:READ});
    }
    const text=res.map(r=>r.result||'').join('\n');
    const r=addFromText(text,'scan');
    hint.textContent=r.f.length?T('scanned',r.f.length,r.added.length):(text.trim().length<20?T('noText'):T('noKnown'));
  }catch(e){track('scan_fail',{why:'error'});hint.textContent=T('scanErr')+(e&&e.message||e)}
};
function takePending(){
  if(!(window.chrome&&chrome.storage))return;
  chrome.storage.session.get('pending').then(o=>{if(!o.pending)return;chrome.storage.session.remove('pending');
    const r=addFromText(o.pending.text,'menu');
    $('drughint').textContent=r.f.length?T('selAdded',r.added.length):T('selNone',o.pending.text.slice(0,30))})}
if(window.chrome&&chrome.storage)chrome.storage.onChanged.addListener((c,a)=>{if(a==='session'&&c.pending&&c.pending.newValue)takePending()});

/* ---------- 문제 직접 입력 ---------- */
const ALIAS={renal_fx:'egfr,gfr,신기능,신장,콩팥,크레아티닌,creatinine,cr,bun,신부전,신손상,aki,사구체',hyperK:'고칼륨,칼륨상승,칼륨증가,포타슘,potassium,k상승,k증가',hypoK:'저칼륨,칼륨감소,칼륨저하',hypoNa:'나트륨,소디움,sodium,저나트륨,na',proteinuria:'단백뇨,혈뇨,소변에피',
lft:'간수치,ast,alt,got,gpt,간기능,간효소,alp,ggt,감마,lft,간검사',hepatitis:'간염,간손상,간독성,간부전',cholestasis:'황달,빌리루빈,bilirubin,담즙',anemia:'빈혈,헤모글로빈,hb,혈색소',thrombocytopenia:'혈소판,plt',leukopenia:'백혈구,호중구,wbc,anc',bleeding:'출혈,멍,코피,피가',
hypoglycemia:'저혈당',hyperglycemia:'고혈당,혈당상승,혈당증가,혈당이높',uric:'요산,통풍',ck:'ck,cpk,근육효소,횡문근',lipid:'중성지방,tg,콜레스테롤,지질',weight_gain:'체중,살이,몸무게',
dizziness:'어지러,어지럼,현기증,빙빙',headache:'두통,머리가아,머리아',edema:'부종,부음,붓기,부어,붓고,다리부',angioedema:'혈관부종,입술부,얼굴부,입술이부',cough:'기침,마른기침',myalgia:'근육통,쥐가,쥐남,근육경련,근육이아',arthralgia:'관절',fatigue:'피곤,피로,무기력,기운,무력',rash:'발진,두드러기,가려,소양,피부',sjs:'sjs,ten,dress,스티븐스,표피괴사',
nausea:'메스꺼,구역,구토,토해,울렁',diarrhea:'설사,묽은변',constipation:'변비',dyspepsia:'소화,속쓰림,복통,배가아,배아,위통,더부룩',insomnia:'불면,잠이안,잠을못',somnolence:'졸림,졸려,졸음,나른,진정',hypotension:'저혈압,기립,혈압이떨,혈압저하',bradycardia:'서맥,맥박이느,맥이느',palpitation:'두근,빈맥,심계항진,맥박이빠',
urinary:'빈뇨,소변,배뇨,오줌,요저류',sexual:'발기,성기능,성욕,사정',flushing:'홍조,얼굴이붉,화끈',hair:'탈모,머리카락,머리빠',tinnitus:'이명,귀에서,청력',vision:'시야,눈이침침,시력,흐릿',dry_mouth:'입마름,입이마,구강건조',mood:'우울,불안,기분,초조',uti:'요로감염,방광염,질염,생식기감염',gi_bleed:'흑변,위출혈,궤양,토혈,검은변',dyspnea:'숨참,호흡곤란,숨이차,숨차',neuropathy:'저림,저려,감각,손발저'};
for(const p of D.problems){const a=(ALIAS[p.id]||'').split(',').concat((I18N_EN.alias[p.id]||'').split(',')).filter(Boolean);a.push(...p.name.split(/[·(),\s]+/).filter(x=>x.length>=2));
  a.push(...(I18N_EN.prob[p.id]||'').toLowerCase().split(/[\/(),]+/).map(x=>x.trim()).filter(x=>x.length>=3));p.alias=[...new Set(a.map(norm))]}
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
pq.addEventListener('input',()=>{const m=matchProblems(pq.value);ftq=pq.value.trim();if(m.length){prob=m[0]}renderPMatch(m);renderProbs();ensure(sel).then(renderResult);if(pq.value.trim())trackProb('text')});
function renderPMatch(m){
  $('pmatch').innerHTML=m.map(id=>`<button class="pb" aria-pressed="${id===prob}" data-p="${id}">${esc(pn(PROB[id]))}</button>`).join('')+(pq.value.trim()&&!m.length?'<span class="hint">'+T('noMatch')+'</span>':'');
  $('pmatch').querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{prob=b.dataset.p;renderPMatch(m);renderProbs();ensure(sel).then(renderResult);trackProb('suggest')});
}
function renderProbs(){
  const t=$('tabs');
  t.innerHTML=CATS.map(c=>`<button class="tab" role="tab" aria-selected="${c===cat}" data-c="${c}">${esc(cn(c))}</button>`).join('');
  t.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{cat=b.dataset.c;renderProbs()});
  $('probs').innerHTML=D.problems.filter(x=>x.category===cat).map(x=>{const n=sel.filter(id=>(byId[id].p||[]).includes(x.id)).length;
    return `<button class="pb" aria-pressed="${x.id===prob}" data-p="${x.id}">${esc(pn(x))}${n?` · ${n}`:''}</button>`}).join('');
  $('probs').querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{prob=b.dataset.p;pq.value='';ftq='';renderPMatch([]);renderProbs();ensure(sel).then(renderResult);trackProb('list')});
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
  box.innerHTML=`<details ${open?'open':''}><summary>${esc(T('ftSum',ftq,h.length))}</summary><div class="items" style="margin-top:8px">`+
    h.map(({d,hit})=>`<div class="item"><div class="top"><span class="badge l${hit.lv}">${LV[hit.lv]}</span><span class="name">${esc(dn(d))}</span></div><blockquote style="margin:0;padding:8px 10px;background:var(--bg);border-radius:6px;font-size:.85rem;overflow-wrap:anywhere">${hit.snip}</blockquote><div class="hint">${esc(d.product)} · <a href="${link(d)}" target="_blank" rel="noopener">${T('source')}</a></div></div>`).join('')+
    (h.length?'':'<div class="none">'+T('ftNone')+'</div>')+
    (miss.length&&h.length?`<div class="none">${T('ftMiss')}${miss.map(r=>esc(dn(r.d))).join(', ')}</div>`:'')+'</div></details>';
}

/* ---------- 결과 ---------- */
function renderResult(){
  const matched=!ftq||matchProblems(ftq).length;
  if(matched){
    const P=PROB[prob]; $('rtitle').textContent=T('rtitle',pn(P));
    const rows=sel.map(id=>({d:byId[id],a:byId[id].adr[prob]})).sort((x,y)=>(y.a?y.a[0]:0)-(x.a?x.a[0]:0));
    const hit=rows.filter(r=>r.a),miss=rows.filter(r=>!r.a);
    let h=hit.map(({d,a})=>`<div class="item"><div class="top"><span class="badge l${a[0]}">${LV[a[0]]}</span><span class="name">${esc(dn(d))}${ftag(d)}</span>${d.tier===2?`<span class="tier2">${T('autoDoc')}</span>`:''}<span class="freq">${T('label')}${esc(fq(a[1]))}</span></div>
      <details><summary>${T('evidence')}</summary><blockquote>${esc(a[2])}</blockquote><div class="hint">${esc(d.product)} · <a href="${link(d)}" target="_blank" rel="noopener">${T('source')}</a></div></details></div>`).join('');
    if(!sel.length)h='<div class="none">'+T('addFirst')+'</div>';
    else if(!hit.length)h+='<div class="none">'+T('notFound')+'</div>';
    if(miss.length&&hit.length)h+=`<div class="none">${T('notMentioned')}${miss.map(r=>esc(dn(r.d))).join(', ')}</div>`;
    $('items').innerHTML=h;
  }else{$('rtitle').textContent=T('rtitle',`"${ftq}"`);$('items').innerHTML='<div class="hint">'+T('ftOnly')+'</div>'}
  renderFT();
}
const TAGCLS={'금기':'t-금기','용량 조절':'t-용량','주의':'t-주의','조절 불필요':'t-불필요'};
document.querySelectorAll('#otabs .tab').forEach(b=>b.onclick=()=>{organTab=b.dataset.o;track('organ_tab',{tab:organTab,n_drugs:sel.length});document.querySelectorAll('#otabs .tab').forEach(x=>x.setAttribute('aria-selected',x===b));renderOrgan()});
function renderOrgan(){
  $('organ').innerHTML=sel.map(id=>{const d=byId[id],g=d.organ[organTab];
    const tags=g.t.length?g.t.map(t=>`<span class="tag ${TAGCLS[t]}">${esc(tn(t))}</span>`).join(''):`<span class="tag t-불필요">${T('noMention')}</span>`;
    const ev=g.e.length?`<details><summary>${T('evidence')}</summary>${g.e.map(e=>`<blockquote><b>${esc(tn(e[0]))}</b> · ${esc(e[1])}</blockquote>`).join('')}<div class="hint"><a href="${link(d)}" target="_blank" rel="noopener">${T('source')}</a></div></details>`:'';
    return `<div class="og"><div class="top"><span class="name"><b>${esc(dn(d))}</b></span>${tags}</div>${ev}</div>`}).join('')||`<span class="none">${T('organEmpty')}</span>`;
}
function renderChips(){
  const c=$('chips');
  c.innerHTML=sel.map(id=>`<span class="chip">${esc(dn(byId[id]))}<button type="button" aria-label="${esc(T('remove',dn(byId[id])))}" data-rm="${id}">×</button></span>`).join('')||`<span class="none">${T('chipsEmpty')}</span>`;
  c.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{sel=sel.filter(x=>x!==b.dataset.rm);save();render()});
}
function render(){renderChips();renderProbs();ensure(sel).then(()=>{renderResult();renderOrgan()})}
if(!IS_EXT){$('scan').hidden=true}
try{if(!localStorage.getItem('adr.introOk')){$('intro').hidden=false}}catch(e){$('intro').hidden=false}
$('introOk').onclick=()=>{$('intro').hidden=true;try{localStorage.setItem('adr.introOk','1');localStorage.setItem('adr.stats',$('statsOk').checked?'1':'0')}catch(e){};renderStats();track('intro_ok')};
function renderStats(){const on=STATS.on();$('statsState').textContent=on?T('statsOn'):T('statsOff');$('statsToggle').textContent=on?T('off'):T('on')}
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
$('langBtn').onclick=()=>{LANG=LANG==='en'?'ko':'en';try{localStorage.setItem('adr.lang',LANG)}catch(e){};track('lang',{lang:LANG});
  applyStatic();renderMeta();renderStats();renderPMatch(pq.value.trim()?matchProblems(pq.value):[]);render()};
render();takePending();
}
