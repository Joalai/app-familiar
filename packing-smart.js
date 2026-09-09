(()=>{
'use strict';

const TEMPLATES={
 'Fin de semana':[
  ['Pijama','Ropa'],['Ropa interior extra','Ropa'],['Neceser','Aseo'],['Cargador móvil','Tecnología']
 ],
 'Playa / piscina':[
  ['Protector solar','Playa / piscina'],['Gafas de sol','Otros'],['Gorra','Ropa'],['Bolsa para ropa mojada','Playa / piscina']
 ],
 'Avión':[
  ['Auriculares','Tecnología'],['Batería externa','Tecnología'],['Adaptador de enchufe','Tecnología'],['Botella vacía para agua','Otros']
 ],
 'Esquí':[
  ['Ropa térmica','Ropa'],['Guantes de nieve','Ropa'],['Gafas de esquí','Otros'],['Casco','Otros'],['Calcetines de esquí','Ropa']
 ]
};
let psBusy=false,psTimer=null;
const pe=s=>typeof esc==='function'?esc(String(s??'')):String(s??'');
function state(){return CODE?rpc('family_packing_get',{p_code:CODE}):Promise.resolve({master_items:[],trips:[],trip_items:[]})}
function activePerson(){return document.querySelector('#pkBody .packPeople button.on')?.dataset.packPerson||USER||'Igor'}
function activeTripId(){return document.querySelector('#pkBody .packTripTab.on')?.dataset.pkTrip||null}
function normalize(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}

const style=document.createElement('style');
style.textContent=`.packSmartBox{border:1px solid #dbeafe;background:#f8fbff;border-radius:13px;padding:10px;margin:10px 0}.packSmartBox b{display:block;margin-bottom:6px}.packTemplateRow{display:flex;gap:6px;overflow:auto}.packTemplateRow button{white-space:nowrap}.packPeopleProgress{display:grid;grid-template-columns:repeat(auto-fit,minmax(105px,1fr));gap:6px;margin:9px 0}.packPersonProgress{border:1px solid var(--line);background:#fff;border-radius:10px;padding:8px}.packPersonProgress b{font-size:12px;margin:0}.packPersonProgress small{display:block;color:var(--mut);font-size:9px;margin-top:3px}.packPersonProgress i{display:block;height:5px;background:#16a34a;border-radius:999px;margin-top:6px}.packSmartActions{display:flex;gap:6px;flex-wrap:wrap}.packSmartActions button{flex:1;min-width:135px}`;document.head.appendChild(style);

async function addTemplate(name){
 const person=activePerson(),items=TEMPLATES[name]||[];if(!items.length)return;
 if(!confirm(`Añadir la plantilla “${name}” a la lista base de ${person}? Solo se añadirán los objetos que no tenga.`))return;
 let added=0;
 for(const [item,cat] of items){try{await rpc('family_packing_add_master_item',{p_code:CODE,p_person_name:person,p_item_name:item,p_category:cat,p_created_by:needUser()||null});added++}catch(e){}}
 await window.familyPackingLoad?.();alert(`${added} objetos nuevos añadidos a ${person}.`)
}
async function cloneLast(){
 let title=prompt('Nombre del nuevo viaje','Nuevo viaje');if(title===null||!title.trim())return;let date=prompt('Fecha de salida (AAAA-MM-DD) o déjalo vacío','');if(date===null)return;date=date.trim()||null;
 try{const tr=await rpc('family_packing_clone_last_trip',{p_code:CODE,p_title:title.trim(),p_start_date:date,p_created_by:needUser()||null});await window.familyPackingLoad?.();alert(`Viaje creado copiando “${tr.source_title||'el último viaje'}”. Todos los objetos vuelven a estado pendiente.`)}catch(e){alert('No se ha podido copiar el último viaje. Si todavía no hay viajes anteriores, crea primero uno desde las listas base.')}
}
async function pendingToShopping(tripId,person){
 const s=await state(),trip=(s.trips||[]).find(x=>x.id===tripId);if(!trip)return;const pending=(s.trip_items||[]).filter(x=>x.trip_id===tripId&&x.person_name===person&&x.status==='pending');if(!pending.length)return alert('No hay objetos pendientes para enviar a Compras.');
 const existing=new Set((D.shopping||[]).filter(x=>!x.is_done).map(x=>normalize(x.item_name)));let added=0;
 for(const x of pending){if(existing.has(normalize(x.item_name)))continue;try{await rpc('family_add_shopping_v2',{p_code:CODE,p_item_name:x.item_name,p_category:'Otro',p_detail:`Maleta · ${trip.title} · ${person}`,p_created_by:needUser()||null});existing.add(normalize(x.item_name));added++}catch(e){}}
 if(typeof load==='function')await load();alert(added?`${added} objetos pendientes añadidos a Compras.`:'Todos esos objetos ya estaban en Compras.')
}
function progressHtml(s,tripId){
 const trip=(s.trips||[]).find(x=>x.id===tripId);if(!trip)return '';
 const people=trip.people?.length?trip.people:[...new Set((s.trip_items||[]).filter(x=>x.trip_id===tripId).map(x=>x.person_name))];
 return `<div class="packSmartBox" id="packSmartProgress"><b>👥 Progreso de toda la familia</b><div class="packPeopleProgress">${people.map(p=>{const a=(s.trip_items||[]).filter(x=>x.trip_id===tripId&&x.person_name===p),na=a.filter(x=>x.status==='na').length,needed=Math.max(0,a.length-na),packed=a.filter(x=>x.status==='packed').length,pending=a.filter(x=>x.status==='pending').length,pct=needed?Math.round(packed/needed*100):100;return `<div class="packPersonProgress"><b>${pe(p)}</b><small>${packed}/${needed} en maleta · ${pending} pendientes</small><i style="width:${Math.min(100,pct)}%"></i></div>`}).join('')}</div><div class="packSmartActions"><button type="button" class="secondary" id="packPendingToShop">🛒 Pendientes de ${pe(activePerson())} → Compras</button></div></div>`
}
async function enhancePacking(){
 if(psBusy||!document.getElementById('packing'))return;psBusy=true;
 try{
   const masterOn=document.getElementById('pkMasterTab')?.classList.contains('primary'),tripsOn=document.getElementById('pkTripsTab')?.classList.contains('primary'),body=document.getElementById('pkBody');if(!body)return;
   if(masterOn&&!document.getElementById('packSmartTemplates')){
     const box=document.createElement('div');box.id='packSmartTemplates';box.className='packSmartBox';box.innerHTML=`<b>🧩 Plantillas rápidas para ${pe(activePerson())}</b><div class="hint" style="margin-bottom:7px">Añaden objetos útiles a la lista base sin borrar ni duplicar los que ya tienes.</div><div class="packTemplateRow">${Object.keys(TEMPLATES).map(x=>`<button type="button" class="miniBtn" data-pack-template="${pe(x)}">${pe(x)}</button>`).join('')}</div>`;const card=body.querySelector('.card');card?.insertBefore(box,card.querySelector('.meta')||card.lastChild);box.querySelectorAll('[data-pack-template]').forEach(b=>b.onclick=()=>addTemplate(b.dataset.packTemplate));
   }
   if(tripsOn&&!document.getElementById('packSmartClone')){
     const box=document.createElement('div');box.id='packSmartClone';box.className='packSmartBox';box.innerHTML='<b>♻️ Reutilizar un viaje</b><div class="hint" style="margin-bottom:7px">Copia el último viaje con las mismas personas y objetos, pero vuelve a poner todo como pendiente.</div><button type="button" class="secondary" id="packCloneLast">Copiar último viaje</button>';const drawer=document.getElementById('pkNewTrip');drawer?.after(box);box.querySelector('#packCloneLast').onclick=cloneLast;
   }
   if(tripsOn){const tripId=activeTripId();if(tripId&&!document.getElementById('packSmartProgress')){const s=await state(),view=document.getElementById('pkTripView');if(view){const wrap=document.createElement('div');wrap.innerHTML=progressHtml(s,tripId);const box=wrap.firstElementChild;if(box){view.insertBefore(box,view.firstChild);box.querySelector('#packPendingToShop').onclick=()=>pendingToShopping(tripId,activePerson())}}}}
 }finally{psBusy=false}
}
function schedule(){clearTimeout(psTimer);psTimer=setTimeout(enhancePacking,80)}
const body=document.getElementById('pkBody');if(body)new MutationObserver(schedule).observe(body,{childList:true,subtree:true});
document.addEventListener('click',e=>{if(e.target.closest?.('#packing'))schedule()});
setTimeout(schedule,400);window.familyPackingSmartRefresh=schedule;
})();
