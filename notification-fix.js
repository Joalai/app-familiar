(()=>{
'use strict';

const NF_SEEN='family_section_seen_v2',NF_INIT='family_section_seen_v2_initialized';
const NF_SECTIONS=['shop','packing','health','plans','routines','sports','races','cal','documents'];
let nfPacking={master_items:[],trips:[],trip_items:[]},nfPackingAt=0,nfBusy=false,nfRendering=false;
const nfEsc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function nfDataReady(){
 const sync=(document.getElementById('sync')?.textContent||'').toLocaleLowerCase('es');
 return sync.includes('sincron')||((D?.members||[]).length>0);
}
function nfSeen(){
 try{const x=JSON.parse(localStorage.getItem(NF_SEEN)||'{}');return x&&typeof x==='object'?x:{}}catch(e){return {}}
}
function nfSaveSeen(x){
 const clean={};NF_SECTIONS.forEach(s=>clean[s]=[...new Set(x[s]||[])].slice(-1200));
 try{localStorage.setItem(NF_SEEN,JSON.stringify(clean))}catch(e){}
}
function nfTitle(x,fallback='Elemento'){try{return typeof displayTitle==='function'?displayTitle(x):(x.title||x.item_name||fallback)}catch(e){return x.title||x.item_name||fallback}}
function nfSectionForEvent(x){
 try{if(typeof isRace==='function'&&isRace(x))return 'races'}catch(e){}
 try{if(typeof isHealth==='function'&&isHealth(x))return 'health'}catch(e){}
 if(x.category==='sport')return 'sports';
 return 'plans';
}
async function nfFetchPacking(force=false){
 if(!CODE)return nfPacking;
 if(!force&&Date.now()-nfPackingAt<25000)return nfPacking;
 try{nfPacking=await rpc('family_packing_get',{p_code:CODE})||nfPacking;nfPackingAt=Date.now()}catch(e){}
 return nfPacking;
}
function nfRecords(){
 const out=[],push=(section,key,title,sub='')=>{if(section&&key)out.push({section,key:String(key),title:String(title||'Novedad'),sub:String(sub||'')})};
 const events=D?.events||[];
 events.forEach(x=>{const s=nfSectionForEvent(x);push(s,`event:${x.id}`,nfTitle(x),`${x.event_date||''}${x.member_names?.length?' · '+x.member_names.join(', '):''}`)});
 (D?.recurring||[]).forEach(x=>push('routines',`routine:${x.id}`,nfTitle(x),(x.member_names||[]).join(', ')));
 (D?.shopping||[]).filter(x=>!x.is_done).forEach(x=>push('shop',`shop:${x.id}`,x.item_name||'Compra pendiente',x.category||''));
 (D?.school_calendar||[]).forEach(x=>push('cal',`school:${x.id||[x.start_date,x.end_date,x.title].join(':')}`,x.title||'Calendario escolar',`${x.start_date||''}${x.end_date?' – '+x.end_date:''}`));
 const eventIds=new Set(events.map(x=>String(x.id)));
 try{if(typeof raceEvents==='function')raceEvents().filter(x=>!eventIds.has(String(x.id))).forEach(x=>push('races',`race:${x.id}`,x.title||'Carrera',x.event_date||''))}catch(e){}
 (window.familyOptionalRaces||[]).forEach(x=>push('races',`optional:${x.id}`,x.title||'Carrera opcional',x.date_text||x.event_date||''));
 (nfPacking.master_items||[]).filter(x=>x.active!==false).forEach(x=>push('packing',`pack-master:${x.id}`,x.item_name||'Objeto de maleta',x.person_name||''));
 (nfPacking.trips||[]).forEach(x=>push('packing',`pack-trip:${x.id}`,x.title||'Viaje',x.start_date||''));
 (nfPacking.trip_items||[]).filter(x=>!x.master_item_id).forEach(x=>push('packing',`pack-manual:${x.id}`,x.item_name||'Objeto de viaje',x.person_name||''));
 const seenKeys=new Set(),dedup=[];out.forEach(x=>{const k=x.section+'|'+x.key;if(!seenKeys.has(k)){seenKeys.add(k);dedup.push(x)}});return dedup;
}
function nfInitializeIfNeeded(){
 if(localStorage.getItem(NF_INIT)==='1'||!nfDataReady())return false;
 const s={};NF_SECTIONS.forEach(k=>s[k]=[]);nfRecords().forEach(x=>s[x.section].push(x.key));nfSaveSeen(s);
 localStorage.setItem(NF_INIT,'1');
 localStorage.setItem('family_unread_events','0');
 return true;
}
function nfUnseen(){
 const seen=nfSeen();return nfRecords().filter(x=>!(seen[x.section]||[]).includes(x.key));
}
function nfCounts(){
 const c={};NF_SECTIONS.forEach(s=>c[s]=0);nfUnseen().forEach(x=>c[x.section]=(c[x.section]||0)+1);return c;
}
function nfTotal(){return nfUnseen().length}
function nfMarkSection(section){
 if(!NF_SECTIONS.includes(section))return;
 const seen=nfSeen();seen[section]=seen[section]||[];const set=new Set(seen[section]);nfRecords().filter(x=>x.section===section).forEach(x=>set.add(x.key));seen[section]=[...set];nfSaveSeen(seen);localStorage.setItem('family_unread_events','0');nfRender();
}
function nfMarkRecord(section,key){
 if(!section||!key)return;const seen=nfSeen();seen[section]=seen[section]||[];if(!seen[section].includes(key))seen[section].push(key);nfSaveSeen(seen);localStorage.setItem('family_unread_events','0');nfRender();
}
function nfMarkAll(){
 const seen=nfSeen();NF_SECTIONS.forEach(s=>seen[s]=seen[s]||[]);nfRecords().forEach(x=>{if(!seen[x.section].includes(x.key))seen[x.section].push(x.key)});nfSaveSeen(seen);localStorage.setItem('family_unread_events','0');nfRender();
}

const nativeSetBadge=typeof navigator.setAppBadge==='function'?navigator.setAppBadge.bind(navigator):null;
const nativeClearBadge=typeof navigator.clearAppBadge==='function'?navigator.clearAppBadge.bind(navigator):null;
async function nfNativeBadge(n){try{if(n>0&&nativeSetBadge)await nativeSetBadge(n);else if(nativeClearBadge)await nativeClearBadge()}catch(e){}}
function nfRenderBell(total){
 const badge=document.getElementById('notifyBadge'),btn=document.getElementById('notifyBtn');
 if(badge){badge.textContent=total?String(Math.min(total,99))+(total>99?'+':''):'';badge.classList.toggle('show',total>0)}
 btn?.classList.toggle('smartAttention',total>0);nfNativeBadge(total);
}
function nfRenderCards(counts){
 const dash=document.getElementById('homeDashboard');if(!dash)return;
 nfRendering=true;
 try{
  dash.querySelectorAll('.homeCardBadge').forEach(x=>x.remove());
  dash.querySelectorAll('.homeGroup > .homeMenuGrid .homeMenuCard[data-home-open]').forEach(card=>{
   const n=counts[card.dataset.homeOpen]||0;if(!n)return;
   const b=document.createElement('span');b.className='homeCardBadge nfNewBadge';b.textContent=n>99?'99+':String(n);b.setAttribute('aria-label',`${n} novedades sin ver`);card.appendChild(b);
  });
 }finally{setTimeout(()=>nfRendering=false,0)}
}
function nfRender(){
 if(localStorage.getItem(NF_INIT)!=='1')return;
 localStorage.setItem('family_unread_events','0');
 const c=nfCounts(),total=Object.values(c).reduce((a,b)=>a+b,0);nfRenderCards(c);nfRenderBell(total);
}

const css=document.createElement('style');
css.textContent=`.homeCardBadge.nfNewBadge{right:9px!important;top:9px!important;min-width:30px!important;height:30px!important;padding:0 8px!important;border-radius:999px!important;font-size:13px!important;font-weight:950!important;line-height:30px!important;display:grid!important;place-items:center!important}.homeFavGroup .homeCardBadge{display:none!important}.notifybadge:not(.show){display:none!important}`;
document.head.appendChild(css);

function nfEnsureDialog(){
 let d=document.getElementById('smartNotifyDialog');if(!d){d=document.createElement('dialog');d.id='smartNotifyDialog';d.className='smartDialog';d.innerHTML='<div class="smartDialogHead"><b>Novedades</b><button type="button" class="smartClose">×</button></div><div class="smartDialogBody"></div>';document.body.appendChild(d)}d.querySelector('.smartClose').onclick=()=>d.close();return d;
}
function nfOpenCenter(){
 const fresh=nfUnseen();nfMarkAll();
 const d=nfEnsureDialog(),body=d.querySelector('.smartDialogBody');
 body.innerHTML=fresh.length?`<div class="smartAlert ok"><b>✓ ${fresh.length} novedad${fresh.length===1?'':'es'} marcada${fresh.length===1?'':'s'} como vista${fresh.length===1?'':'s'}</b><small>Al abrir la campana se limpian también los globos de las secciones y el del icono de la app.</small></div>${fresh.map((x,i)=>`<button type="button" class="smartAlert" style="width:100%;text-align:left" data-nf-fresh="${i}"><b>${nfEsc(x.title)}</b><small>${nfEsc(x.sub)} · ${nfEsc(({shop:'Compras',packing:'Maleta',health:'Salud',plans:'Cumples y planes',routines:'Rutinas',sports:'Deporte',races:'Carreras',cal:'Calendarios',documents:'Documentación'})[x.section]||x.section)}</small></button>`).join('')}`:'<div class="smartAlert ok"><b>✓ No tienes novedades sin ver</b><small>Los avisos ya revisados no generan ningún globo.</small></div>';
 body.querySelectorAll('[data-nf-fresh]').forEach(b=>b.onclick=()=>{const x=fresh[Number(b.dataset.nfFresh)];d.close();nfGo(x.section)});
 if(!d.open)d.showModal();
}
function nfGo(view){if(typeof window.familySafeOpen==='function')window.familySafeOpen(view);else if(typeof show==='function')show(view)}
function nfHookBell(){const b=document.getElementById('notifyBtn');if(b)b.onclick=nfOpenCenter}

function nfWrapNavigation(){
 if(window.familySafeOpen&&!window.familySafeOpen.__nfWrapped){const old=window.familySafeOpen;const wrapped=function(v){const r=old(v);if(r!==false&&NF_SECTIONS.includes(v))setTimeout(()=>nfMarkSection(v),80);return r};wrapped.__nfWrapped=true;window.familySafeOpen=wrapped}
 if(window.show&&!window.show.__nfWrapped){const old=window.show;const wrapped=function(v){const r=old(v);if(r!==false&&NF_SECTIONS.includes(v))setTimeout(()=>nfMarkSection(v),80);return r};wrapped.__nfWrapped=true;window.show=wrapped}
}
function nfEventRecordById(id){return nfRecords().find(x=>x.key===`event:${id}`)}
function nfDetailHooks(){
 document.addEventListener('click',e=>{
  const ev=e.target.closest?.('[data-detail-event]');if(ev){const r=nfEventRecordById(ev.dataset.detailEvent);if(r)nfMarkRecord(r.section,r.key);return}
  const rr=e.target.closest?.('[data-detail-routine]');if(rr)nfMarkRecord('routines',`routine:${rr.dataset.detailRoutine}`);
 },true);
}
function nfObserve(){
 const dash=document.getElementById('homeDashboard'),bell=document.getElementById('notifyBadge');
 if(dash&&!dash.dataset.nfObserved){dash.dataset.nfObserved='1';new MutationObserver(()=>{if(!nfRendering)queueMicrotask(nfRender)}).observe(dash,{childList:true,subtree:true})}
 if(bell&&!bell.dataset.nfObserved2){bell.dataset.nfObserved2='1';new MutationObserver(()=>{if(!nfRendering)queueMicrotask(nfRender)}).observe(bell,{childList:true,subtree:true,attributes:true})}
}

async function nfRefresh(force=false){
 if(nfBusy)return;nfBusy=true;try{await nfFetchPacking(force);const justInit=nfInitializeIfNeeded();nfHookBell();nfWrapNavigation();nfObserve();if(justInit||localStorage.getItem(NF_INIT)==='1')nfRender()}finally{nfBusy=false}
}
const oldUpdate=typeof updateNotifyButton==='function'?updateNotifyButton:null;if(oldUpdate){updateNotifyButton=function(){oldUpdate();setTimeout(nfRender,0)}}
nfDetailHooks();
document.addEventListener('family-upcoming-rendered',()=>nfRefresh(false));
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')nfRefresh(true)});
window.addEventListener('focus',()=>nfRefresh(false));
setInterval(()=>nfRefresh(false),20000);
setTimeout(()=>nfRefresh(true),250);
})();
