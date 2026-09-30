'use strict';
(() => {
 const T=(ko,en,vars)=>window.JSB_T?window.JSB_T(ko,en,vars):en;
 const filters=[...document.querySelectorAll('[data-filter]')];
 const cards=[...document.querySelectorAll('[data-category]')];
 const search=document.getElementById('travel-search');
 let category='all';
 const normalize=text=>text.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g,' ').trim();
 function applyFilters(){
  const terms=normalize(search?.value||'').split(' ').filter(Boolean);
  let visible=0;
  cards.forEach(card=>{card.hidden=!(category==='all'||card.dataset.category===category)||!terms.every(term=>normalize(card.dataset.search).includes(term));if(!card.hidden)visible++;});
  filters.forEach(button=>{const on=button.dataset.filter===category;button.classList.toggle('active',on);button.setAttribute('aria-pressed',String(on));});
  const count=document.getElementById('filter-count');if(count)count.textContent=T('{n}개의 여정','{n} journeys',{n:visible});
  const empty=document.getElementById('search-empty');if(empty)empty.hidden=visible!==0;
 }
 filters.forEach(button=>button.addEventListener('click',()=>{category=button.dataset.filter;applyFilters();}));
 search?.addEventListener('input',applyFilters);
 document.querySelectorAll('#reset-search,[data-reset-search]').forEach(button=>button.addEventListener('click',()=>{search.value='';category='all';applyFilters();search.focus();}));
 const checks=[...document.querySelectorAll('[data-compare]')];
 const comparison=document.getElementById('comparison-dialog');
 const compareOpen=document.getElementById('open-comparison');
 let returnFocus=null,previousOverflow='';
 const selections=()=>checks.filter(input=>input.checked);
 function syncComparison(){
  const selected=selections();
  const bar=document.querySelector('.compare-bar');if(bar)bar.hidden=selected.length===0;
  const status=document.getElementById('compare-selection');if(status)status.textContent=`${T('선택','Selected')} ${selected.length}/2 · ${selected.map(input=>input.closest('.tour-card')?.querySelector('h3')?.textContent||input.value).join(' / ')}`;
  if(compareOpen)compareOpen.disabled=selected.length!==2;
 }
 checks.forEach(input=>input.addEventListener('change',()=>{
  const message=document.getElementById('compare-message');
  if(selections().length>2){input.checked=false;message.textContent=T('여행은 최대 2개까지 비교할 수 있습니다. 먼저 선택한 여행을 해제해 주세요','Compare up to two journeys. Remove one before adding another');}
  else message.textContent='';
  syncComparison();
 }));
 document.getElementById('clear-comparison')?.addEventListener('click',()=>{checks.forEach(input=>input.checked=false);document.getElementById('compare-message').textContent=T('선택한 여행을 모두 해제했습니다','All selections cleared');syncComparison();(checks.find(input=>!input.closest('.tour-card').hidden)||search)?.focus();});
 compareOpen?.addEventListener('click',()=>{
  const ids=selections().map(input=>input.dataset.compare);if(ids.length!==2)return;
  comparison.querySelectorAll('[data-comparison]').forEach(panel=>panel.hidden=!ids.includes(panel.dataset.comparison));
  returnFocus=document.activeElement;previousOverflow=document.body.style.overflow;
  comparison.showModal();document.body.style.overflow='hidden';document.getElementById('close-comparison').focus();
 });
 const closeComparison=()=>{if(comparison?.open)comparison.close();};
 document.getElementById('close-comparison')?.addEventListener('click',closeComparison);
 comparison?.addEventListener('cancel',event=>{event.preventDefault();closeComparison();});
 comparison?.addEventListener('close',()=>{document.body.style.overflow=previousOverflow;returnFocus?.focus();});
 const days=[...document.querySelectorAll('.day-details')];
 const toggleDays=document.getElementById('toggle-days');
 function syncDays(){if(!toggleDays)return;const allOpen=days.every(day=>day.open);toggleDays.textContent=allOpen?T('전체 일정 접기','Collapse all days'):T('전체 일정 펼치기','Expand all days');toggleDays.setAttribute('aria-expanded',String(allOpen));}
 toggleDays?.addEventListener('click',()=>{const open=!days.every(day=>day.open);days.forEach(day=>day.open=open);syncDays();});
 days.forEach(day=>day.addEventListener('toggle',syncDays));
 document.querySelectorAll('[data-share]').forEach(button=>button.addEventListener('click',async()=>{
  const tools=button.closest('.share-tools'),status=tools.querySelector('.share-status'),fallback=tools.querySelector('.share-fallback');
  try{if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');await navigator.clipboard.writeText(window.location.href);fallback.hidden=true;status.textContent=T('현재 페이지 주소를 복사했습니다','Page link copied');}
  catch{fallback.hidden=false;const input=fallback.querySelector('input');input.value=window.location.href;input.focus();input.select();status.textContent=T('자동 복사를 사용할 수 없습니다. 아래 주소를 직접 복사해 주세요','Automatic copying is unavailable. Copy the link below');}
 }));
})();

// Independent route explorer: selection only, with no timed playback.
(() => {
 const T=(ko,en,vars)=>window.JSB_T?window.JSB_T(ko,en,vars):en;
 const explorer=document.getElementById('route-explorer');
 if(!explorer)return;
 const productButtons=[...explorer.querySelectorAll('[data-route-product]')];
 const panels=[...explorer.querySelectorAll('[data-route-panel]')];
 const status=explorer.querySelector('#route-update');
 function showDay(panel,index,announce=true){
  const buttons=[...panel.querySelectorAll('[data-route-day]')];
  const days=[...panel.querySelectorAll('[data-route-day-panel]')];
  buttons.forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.routeDay)===index)));
  days.forEach(day=>{day.hidden=Number(day.dataset.routeDayPanel)!==index;day.classList.remove('route-flip-active');});
  const current=days.find(day=>!day.hidden);
  if(current&&!document.body.classList.contains('motion-paused')&&explorer.dataset.motionPaused!=='true'&&!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)){void current.offsetWidth;current.classList.add('route-flip-active');}
  if(announce){const active=days.find(day=>!day.hidden);const count=active.querySelectorAll('.route-node').length;status.textContent=T('{name}, {day}일차: {place} {count}개 방문·이동 단계','{name}, day {day}: {place}, {count} stops and transfers',{name:panel.querySelector('h3').textContent,day:index+1,place:active.querySelector('h4').textContent,count});}
 }
 productButtons.forEach(button=>button.addEventListener('click',()=>{
  productButtons.forEach(other=>{other.setAttribute('aria-pressed',String(other===button));const state=other.querySelector('.route-selection');if(state)state.textContent=other===button?T('선택됨','Selected'):T('일정 보기','View itinerary');});
  panels.forEach(panel=>panel.hidden=panel.dataset.routePanel!==button.dataset.routeProduct);
  const active=panels.find(panel=>!panel.hidden);showDay(active,0);
 }));
 panels.forEach(panel=>panel.querySelectorAll('[data-route-day]').forEach(button=>button.addEventListener('click',()=>showDay(panel,Number(button.dataset.routeDay)))));
 // Native buttons work with Enter / Space; arrow keys add convenient group navigation.
 explorer.querySelectorAll('[role="group"]').forEach(group=>group.addEventListener('keydown',event=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  const buttons=[...group.querySelectorAll('button')];const current=buttons.indexOf(document.activeElement);if(current<0)return;
  event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(current+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;
  buttons[next].focus();buttons[next].click();
 }));
 const motionChange=event=>{explorer.dataset.motionPaused=String(Boolean(event.detail?.paused));};
 document.addEventListener('motionchange',motionChange);
 window.addEventListener('motionchange',motionChange);
})();

// Local wall clock only; never presented as a journey departure time.
(() => {
 const clocks=[...document.querySelectorAll('.airport-clock')];
 if(!clocks.length)return;
 const formatter=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
 const updateClock=()=>{const now=new Date();const parts=formatter.formatToParts(now);const value=parts.find(part=>part.type==='hour').value+':'+parts.find(part=>part.type==='minute').value;clocks.forEach(clock=>{clock.textContent=value;clock.dateTime=now.toISOString();});};
 updateClock();
 window.setInterval(updateClock,60000);
})();
