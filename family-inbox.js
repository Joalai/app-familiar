(()=>{
'use strict';

const INBOX_ENDPOINT='https://gjplhfinujyhjxpahcak.supabase.co/functions/v1/familia-inbox';
const byId=id=>document.getElementById(id);
const esc2=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const isoToday=()=>typeof iso==='function'?iso(new Date()):new Date().toISOString().slice(0,10);
const sourceLabel={app:'App',siri:'Siri',share:'Compartir',other:'Otro'};

const style=document.createElement('style');
style.textContent=`
.inboxHero{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:end;margin-bottom:10px}.inboxComposer{display:grid;gap:8px}.inboxComposer textarea{min-height:78px;resize:vertical}.inboxActions{display:flex;gap:7px;flex-wrap:wrap}.inboxActions button{flex:1;min-width:120px}.inboxRow{border:1px solid var(--line);border-radius:13px;padding:11px;margin:8px 0;background:#fff}.inboxRowTop{display:flex;justify-content:space-between;gap:10px}.inboxText{font-weight:850;font-size:14px;white-space:pre-wrap}.inboxMeta{font-size:10px;color:var(--mut);margin-top:4px}.inboxMove{display:flex;gap:5px;flex-wrap:wrap;margin-top:9px}.inboxMove button{border:1px solid var(--line);background:#fff;border-radius:999px;padding:7px 9px;font-size:11px;font-weight:800}.inboxMove .danger{color:#b42318}.inboxEmpty{padding:22px;text-align:center;color:var(--mut)}.inboxBadge{display:inline-grid;place-items:center;min-width:23px;height:23px;padding:0 6px;border-radius:999px;background:#e11d48;color:#fff;font-size:11px;font-weight:900}.inboxSetup{margin-top:12px}.inboxSetup summary{cursor:pointer;font-weight:850}.inboxSetup ol{padding-left:20px;color:var(--mut);line-height:1.55}.richWeekBlock{border:1px solid var(--line);border-radius:12px;padding:10px;margin:8px 0;background:#fff}.richWeekBlock h4{margin:0 0 7px;font-size:13px}.richWeekList{margin:0;padding-left:18px}.richWeekList li{margin:4px 0}.richWeekWarn{background:#fff7ed;border-color:#fed7aa}.richWeekOk{background:#f0fdf4;border-color:#bbf7d0}
@media(max-width:700px){.inboxHero{grid-template-columns:1fr}.inboxMove button{font-size:12px;padding:8px 10px}}
`;
document.head.appendChild(style);

function pendingInbox(){return (D?.inbox||[]).filter(x=>x.status==='pending').sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)))}

function ensureSection(){
 if(byId('inbox'))return;
 const shop=byId('shop');
 const html=`<section id="inbox" class="view">
  <div class="ey">Captura ahora · clasifica después</div>
  <div class="title">📥 Bandeja familiar</div>
  <div class="card pad inboxComposer">
   <div class="field"><label>¿Qué quieres guardar?</label><textarea id="inboxText" placeholder="Ej. Comprar zapatillas para Alain, pedir cita, mirar seguro del coche…"></textarea></div>
   <div class="inboxActions"><button id="inboxVoice" type="button" class="secondary">🎙️ Dictar</button><button id="inboxSave" type="button" class="primary">Añadir a la bandeja</button></div>
   <div id="inboxMsg" class="meta" role="status" aria-live="polite"></div>
  </div>
  <div class="card pad" style="margin-top:10px">
   <div class="inboxHero"><div><div class="title" style="font-size:18px;margin:0">Por clasificar</div><div class="meta">Todo lo que se capture desde la app, Siri o Compartir llega aquí.</div></div><span id="inboxCount" class="inboxBadge">0</span></div>
   <div id="inboxList"></div>
  </div>
  <details class="card pad inboxSetup">
    <summary>🎙️ Siri y Compartir desde el iPhone</summary>
    <ol>
      <li>Crea una vez en Atajos un atajo llamado <b>Apunta en familia</b>.</li>
      <li>Si recibe contenido desde Compartir, usa ese contenido; si no, usa <b>Dictar texto</b>.</li>
      <li>Envía el texto por POST a <code>https://gjplhfinujyhjxpahcak.supabase.co/functions/v1/familia-inbox</code> con el código familiar en la cabecera <code>x-family-code</code>.</li>
      <li>Desde entonces podrás decir “Oye Siri, Apunta en familia” o usar Compartir → Apunta en familia.</li>
    </ol>
  </details>
 </section>`;
 if(shop)shop.insertAdjacentHTML('beforebegin',html);else document.querySelector('main')?.insertAdjacentHTML('beforeend',html);
 byId('inboxSave').onclick=addFromApp;
 byId('inboxVoice').onclick=dictate;
}

function ensureHomeCard(){
 const dash=byId('homeDashboard');if(!dash)return;
 let card=dash.querySelector('[data-home-open="inbox"]');
 if(!card){
  const groups=[...dash.querySelectorAll('.homeGroup')],fam=groups.find(g=>g.querySelector('.homeGroupTitle')?.textContent.trim()==='Familia');
  const grid=fam?.querySelector('.homeMenuGrid');
  if(grid){card=document.createElement('button');card.type='button';card.className='homeMenuCard';card.dataset.homeOpen='inbox';card.innerHTML='<span class="homeMenuIcon">📥</span><b>Bandeja</b><small>Captura y clasifica después</small>';grid.prepend(card);card.onclick=()=>openInbox()}
 }
 updateHomeBadge();
}

function updateHomeBadge(){
 const n=pendingInbox().length;
 document.querySelectorAll('[data-home-open="inbox"]').forEach(card=>{
  let b=card.querySelector('.homeCardBadge');
  if(!n){b?.remove();return}
  if(!b){b=document.createElement('span');b.className='homeCardBadge';card.appendChild(b)}
  b.textContent=n>99?'99+':String(n);
 });
 if(byId('inboxCount'))byId('inboxCount').textContent=String(n);
}

function openInbox(){
 if(typeof window.familySafeOpen==='function')window.familySafeOpen('inbox');
 else if(typeof show==='function')show('inbox');
 renderInbox();
}

async function addFromApp(){
 const text=byId('inboxText').value.trim(),msg=byId('inboxMsg');if(!text)return;
 const actor=typeof needUser==='function'?needUser():(window.USER||null);if(!actor)return;
 byId('inboxSave').disabled=true;msg.textContent='Guardando…';
 try{
  await rpc('family_add_inbox',{p_code:CODE,p_text:text,p_source:'app',p_created_by:actor,p_shared_url:null});
  byId('inboxText').value='';await load();msg.textContent='Añadido ✓';
 }catch(e){console.error(e);msg.textContent='No se ha podido guardar.'}
 finally{byId('inboxSave').disabled=false}
}

function dictate(){
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!SR){byId('inboxText').focus();alert('Usa el micrófono del teclado del iPhone para dictar el texto.');return}
 const r=new SR();r.lang='es-ES';r.interimResults=false;byId('inboxVoice').textContent='🎙️ Escuchando…';
 r.onresult=e=>{byId('inboxText').value=(e.results?.[0]?.[0]?.transcript||'').trim();byId('inboxText').focus()};
 r.onerror=()=>{};r.onend=()=>{byId('inboxVoice').textContent='🎙️ Dictar'};r.start();
}

function renderInbox(){
 ensureSection();const rows=pendingInbox();updateHomeBadge();
 byId('inboxList').innerHTML=rows.length?rows.map(x=>`<article class="inboxRow" data-inbox-id="${x.id}">
  <div class="inboxRowTop"><div><div class="inboxText">${esc2(x.item_text)}</div><div class="inboxMeta">${esc2(sourceLabel[x.source]||x.source||'App')}${x.created_by?' · '+esc2(x.created_by):''} · ${new Date(x.created_at).toLocaleString('es-ES',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>${x.shared_url?`<div class="inboxMeta"><a href="${esc2(x.shared_url)}" target="_blank" rel="noopener">Abrir enlace compartido</a></div>`:''}</div></div>
  <div class="inboxMove">
   <button data-inbox-dest="shopping">🛒 Compras</button><button data-inbox-dest="task">✅ Tarea</button><button data-inbox-dest="calendar">🗓️ Calendario</button><button data-inbox-dest="health">🩺 Salud</button><button data-inbox-dest="car">🚗 Coche</button><button data-inbox-dest="packing">🧳 Maleta</button><button data-inbox-dest="documents">🪪 Documentación</button><button data-inbox-dest="other">✓ Otro</button><button data-inbox-discard class="danger">Descartar</button>
  </div>
 </article>`).join(''):'<div class="inboxEmpty">La bandeja está vacía. Nada por clasificar.</div>';
 byId('inboxList').querySelectorAll('[data-inbox-dest]').forEach(b=>b.onclick=()=>classify(b.closest('[data-inbox-id]').dataset.inboxId,b.dataset.inboxDest));
 byId('inboxList').querySelectorAll('[data-inbox-discard]').forEach(b=>b.onclick=()=>discard(b.closest('[data-inbox-id]').dataset.inboxId));
}

function itemById(id){return (D?.inbox||[]).find(x=>x.id===id)}
async function markClassified(id,destination,targetId=null){
 const actor=typeof needUser==='function'?needUser():(window.USER||null);if(!actor)return false;
 await rpc('family_classify_inbox',{p_code:CODE,p_id:id,p_destination:destination,p_classified_by:actor,p_target_id:targetId});
 return true;
}
async function discard(id){
 if(!confirm('¿Descartar esta entrada?'))return;
 const actor=typeof needUser==='function'?needUser():(window.USER||null);if(!actor)return;
 await rpc('family_discard_inbox',{p_code:CODE,p_id:id,p_classified_by:actor});await load();
}

function askDate(label='Fecha'){
 const d=prompt(label+' (AAAA-MM-DD)',isoToday());return d&&/^\d{4}-\d{2}-\d{2}$/.test(d)?d:null;
}
function pickMember(label='Persona'){
 const v=prompt(label+' (Igor, Mirari, Joane, Laia, Alain o Familia)','Familia');return v&&['Igor','Mirari','Joane','Laia','Alain','Familia'].includes(v)?v:null;
}

async function classify(id,dest){
 const x=itemById(id);if(!x)return;const actor=typeof needUser==='function'?needUser():(window.USER||null);if(!actor)return;
 try{
  let target=null;
  if(dest==='shopping'){
   target=await rpc('family_add_shopping_v2',{p_code:CODE,p_item_name:x.item_text,p_category:'Otro',p_detail:x.shared_url||null,p_created_by:actor});
  }else if(dest==='task'){
   target=await rpc('family_add_task',{p_code:CODE,p_title:x.item_text,p_due_date:null,p_assignees:[],p_notes:x.shared_url||null,p_created_by:actor});
  }else if(dest==='calendar'||dest==='health'){
   const date=askDate(dest==='health'?'Fecha de la cita':'Fecha del evento');if(!date)return;
   const who=pickMember(dest==='health'?'Persona de la cita':'Quién');if(!who)return;
   const time=prompt('Hora (HH:MM) o deja vacío','')||null;
   target=await rpc('family_add_event_v2',{p_code:CODE,p_category:dest==='health'?'salud':'plan',p_title:x.item_text,p_event_date:date,p_start_time:time||null,p_end_time:null,p_member_names:[who],p_place:null,p_notes:x.shared_url||null,p_created_by:actor});
  }else if(dest==='car'){
   const vs=(D?.vehicles||[]).filter(v=>v.active!==false);if(!vs.length){alert('Primero añade el coche en la sección Coches.');return}
   const names=vs.map((v,i)=>`${i+1}. ${v.name||v.vehicle_name||v.registration||'Coche'}`).join('\n');
   const n=Number(prompt('¿A qué coche corresponde?\n'+names,'1'));const v=vs[n-1];if(!v)return;
   const date=askDate('Fecha');if(!date)return;
   const kind=(prompt('Tipo: itv, seguro, taller u otro','otro')||'otro').toLowerCase();if(!['itv','seguro','taller','otro'].includes(kind))return;
   target=await rpc('family_add_vehicle_record',{p_code:CODE,p_vehicle_id:v.id,p_kind:kind,p_record_date:date,p_next_date:null,p_reminder_date:null,p_title:x.item_text,p_provider:null,p_mileage:null,p_amount:null,p_notes:x.shared_url||null,p_show_calendar:true,p_created_by:actor});
  }else if(dest==='packing'){
   const who=pickMember('¿Para quién?');if(!who||who==='Familia'){alert('En Maleta elige una persona concreta.');return}
   target=await rpc('family_packing_add_master_item',{p_code:CODE,p_person_name:who,p_item_name:x.item_text,p_category:'General',p_created_by:actor});
  }else if(dest==='documents'){
   try{await navigator.clipboard.writeText(x.item_text)}catch(e){}
   alert('He copiado el texto. Completa la ficha segura en Documentación; esta entrada seguirá pendiente hasta que la descartes o clasifiques.');
   if(typeof window.familySafeOpen==='function')window.familySafeOpen('documents');else if(typeof show==='function')show('documents');
   return;
  }else if(dest==='other'){
   target=null;
  }
  const tid=target?.id||null;await markClassified(id,dest,tid);await load();
 }catch(e){console.error(e);alert('No se ha podido clasificar esta entrada.')}
}

function addDays(ds,n){const d=new Date(ds+'T12:00:00');d.setDate(d.getDate()+n);return typeof iso==='function'?iso(d):d.toISOString().slice(0,10)}
function monday(ds){const d=new Date(ds+'T12:00:00'),day=d.getDay()||7;d.setDate(d.getDate()-day+1);return typeof iso==='function'?iso(d):d.toISOString().slice(0,10)}
function fmtDay(ds){return new Intl.DateTimeFormat('es-ES',{weekday:'short',day:'numeric',month:'short'}).format(new Date(ds+'T12:00:00'))}
function timeMin(t){if(!t)return null;const [h,m]=t.slice(0,5).split(':').map(Number);return h*60+m}
function scheduledFor(ds){
 const rows=[];
 (D?.events||[]).filter(x=>x.event_date===ds).forEach(x=>rows.push({title:typeof displayTitle==='function'?displayTitle(x):x.title,start:x.start_time,end:x.end_time,members:x.member_names||[]}));
 try{(rf(new Date(ds+'T12:00:00'))||[]).forEach(x=>rows.push({title:typeof displayTitle==='function'?displayTitle(x):x.title,start:x.start_time,end:x.end_time,members:x.member_names||[]}))}catch(e){}
 try{const s=schoolMarker(new Date(ds+'T12:00:00'));if(s)rows.unshift({title:'🏫 '+schoolText(s),start:null,end:null,members:[]})}catch(e){}
 return rows;
}
function overlap(a,b){const as=timeMin(a.start),bs=timeMin(b.start);if(as===null||bs===null)return false;const ae=timeMin(a.end)??as+60,be=timeMin(b.end)??bs+60;return as<be&&bs<ae}
function conflicts(days){
 const out=[];
 days.forEach(d=>{const a=d.items;for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++){const shared=(a[i].members||[]).filter(x=>(a[j].members||[]).includes(x));if(shared.length&&overlap(a[i],a[j]))out.push(`${fmtDay(d.ds)} · ${shared.join(', ')}: ${a[i].title} / ${a[j].title}`)}})
 return [...new Set(out)];
}
function richWeeklyData(){
 const start=addDays(monday(isoToday()),7),end=addDays(start,6),days=[];
 for(let i=0;i<7;i++){const ds=addDays(start,i);days.push({ds,items:scheduledFor(ds)})}
 const tasks=(D?.tasks||[]).filter(x=>!x.is_done&&(!x.due_date||x.due_date<=end)).slice(0,12);
 const shopping=(D?.shopping||[]).filter(x=>!x.is_done).slice(0,12);
 const inbox=pendingInbox();
 const cut=new Date();cut.setDate(cut.getDate()-7);
 const fresh=[
  ...(D?.events||[]).filter(x=>x.created_at&&new Date(x.created_at)>=cut).map(x=>'📅 '+x.title),
  ...(D?.shopping||[]).filter(x=>x.created_at&&new Date(x.created_at)>=cut).map(x=>'🛒 '+x.item_name),
  ...(D?.tasks||[]).filter(x=>x.created_at&&new Date(x.created_at)>=cut).map(x=>'✅ '+x.title),
  ...(D?.inbox||[]).filter(x=>x.created_at&&new Date(x.created_at)>=cut).map(x=>'📥 '+x.item_text)
 ].slice(0,15);
 return {start,end,days,tasks,shopping,inbox,conflicts:conflicts(days),fresh};
}
function listHtml(items,empty='Nada pendiente'){return items.length?`<ul class="richWeekList">${items.map(x=>`<li>${esc2(x)}</li>`).join('')}</ul>`:`<div class="meta">${empty}</div>`}
function openRichWeekly(){
 const w=richWeeklyData(),total=w.days.reduce((n,d)=>n+d.items.length,0);
 let d=byId('richWeekDialog');if(!d){d=document.createElement('dialog');d.id='richWeekDialog';d.className='smartDialog';d.innerHTML='<div class="smartDialogHead"><b>🗓️ Resumen del domingo</b><button class="smartClose" type="button">×</button></div><div class="smartDialogBody"></div>';document.body.appendChild(d);d.querySelector('.smartClose').onclick=()=>d.close()}
 d.querySelector('.smartDialogBody').innerHTML=`
  <div class="richWeekBlock"><h4>Próxima semana · ${esc2(fmtDay(w.start))} – ${esc2(fmtDay(w.end))}</h4><div class="meta">${total} acontecimientos previstos.</div></div>
  ${w.days.map(x=>`<div class="weeklyDay"><b>${esc2(fmtDay(x.ds))}</b><small>${x.items.length?x.items.map(i=>esc2((i.start?i.start.slice(0,5)+' ':'')+i.title)).join(' · '):'Sin acontecimientos'}</small></div>`).join('')}
  <div class="richWeekBlock ${w.conflicts.length?'richWeekWarn':'richWeekOk'}"><h4>⚠️ Conflictos horarios</h4>${listHtml(w.conflicts,'No he detectado solapamientos horarios.')}</div>
  <div class="richWeekBlock"><h4>✅ Tareas pendientes</h4>${listHtml(w.tasks.map(x=>x.title+(x.due_date?' · '+x.due_date:'')))}</div>
  <div class="richWeekBlock"><h4>🛒 Compras pendientes</h4>${listHtml(w.shopping.map(x=>x.item_name))}</div>
  <div class="richWeekBlock ${w.inbox.length?'richWeekWarn':''}"><h4>📥 Bandeja por clasificar</h4>${listHtml(w.inbox.map(x=>x.item_text))}</div>
  <div class="richWeekBlock"><h4>🆕 Añadido en los últimos 7 días</h4>${listHtml(w.fresh,'Sin novedades añadidas.')}</div>
  <div class="smartActionRow"><button id="richWeekShare" type="button" class="primary">Compartir</button><button id="richWeekCopy" type="button" class="secondary">Copiar texto</button></div>`;
 const text=['Resumen familiar · próxima semana',...w.days.map(x=>`${fmtDay(x.ds)}: ${x.items.length?x.items.map(i=>(i.start?i.start.slice(0,5)+' ':'')+i.title).join(' · '):'Sin acontecimientos'}`),'',w.conflicts.length?'Conflictos: '+w.conflicts.join(' | '):'Sin conflictos horarios','Tareas: '+(w.tasks.map(x=>x.title).join(' · ')||'ninguna'),'Compras: '+(w.shopping.map(x=>x.item_name).join(' · ')||'ninguna'),'Bandeja: '+(w.inbox.map(x=>x.item_text).join(' · ')||'vacía'),'Novedades: '+(w.fresh.join(' · ')||'ninguna')].join('\n');
 d.querySelector('#richWeekShare').onclick=async()=>{if(navigator.share)try{await navigator.share({title:'Resumen familiar',text})}catch(e){}else navigator.clipboard?.writeText(text)};
 d.querySelector('#richWeekCopy').onclick=async()=>{await navigator.clipboard?.writeText(text).catch(()=>{});d.querySelector('#richWeekCopy').textContent='Copiado ✓'};
 if(!d.open)d.showModal();
}

function refresh(){
 ensureSection();ensureHomeCard();renderInbox();
 const btn=document.querySelector('[data-smart-week]');if(btn&&!btn.dataset.richWeek){btn.dataset.richWeek='1';btn.onclick=openRichWeekly}
}
const baseRender=typeof renderAll==='function'?renderAll:null;
if(baseRender){renderAll=function(){baseRender();setTimeout(refresh,0)}}
window.familyOpenInbox=openInbox;
window.familyOpenRichWeekly=openRichWeekly;
window.familyOpenWeekly=openRichWeekly;
window.familyInboxShortcutEndpoint=INBOX_ENDPOINT;
document.addEventListener('family-upcoming-rendered',()=>setTimeout(refresh,0));
setTimeout(refresh,100);
})();