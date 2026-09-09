(()=>{
'use strict';

const SF_FAV='family_home_favorites',SF_USE='family_home_usage';
const SF_SECTION_META={
 upcoming:{title:'Lo que viene',icon:'📌',view:'home'},week:{title:'Semana',icon:'🗓️',view:'week'},month:{title:'Mes',icon:'📆',view:'month'},cal:{title:'Calendarios',icon:'🧭',view:'cal'},
 shop:{title:'Compras',icon:'🛒',view:'shop'},packing:{title:'Maleta',icon:'🧳',view:'packing'},health:{title:'Salud',icon:'🩺',view:'health'},documents:{title:'Documentación',icon:'🪪',view:'documents'},
 plans:{title:'Cumples y planes',icon:'🎂',view:'plans'},routines:{title:'Rutinas',icon:'🔁',view:'routines'},sports:{title:'Deporte',icon:'🏅',view:'sports'},races:{title:'Carreras',icon:'🏃',view:'races'}
};
let sfPacking={master_items:[],trips:[],trip_items:[]},sfLastPackingFetch=0,sfAttention=0;
const sfEsc=s=>typeof esc==='function'?esc(String(s??'')):String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>typeof iso==='function'?iso(new Date()):new Date().toISOString().slice(0,10);
function addDays(ds,n){const d=new Date(ds+'T12:00:00');d.setDate(d.getDate()+n);return typeof iso==='function'?iso(d):d.toISOString().slice(0,10)}
function monday(ds){const d=new Date(ds+'T12:00:00'),day=d.getDay()||7;d.setDate(d.getDate()-day+1);return typeof iso==='function'?iso(d):d.toISOString().slice(0,10)}
function fmtShort(ds){try{return fmt(new Date(ds+'T12:00:00'),{weekday:'short',day:'numeric',month:'short'})}catch(e){return ds}}
function openSection(id){
 bumpUsage(id);
 if(id==='upcoming'){
   if(typeof window.familySafeOpen==='function')window.familySafeOpen('home');else if(typeof show==='function')show('home');
   setTimeout(()=>document.getElementById('homeUpcomingAnchor')?.scrollIntoView({behavior:'smooth',block:'start'}),50);return;
 }
 if(typeof window.familySafeOpen==='function')window.familySafeOpen(id);else if(typeof show==='function')show(id);
}
function bumpUsage(id){try{const x=JSON.parse(localStorage.getItem(SF_USE)||'{}');x[id]=(x[id]||0)+1;localStorage.setItem(SF_USE,JSON.stringify(x))}catch(e){}}
function favorites(){try{return JSON.parse(localStorage.getItem(SF_FAV)||'[]').filter(x=>SF_SECTION_META[x]).slice(0,4)}catch(e){return []}}
function toggleFavorite(id){let a=favorites();a=a.includes(id)?a.filter(x=>x!==id):[...a,id].slice(-4);localStorage.setItem(SF_FAV,JSON.stringify(a));decorateHome()}

const style=document.createElement('style');
style.textContent=`
.smartTopTools{display:flex;gap:7px;overflow:auto;margin:0 0 10px}.smartTopTools button{border:1px solid var(--line);background:#fff;border-radius:999px;padding:8px 10px;font-weight:850;white-space:nowrap}.homeSmartHint{font-size:9px;color:var(--mut);margin:-4px 0 8px}.homeMenuCard{position:relative}.homeCardBadge{position:absolute;right:8px;top:8px;min-width:21px;height:21px;padding:0 6px;border-radius:999px;background:#e11d48;color:#fff;display:grid;place-items:center;font-size:10px;font-weight:950;box-shadow:0 2px 7px #0002}.homeFavMark{position:absolute;right:8px;bottom:7px;font-size:12px;color:#d97706}.homeFavGroup{padding:9px;border:1px solid #fde68a;background:#fffbeb;border-radius:15px;margin:10px 0 14px}.homeFavGroup .homeGroupTitle{color:#92400e}.homeFavGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.homeFavGrid .homeMenuCard{min-height:84px;background:#fff}.smartFab{position:fixed;right:18px;bottom:max(18px,env(safe-area-inset-bottom));z-index:45;width:58px;height:58px;border-radius:50%;border:0;background:#0f172a;color:#fff;font-size:31px;line-height:1;box-shadow:0 12px 32px #0f172a55}.smartDialog{border:0;border-radius:20px;padding:0;width:min(540px,calc(100% - 24px));max-height:min(82vh,760px);overflow:hidden;box-shadow:0 24px 80px #0005}.smartDialog::backdrop{background:#0007}.smartDialogHead{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:14px 15px;background:#fff;border-bottom:1px solid var(--line)}.smartDialogHead b{font-size:18px}.smartClose{border:0;background:#eef2f6;border-radius:9px;width:34px;height:34px;font-size:18px}.smartDialogBody{padding:14px;overflow:auto;max-height:calc(82vh - 64px)}.smartChoiceGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.smartChoice{border:1px solid var(--line);background:#fff;border-radius:14px;padding:13px;text-align:left}.smartChoice span{font-size:24px;display:block;margin-bottom:6px}.smartChoice b{display:block}.smartChoice small{display:block;color:var(--mut);margin-top:3px}.smartSearchInput{font-size:17px;padding:12px;margin-bottom:10px}.smartResult{width:100%;display:grid;grid-template-columns:auto 1fr;gap:10px;text-align:left;border:0;border-bottom:1px solid var(--line);background:#fff;padding:11px 4px}.smartResultIcon{font-size:22px}.smartResult b{display:block}.smartResult small{display:block;color:var(--mut);margin-top:2px}.smartEmpty{padding:18px;text-align:center;color:var(--mut)}.smartAlert{padding:10px;border:1px solid var(--line);border-radius:12px;margin-bottom:7px;background:#fff}.smartAlert.warn{background:#fff7ed;border-color:#fed7aa}.smartAlert.ok{background:#f0fdf4;border-color:#bbf7d0}.smartAlert b{display:block}.smartAlert small{display:block;color:var(--mut);margin-top:3px}.smartTabs{display:flex;gap:6px;margin-bottom:10px}.smartTabs button{flex:1;border:1px solid var(--line);background:#fff;border-radius:999px;padding:8px;font-weight:850}.smartTabs button.on{background:#0f172a;color:#fff}.historyRow{display:grid;grid-template-columns:1fr auto;gap:8px;padding:10px 0;border-bottom:1px solid var(--line)}.historyRow b{display:block}.historyRow small{display:block;color:var(--mut);margin-top:3px}.weeklyDay{border-left:4px solid #cbd5e1;padding:8px 9px;margin:6px 0;background:#fff;border-radius:9px}.weeklyDay b{display:block}.weeklyDay small{display:block;color:var(--mut);margin-top:3px}.raceConflict{margin-top:7px;padding:7px 8px;border-radius:9px;font-size:10px;font-weight:800}.raceConflict.clear{background:#dcfce7;color:#166534}.raceConflict.busy{background:#ffedd5;color:#9a3412}.headerSearchBtn{border:0;background:#eef2f6;border-radius:999px;width:36px;height:36px;font-size:17px}.notifybtn.smartAttention{outline:2px solid #f59e0b}.smartBadgeNote{font-size:10px;color:var(--mut);margin-top:8px}.smartActionRow{display:flex;gap:7px;flex-wrap:wrap;margin:10px 0}.smartActionRow button{flex:1;min-width:130px}
@media(max-width:700px){.homeFavGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.smartChoiceGrid{grid-template-columns:1fr}.smartFab{right:14px;bottom:max(14px,env(safe-area-inset-bottom))}}
`;
document.head.appendChild(style);

function ensureDialog(id,title){
 let d=document.getElementById(id);if(d)return d;
 d=document.createElement('dialog');d.id=id;d.className='smartDialog';d.innerHTML=`<div class="smartDialogHead"><b>${sfEsc(title)}</b><button type="button" class="smartClose">×</button></div><div class="smartDialogBody"></div>`;document.body.appendChild(d);d.querySelector('.smartClose').onclick=()=>d.close();return d;
}
function showDialog(id,title,html){const d=ensureDialog(id,title);d.querySelector('.smartDialogHead b').textContent=title;d.querySelector('.smartDialogBody').innerHTML=html;if(!d.open)d.showModal();return d}

async function fetchPacking(force=false){
 if(!CODE)return sfPacking;
 if(!force&&Date.now()-sfLastPackingFetch<30000)return sfPacking;
 try{sfPacking=await rpc('family_packing_get',{p_code:CODE})||sfPacking;sfLastPackingFetch=Date.now()}catch(e){}
 return sfPacking;
}
function counts(){
 const n=today(),d30=addDays(n,30),d7=addDays(n,7),month=n.slice(0,7),weekEnd=addDays(monday(n),6);
 const events=D?.events||[],shopping=D?.shopping||[],rec=D?.recurring||[],opts=Array.isArray(window.familyOptionalRaces)?window.familyOptionalRaces:[];
 return {
  upcoming:events.filter(x=>x.event_date>=n&&x.event_date<=d7).length,
  week:events.filter(x=>x.event_date>=monday(n)&&x.event_date<=weekEnd).length,
  month:events.filter(x=>x.event_date?.startsWith(month)).length,
  cal:events.filter(x=>x.event_date>=n).length+rec.length,
  shop:shopping.filter(x=>!x.is_done).length,
  health:events.filter(x=>typeof isHealth==='function'&&isHealth(x)&&x.event_date>=n&&x.event_date<=d30).length,
  plans:events.filter(x=>x.source==='family'&&!(typeof isHealth==='function'&&isHealth(x))&&x.event_date>=n&&x.event_date<=d30).length,
  routines:rec.length,
  sports:events.filter(x=>x.category==='sport'&&x.event_date>=n&&x.event_date<=d30).length,
  races:opts.filter(x=>(x.event_date||x.sort_date)>=n&&(x.event_date||x.sort_date)<=addDays(n,120)).length,
  packing:(sfPacking.trip_items||[]).filter(x=>x.status==='pending').length
 };
}
function setCardBadge(card,n){let b=card.querySelector('.homeCardBadge');if(!n){b?.remove();return}if(!b){b=document.createElement('span');b.className='homeCardBadge';card.appendChild(b)}b.textContent=n>99?'99+':String(n)}
function decorateHome(){
 const dash=document.getElementById('homeDashboard');if(!dash)return;
 const c=counts(),f=favorites();
 dash.querySelectorAll('.homeMenuCard[data-home-open]').forEach(card=>{
   const id=card.dataset.homeOpen;setCardBadge(card,c[id]||0);
   let mark=card.querySelector('.homeFavMark');if(f.includes(id)){if(!mark){mark=document.createElement('span');mark.className='homeFavMark';mark.textContent='★';card.appendChild(mark)}}else mark?.remove();
 });
 let hint=dash.querySelector('.homeSmartHint');if(!hint){hint=document.createElement('div');hint.className='homeSmartHint';hint.textContent='Mantén pulsada una tarjeta para añadirla o quitarla de Favoritos.';dash.querySelector('.homeWelcome')?.after(hint)}
 let old=dash.querySelector('.homeFavGroup');old?.remove();
 if(f.length){
   const sec=document.createElement('section');sec.className='homeFavGroup';sec.innerHTML=`<div class="homeGroupTitle">★ Favoritos</div><div class="homeFavGrid">${f.map(id=>{const m=SF_SECTION_META[id];return `<button type="button" class="homeMenuCard" data-home-open="${id}"><span class="homeMenuIcon">${m.icon}</span><b>${sfEsc(m.title)}</b><small>Acceso favorito</small><span class="homeFavMark">★</span></button>`}).join('')}</div>`;
   const first=dash.querySelector('.homeGroup');first?.before(sec);sec.querySelectorAll('[data-home-open]').forEach(b=>b.onclick=()=>openSection(b.dataset.homeOpen));
   sec.querySelectorAll('.homeMenuCard').forEach(card=>setCardBadge(card,c[card.dataset.homeOpen]||0));
 }
 ensureHomeTools();bindLongPress();
}
function bindLongPress(){
 document.querySelectorAll('#homeDashboard .homeMenuCard:not([data-smart-long])').forEach(card=>{
   card.dataset.smartLong='1';let timer=null,pressed=false;
   const clear=()=>{if(timer)clearTimeout(timer);timer=null};
   card.addEventListener('pointerdown',()=>{pressed=false;timer=setTimeout(()=>{pressed=true;card.dataset.suppress='1';toggleFavorite(card.dataset.homeOpen);if(navigator.vibrate)navigator.vibrate(30)},650)});
   ['pointerup','pointercancel','pointerleave'].forEach(ev=>card.addEventListener(ev,clear));
   card.addEventListener('click',e=>{if(card.dataset.suppress==='1'||pressed){e.preventDefault();e.stopImmediatePropagation();delete card.dataset.suppress;pressed=false}},true);
 });
}
function ensureHomeTools(){
 const dash=document.getElementById('homeDashboard');if(!dash||dash.querySelector('.smartTopTools'))return;
 const row=document.createElement('div');row.className='smartTopTools';row.innerHTML='<button type="button" data-smart-search>🔎 Buscar</button><button type="button" data-smart-week>🗓️ Resumen semanal</button><button type="button" data-smart-history>↩️ Historial / Papelera</button>';const hint=dash.querySelector('.homeSmartHint');(hint||dash.querySelector('.homeWelcome'))?.after(row);
 row.querySelector('[data-smart-search]').onclick=openSearch;row.querySelector('[data-smart-week]').onclick=openWeekly;row.querySelector('[data-smart-history]').onclick=()=>openHistory('history');
}

function ensureFab(){if(document.getElementById('smartFab'))return;const b=document.createElement('button');b.id='smartFab';b.className='smartFab';b.type='button';b.textContent='＋';b.setAttribute('aria-label','Añadir');b.onclick=openQuickAdd;document.body.appendChild(b)}
function openQuickAdd(){
 const choices=[['shop','🛒','Compra','Añadir a la lista'],['voiceShop','🎙️','Compra por voz','Dictar productos'],['plans','🎂','Plan / cumpleaños','Añadir acontecimiento'],['health','🩺','Cita de salud','Añadir revisión o cita'],['routines','🔁','Rutina','Añadir actividad'],['packing','🧳','Maleta','Añadir objeto o viaje'],['races','🏃','Carrera','Ver objetivos y opciones']];
 const d=showDialog('smartAddDialog','Añadir',`<div class="smartChoiceGrid">${choices.map(x=>`<button type="button" class="smartChoice" data-smart-add="${x[0]}"><span>${x[1]}</span><b>${x[2]}</b><small>${x[3]}</small></button>`).join('')}</div>`);
 d.querySelectorAll('[data-smart-add]').forEach(b=>b.onclick=()=>{const k=b.dataset.smartAdd;d.close();if(k==='voiceShop'){openSection('shop');setTimeout(()=>document.getElementById('voiceShop')?.click(),120);return}openSection(k);setTimeout(()=>{if(k==='shop')document.getElementById('sn')?.focus();if(k==='plans'){const x=document.getElementById('planformDrawer');if(x)x.open=true;document.getElementById('pn')?.focus()}if(k==='health'){const x=document.getElementById('healthformDrawer');if(x)x.open=true;document.getElementById('hn')?.focus()}if(k==='routines'){const x=document.getElementById('routineformDrawer');if(x)x.open=true}},100)})
}

function ensureHeaderSearch(){if(document.getElementById('headerSearchBtn'))return;const notify=document.getElementById('notifyBtn');if(!notify)return;const b=document.createElement('button');b.id='headerSearchBtn';b.type='button';b.className='headerSearchBtn';b.textContent='🔎';b.title='Buscar en toda la app';b.onclick=openSearch;notify.parentElement.insertBefore(b,notify)}
function searchRecords(q){
 q=String(q||'').trim().toLocaleLowerCase('es');if(!q)return [];
 const out=[],push=(icon,title,sub,view,cb,hay='')=>{if((title+' '+sub+' '+hay).toLocaleLowerCase('es').includes(q))out.push({icon,title,sub,view,cb})};
 (D?.events||[]).forEach(x=>push(typeof isHealth==='function'&&isHealth(x)?'🩺':x.category==='sport'?'🏅':'📅',displayTitle(x),`${x.event_date} · ${(x.member_names||[]).join(', ')} · ${x.place||''}`,typeof isHealth==='function'&&isHealth(x)?'health':x.category==='sport'?'sports':'plans',()=>{openSection(typeof isHealth==='function'&&isHealth(x)?'health':x.category==='sport'?'sports':'plans');setTimeout(()=>typeof openEventDetail==='function'&&openEventDetail(x.id),100)},x.notes||''));
 (D?.recurring||[]).forEach(x=>push('🔁',displayTitle(x),`${(x.member_names||[]).join(', ')} · ${x.place||''}`,'routines',()=>{openSection('routines');setTimeout(()=>typeof openRoutineDetail==='function'&&openRoutineDetail(x.id),100)}));
 (D?.shopping||[]).forEach(x=>push('🛒',x.item_name,`${x.category||''}${x.detail?' · '+x.detail:''}${x.is_done?' · Hecho':''}`,'shop',()=>openSection('shop')));
 (D?.school_calendar||[]).forEach(x=>push('🏫',x.title,`${x.start_date} – ${x.end_date}`,'cal',()=>openSection('cal')));
 (window.familyOptionalRaces||[]).forEach(x=>push('🏃',x.title,x.date_text||x.sort_date,'races',()=>openSection('races'),`${x.place||''} ${x.distance||''}`));
 (sfPacking.master_items||[]).forEach(x=>push('🧳',x.item_name,`Lista base · ${x.person_name} · ${x.category}`,'packing',()=>openSection('packing')));
 (sfPacking.trips||[]).forEach(x=>push('🧳',x.title,`Viaje · ${x.start_date||'sin fecha'}`,'packing',()=>openSection('packing')));
 return out.slice(0,60);
}
async function openSearch(){await fetchPacking();const d=showDialog('smartSearchDialog','Buscar en toda la app','<input id="smartSearchInput" class="smartSearchInput" placeholder="Ej. dentista, Joane, Bakio, pasaporte…"><div id="smartSearchResults" class="smartEmpty">Empieza a escribir.</div>');const input=d.querySelector('#smartSearchInput'),box=d.querySelector('#smartSearchResults');const render=()=>{const rows=searchRecords(input.value);box.className=rows.length?'':'smartEmpty';box.innerHTML=rows.length?rows.map((r,i)=>`<button type="button" class="smartResult" data-sr="${i}"><span class="smartResultIcon">${r.icon}</span><span><b>${sfEsc(r.title)}</b><small>${sfEsc(r.sub)}</small></span></button>`).join(''):'No hay resultados.';box.querySelectorAll('[data-sr]').forEach(b=>b.onclick=()=>{const r=rows[Number(b.dataset.sr)];d.close();r.cb()})};input.oninput=render;setTimeout(()=>input.focus(),50)}

function eventForDate(ds){const a=[];(D?.events||[]).filter(x=>x.event_date===ds).forEach(x=>a.push(displayTitle(x)));try{rf(new Date(ds+'T12:00:00')).forEach(x=>a.push(displayTitle(x)))}catch(e){}try{const s=schoolMarker(new Date(ds+'T12:00:00'));if(s)a.push('Ikastola: '+schoolText(s))}catch(e){}return [...new Set(a)]}
function raceWeekendInfo(race){
 if(!race.event_date)return {clear:null,items:[]};const d=new Date(race.event_date+'T12:00:00'),day=d.getDay(),sat=new Date(d);sat.setDate(d.getDate()+(day===0?-1:6-day));const s=typeof iso==='function'?iso(sat):sat.toISOString().slice(0,10),sun=addDays(s,1),items=[...eventForDate(s),...eventForDate(sun)].filter(x=>!String(x).toLowerCase().includes(String(race.title).toLowerCase()));return {clear:items.length===0,items:[...new Set(items)]}
}
function decorateRaceConflicts(){
 const opts=window.familyOptionalRaces||[];
 document.querySelectorAll('.homeOptionalRace[data-optional-race-id]').forEach(card=>{const r=opts.find(x=>x.id===card.dataset.optionalRaceId);if(!r)return;let old=card.querySelector('.raceConflict');old?.remove();const info=raceWeekendInfo(r);const el=document.createElement('div');el.className='raceConflict '+(info.clear===true?'clear':info.clear===false?'busy':'');el.textContent=info.clear===null?'◷ Fecha pendiente: el conflicto se calculará al publicarse el día.':info.clear?'✅ Fin de semana despejado en la agenda familiar.':`⚠️ ${info.items.length} coincidencia${info.items.length===1?'':'s'}: ${info.items.slice(0,3).join(' · ')}${info.items.length>3?'…':''}`;card.querySelector('div:nth-child(2)')?.appendChild(el)});
 document.querySelectorAll('#raceList .raceOptional').forEach(card=>{const title=card.querySelector('.name')?.textContent?.replace(/^🏃\s*/,'').trim(),r=opts.find(x=>x.title===title);if(!r)return;card.querySelector('.raceConflict')?.remove();const info=raceWeekendInfo(r),el=document.createElement('div');el.className='raceConflict '+(info.clear===true?'clear':info.clear===false?'busy':'');el.textContent=info.clear===null?'◷ Conflictos pendientes hasta conocer el día exacto.':info.clear?'✅ Agenda familiar despejada ese fin de semana.':`⚠️ Ese fin de semana también hay: ${info.items.slice(0,4).join(' · ')}${info.items.length>4?'…':''}`;const note=card.querySelector('.raceNote');note?.after(el)})
}

function attentionItems(){
 const n=today(),d14=addDays(n,14),d60=addDays(n,60),out=[];
 (D?.events||[]).filter(x=>typeof isHealth==='function'&&isHealth(x)&&x.event_date>=n&&x.event_date<=d14).forEach(x=>out.push({kind:'warn',title:'🩺 '+displayTitle(x),sub:`${fmtShort(x.event_date)} · cita próxima`,view:'health'}));
 (window.familyOptionalRaces||[]).filter(x=>x.event_date&&x.event_date>=n&&x.event_date<=d60).forEach(x=>{const i=raceWeekendInfo(x);out.push({kind:i.clear?'ok':'warn',title:'🏃 '+x.title,sub:i.clear?'Fin de semana libre en la agenda':'Revisar coincidencias de ese fin de semana',view:'races'})});
 const oldCut=new Date();oldCut.setDate(oldCut.getDate()-7);(D?.shopping||[]).filter(x=>!x.is_done&&x.created_at&&new Date(x.created_at)<oldCut).slice(0,5).forEach(x=>out.push({kind:'warn',title:'🛒 '+x.item_name,sub:'Pendiente desde hace más de 7 días',view:'shop'}));
 const pending=(sfPacking.trip_items||[]).filter(x=>x.status==='pending').length;if(pending)out.push({kind:'warn',title:'🧳 Maleta',sub:`${pending} objetos pendientes entre los viajes activos`,view:'packing'});
 return out;
}
function refreshAttentionBadge(){
 const items=attentionItems(),unread=Number(localStorage.getItem('family_unread_events')||0);sfAttention=items.length+unread;const b=document.getElementById('notifyBadge'),btn=document.getElementById('notifyBtn');if(b){b.textContent=sfAttention>99?'99+':String(sfAttention);b.classList.toggle('show',sfAttention>0)}btn?.classList.toggle('smartAttention',items.length>0);if('setAppBadge' in navigator){if(sfAttention)navigator.setAppBadge(sfAttention).catch(()=>{});else navigator.clearAppBadge().catch(()=>{})}}
function openNotificationCenter(){
 const items=attentionItems(),enabled=typeof notificationEnabled==='function'?notificationEnabled():false,unread=Number(localStorage.getItem('family_unread_events')||0);
 const d=showDialog('smartNotifyDialog','Centro de avisos',`${!enabled?'<div class="smartAlert warn"><b>🔔 Avisos del iPhone desactivados</b><small>Puedes activarlos desde aquí si la app está instalada en la pantalla de inicio.</small></div>':''}${unread?`<div class="smartAlert"><b>🆕 ${unread} novedad${unread===1?'':'es'} sin leer</b><small>Nuevos acontecimientos detectados desde la última revisión.</small></div>`:''}${items.length?items.map((x,i)=>`<button type="button" class="smartAlert ${x.kind}" style="width:100%;text-align:left" data-alert="${i}"><b>${sfEsc(x.title)}</b><small>${sfEsc(x.sub)}</small></button>`).join(''):'<div class="smartAlert ok"><b>✓ Nada requiere atención ahora</b><small>La agenda no tiene avisos destacados.</small></div>'}<div class="smartActionRow">${!enabled?'<button type="button" class="primary" id="smartEnableNotify">Activar notificaciones</button>':''}<button type="button" class="secondary" id="smartMarkRead">Marcar novedades leídas</button></div><div class="smartBadgeNote">El número de la campana cuenta avisos que requieren atención y novedades sin leer.</div>`);
 d.querySelectorAll('[data-alert]').forEach(b=>b.onclick=()=>{const x=items[Number(b.dataset.alert)];d.close();openSection(x.view)});const en=d.querySelector('#smartEnableNotify');if(en)en.onclick=async()=>{if(typeof enableNotifications==='function')await enableNotifications();d.close();refreshSmart()};d.querySelector('#smartMarkRead').onclick=()=>{localStorage.setItem('family_unread_events','0');if(typeof updateNotifyButton==='function')updateNotifyButton();d.close();refreshSmart()}
}
function hookNotify(){const b=document.getElementById('notifyBtn');if(!b||b.dataset.smartCenter)return;b.dataset.smartCenter='1';b.onclick=openNotificationCenter}

function weekSummaryData(){const start=addDays(monday(today()),7),days=[];for(let i=0;i<7;i++){const ds=addDays(start,i),items=[];(D?.events||[]).filter(x=>x.event_date===ds).sort((a,b)=>(a.start_time||'99').localeCompare(b.start_time||'99')).forEach(x=>items.push(`${x.start_time?x.start_time.slice(0,5)+' ':''}${displayTitle(x)}`));try{rf(new Date(ds+'T12:00:00')).forEach(x=>items.push(`${x.start_time?.slice(0,5)||''} ${displayTitle(x)}`.trim()))}catch(e){}try{const s=schoolMarker(new Date(ds+'T12:00:00'));if(s)items.unshift('🏫 '+schoolText(s))}catch(e){}days.push({ds,items:[...new Set(items)]})}return days}
function weeklyText(days){return ['Planificación de la próxima semana',...days.map(d=>`${fmtShort(d.ds)}: ${d.items.length?d.items.join(' · '):'Sin acontecimientos'}`)].join('\n')}
function openWeekly(){const days=weekSummaryData(),total=days.reduce((a,x)=>a+x.items.length,0),d=showDialog('smartWeekDialog','🗓️ Próxima semana',`<div class="smartAlert ${total?'':'ok'}"><b>${total} acontecimiento${total===1?'':'s'} en la próxima semana</b><small>Incluye agenda, rutinas y calendario escolar.</small></div>${days.map(x=>`<div class="weeklyDay"><b>${sfEsc(fmtShort(x.ds))}</b><small>${x.items.length?x.items.map(sfEsc).join(' · '):'Sin acontecimientos'}</small></div>`).join('')}<div class="smartActionRow"><button type="button" class="primary" id="smartShareWeek">Compartir</button><button type="button" class="secondary" id="smartCopyWeek">Copiar texto</button></div>`);const text=weeklyText(days);d.querySelector('#smartShareWeek').onclick=async()=>{if(navigator.share)try{await navigator.share({title:'Planificación familiar',text})}catch(e){}else navigator.clipboard?.writeText(text)};d.querySelector('#smartCopyWeek').onclick=async()=>{await navigator.clipboard?.writeText(text).catch(()=>{});d.querySelector('#smartCopyWeek').textContent='Copiado ✓'}}

function historyLabel(x){const p=x.payload||{};const title=p.title||p.item_name||p.person_name||p.document_type||p.id||'Elemento';const types={events:'Agenda',shopping_items:'Compras',recurring_activities:'Rutinas',packing_master_items:'Maleta · lista base',packing_trips:'Maleta · viaje',packing_trip_items:'Maleta · viaje'};const acts={insert:'Añadido',update:'Modificado',delete:'Borrado',restore:'Restaurado'};return {title:`${acts[x.action]||x.action}: ${title}`,sub:`${types[x.entity_type]||x.entity_type} · ${new Date(x.occurred_at).toLocaleString('es-ES',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}`}}
async function openHistory(tab='history'){
 const d=showDialog('smartHistoryDialog','↩️ Historial y Papelera','<div class="smartEmpty">Cargando…</div>');let data;try{data=await rpc('family_get_activity_history',{p_code:CODE,p_limit:150})}catch(e){d.querySelector('.smartDialogBody').innerHTML='<div class="smartEmpty">No se ha podido cargar el historial.</div>';return}renderHistoryDialog(d,data,tab)}
function renderHistoryDialog(d,data,tab){const rows=tab==='trash'?(data.trash||[]):((data.history||[]).filter(x=>x.action!=='update'||x.entity_type!=='packing_trip_items'));d.querySelector('.smartDialogBody').innerHTML=`<div class="smartTabs"><button type="button" data-h-tab="history" class="${tab==='history'?'on':''}">Historial</button><button type="button" data-h-tab="trash" class="${tab==='trash'?'on':''}">Papelera ${(data.trash||[]).length?`(${(data.trash||[]).length})`:''}</button></div>${rows.length?rows.map(x=>{const l=historyLabel(x);return `<div class="historyRow"><div><b>${sfEsc(l.title)}</b><small>${sfEsc(l.sub)}${x.action==='delete'&&x.restore_until?' · recuperable 30 días':''}</small></div>${tab==='trash'?`<button type="button" class="miniBtn" data-restore="${x.id}">Restaurar</button>`:''}</div>`}).join(''):'<div class="smartEmpty">No hay elementos aquí.</div>'}`;d.querySelectorAll('[data-h-tab]').forEach(b=>b.onclick=()=>renderHistoryDialog(d,data,b.dataset.hTab));d.querySelectorAll('[data-restore]').forEach(b=>b.onclick=async()=>{b.disabled=true;b.textContent='Restaurando…';try{await rpc('family_restore_activity',{p_code:CODE,p_log_id:b.dataset.restore});if(typeof load==='function')await load();if(typeof window.familyPackingLoad==='function')await window.familyPackingLoad();const nd=await rpc('family_get_activity_history',{p_code:CODE,p_limit:150});renderHistoryDialog(d,nd,'trash');refreshSmart()}catch(e){b.disabled=false;b.textContent='Restaurar';alert('No se ha podido restaurar.')}})}

function refreshSmart(){fetchPacking().then(()=>{decorateHome();refreshAttentionBadge();decorateRaceConflicts()});ensureFab();ensureHeaderSearch();hookNotify();decorateHome();decorateRaceConflicts();refreshAttentionBadge()}

const baseUpdate=typeof updateNotifyButton==='function'?updateNotifyButton:null;if(baseUpdate){updateNotifyButton=function(){baseUpdate();setTimeout(refreshAttentionBadge,0)}}
document.addEventListener('family-upcoming-rendered',refreshSmart);
document.addEventListener('click',e=>{const b=e.target.closest?.('#homeDashboard [data-home-open]');if(b)bumpUsage(b.dataset.homeOpen)},true);
const raceList=document.getElementById('raceList');if(raceList)new MutationObserver(()=>setTimeout(decorateRaceConflicts,0)).observe(raceList,{childList:true,subtree:true});
const home=document.getElementById('home');if(home)new MutationObserver(()=>setTimeout(decorateHome,0)).observe(home,{childList:true,subtree:false});
setTimeout(refreshSmart,50);setTimeout(()=>fetchPacking(true).then(refreshSmart),800);
window.familySmartRefresh=refreshSmart;window.familyOpenSearch=openSearch;window.familyOpenHistory=openHistory;window.familyOpenWeekly=openWeekly;
})();
