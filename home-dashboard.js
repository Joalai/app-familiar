(()=>{
'use strict';
const SECTIONS=[
 {group:'Agenda',items:[
  {id:'week',icon:'🗓️',title:'Semana',desc:'Agenda semanal'},
  {id:'month',icon:'📆',title:'Mes',desc:'Vista mensual'},
  {id:'cal',icon:'🧭',title:'Calendarios',desc:'Combina calendarios'}
 ]},
 {group:'Familia',items:[
  {id:'shop',icon:'🛒',title:'Compras',desc:'Lista compartida'},
  {id:'packing',icon:'🧳',title:'Maleta',desc:'Listas por persona y viaje'},
  {id:'plans',icon:'🎂',title:'Cumples y planes',desc:'Invitaciones y planes'},
  {id:'health',icon:'🩺',title:'Salud',desc:'Citas y revisiones'},
  {id:'documents',icon:'🪪',title:'Documentación',desc:'DNI, pasaportes y carnets'}
 ]},
 {group:'Actividades',items:[
  {id:'routines',icon:'🔁',title:'Rutinas',desc:'Actividades recurrentes'},
  {id:'sports',icon:'🏅',title:'Deporte',desc:'Partidos y actividades'},
  {id:'races',icon:'🏃',title:'Carreras',desc:'Objetivos y opciones'}
 ]}
];

const css=document.createElement('style');
css.textContent=`
.homeDashboard{margin-bottom:18px}.homeWelcome{display:flex;justify-content:space-between;gap:12px;align-items:flex-end;margin-bottom:12px}.homeWelcome h2{margin:0;font-size:25px}.homeWelcome p{margin:4px 0 0;color:var(--mut);font-size:12px}.homeGroup{margin:12px 0}.homeGroupTitle{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--mut);font-weight:900;margin:0 0 7px 2px}.homeMenuGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.homeMenuCard{border:1px solid var(--line);background:#fff;border-radius:15px;padding:13px 11px;text-align:left;min-height:96px;box-shadow:0 4px 16px #16202b0a;cursor:pointer;color:var(--ink)}.homeMenuCard:active{transform:scale(.985)}.homeMenuIcon{font-size:25px;display:block;margin-bottom:8px}.homeMenuCard b{display:block;font-size:14px;line-height:1.2}.homeMenuCard small{display:block;color:var(--mut);font-size:10px;line-height:1.25;margin-top:4px}.homeUpcomingTitle{display:flex;align-items:center;gap:8px;margin:18px 0 9px}.homeUpcomingTitle span{font-size:18px}.homeUpcomingTitle b{font-size:18px}.homeBack{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);background:#fff;border-radius:999px;padding:8px 11px;font-weight:850;margin:0 0 10px;color:var(--ink)}
@media(max-width:700px){#nav{display:none}.homeMenuGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.homeMenuCard{min-height:94px}.homeMenuCard b{font-size:15px}.homeMenuCard small{font-size:11px}.homeDashboard{margin-top:2px}header .top{padding-bottom:12px}}
@media(min-width:701px){.homeBack{display:none}}
`;
document.head.appendChild(css);

function openSection(id){
 if(typeof window.familySafeOpen==='function')window.familySafeOpen(id);
 else if(typeof window.show==='function')window.show(id);
}
function buildHome(){
 const home=document.getElementById('home');if(!home||document.getElementById('homeDashboard'))return;
 const dash=document.createElement('div');dash.id='homeDashboard';dash.className='homeDashboard';
 dash.innerHTML=`<div class="homeWelcome"><div><div class="ey">App familiar</div><h2>¿Qué necesitas?</h2><p>Acceso rápido a todas las secciones.</p></div></div>${SECTIONS.map(g=>`<section class="homeGroup"><div class="homeGroupTitle">${g.group}</div><div class="homeMenuGrid">${g.items.map(x=>`<button type="button" class="homeMenuCard" data-home-open="${x.id}"><span class="homeMenuIcon">${x.icon}</span><b>${x.title}</b><small>${x.desc}</small></button>`).join('')}</div></section>`).join('')}<div class="homeUpcomingTitle"><span>📌</span><b>Lo que viene</b></div>`;
 home.insertBefore(dash,home.firstChild);
 const oldEy=[...home.children].find(x=>x.classList?.contains('ey')&&x!==dash.querySelector('.ey'));if(oldEy)oldEy.style.display='none';
 const oldTitle=[...home.children].find(x=>x.classList?.contains('title'));if(oldTitle)oldTitle.style.display='none';
 dash.querySelectorAll('[data-home-open]').forEach(b=>b.onclick=()=>openSection(b.dataset.homeOpen));
}
function addBackButtons(){
 document.querySelectorAll('main > section.view').forEach(section=>{
  if(section.id==='home'||section.querySelector(':scope > .homeBack'))return;
  const b=document.createElement('button');b.type='button';b.className='homeBack';b.innerHTML='← <span>Inicio</span>';b.onclick=()=>openSection('home');
  section.insertBefore(b,section.firstChild);
 });
}
function refresh(){buildHome();addBackButtons()}
refresh();
const observer=new MutationObserver(()=>addBackButtons());
observer.observe(document.querySelector('main'),{childList:true});
window.familyHomeRefresh=refresh;
})();
