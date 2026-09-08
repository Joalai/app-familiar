(()=>{
'use strict';
const PEOPLE=['Igor','Mirari','Joane','Laia','Alain'];
const PACK_CATEGORIES=[
 {key:'Ropa',icon:'👕'},
 {key:'Ropa de correr',icon:'🏃'},
 {key:'Playa / piscina',icon:'🏖️'},
 {key:'Aseo',icon:'🧴'},
 {key:'Tecnología',icon:'📱'},
 {key:'Documentación',icon:'🪪'},
 {key:'Medicina',icon:'💊'},
 {key:'Otros',icon:'📦'}
];
const CATS=PACK_CATEGORIES.map(x=>x.key);
let PK={master_items:[],trips:[],trip_items:[]},PK_MODE='master',PK_PERSON=(typeof USER!=='undefined'&&PEOPLE.includes(USER)?USER:'Igor'),PK_TRIP=null,PK_TRIP_PERSON=null;
const pe=s=>esc(s);
function packPlain(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
function packCategory(x){
 const raw=packPlain(x?.category),name=packPlain(x?.item_name);
 const running=/correr|running|trail|runner|zapatillas?\s+(?:de\s+)?correr/.test(name);
 if(running||raw==='ropa de correr'||raw==='deporte')return 'Ropa de correr';
 if(raw==='ropa'||raw==='calzado')return 'Ropa';
 if(raw.includes('playa')||raw.includes('piscina'))return 'Playa / piscina';
 if(raw==='aseo'||raw.includes('higiene'))return 'Aseo';
 if(raw.includes('electron')||raw.includes('tecnolog'))return 'Tecnología';
 if(raw.includes('document'))return 'Documentación';
 if(raw.includes('medic'))return 'Medicina';
 return 'Otros';
}
function packCatInfo(x){const key=typeof x==='string'?x:packCategory(x);return PACK_CATEGORIES.find(c=>c.key===key)||PACK_CATEGORIES.at(-1)}
function packSavedCategory(value,itemName=''){return packCategory({category:value,item_name:itemName})}

const css=document.createElement('style');
css.textContent=`
#packing .packingTop{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}#packing .packingTop button{flex:1;min-width:130px}
.packPeople{display:flex;gap:6px;overflow:auto;padding:2px 0 10px}.packPeople button{border:1px solid var(--line);background:#fff;border-radius:999px;padding:8px 11px;font-weight:850;white-space:nowrap}.packPeople button.on{background:#eff6ff;border-color:#2563eb;color:#1d4ed8}
.packActions{display:flex;gap:7px;flex-wrap:wrap;margin:8px 0 12px}.packActions>*{flex:1;min-width:140px}.packGroup{border:1px solid var(--line);border-radius:13px;background:#fff;overflow:hidden;margin:9px 0}.packGroupHead{display:flex;align-items:center;gap:8px;padding:9px 10px;font-size:12px;font-weight:900;background:#f8fafc;border-bottom:1px solid var(--line);color:#334155}.packGroupIcon{font-size:20px;line-height:1}.packRow{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;padding:10px;border-bottom:1px solid var(--line)}.packRow:last-child{border-bottom:0}.packRow .name{font-size:14px}.packRow .meta{margin-top:2px}.packBtns{display:flex;gap:5px}.packStatus{width:36px;height:36px;border-radius:10px;border:1px solid var(--line);background:#fff;font-size:18px;font-weight:900}.packStatus.packed.on{background:#dcfce7;border-color:#86efac;color:#166534}.packStatus.na.on{background:#e2e8f0;border-color:#94a3b8;color:#475569}.packPending{display:inline-block;background:#fff7ed;color:#9a3412;border-radius:999px;padding:3px 7px;font-size:9px;font-weight:850;margin-top:4px}.packSummary{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:10px 0}.packStat{border:1px solid var(--line);border-radius:12px;background:#fff;padding:10px;text-align:center}.packStat b{display:block;font-size:20px}.packStat span{font-size:9px;color:var(--mut);font-weight:850}.packStat.done b{color:#15803d}.packStat.wait b{color:#c2410c}.packStat.na b{color:#64748b}.packTripTabs{display:flex;gap:7px;overflow:auto;margin:8px 0 12px}.packTripTab{border:1px solid var(--line);background:#fff;border-radius:12px;padding:9px 11px;min-width:145px;text-align:left}.packTripTab.on{border-color:#2563eb;background:#eff6ff}.packTripTab b{display:block}.packTripTab small{color:var(--mut)}.packEmpty{padding:18px;text-align:center;color:var(--mut)}.packProgress{height:8px;background:#e5e7eb;border-radius:999px;overflow:hidden;margin:7px 0 12px}.packProgress i{display:block;height:100%;background:#22c55e}.packCopy{display:grid;grid-template-columns:1fr auto;gap:7px}.packCopy select{min-width:0}.packAddLine{display:grid;grid-template-columns:1.3fr .9fr auto;gap:7px}.packAddLine button{white-space:nowrap}.packTripHead{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.packTripHead .title{margin-bottom:3px}.packTripMeta{color:var(--mut);font-size:11px}.packModeTitle{font-size:20px;font-weight:900;margin:2px 0 8px}.packCatMeta{display:flex;align-items:center;gap:4px}
@media(max-width:700px){.packAddLine{grid-template-columns:1fr}.packCopy{grid-template-columns:1fr}.packRow{grid-template-columns:1fr auto}.packBtns{align-self:start}.packTripHead{display:block}.packActions>*{min-width:120px}}
`;
document.head.appendChild(css);

function ensurePackingUI(){
 if($('packing'))return;
 const section=document.createElement('section');section.id='packing';section.className='view';
 section.innerHTML=`<div class="ey">Listas reutilizables por persona</div><div class="title">🧳 Maleta</div><div class="packingTop"><button id="pkMasterTab" type="button" class="secondary">Lista base</button><button id="pkTripsTab" type="button" class="secondary">Viajes</button></div><div id="pkBody"></div>`;
 document.querySelector('main').appendChild(section);
 const b=document.createElement('button');b.type='button';b.dataset.v='packing';b.textContent='🧳 Maleta';b.onclick=()=>{show('packing');loadPacking()};
 const shopBtn=document.querySelector('#nav [data-v="shop"]');shopBtn?shopBtn.after(b):$('nav').appendChild(b);
 $('pkMasterTab').onclick=()=>{PK_MODE='master';renderPacking()};$('pkTripsTab').onclick=()=>{PK_MODE='trips';renderPacking()};
}
async function loadPacking(){
 if(!CODE)return;
 try{PK=await rpc('family_packing_get',{p_code:CODE});if(!PK_TRIP&&PK.trips?.length)PK_TRIP=chooseDefaultTrip();renderPacking()}catch(e){$('pkBody').innerHTML='<div class="card pad status-error">No se ha podido cargar Maleta.</div>'}
}
function chooseDefaultTrip(){const today=iso(new Date()),future=(PK.trips||[]).filter(t=>!t.start_date||t.start_date>=today);return (future[0]||PK.trips?.[0]||{}).id||null}
function setModeButtons(){$('pkMasterTab').classList.toggle('primary',PK_MODE==='master');$('pkMasterTab').classList.toggle('secondary',PK_MODE!=='master');$('pkTripsTab').classList.toggle('primary',PK_MODE==='trips');$('pkTripsTab').classList.toggle('secondary',PK_MODE!=='trips')}
function personButtons(current,onclick,people=PEOPLE){return `<div class="packPeople">${people.map(p=>`<button type="button" class="${p===current?'on':''}" data-pack-person="${p}">${p}</button>`).join('')}</div>`}
function groupItems(items,rowfn){return PACK_CATEGORIES.map(cat=>{const list=items.filter(x=>packCategory(x)===cat.key).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)||a.item_name.localeCompare(b.item_name,'es'));if(!list.length)return '';return `<section class="packGroup"><div class="packGroupHead"><span class="packGroupIcon">${cat.icon}</span><span>${pe(cat.key)}</span></div>${list.map(rowfn).join('')}</section>`}).join('')}
function masterRow(x){const c=packCatInfo(x);return `<div class="packRow"><div><div class="name">${pe(x.item_name)}</div><div class="meta packCatMeta"><span>${c.icon}</span><span>${pe(c.key)}</span></div></div><div class="packBtns"><button type="button" class="miniBtn" data-pk-edit="${x.id}">Editar</button><button type="button" class="miniBtn danger" data-pk-del="${x.id}">×</button></div></div>`}
function addForm(prefix,person,tripId=null){return `<div class="packAddLine"><input id="${prefix}Name" placeholder="Añadir objeto"><select id="${prefix}Cat" aria-label="Categoría">${PACK_CATEGORIES.map(c=>`<option value="${pe(c.key)}">${c.icon} ${pe(c.key)}</option>`).join('')}</select><button id="${prefix}Add" type="button" class="primary">＋ Añadir</button></div>`}
function renderMaster(){
 const items=(PK.master_items||[]).filter(x=>x.person_name===PK_PERSON);
 $('pkBody').innerHTML=`<div class="card pad"><div class="packModeTitle">Lista base de ${pe(PK_PERSON)}</div><div class="hint">Tu esquema macro. Aquí guardas todo lo que podrías necesitar en cualquier viaje.</div>${personButtons(PK_PERSON)}${addForm('pkM',PK_PERSON)}<div class="packActions"><div class="packCopy"><select id="pkCopyFrom">${PEOPLE.filter(p=>p!==PK_PERSON).map(p=>`<option>${p}</option>`).join('')}</select><button id="pkCopy" type="button" class="secondary">Copiar lista de…</button></div></div><div class="meta">${items.length} ${items.length===1?'objeto':'objetos'} en la lista base.</div><div id="pkMasterList">${items.length?groupItems(items,masterRow):'<div class="packEmpty">Esta lista está vacía. Añade objetos o copia la de otra persona.</div>'}</div></div>`;
 document.querySelectorAll('[data-pack-person]').forEach(b=>b.onclick=()=>{PK_PERSON=b.dataset.packPerson;renderPacking()});
 $('pkMAdd').onclick=addMasterItem;$('pkMName').onkeydown=e=>{if(e.key==='Enter')addMasterItem()};
 $('pkCopy').onclick=copyMaster;
 document.querySelectorAll('[data-pk-del]').forEach(b=>b.onclick=()=>deleteMaster(b.dataset.pkDel));document.querySelectorAll('[data-pk-edit]').forEach(b=>b.onclick=()=>editMaster(b.dataset.pkEdit));
}
async function addMasterItem(){const n=$('pkMName').value.trim(),c=packSavedCategory($('pkMCat').value,n);if(!n)return;const b=$('pkMAdd');b.disabled=true;try{await rpc('family_packing_add_master_item',{p_code:CODE,p_person_name:PK_PERSON,p_item_name:n,p_category:c,p_created_by:needUser()||null});await loadPacking()}catch(e){alert('No se ha podido añadir. Puede que ya exista.') }finally{b.disabled=false}}
async function deleteMaster(id){if(!confirm('¿Quitar este objeto de la lista base? Los viajes ya creados no cambiarán.'))return;await rpc('family_packing_delete_master_item',{p_code:CODE,p_id:id});await loadPacking()}
async function editMaster(id){const x=(PK.master_items||[]).find(y=>y.id===id);if(!x)return;const n=prompt('Objeto',x.item_name);if(n===null||!n.trim())return;const current=packCategory({...x,item_name:n.trim()}),c=prompt('Categoría: Ropa, Ropa de correr, Playa / piscina, Aseo, Tecnología, Documentación, Medicina u Otros',current);if(c===null)return;try{await rpc('family_packing_update_master_item',{p_code:CODE,p_id:id,p_item_name:n.trim(),p_category:packSavedCategory(c,n.trim())});await loadPacking()}catch(e){alert('No se ha podido modificar.') }}
async function copyMaster(){const src=$('pkCopyFrom').value;if(!src)return;if(!confirm(`Copiar a ${PK_PERSON} todos los objetos de ${src} que todavía no tenga?`))return;const b=$('pkCopy');b.disabled=true;try{const n=await rpc('family_packing_copy_master',{p_code:CODE,p_source_person:src,p_target_person:PK_PERSON,p_created_by:needUser()||null});await loadPacking();alert(`${n||0} objetos copiados.`)}catch(e){alert('No se ha podido copiar la lista.')}finally{b.disabled=false}}

function renderTrips(){
 const trips=PK.trips||[];
 if(PK_TRIP&&!trips.some(t=>t.id===PK_TRIP))PK_TRIP=chooseDefaultTrip();
 const trip=trips.find(t=>t.id===PK_TRIP);
 $('pkBody').innerHTML=`<details class="formDrawer" id="pkNewTrip"><summary>Nuevo viaje <span>＋ Crear lista</span></summary><div class="card pad"><div class="form"><div class="field"><label>Nombre del viaje</label><input id="pkTripName" placeholder="Ej. China Semana Santa"></div><div class="field"><label>Fecha de salida (opcional)</label><input id="pkTripDate" type="date"></div><div class="field"><label>Personas</label><div id="pkTripPeople" class="personpick">${PEOPLE.map(p=>`<label class="on"><input type="checkbox" value="${p}" checked>${p}</label>`).join('')}</div></div><button id="pkCreateTrip" class="primary" type="button">Crear desde las listas base</button></div></div></details>${trips.length?`<div class="packTripTabs">${trips.map(t=>`<button type="button" class="packTripTab ${t.id===PK_TRIP?'on':''}" data-pk-trip="${t.id}"><b>${pe(t.title)}</b><small>${t.start_date?fmt(new Date(t.start_date+'T12:00:00'),{day:'numeric',month:'short',year:'numeric'}):'Sin fecha'}</small></button>`).join('')}</div><div id="pkTripView"></div>`:'<div class="card packEmpty">Todavía no hay viajes. Crea uno y se copiarán las listas base de las personas que elijas.</div>'}`;
 $('pkTripPeople')?.querySelectorAll('input').forEach(i=>i.onchange=()=>i.closest('label').classList.toggle('on',i.checked));
 if($('pkCreateTrip'))$('pkCreateTrip').onclick=createTrip;
 document.querySelectorAll('[data-pk-trip]').forEach(b=>b.onclick=()=>{PK_TRIP=b.dataset.pkTrip;PK_TRIP_PERSON=null;renderPacking()});
 if(trip)renderTripView(trip);
}
async function createTrip(){const title=$('pkTripName').value.trim(),date=$('pkTripDate').value||null,people=[...$('pkTripPeople').querySelectorAll('input:checked')].map(x=>x.value);if(!title)return alert('Pon un nombre al viaje.');if(!people.length)return alert('Elige al menos una persona.');const b=$('pkCreateTrip');b.disabled=true;try{const tr=await rpc('family_packing_create_trip',{p_code:CODE,p_title:title,p_start_date:date,p_people:people,p_created_by:needUser()||null});PK_TRIP=tr.id;PK_TRIP_PERSON=people[0];await loadPacking()}catch(e){alert('No se ha podido crear el viaje.')}finally{b.disabled=false}}
function renderTripView(trip){
 const people=(trip.people&&trip.people.length?trip.people:PEOPLE.filter(p=>(PK.trip_items||[]).some(x=>x.trip_id===trip.id&&x.person_name===p)));
 if(!PK_TRIP_PERSON||!people.includes(PK_TRIP_PERSON))PK_TRIP_PERSON=people[0]||'Igor';
 const items=(PK.trip_items||[]).filter(x=>x.trip_id===trip.id&&x.person_name===PK_TRIP_PERSON),packed=items.filter(x=>x.status==='packed').length,na=items.filter(x=>x.status==='na').length,pending=items.length-packed-na,needed=Math.max(1,items.length-na),pct=Math.round(packed/needed*100);
 $('pkTripView').innerHTML=`<div class="card pad"><div class="packTripHead"><div><div class="ey">Lista de viaje</div><div class="title" style="font-size:21px">${pe(trip.title)}</div><div class="packTripMeta">${trip.start_date?fmt(new Date(trip.start_date+'T12:00:00'),{weekday:'long',day:'numeric',month:'long',year:'numeric'}):'Fecha sin definir'}</div></div><button id="pkArchiveTrip" type="button" class="miniBtn danger">Archivar viaje</button></div>${personButtons(PK_TRIP_PERSON,null,people)}<div class="packSummary"><div class="packStat done"><b>${packed}</b><span>EN MALETA</span></div><div class="packStat wait"><b>${pending}</b><span>PENDIENTES</span></div><div class="packStat na"><b>${na}</b><span>NO APLICA</span></div></div><div class="packProgress"><i style="width:${Math.min(100,pct)}%"></i></div>${addForm('pkT',PK_TRIP_PERSON,trip.id)}<div id="pkTripItems">${items.length?groupItems(items,tripRow):'<div class="packEmpty">No hay objetos para esta persona en este viaje. Puedes añadirlos aquí.</div>'}</div></div>`;
 document.querySelectorAll('#pkTripView [data-pack-person]').forEach(b=>b.onclick=()=>{PK_TRIP_PERSON=b.dataset.packPerson;renderTripView(trip)});$('pkTAdd').onclick=()=>addTripItem(trip.id);$('pkTName').onkeydown=e=>{if(e.key==='Enter')addTripItem(trip.id)};$('pkArchiveTrip').onclick=()=>archiveTrip(trip.id);
 document.querySelectorAll('[data-pk-status]').forEach(b=>b.onclick=()=>setTripStatus(b.dataset.pkStatus,b.dataset.status));document.querySelectorAll('[data-pk-trip-del]').forEach(b=>b.onclick=()=>deleteTripItem(b.dataset.pkTripDel));
}
function tripRow(x){const c=packCatInfo(x);return `<div class="packRow"><div><div class="name">${pe(x.item_name)}</div><div class="meta packCatMeta"><span>${c.icon}</span><span>${pe(c.key)}</span></div>${x.status==='pending'?'<span class="packPending">Pendiente</span>':''}</div><div class="packBtns"><button type="button" aria-label="En la maleta" title="En la maleta" class="packStatus packed ${x.status==='packed'?'on':''}" data-pk-status="${x.id}" data-status="${x.status==='packed'?'pending':'packed'}">✓</button><button type="button" aria-label="No aplica" title="No aplica en este viaje" class="packStatus na ${x.status==='na'?'on':''}" data-pk-status="${x.id}" data-status="${x.status==='na'?'pending':'na'}">—</button><button type="button" class="miniBtn danger" data-pk-trip-del="${x.id}">×</button></div></div>`}
async function setTripStatus(id,status){try{await rpc('family_packing_set_trip_status',{p_code:CODE,p_item_id:id,p_status:status});const x=PK.trip_items.find(y=>y.id===id);if(x)x.status=status;const trip=PK.trips.find(t=>t.id===PK_TRIP);renderTripView(trip)}catch(e){alert('No se ha podido actualizar.') }}
async function addTripItem(tripId){const n=$('pkTName').value.trim(),c=packSavedCategory($('pkTCat').value,n);if(!n)return;const b=$('pkTAdd');b.disabled=true;try{await rpc('family_packing_add_trip_item',{p_code:CODE,p_trip_id:tripId,p_person_name:PK_TRIP_PERSON,p_item_name:n,p_category:c});await loadPacking()}catch(e){alert('No se ha podido añadir.')}finally{b.disabled=false}}
async function deleteTripItem(id){if(!confirm('¿Quitar este objeto solo de este viaje?'))return;await rpc('family_packing_delete_trip_item',{p_code:CODE,p_item_id:id});await loadPacking()}
async function archiveTrip(id){if(!confirm('¿Archivar este viaje? Su lista dejará de aparecer, pero no se modifican las listas base.'))return;await rpc('family_packing_archive_trip',{p_code:CODE,p_trip_id:id});PK_TRIP=null;PK_TRIP_PERSON=null;await loadPacking()}
function renderPacking(){ensurePackingUI();setModeButtons();PK_MODE==='master'?renderMaster():renderTrips()}
window.familyPackingLoad=loadPacking;
window.familyPackingRender=renderPacking;
ensurePackingUI();
})();
