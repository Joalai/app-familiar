(()=>{
'use strict';

const $p=id=>document.getElementById(id);

function installStyles(){
  if($p('prioritySectionsStyles'))return;
  const style=document.createElement('style');
  style.id='prioritySectionsStyles';
  style.textContent=`
#plans .tools,#routines .tools{grid-template-columns:1fr!important;gap:10px}
#plans .priorityTop,#routines .priorityTop{margin-bottom:4px}
#plans .priorityTop .title,#routines .priorityTop .title{margin-bottom:10px}
#plans .priorityListCard,#routines .priorityListCard{order:1}
#plans #planformDrawer,#routines #routineformDrawer{order:2;margin-top:0}
#plans #planformDrawer>summary,#routines #routineformDrawer>summary{padding:12px 14px}
#plans #planform>.ey,#plans #planform>.title,#routines #routineform>.ey,#routines #routineform>.title{display:none}
#plans #planform,#routines #routineform{box-shadow:none;border-radius:0;border:0;padding-top:8px}
#plans .planMainInfo{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin:5px 0 4px}
#plans .planTime{display:inline-flex;align-items:center;min-height:30px;padding:5px 9px;border-radius:9px;background:#1d4ed8;color:#fff;font-size:14px;font-weight:950}
#plans .planPeople{display:inline-flex;align-items:center;min-height:30px;padding:5px 9px;border-radius:9px;background:#fff;border:1px solid #93c5fd;color:#1e3a8a;font-size:14px;font-weight:950}
#plans .planPlace{font-size:12px;color:var(--mut);line-height:1.35}
#plans .planPlace .maplink{font-size:12px}
#routines .routineTime{font-size:14px;font-weight:950;color:#1e3a8a}
#routines .routineCard{padding:11px}
@media(max-width:700px){
 #plans .priorityListCard,#routines .priorityListCard{padding:12px}
 #plans #planformDrawer>summary,#routines #routineformDrawer>summary{padding:11px 12px}
 #plans .planTime,#plans .planPeople{font-size:15px;min-height:32px}
 #plans .planPlace,#plans .planPlace .maplink{font-size:13px}
 #routines .routineTime{font-size:15px}
}
`;
  document.head.appendChild(style);
}

function isPastEventLocal(x){
  const now=new Date(),day=iso(now),clock=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
  if(x.event_date<day)return true;
  if(x.event_date>day)return false;
  const end=(x.end_time||x.start_time||'').slice(0,5);
  return end?end<clock:false;
}

function planRowCompact(x){
  const time=x.start_time?x.start_time.slice(0,5)+(x.end_time?'–'+x.end_time.slice(0,5):''):'Hora pendiente';
  const people=(x.member_names||[]).join(', ')||'Sin asignar';
  return `<div class="item" data-detail-event="${x.id}"><div>${db(x.event_date)}</div><div><div class="name">${esc(displayTitle(x))}</div><div class="planMainInfo"><span class="planTime">${esc(time)}</span><span class="planPeople">👥 ${esc(people)}</span></div>${x.place?`<div class="planPlace">${mapLink(x.place)}</div>`:''}</div>${eventButtons(x,'plan')}</div>`;
}

function pastDrawer(label,rows){
  return rows.length?`<details class="pastDrawer"><summary>${esc(label)}<span>${rows.length}</span></summary><div class="pastContent">${rows.map(planRowCompact).join('')}</div></details>`:'';
}

function installPlanRendering(){
  if(typeof bindEventButtons!=='function'||typeof isHealth!=='function')return;
  rplans=function(){
    const rows=(D.events||[]).filter(e=>e.source==='family'&&!isHealth(e));
    const upcoming=rows.filter(x=>!isPastEventLocal(x)).sort((a,b)=>a.event_date.localeCompare(b.event_date)||(a.start_time||'99').localeCompare(b.start_time||'99'));
    const past=rows.filter(isPastEventLocal).sort((a,b)=>b.event_date.localeCompare(a.event_date)||(b.start_time||'').localeCompare(a.start_time||''));
    const list=$p('plist');if(!list)return;
    list.innerHTML=(upcoming.length?upcoming.map(planRowCompact).join(''):'<div class="meta">No hay próximos planes.</div>')+pastDrawer('Ver planes y cumples pasados',past);
    bindEventButtons('plan');
  };
  rplans();
}

function setupReadFirstSection(config){
  const section=$p(config.section),tools=section?.querySelector(':scope > .tools'),drawer=$p(config.drawer),list=$p(config.list),listCard=list?.closest('.card');
  if(!section||!tools||!drawer||!listCard)return;
  installStyles();
  let top=$p(config.topId);
  if(!top){
    top=document.createElement('div');top.id=config.topId;top.className='priorityTop';
    top.innerHTML=`<div class="ey">${config.ey}</div><div class="title">${config.icon} ${config.title}</div>`;
    section.insertBefore(top,tools);
  }
  listCard.classList.add('priorityListCard');
  const listTitle=listCard.querySelector(':scope > .title');
  if(listTitle)listTitle.textContent=config.listTitle;
  const summary=drawer.querySelector(':scope > summary');
  if(summary)summary.innerHTML=`${config.addTitle}<span>＋ ${config.addLabel}</span>`;
  if(tools.firstElementChild!==listCard)tools.insertBefore(listCard,drawer);
}

function enhancePrioritySections(){
  setupReadFirstSection({section:'plans',drawer:'planformDrawer',list:'plist',topId:'plansPriorityTop',ey:'Agenda familiar',icon:'🎈',title:'Cumples y planes',listTitle:'Próximos',addTitle:'Añadir plan',addLabel:'Nuevo plan'});
  setupReadFirstSection({section:'routines',drawer:'routineformDrawer',list:'rlist',topId:'routinesPriorityTop',ey:'Actividades habituales',icon:'🔁',title:'Rutinas',listTitle:'Actividades',addTitle:'Añadir rutina',addLabel:'Nueva rutina'});
}

function refreshSection(name){
  if(name==='plans'){
    installPlanRendering();
    enhancePrioritySections();
  }else if(name==='routines'){
    try{if(typeof rroutines==='function')rroutines()}catch(e){console.error(e)}
    enhancePrioritySections();
  }
}

document.addEventListener('click',e=>{
  const nav=e.target.closest?.('#nav button[data-v]');
  if(nav&&(nav.dataset.v==='plans'||nav.dataset.v==='routines'))setTimeout(()=>refreshSection(nav.dataset.v),0);
});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(()=>{installPlanRendering();enhancePrioritySections()},100)});
setTimeout(()=>{installPlanRendering();enhancePrioritySections()},220);
setInterval(enhancePrioritySections,1800);
})();
