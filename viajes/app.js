(()=>{'use strict';
const SUPA='https://gjplhfinujyhjxpahcak.supabase.co';
const KEY='sb_publishable_8WLfOB17Uhnyd9jNWFdyDA_ewE7yxVO';
const VERSION='0.1.0';
const SLUG=new URL(location.href).searchParams.get('trip')||'china-2027';
let CODE=localStorage.getItem('family_code')||'';
let USER=localStorage.getItem('family_user')||'Igor';
let D=null,recordFilter='all';

const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const fmtDate=(s,o={day:'numeric',month:'short'})=>s?new Intl.DateTimeFormat('es-ES',o).format(new Date(s+'T12:00:00')):'';
const euro=n=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Number(n||0));
const isoLocal=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
function rpc(name,args){return fetch(SUPA+'/rest/v1/rpc/'+name,{method:'POST',headers:{'Content-Type':'application/json','apikey':KEY},body:JSON.stringify(args)}).then(async r=>{if(!r.ok)throw Error((await r.text())||String(r.status));return r.status===204?null:r.json()})}
function cacheKey(){return 'travel_cache_'+SLUG}
function saveCache(){try{localStorage.setItem(cacheKey(),JSON.stringify({saved_at:new Date().toISOString(),data:D}))}catch(e){}}
function readCache(){try{return JSON.parse(localStorage.getItem(cacheKey())||'null')}catch(e){return null}}

async function load(){
 if(!CODE){showLogin();return}
 try{
   D=await rpc('travel_get_data',{p_code:CODE,p_slug:SLUG});saveCache();setSync('Sincronizado','ok');hideLogin();renderAll();
 }catch(e){
   const c=readCache();
   if(c?.data){D=c.data;setSync('Offline','warn');hideLogin();renderAll()}
   else{showLogin(CODE?'Código incorrecto o sin conexión':'');setSync('Sin conexión','warn')}
 }
}
function setSync(t,cls='neutral'){const p=$('syncPill');p.textContent=t;p.className='pill '+cls}
function showLogin(msg=''){$('login').classList.remove('hidden');$('codeInput').value=CODE;$('loginMsg').textContent=msg}
function hideLogin(){$('login').classList.add('hidden')}

function renderAll(){
 if(!D)return;
 $('brandTitle').textContent=D.trip.title||'VIAJE';
 $('userBtn').textContent=USER?'👤 '+USER.split(' ')[0]:'👤';
 $('dateRange').textContent=fmtDate(D.trip.start_date,{day:'numeric',month:'long'})+' — '+fmtDate(D.trip.end_date,{day:'numeric',month:'long',year:'numeric'});
 renderCountdown();renderNowNext();renderPriority();renderDays();renderRecords();renderBudget();renderMore();
}

function renderCountdown(){
 const today=new Date(isoLocal()+'T12:00:00'),start=new Date(D.trip.start_date+'T12:00:00'),end=new Date(D.trip.end_date+'T23:59:00');
 const diff=Math.ceil((start-today)/86400000);
 if(today<start){$('countdown').textContent=String(Math.max(0,diff));$('countdownLabel').textContent=diff===1?'día':'días'}
 else if(today<=end){const day=D.days.find(x=>x.trip_date===isoLocal());$('countdown').textContent=day?'D'+day.day_index:'EN';$('countdownLabel').textContent='viaje'}
 else{$('countdown').textContent='✓';$('countdownLabel').textContent='finalizado'}
}
function recordByKey(key){return (D.records||[]).find(x=>x.external_key===key)}
function displayStatus(status){return({pending:'Pendiente',planned:'Planificado',reserved:'Reservado',paid:'Pagado',completed:'Completado',not_needed:'No necesario'}[status]||status||'Pendiente')}
function statusClass(s){return 'status-'+(s||'pending')}
function certaintyLabel(c){return({confirmed:'Confirmado',planned:'Planificado',estimate:'Estimación'}[c]||c||'Planificado')}

function operationalCards(){
 const today=isoLocal(),start=D.trip.start_date,end=D.trip.end_date;
 if(today<start){
   const dated=(D.records||[]).filter(r=>r.status==='pending'&&r.data?.available_from).sort((a,b)=>String(a.data.available_from).localeCompare(String(b.data.available_from)));
   const next=dated.find(r=>r.data.available_from>=today)||dated[0];
   const urgent=(D.records||[]).find(r=>r.status==='pending'&&r.data?.priority==='very_high');
   return [
    {tag:'AHORA',icon:'🧭',title:'Preparar China 2027',sub:urgent?urgent.title:'Cerrar decisiones y reservas prioritarias'},
    {tag:'LO SIGUIENTE',icon:'⏰',title:next?next.title:'Reservas pendientes',sub:next?'Se abre '+fmtDate(next.data.available_from,{day:'numeric',month:'long'}):'Revisar hoteles, transportes y documentación'}
   ];
 }
 if(today>end)return[{tag:'VIAJE',icon:'✓',title:'China 2027 completado',sub:'La estructura queda disponible para reutilizar en futuros viajes.'}];
 const day=D.days.find(x=>x.trip_date===today),items=(D.items||[]).filter(x=>x.trip_date===today).sort((a,b)=>(a.start_time||'99:99').localeCompare(b.start_time||'99:99')||a.sort_order-b.sort_order);
 let nowItem=null,nextItem=null;const hh=new Date().getHours()*60+new Date().getMinutes();
 for(const x of items){if(x.start_time){const [h,m]=x.start_time.slice(0,5).split(':').map(Number);const min=h*60+m;if(min<=hh)nowItem=x;else if(!nextItem)nextItem=x}}
 if(!nowItem&&items.length)nowItem=items[0];if(!nextItem)nextItem=items.find(x=>x!==nowItem)||null;
 return [
   {tag:'HOY · '+(day?.base_name||''),icon:'📍',title:nowItem?.title||day?.summary||'Día de viaje',sub:nowItem?.place||nowItem?.notes||''},
   ...(nextItem?[{tag:'SIGUIENTE',icon:'→',title:(nextItem.start_time?nextItem.start_time.slice(0,5)+' · ':'')+nextItem.title,sub:nextItem.place||nextItem.notes||''}]:[])
 ];
}
function renderNowNext(){
 $('nowNext').innerHTML=operationalCards().map((x,i)=>'<div class="nowCard '+(i===0?'primary':'')+'"><div class="nowIcon">'+x.icon+'</div><div><span class="nowTag">'+esc(x.tag)+'</span><b>'+esc(x.title)+'</b><small>'+esc(x.sub||'')+'</small></div><span>›</span></div>').join('');
}
function pendingRecords(){return (D.records||[]).filter(r=>r.record_type!=='budget'&&r.status==='pending')}
function priorityScore(r){return r.data?.priority==='very_high'?0:r.data?.priority==='high'?1:r.data?.available_from?2:3}
function renderPriority(){
 const list=pendingRecords().sort((a,b)=>priorityScore(a)-priorityScore(b)||String(a.data?.available_from||'9999').localeCompare(String(b.data?.available_from||'9999'))).slice(0,6);
 $('priorityTasks').innerHTML=list.length?list.map((r,i)=>'<div class="taskCard"><div class="taskNum">'+(i+1)+'</div><div><b>'+esc(r.title)+'</b><small>'+esc(r.data?.available_from?'Disponible desde '+fmtDate(r.data.available_from,{day:'numeric',month:'long'}):(r.notes||'Pendiente de cerrar'))+'</small></div></div>').join(''):'<div class="card">No hay pendientes prioritarios.</div>';
}

function renderDays(){
 $('dayCount').textContent=(D.days||[]).filter(x=>x.day_index>0&&x.day_index<15).length+' días en destino';
 $('days').innerHTML=(D.days||[]).map(day=>{
  const items=(D.items||[]).filter(x=>x.trip_date===day.trip_date).sort((a,b)=>a.sort_order-b.sort_order);
  const dt=new Date(day.trip_date+'T12:00:00'),wd=new Intl.DateTimeFormat('es-ES',{weekday:'short'}).format(dt).replace('.','');
  const tl=items.map(x=>{const rr=x.related_record_key?recordByKey(x.related_record_key):null;const st=rr?.status||x.status;const map=x.place?'<a class="mini" target="_blank" rel="noopener" href="https://maps.apple.com/?q='+encodeURIComponent(x.place)+'">Mapa</a>':'';return '<div class="tlItem"><div class="tlTime">'+esc(x.start_time?x.start_time.slice(0,5):'Hora por cerrar')+'</div><div class="tlTitle">'+esc(x.title)+'</div><div class="tlMeta">'+esc(x.place||'')+(x.notes?'<br>'+esc(x.notes):'')+(x.practical_tip?'<br><b>Consejo:</b> '+esc(x.practical_tip):'')+'</div><div class="tlActions"><span class="statusChip '+statusClass(st)+'">'+esc(displayStatus(st))+'</span>'+map+'</div></div>'}).join('');
  return '<article class="dayCard" data-day="'+day.trip_date+'"><button class="dayHead" type="button"><div class="dayDate"><span>'+esc(wd)+'</span><b>'+dt.getDate()+'</b></div><div><strong>Día '+day.day_index+' · '+esc(day.base_name||'')+'</strong><small>'+esc(day.summary||'')+'</small></div><span>⌄</span></button><div class="dayBody"><div class="timeline">'+(tl||'<div class="tlItem">Detalle pendiente.</div>')+'</div></div></article>';
 }).join('');
 document.querySelectorAll('.dayHead').forEach(b=>b.onclick=()=>b.closest('.dayCard').classList.toggle('open'));
 const today=document.querySelector('[data-day="'+isoLocal()+'"]');if(today)today.classList.add('open');
}

function filteredRecords(){
 return (D.records||[]).filter(r=>r.record_type!=='budget'&&(recordFilter==='all'||r.record_type===recordFilter));
}
function typeLabel(t){return({transport:'Transporte',accommodation:'Alojamiento',reservation:'Entrada / reserva',document:'Documentación'}[t]||t)}
function recordDate(r){if(!r.start_date)return'';const end=r.end_date&&r.end_date!==r.start_date?' → '+fmtDate(r.end_date):'';return fmtDate(r.start_date)+end}
function renderRecords(){
 document.querySelectorAll('#bookingFilters button').forEach(b=>b.classList.toggle('on',b.dataset.type===recordFilter));
 const rs=filteredRecords();
 $('records').innerHTML=rs.length?rs.map(r=>'<article class="recordCard"><div class="recordTop"><div><div class="recordType">'+esc(typeLabel(r.record_type))+'</div><div class="recordTitle">'+esc(r.title)+'</div></div><span class="statusChip certainty-'+esc(r.certainty)+'">'+esc(certaintyLabel(r.certainty))+'</span></div><div class="recordMeta">'+(recordDate(r)?'<span class="pill">'+esc(recordDate(r))+'</span>':'')+(r.place?'<span class="pill">'+esc(r.place)+'</span>':'')+(r.data?.available_from?'<span class="pill warn">Abre '+esc(fmtDate(r.data.available_from))+'</span>':'')+'</div>'+(r.notes?'<div class="recordNotes">'+esc(r.notes)+'</div>':'')+'<select class="statusSelect" data-record-status="'+esc(r.id)+'"><option value="pending" '+(r.status==='pending'?'selected':'')+'>Pendiente</option><option value="planned" '+(r.status==='planned'?'selected':'')+'>Planificado</option><option value="reserved" '+(r.status==='reserved'?'selected':'')+'>Reservado</option><option value="paid" '+(r.status==='paid'?'selected':'')+'>Pagado</option><option value="completed" '+(r.status==='completed'?'selected':'')+'>Completado</option><option value="not_needed" '+(r.status==='not_needed'?'selected':'')+'>No necesario</option></select></article>').join(''):'<div class="card">No hay elementos en este filtro.</div>';
 document.querySelectorAll('[data-record-status]').forEach(s=>s.onchange=()=>changeStatus(s.dataset.recordStatus,s.value,s));
}
async function changeStatus(id,status,select){
 const old=(D.records||[]).find(r=>r.id===id)?.status;select.disabled=true;
 try{const r=await rpc('travel_set_record_status',{p_code:CODE,p_record_id:id,p_status:status,p_user:USER||null});const i=D.records.findIndex(x=>x.id===id);if(i>=0)D.records[i]=r;saveCache();setSync('Guardado','ok');renderAll()}
 catch(e){if(old)select.value=old;setSync('Error al guardar','warn');alert('No se ha podido guardar el cambio.')}
 finally{select.disabled=false}
}

function budgetRecords(){return (D.records||[]).filter(r=>r.record_type==='budget')}
function sum(field){return budgetRecords().reduce((a,r)=>a+Number(r[field]||0),0)}
function renderBudget(){
 const estimated=sum('amount_estimated'),reserved=sum('amount_reserved'),paid=sum('amount_paid'),actual=sum('amount_actual');
 $('budgetSummary').innerHTML=[
  ['Estimación central',euro(estimated)],
  ['Reservado',euro(reserved)],
  ['Pagado',euro(paid)],
  ['Gasto real',euro(actual)]
 ].map(x=>'<div class="metric"><b>'+x[1]+'</b><small>'+x[0]+'</small></div>').join('');
 $('budgetRows').innerHTML=budgetRecords().map(r=>'<div class="budgetRow"><div><b>'+esc(r.title)+'</b><small>'+esc(r.notes||'')+'</small></div><div class="budgetValue">'+euro(r.amount_estimated)+'</div></div>').join('');
}
function renderMore(){
 $('people').innerHTML=(D.people||[]).map(p=>'<span class="person">'+esc(p.person_name)+'</span>').join('');
}

function openView(id,filter=null){
 document.querySelectorAll('.view').forEach(v=>v.classList.toggle('on',v.id===id));
 document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('on',b.dataset.nav===id));
 if(id==='bookings'&&filter){recordFilter=filter;renderRecords()}
 window.scrollTo({top:0,behavior:'auto'});
}
document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>openView(b.dataset.nav));
document.addEventListener('click',e=>{const b=e.target.closest('[data-open]');if(b)openView(b.dataset.open,b.dataset.filter||null)});
document.querySelectorAll('#bookingFilters button').forEach(b=>b.onclick=()=>{recordFilter=b.dataset.type;renderRecords()});

$('loginBtn').onclick=()=>{CODE=$('codeInput').value.trim().toUpperCase();if(CODE)localStorage.setItem('family_code',CODE);load()};
$('codeInput').onkeydown=e=>{if(e.key==='Enter')$('loginBtn').click()};
$('userBtn').onclick=()=>{const n=prompt('¿Quién está usando la app?',USER||'Igor');if(n!==null&&n.trim()){USER=n.trim();localStorage.setItem('family_user',USER);$('userBtn').textContent='👤 '+USER.split(' ')[0]}};
$('packingBtn').onclick=()=>{location.href='../?open=packing'};

if('serviceWorker' in navigator)navigator.serviceWorker.register('service-worker.js?v='+VERSION).catch(()=>{});
load();
})();