// 약 바로알기 첫 화면: 검색, 숫자 효과, 검색 예시 바꾸기, 제목 따라오기, 앱 설치
(function(){
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile=()=>matchMedia('(max-width:760px)').matches;

// 검색
const q=$('#q');
Portal.attachSearch(q,$('#sugg'),it=>{
  location.href=it.type==='product'?'drug.html?p='+encodeURIComponent(it.label):'drug.html?id='+encodeURIComponent(it.ids[0]);
});

// 검색창 예시 글자: 2.4초마다 바꿈
const EX=['타이레놀','아스피린','감기약 + 진통제','메트포르민','어지러움 · 두통','졸피뎀'];
let ex=0;
const setPh=()=>{q.placeholder=mobile()?`예: ${EX[ex]}`:`예: ${EX[ex]} · 약 이름, 성분, 증상 무엇이든`};
setPh();
if(!reduce)setInterval(()=>{if(document.activeElement!==q&&!q.value){ex=(ex+1)%EX.length;setPh()}},2400);
addEventListener('resize',setPh);

// 성분·제품 수: 0부터 올라가며 나타남
const FALLBACK={drugs:1493,products:20340};
const countUp=v=>{
  $$('[data-v]').forEach(e=>e.textContent=Number(v[e.dataset.v]).toLocaleString());
  const els=$$('[data-up]');
  if(reduce){els.forEach(e=>e.textContent=Number(v[e.dataset.up]).toLocaleString());return}
  const run=()=>{const t0=performance.now();const tick=now=>{const k=Math.min(1,(now-t0)/1800),p=1-Math.pow(1-k,3);
    els.forEach(e=>e.textContent=Math.round(v[e.dataset.up]*p).toLocaleString());if(k<1)requestAnimationFrame(tick)};requestAnimationFrame(tick)};
  // 화면에 보일 때 시작
  if('IntersectionObserver' in window){const io=new IntersectionObserver(es=>{if(es.some(x=>x.isIntersecting)){io.disconnect();run()}},{threshold:.4});els.forEach(e=>io.observe(e))}else run();
};
fetch(Portal.DATA+'version.json').then(r=>r.json()).then(countUp).catch(()=>countUp(FALLBACK));

// 스크롤할 때 제목이 살짝 따라옴
const follows=$$('[data-follow]');
if(follows.length&&!reduce){
  let raf=0;
  const step=()=>{
    raf=0;let moving=false;
    follows.forEach(el=>{
      const zone=el.parentElement,zr=zone.getBoundingClientRect();
      const lim=mobile()?+(el.dataset.followMaxM??el.dataset.followMax):+el.dataset.followMax;
      const max=Math.max(0,Math.min(lim,zone.offsetHeight-el.offsetHeight));
      const target=Math.max(0,Math.min(max,(96-zr.top)*+el.dataset.followK));
      const y=el._y||0,ny=Math.abs(target-y)<.1?target:y+(target-y)*.14;
      el._y=ny;el.style.transform=ny?`translateY(${ny.toFixed(1)}px)`:'';
      if(ny!==target)moving=true;
    });
    if(moving)raf=requestAnimationFrame(step);
  };
  const kick=()=>{if(!raf)raf=requestAnimationFrame(step)};
  addEventListener('scroll',kick,{passive:true});addEventListener('resize',kick);kick();
}

// 모바일 메뉴
const burger=$('.h-burger'),menu=$('#hMenu');
burger.addEventListener('click',()=>{const o=menu.classList.toggle('open');burger.setAttribute('aria-expanded',o);burger.setAttribute('aria-label',o?'메뉴 닫기':'메뉴 열기')});

// 알림
const toast=msg=>{const t=$('#hToast');t.textContent=msg;t.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>t.hidden=true,2600)};

// 앱 설치 (홈 화면에 추가)
const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone;
if(standalone)document.body.classList.add('installed');
let deferred=null;
addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e});
addEventListener('appinstalled',()=>{deferred=null;document.body.classList.add('installed');toast('설치했어요. 홈 화면에서 열 수 있어요.')});
const help=$('#installHelp');
$$('[data-install]').forEach(b=>b.addEventListener('click',async()=>{
  if(deferred){deferred.prompt();const r=await deferred.userChoice.catch(()=>null);if(r&&r.outcome==='accepted')deferred=null;return}
  if(help.showModal)help.showModal();else help.setAttribute('open','');
}));

// 링크 보내기 (휴대폰으로)
$$('[data-share]').forEach(b=>b.addEventListener('click',async()=>{
  const url=location.href.split('#')[0];
  if(navigator.share){try{await navigator.share({title:'약 바로알기',url});}catch(e){}return}
  try{await navigator.clipboard.writeText(url);toast('링크를 복사했어요. 휴대폰으로 보내 열어 보세요.')}catch(e){toast(url)}
}));
})();
