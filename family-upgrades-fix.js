(()=>{
'use strict';
const q=id=>document.getElementById(id);
function installHealthStyles(){
  if(q('healthLayoutStyles'))return;
  const style=document.createElement('style');
  style.id='healthLayoutStyles';
  style.textContent=`
#health .tools{grid-template-columns:1fr!important;gap:10px}
#health .healthTop{margin-bottom:4px}
#health .healthTop .title{margin-bottom:10px}
#health .healthAppointmentsCard{order:1}
#health #healthformDrawer{order:2;margin-top:0}
#health #healthformDrawer>summary{padding:12px 14px}
#health #healthform>.ey,#health #healthform>.title{display:none}
#health #healthform{box-shadow:none;border-radius:0;border:0;padding-top:8px}
#health .healthMainInfo{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin:5px 0 4px}
#health .healthTime{display:inline-flex;align-items:center;min-height:30px;padding:5px 9px;border-radius:9px;background:#075985;color:#fff;font-size:14px;font-weight:950;letter-spacing:.01em}
#health .healthPatient{display:inline-flex;align-items:center;min-height:30px;padding:5px 9px;border-radius:9px;background:#fff;border:1px solid #7dd3fc;color:#075985;font-size:14px;font-weight:950}
#health .healthPlace{font-size:12px;color:var(--mut);line-height:1.35}
#health .healthPlace .maplink{font-size:12px}
@media(max-width:700px){#health .healthAppointmentsCard{padding:12px}#health #healthformDrawer>summary{padding:11px 12px}#health .healthTime,#health .healthPatient{font-size:15px;min-height:32px}#health .healthPlace,#health .healthPlace .maplink{font-size:13px}}
`;
  document.head.appendChild(style);
}

function healthIsPast(x){
  const now=new Date(),day=iso(now),clock=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
  if(x.event_date<day)return true;
  if(x.event_date>day)return false;
  const end=(x.end_time||x.start_time||'').slice(0,5);
  return end?end<clock:false;
}
function healthPastDrawer(label,rows){return rows.length?`<details class="pastDrawer"><summary>${esc(label)}<span>${rows.length}</span></summary><div class="pastContent">${rows.map(healthCompactRow).join('')}</div></details>`:''}
function healthCompactRow(x){
  const time=x.start_time?x.start_time.slice(0,5)+(x.end_time?'–'+x.end_time.slice(0,5):''):'Hora pendiente';
  const patient=(x.member_names||[]).join(', ')||'Sin paciente';
  return `<div class="item health" data-detail-event="${x.id}"><div>${db(x.event_date)}</div><div><div class="name">${esc(displayTitle(x))}</div><div class="healthMainInfo"><span class="healthTime">${esc(time)}</span><span class="healthPatient">👤 ${esc(patient)}</span></div>${x.place?`<div class="healthPlace">${mapLink(x.place)}</div>`:''}</div>${eventButtons(x,'health')}</div>`;
}
function installHealthRendering(){
  if(typeof rhealth!=='function'||typeof bindEventButtons!=='function')return;
  rhealth=function(){
    const rows=(D.events||[]).filter(isHealth),upcoming=rows.filter(x=>!healthIsPast(x)).sort((a,b)=>a.event_date.localeCompare(b.event_date)||(a.start_time||'99').localeCompare(b.start_time||'99')),past=rows.filter(healthIsPast).sort((a,b)=>b.event_date.localeCompare(a.event_date)||(b.start_time||'').localeCompare(a.start_time||''));
    const list=q('hlist');if(!list)return;
    list.innerHTML=(upcoming.length?upcoming.map(healthCompactRow).join(''):'<div class="meta">No hay próximas citas.</div>')+healthPastDrawer('Ver citas pasadas',past);
    bindEventButtons('health');
  };
  rhealth();
}

function enhanceHealthLayout(){
  const section=q('health'),tools=section?.querySelector(':scope > .tools'),drawer=q('healthformDrawer'),list=q('hlist'),listCard=list?.closest('.card');
  if(!section||!tools||!drawer||!listCard)return;
  installHealthStyles();
  let top=q('healthTop');
  if(!top){
    top=document.createElement('div');top.id='healthTop';top.className='healthTop';
    top.innerHTML='<div class="ey">Agenda sanitaria compartida</div><div class="title">🩺 Salud</div>';
    section.insertBefore(top,tools);
  }
  listCard.classList.add('healthAppointmentsCard');
  const listTitle=listCard.querySelector('.title');
  if(listTitle)listTitle.textContent='Próximas citas';
  const summary=drawer.querySelector(':scope > summary');
  if(summary)summary.innerHTML='Añadir cita <span>＋ Nueva cita</span>';
  if(tools.firstElementChild!==listCard)tools.insertBefore(listCard,drawer);
}


function refreshHealthStable(){
  try{enhanceHealthLayout();installHealthRendering()}catch(e){console.error('Salud',e)}
}
document.addEventListener('click',e=>{
  if(e.target.closest?.('#nav button[data-v="health"]'))setTimeout(refreshHealthStable,0);
});
document.addEventListener('family-data-synced',()=>{
  if(q('health')?.classList.contains('on'))setTimeout(refreshHealthStable,0);
});
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible'&&q('health')?.classList.contains('on'))setTimeout(refreshHealthStable,80);
});
setTimeout(refreshHealthStable,150);
})();
