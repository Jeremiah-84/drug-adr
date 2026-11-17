// 약 바로알기 포털 공통: 머리·꼬리, 약 데이터 불러오기, 약 검색
(function(){
const B=document.body.dataset.base||'';           // 포털 루트까지 상대 경로 ('' 또는 '../')
const DATA=B+'../data/';                          // 기존 웹 버전과 같은 식약처 데이터
const page=document.body.dataset.page||'';
const NAV=[['drug','drug.html','약 사전'],['guides','guides.html','상황별 가이드'],['check','check.html','같이 먹어도 되나요?'],['news','news.html','안전 소식'],['pro','pro.html','의료진'],['about','about.html','소개']];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
document.body.insertAdjacentHTML('afterbegin',`<header class="top"><div class="wrap">
<a class="logo" href="${B}index.html"><i>약</i>약 바로알기</a>
<nav class="nav" aria-label="주 메뉴">${NAV.map(([k,h,t])=>`<a href="${B}${h}"${k===page?' aria-current="page"':''}>${t}</a>`).join('')}</nav></div></header>`);
document.body.insertAdjacentHTML('beforeend',`<footer class="foot"><div class="wrap">
<div><b>약 바로알기</b>는 식품의약품안전처 의약품 허가정보(첨부문서)를 쉬운 말로 정리합니다. AI가 만든 글이 아니며, 진단이나 처방을 대신하지 않습니다. 약을 임의로 끊거나 바꾸지 말고 의사·약사와 상의하세요.</div>
<div class="row"><a href="${B}about.html">운영자·출처</a><a href="${B}about.html#report">오류 신고</a><a href="${B}../privacy.html">개인정보처리방침</a><span id="dataVer"></span></div>
<div style="margin-top:8px">응급 증상(숨이 차거나 얼굴·입술이 붓는 경우, 의식이 흐려지는 경우)은 바로 <b>119</b>에 연락하세요.</div></div></footer>`);
fetch(DATA+'version.json').then(r=>r.json()).then(v=>{const e=document.getElementById('dataVer');if(e)e.textContent=`자료 기준일 ${v.version} · 성분 ${v.drugs.toLocaleString()}개 · 제품명 ${v.products.toLocaleString()}개`}).catch(()=>{});

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
  function pick(it){box.hidden=true;onPick(it)}
}
window.Portal={B,DATA,esc,norm,load,search,attachSearch};
})();
