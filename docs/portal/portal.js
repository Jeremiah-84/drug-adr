// 약 바로알기 포털 공통: 머리·꼬리, 약 데이터 불러오기, 약 검색
(function(){
const B=document.body.dataset.base||'';           // 포털 루트까지 상대 경로 ('' 또는 '../')
const DATA=B+'../data/';                          // 기존 웹 버전과 같은 식약처 데이터
const page=document.body.dataset.page||'';
const NAV=[['drug','drug.html','약 사전'],['guides','guides.html','상황별 가이드'],['check','check.html','같이 먹어도 되나요?'],['news','news.html','안전 소식'],['dep','dependence.html','의존·중독'],['history','history.html','약의 역사'],['pro','pro.html','의료진'],['about','about.html','소개']];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const IC={
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  pill:'<path d="M10.5 20.5a5 5 0 0 1-7-7l10-10a5 5 0 0 1 7 7z"/><path d="m8.5 8.5 7 7"/>',
  heart:'<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
  symptom:'<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  layers:'<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  book:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/><path d="M9 7h6"/>',
  compass:'<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  shield:'<path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z"/><path d="m9 12 2 2 4-4"/>',
  bell:'<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
  arrow:'<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  warn:'<path d="M12 3 2 20h20z"/><path d="M12 10v4"/><path d="M12 17h.01"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>',
  check:'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  refresh:'<path d="M20 11a8 8 0 0 0-14.5-4.5L4 8"/><path d="M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.5 4.5L20 16"/><path d="M20 20v-4h-4"/>',
  doc:'<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  ext:'<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M19 14v6H4V5h6"/>',
  phone:'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1"/>',
  kidney:'<path d="M9 4C5 4 4 8 4 12s1 8 5 8 4-3 3-5 1-3 0-5-1-6-3-6z"/><path d="M15 4c4 0 5 4 5 8s-1 8-5 8"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  plug:'<path d="M9 2v6M15 2v6"/><path d="M6 8h12v3a6 6 0 0 1-12 0z"/><path d="M12 17v5"/>',
};
const icon=(n,c='i')=>`<svg class="${c}" viewBox="0 0 24 24" aria-hidden="true">${IC[n]||''}</svg>`;
// 페이지 안의 <i data-i="이름"></i>를 아이콘으로 바꿈
document.querySelectorAll('i[data-i]').forEach(e=>e.outerHTML=icon(e.dataset.i));
// 첫 화면과 같은 제목 글꼴
if(!document.querySelector('link[href*="family=Archivo"]')){document.head.insertAdjacentHTML('beforeend','<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;800&display=swap">')}
// data-chrome="own"인 페이지(첫 화면)는 머리·꼬리를 직접 그림
if(document.body.dataset.chrome!=='own'){
document.body.insertAdjacentHTML('afterbegin',`<header class="top"><div class="wrap">
<a class="logo" href="${B}index.html"><span class="mark">${icon('pill')}</span>약 바로알기</a>
<nav class="nav" aria-label="주 메뉴">${NAV.map(([k,h,t])=>`<a href="${B}${h}"${k===page?' aria-current="page"':''}>${t}</a>`).join('')}</nav></div></header>`);
document.body.insertAdjacentHTML('beforeend',`<footer class="foot"><div class="wrap">
<div class="cols">
 <div><a class="logo" href="${B}index.html" style="margin-bottom:12px"><span class="mark">${icon('pill')}</span>약 바로알기</a>
 <p style="margin:0;max-width:44ch">식품의약품안전처 의약품 허가정보(첨부문서)를 쉬운 말로 정리합니다. AI가 만든 글이 아니며, 진단이나 처방을 대신하지 않습니다. 약을 임의로 끊거나 바꾸지 말고 의사·약사와 상의하세요.</p></div>
 <div><h4>찾아보기</h4><ul><li><a href="${B}drug.html">약 사전</a></li><li><a href="${B}../">이 증상, 약 때문일까?</a></li><li><a href="${B}check.html">같이 먹어도 되나요?</a></li><li><a href="${B}guides.html">상황별 가이드</a></li><li><a href="${B}history.html">약의 역사</a></li></ul></div>
 <div><h4>안내</h4><ul><li><a href="${B}about.html">운영자·출처</a></li><li><a href="${B}about.html#report">오류 신고</a></li><li><a href="${B}pro.html">의료진 코너</a></li><li><a href="${B}../privacy.html">개인정보처리방침</a></li></ul></div>
</div>
<div class="legal"><span id="dataVer">자료: 식품의약품안전처 의약품 허가정보</span><span class="sos">${icon('phone')}숨이 차거나 얼굴·입술이 붓는 등 응급 증상은 <b>119</b></span></div>
</div></footer>`);
}
fetch(DATA+'version.json').then(r=>r.json()).then(v=>{const e=document.getElementById('dataVer');if(e)e.textContent=`자료: 식품의약품안전처 의약품 허가정보 · 기준일 ${v.version} · 성분 ${v.drugs.toLocaleString()}개 · 제품명 ${v.products.toLocaleString()}개`;document.querySelectorAll('[data-count]').forEach(x=>x.textContent=Number(v[x.dataset.count]).toLocaleString())}).catch(()=>{});

let IDX=null;
const norm=s=>String(s).toLowerCase().replace(/[\s\-·()（）]/g,'');
function load(){
  if(!IDX)IDX=fetch(DATA+'index.json').then(r=>r.json()).then(d=>{
    const byId={};d.drugs.forEach(x=>{byId[x.id]=x;x.n=[x.ko,x.en,x.brand].filter(Boolean).map(norm)});
    const prods=Object.entries(d.products||{}).map(([name,ids])=>({name,n:norm(name),ids}));
    const probs={};(d.problems||[]).forEach(p=>probs[p.id]=p);
    return {d,byId,prods,probs};
  });
  return IDX;
}
// 검색어 → [{type:'drug'|'product', label, sub, ids}]
function search(db,q,max=12){
  const n=norm(q);if(!n)return[];
  const out=[],seen=new Set();
  for(const x of db.d.drugs){const i=x.n.findIndex(s=>s.startsWith(n));if(i>=0){out.push({type:'drug',label:x.ko||x.en,sub:'성분 · '+(x.brand?'대표 제품 '+x.brand:x.en),ids:[x.id],rank:i===0?0:1});seen.add(x.id)}}
  for(const p of db.prods){if(p.n.startsWith(n))out.push({type:'product',label:p.name,sub:'제품 · '+p.ids.map(id=>db.byId[id]?.ko||id).join(', '),ids:p.ids,rank:2})}
  if(out.length<max){for(const x of db.d.drugs){if(!seen.has(x.id)&&x.n.some(s=>s.includes(n))){out.push({type:'drug',label:x.ko||x.en,sub:'성분 · '+(x.brand||x.en),ids:[x.id],rank:3});seen.add(x.id)}}
    for(const p of db.prods){if(out.length>=max*3)break;if(!p.n.startsWith(n)&&p.n.includes(n))out.push({type:'product',label:p.name,sub:'제품 · '+p.ids.map(id=>db.byId[id]?.ko||id).join(', '),ids:p.ids,rank:4})}}
  out.sort((a,b)=>a.rank-b.rank||a.label.length-b.label.length);
  return out.slice(0,max);
}
// 검색창 + 추천 목록 연결. onPick(item) 호출
function attachSearch(input,box,onPick){
  let items=[],on=-1;
  const draw=()=>{box.hidden=!items.length;box.innerHTML=items.map((it,i)=>`<a href="#" data-i="${i}" class="${i===on?'on':''}"><span>${esc(it.label)}</span><small>${esc(it.sub)}</small></a>`).join('')};
  input.addEventListener('focus',load,{once:true});
  input.addEventListener('input',async()=>{const db=await load();items=search(db,input.value);on=-1;
    if(!items.length&&input.value.trim()){box.hidden=false;box.innerHTML='<div>찾는 약이 없어요. 성분명이나 다른 제품명으로 찾아보세요.</div>';return}draw()});
  input.addEventListener('keydown',e=>{if(!items.length)return;
    if(e.key==='ArrowDown'){on=(on+1)%items.length;draw();e.preventDefault()}
    else if(e.key==='ArrowUp'){on=(on-1+items.length)%items.length;draw();e.preventDefault()}
    else if(e.key==='Enter'){e.preventDefault();pick(items[on<0?0:on])}
    else if(e.key==='Escape'){box.hidden=true}});
  box.addEventListener('click',e=>{const a=e.target.closest('a[data-i]');if(!a)return;e.preventDefault();pick(items[+a.dataset.i])});
  document.addEventListener('click',e=>{if(!box.contains(e.target)&&e.target!==input)box.hidden=true});
  const b=input.closest('.search')?.querySelector('.btn');
  if(b)b.addEventListener('click',async e=>{e.preventDefault();const db=await load();const r=search(db,input.value);if(r.length)pick(r[0]);else input.focus()});
  function pick(it){box.hidden=true;onPick(it)}
}
// 의존·내성 주의가 필요한 약 묶음 (감수 필요)
const DEP=[
  {k:'sleep',name:'수면제·신경안정제',sub:'벤조디아제핀계, 졸피뎀',ids:['alprazolam','lorazepam','diazepam','clonazepam','etizolam','triazolam','bromazepam','clobazam','flurazepam','chlordiazepoxide','flunitrazepam','loflazepate','tofisopam','zolpidem','eszopiclone','zaleplon']},
  {k:'opioid',name:'마약성 진통제',sub:'트라마돌, 옥시코돈 등',ids:['tramadol','oxycodone','hydromorphone','fentanyl','morphine','tapentadol','pethidine','pentazocine','butorphanol','sufentanil','oliceridine']},
  {k:'cough',name:'코데인이 든 기침약',sub:'코데인, 디히드로코데인',ids:['codeine','dihydrocodeine']},
  {k:'diet',name:'식욕억제제',sub:'펜터민, 펜디메트라진 등',ids:['phentermine','phendimetrazine','diethylpropion']},
  {k:'adhd',name:'중추신경 자극제',sub:'ADHD 치료제, 기면증 치료제',ids:['methylphenidate','modafinil','armodafinil']},
  {k:'etc',name:'그 밖의 향정신성의약품',sub:'바르비탈계 등',ids:['phenobarbital','pentobarbital','esketamine']},
];
const DEP_IDS=new Set(DEP.flatMap(g=>g.ids));
// 첨부문서 문장 중 의존성·금단·남용 관련 문장
const DEP_RE=/(정신적|신체적|약물)\s*의존|의존성|금단|남용|습관성|약물\s*내성|반동성/;
const DEP_NOT=/(용량|농도|시간)\s*[-·]?\s*의존/;
const depLines=txt=>(txt||[]).filter(t=>t.length>15&&DEP_RE.test(t)&&!(DEP_NOT.test(t)&&!/의존성/.test(t.replace(DEP_NOT,''))));
window.Portal={B,DATA,esc,norm,load,search,attachSearch,icon,DEP,DEP_IDS,depLines};
})();
