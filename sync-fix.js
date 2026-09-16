(()=>{
'use strict';
if(window.familyLiveSyncLoaded)return;
window.familyLiveSyncLoaded=true;

const SYNC_MIN_MS=15000;
let syncAt=0,syncBusy=false,lastRemoteSig='';

function familySig(data){
  const d=data||{};
  const slim=(rows,fields)=>(Array.isArray(rows)?rows:[]).map(x=>fields.map(f=>x?.[f]??null));
  return JSON.stringify({
    events:slim(d.events,['id','updated_at','event_date','start_time','end_time','title','category','member_names','place','notes']),
    shopping:slim(d.shopping,['id','updated_at','is_done','item_name','category','detail']),
    recurring:slim(d.recurring,['id','updated_at','active','title','weekday','start_time','end_time','member_names','place','valid_from','valid_until']),
    school:slim(d.school_calendar,['id','updated_at','start_date','end_date','title','kind','extracurriculars_allowed']),
    vehicles:slim(d.vehicles,['id','updated_at','active','name','registration','notes']),
    vehicleRecords:slim(d.vehicle_records,['id','updated_at','vehicle_id','kind','record_date','next_date','reminder_date','title']),
    tasks:slim(d.tasks,['id','updated_at','title','due_date','assignees','is_done','notes'])
  });
}

function resetHiddenUpcomingFilter(){
  // "Lo que viene" es un resumen familiar. Un filtro de persona no debe
  // quedarse heredado de un uso anterior y ocultar acontecimientos sin avisar.
  try{localStorage.removeItem('family_upcoming_person')}catch(e){}
}

function refreshViews(){
  try{if(typeof renderAll==='function')renderAll()}catch(e){console.error('renderAll sync',e)}
  try{if(typeof window.familyRefreshUpcoming==='function')window.familyRefreshUpcoming()}catch(e){console.error('upcoming sync',e)}
  try{if(typeof window.familyHomeRefresh==='function')window.familyHomeRefresh()}catch(e){}
  try{if(typeof window.familyCarsRender==='function')window.familyCarsRender()}catch(e){}
  try{document.dispatchEvent(new CustomEvent('family-data-synced'))}catch(e){}
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
    lastRemoteSig=remoteSig;
    if(remoteSig!==localSig){
      D=fresh;
      refreshViews();
      return true;
    }
    return false;
  }catch(e){
    console.error('Sincronización familiar',e);
    return false;
  }finally{syncBusy=false}
}

window.familySyncNow=()=>syncFamilyData(true);

// Al arrancar, el resumen vuelve a ser familiar (Todos), no un filtro antiguo.
resetHiddenUpcomingFilter();
setTimeout(()=>{
  try{if(typeof window.familyRefreshUpcoming==='function')window.familyRefreshUpcoming()}catch(e){}
  syncFamilyData(true);
},250);

document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible'){
    resetHiddenUpcomingFilter();
    setTimeout(()=>syncFamilyData(true),60);
  }
});
window.addEventListener('focus',()=>setTimeout(()=>syncFamilyData(true),80));

document.addEventListener('click',e=>{
  if(e.target.closest?.('[data-home-open],#nav button[data-v]'))setTimeout(()=>syncFamilyData(true),0);
},true);

setInterval(()=>syncFamilyData(false),15000);
})();
