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
  if(announce){const active=days.find(day=>!day.hidden);const count=active.querySelectorAll('.route-node').length;status.textContent=T('{name}, {day}일차: {place} {count}개 방문·이동 단계','{name}, day {day}: {place}. Stops: {count}',{name:panel.querySelector('h3').textContent,day:index+1,place:active.querySelector('h4').textContent,count});}
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
