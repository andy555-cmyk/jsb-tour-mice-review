(function(){
'use strict';
const nav=document.querySelector('.nav');
const updateNav=()=>nav?.classList.toggle('scrolled',window.scrollY>24);
window.addEventListener('scroll',updateNav,{passive:true});updateNav();
const menu=document.getElementById('mm'),burger=document.querySelector('.burger'),close=document.querySelector('.mobile-close');
const setMenu=(open)=>{if(!menu)return;menu.classList.toggle('open',open);menu.inert=!open;burger?.setAttribute('aria-expanded',String(open));document.body.style.overflow=open?'hidden':'';if(open)close?.focus();else burger?.focus();};
burger?.addEventListener('click',()=>setMenu(true));close?.addEventListener('click',()=>setMenu(false));
menu?.addEventListener('keydown',e=>{if(e.key==='Escape'){setMenu(false);return;}if(e.key==='Tab'){const controls=[...menu.querySelectorAll('a,button')];const first=controls[0],last=controls.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
menu?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.classList.remove('open');menu.inert=true;document.body.style.overflow='';}));
window.matchMedia('(min-width:1025px)').addEventListener('change',e=>{if(e.matches&&menu?.classList.contains('open'))setMenu(false);});
document.querySelectorAll('.filter-btn').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.filter-btn').forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));let count=0;document.querySelectorAll('[data-category]').forEach(card=>{card.hidden=btn.dataset.filter!=='all'&&card.dataset.category!==btn.dataset.filter;if(!card.hidden)count++;});const status=document.querySelector('.filter-status');if(status)status.textContent=(window.JSB_T?window.JSB_T('{n}개의 여행 프로그램','{n} travel programs',{n:count}):`${count} travel programs`);}));

})();
