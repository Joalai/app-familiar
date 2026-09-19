(()=>{
'use strict';
if(window.familyLiveSyncLoaded)return;
window.familyLiveSyncLoaded=true;

const SYNC_MIN_MS=15000;
let syncAt=0,syncBusy=false,pendingFresh=null;

function familySig(data){
  const d=data||{};
  const slim=(rows,fields)=>(Array.isArray(rows)?rows:[]).map(x=>fields.map(f=>x?.[f]??null));
  return JSON.stringify({
    events:slim(d.events,['id','updated_at','event_date','start_time','end_time','title','category','member_names','place','notes','source','source_ref']),
    shopping:slim(d.shopping,['id','updated_at','is_done','item_name','category','detail']),
    recurring:slim(d.recurring,['id','updated_at','active','title','weekday','start_time','end_time','member_names','place','valid_from','valid_until']),
    school:slim(d.school_calendar,['id','updated_at','start_date','end_date','title','kind','extracurriculars_allowed']),
    vehicles:slim(d.vehicles,['id','updated_at','active','name','registration','make','model','model_year','vin','current_mileage','notes']),
    vehicleRecords:slim(d.vehicle_records,['id','updated_at','vehicle_id','kind','record_date','next_date','reminder_date','title','provider','mileage','amount','appointment_time','place','notes']),
    tasks:slim(d.tasks,['id','updated_at','title','due_date','assignees','is_done','notes']),
    inbox:slim(d.inbox,['id','updated_at','text','status','destination','created_by'])
  });
}

function resetHiddenUpcomingFilter(){
  try{localStorage.removeItem('family_upcoming_person')}catch(e){}
}

function userIsEditing(){
  const a=document.activeElement;
  if(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)){
    const type=String(a.type||'').toLowerCase();
    if(!['button','submit','checkbox','radio'].includes(type))return true;
  }
  if(document.querySelector('#carEditDialog[open],#vehicleEditDialog[open]'))return true;
  return false;
}

function renderActiveView(){
  const v=document.querySelector('.view.on')?.id;
  try{
    if(v==='home'&&typeof rh==='function')rh();
    else if(v==='week'&&typeof rw==='function')rw();
    else if(v==='month'&&typeof rm==='function')rm();
    else if(v==='shop'&&typeof rshop==='function')rshop();
    else if(v==='plans'&&typeof rplans==='function')rplans();
    else if(v==='health'&&typeof rhealth==='function')rhealth();
    else if(v==='races'&&typeof renderRaces==='function')renderRaces();
    else if(v==='routines'&&typeof rroutines==='function')rroutines();
    else if(v==='sports'&&typeof rs==='function')rs();
    else if(v==='cal'&&typeof rc==='function')rc();
    else if(v==='cars'&&typeof window.familyCarsRender==='function')window.familyCarsRender();
    else if(v==='tasks'&&typeof window.familyTasksRender==='function')window.familyTasksRender();
  }catch(e){console.error('Render activo tras sincronizar',e)}
}

function refreshViews(){
  renderActiveView();
  try{if(typeof window.familyRefreshUpcoming==='function')window.familyRefreshUpcoming()}catch(e){console.error('upcoming sync',e)}
  try{if(typeof window.familyHomeRefresh==='function')window.familyHomeRefresh()}catch(e){}
  try{document.dispatchEvent(new CustomEvent('family-data-synced'))}catch(e){}
}

function applyFresh(fresh){
  D=fresh;
  pendingFresh=null;
  refreshViews();
}

function flushPending(){
  if(!pendingFresh||userIsEditing())return false;
  const fresh=pendingFresh;
  applyFresh(fresh);
  return true;
}

async function syncFamilyData(force=false){
  if(syncBusy||typeof CODE==='undefined'||!CODE||typeof rpc!=='function')return false;
  if(document.visibilityState==='hidden')return false;
  const now=Date.now();
  if(!force&&now-syncAt<SYNC_MIN_MS)return false;
  syncAt=now;syncBusy=true;
  try{
    const fresh=await rpc('family_get_data',{p_code:CODE});
    if(!fresh||typeof fresh!=='object')return false;
    const remoteSig=familySig(fresh),localSig=familySig(typeof D!=='undefined'?D:null);
    if(remoteSig===localSig){flushPending();return false}
    if(userIsEditing()){
      pendingFresh=fresh;
      return true;
    }
    applyFresh(fresh);
    return true;
  }catch(e){
    console.error('Sincronización familiar',e);
    return false;
  }finally{syncBusy=false}
}

window.familySyncNow=()=>syncFamilyData(true);
window.familyFlushPendingSync=flushPending;

resetHiddenUpcomingFilter();
setTimeout(()=>{
  try{if(typeof window.familyRefreshUpcoming==='function')window.familyRefreshUpcoming()}catch(e){}
  syncFamilyData(true);
},250);

document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible'){
    resetHiddenUpcomingFilter();
    setTimeout(()=>syncFamilyData(true),80);
  }
});
window.addEventListener('focus',()=>setTimeout(()=>syncFamilyData(true),120));
document.addEventListener('focusout',()=>setTimeout(flushPending,120),true);
document.addEventListener('close',()=>setTimeout(flushPending,80),true);
document.addEventListener('click',e=>{
  if(e.target.closest?.('[data-home-open],#nav button[data-v]'))setTimeout(()=>syncFamilyData(true),120);
},true);

setInterval(()=>syncFamilyData(false),SYNC_MIN_MS);
})();
