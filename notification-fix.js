(()=>{
'use strict';

const NF_SEEN='family_notice_seen_keys';
let nfPacking={trips:[],trip_items:[]},nfPackingAt=0,nfSyncing=false;
const nfToday=()=>typeof iso==='function'?iso(new Date()):new Date().toISOString().slice(0,10);
function nfAddDays(ds,n){const d=new Date(ds+'T12:00:00');d.setDate(d.getDate()+n);return typeof iso==='function'?iso(d):d.toISOString().slice(0,10)}
function nfFmt(ds){try{return fmt(new Date(ds+'T12:00:00'),{weekday:'short',day:'numeric',month:'short'})}catch(e){return ds}}
function nfSeen(){try{return new Set(JSON.parse(localStorage.getItem(NF_SEEN)||'[]'))}catch(e){return new Set()}}
function nfSaveSeen(set){try{localStorage.setItem(NF_SEEN,JSON.stringify([...set].slice(-300)))}catch(e){}}
function nfGo(view){if(typeof window.familySafeOpen==='function')window.familySafeOpen(view);else if(typeof show==='function')show(view)}
function nfPlain(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

async function nfFetchPacking(force=false){
 if(!CODE)return nfPacking;
 if(!force&&Date.now()-nfPackingAt<30000)return nfPacking;
 try{nfPacking=await rpc('family_packing_get',{p_code:CODE})||nfPacking;nfPackingAt=Date.now()}catch(e){}
 return nfPacking;
}
function nfRaceWeekendIds(r){
 if(!r.event_date)return [];
 const d=new Date(r.event_date+'T12:00:00'),day=d.getDay(),sat=new Date(d);sat.setDate(sat.getDate()+(day===0?-1:6-day));const satIso=typeof iso==='function'?iso(sat):sat.toISOString().slice(0,10),sunIso=nfAddDays(satIso,1);
 return (D?.events||[]).filter(x=>x.event_date===satIso||x.event_date===sunIso).map(x=>x.id).sort();
}
function nfItems(){
 const n=nfToday(),d14=nfAddDays(n,14),d60=nfAddDays(n,60),out=[];
 (D?.events||[]).filter(x=>typeof isHealth==='function'&&isHealth(x)&&x.event_date>=n&&x.event_date<=d14).forEach(x=>out.push({key:`health:${x.id}:${x.event_date}`,kind:'warn',title:'🩺 '+displayTitle(x),sub:`${nfFmt(x.event_date)} · cita próxima`,view:'health'}));
 (window.familyOptionalRaces||[]).filter(x=>x.event_date&&x.event_date>=n&&x.event_date<=d60).forEach(x=>{const weekend=nfRaceWeekendIds(x),busy=weekend.length>0;out.push({key:`race:${x.id}:${x.event_date}:${weekend.join(',')}`,kind:busy?'warn':'ok',title:'🏃 '+x.title,sub:busy?`Revisar ${weekend.length} coincidencia${weekend.length===1?'':'s'} de ese fin de semana`:'Fin de semana libre en la agenda',view:'races'})});
 const oldCut=new Date();oldCut.setDate(oldCut.getDate()-7);(D?.shopping||[]).filter(x=>!x.is_done&&x.created_at&&new Date(x.created_at)<oldCut).slice(0,5).forEach(x=>out.push({key:`shop:${x.id}`,kind:'warn',title:'🛒 '+x.item_name,sub:'Pendiente desde hace más de 7 días',view:'shop'}));
 const byTrip={};(nfPacking.trip_items||[]).filter(x=>x.status==='pending').forEach(x=>byTrip[x.trip_id]=(byTrip[x.trip_id]||0)+1);
 Object.entries(byTrip).forEach(([tripId,count])=>{const tr=(nfPacking.trips||[]).find(x=>x.id===tripId);out.push({key:`packing:${tripId}:${count}`,kind:'warn',title:'🧳 '+(tr?.title||'Maleta'),sub:`${count} objeto${count===1?'':'s'} pendiente${count===1?'':'s'}`,view:'packing'})});
 return out;
}
function nfUnread(){return Number(localStorage.getItem('family_unread_events')||0)||0}
function nfUnseenItems(){const seen=nfSeen();return nfItems().filter(x=>!seen.has(x.key))}
function nfCount(){return nfUnseenItems().length+nfUnread()}

const nativeSetBadge=typeof navigator.setAppBadge==='function'?navigator.setAppBadge.bind(navigator):null;
const nativeClearBadge=typeof navigator.clearAppBadge==='function'?navigator.clearAppBadge.bind(navigator):null;
async function nfApplyNativeBadge(n){try{if(n>0&&nativeSetBadge)await nativeSetBadge(n);else if(nativeClearBadge)await nativeClearBadge()}catch(e){}}
function nfSyncBadge(){
 if(nfSyncing)return;nfSyncing=true;
 try{
  const n=nfCount(),badge=document.getElementById('notifyBadge'),btn=document.getElementById('notifyBtn');
  if(badge){const txt=n>99?'99+':String(n);if(badge.textContent!==txt)badge.textContent=txt;badge.classList.toggle('show',n>0)}
  btn?.classList.toggle('smartAttention',n>0);
  nfApplyNativeBadge(n);
 }finally{setTimeout(()=>nfSyncing=false,0)}
}
function nfAcknowledge(){
 const seen=nfSeen();nfItems().forEach(x=>seen.add(x.key));nfSaveSeen(seen);
 localStorage.setItem('family_unread_events','0');
 nfSyncBadge();
}
function nfPruneSeen(){const active=new Set(nfItems().map(x=>x.key)),seen=nfSeen(),keep=new Set([...seen].filter(k=>active.has(k)));nfSaveSeen(keep)}

function nfEnsureDialog(){
 let d=document.getElementById('smartNotifyDialog');
 if(!d){d=document.createElement('dialog');d.id='smartNotifyDialog';d.className='smartDialog';d.innerHTML='<div class="smartDialogHead"><b>Centro de avisos</b><button type="button" class="smartClose">×</button></div><div class="smartDialogBody"></div>';document.body.appendChild(d)}
 d.querySelector('.smartClose').onclick=()=>d.close();return d;
}
function nfOpenCenter(){
 const items=nfItems(),enabled=typeof notificationEnabled==='function'?notificationEnabled():false;
 nfAcknowledge();
 const d=nfEnsureDialog(),body=d.querySelector('.smartDialogBody');
 body.innerHTML=`${!enabled?'<div class="smartAlert warn"><b>🔔 Avisos del iPhone desactivados</b><small>Puedes activarlos desde aquí si la app está instalada en la pantalla de inicio.</small></div>':''}${items.length?items.map((x,i)=>`<button type="button" class="smartAlert ${x.kind}" style="width:100%;text-align:left" data-nf-alert="${i}"><b>${nfPlain(x.title)}</b><small>${nfPlain(x.sub)}</small></button>`).join(''):'<div class="smartAlert ok"><b>✓ Nada requiere atención ahora</b><small>La agenda no tiene avisos destacados.</small></div>'}<div class="smartActionRow">${!enabled?'<button type="button" class="primary" id="nfEnableNotify">Activar notificaciones</button>':''}<button type="button" class="secondary" id="nfCloseNotify">Cerrar</button></div><div class="smartBadgeNote">El número de la campana y del icono de la app cuenta solo avisos nuevos desde la última vez que abriste este centro. Los avisos activos siguen visibles aquí aunque ya estén leídos.</div>`;
 body.querySelectorAll('[data-nf-alert]').forEach(b=>b.onclick=()=>{const x=items[Number(b.dataset.nfAlert)];d.close();nfGo(x.view)});
 body.querySelector('#nfCloseNotify').onclick=()=>{nfAcknowledge();d.close()};
 const en=body.querySelector('#nfEnableNotify');if(en)en.onclick=async()=>{if(typeof enableNotifications==='function')await enableNotifications();nfAcknowledge();d.close()};
 if(!d.open)d.showModal();nfSyncBadge();
}
function nfHookBell(){const b=document.getElementById('notifyBtn');if(!b)return;b.onclick=nfOpenCenter;b.dataset.noticeFixed='1'}

// El código anterior recalculaba todos los avisos activos como no leídos. Este observador
// vuelve a imponer el estado correcto si cualquier render antiguo intenta reescribir el badge.
function nfObserveBadge(){
 const badge=document.getElementById('notifyBadge'),btn=document.getElementById('notifyBtn');if(!badge||badge.dataset.nfObserved)return;badge.dataset.nfObserved='1';
 const obs=new MutationObserver(()=>{if(!nfSyncing)queueMicrotask(nfSyncBadge)});obs.observe(badge,{childList:true,characterData:true,subtree:true,attributes:true});if(btn)obs.observe(btn,{attributes:true,attributeFilter:['class']});
}

const priorUpdate=typeof updateNotifyButton==='function'?updateNotifyButton:null;
if(priorUpdate){updateNotifyButton=function(){priorUpdate();setTimeout(nfSyncBadge,0)}}

async function nfRefresh(force=false){await nfFetchPacking(force);nfPruneSeen();nfHookBell();nfObserveBadge();nfSyncBadge()}
document.addEventListener('family-upcoming-rendered',()=>nfRefresh(false));
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')nfRefresh(true)});
window.addEventListener('focus',()=>nfRefresh(false));
setInterval(()=>nfRefresh(false),30000);
setTimeout(()=>nfRefresh(true),100);
})();
