(()=>{
'use strict';
if(window.familyStabilityCoreLoaded)return;
window.familyStabilityCoreLoaded=true;

const STORAGE_KEY='family_recent_client_errors';
const seen=new Map();

function activeSection(){
  return document.querySelector('.view.on')?.id||'unknown';
}

function normalizeError(value){
  if(value instanceof Error)return {message:value.message||value.name||'Error',stack:value.stack||''};
  if(value&&typeof value==='object'){
    const message=String(value.message||value.error_description||value.name||'Error');
    let stack='';
    try{stack=value.stack||JSON.stringify(value)}catch(e){}
    return {message,stack};
  }
  return {message:String(value||'Unknown client error'),stack:''};
}

function remember(record){
  try{
    const rows=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');
    rows.push(record);
    localStorage.setItem(STORAGE_KEY,JSON.stringify(rows.slice(-20)));
  }catch(e){}
}

function send(record){
  try{
    if(typeof CODE==='undefined'||!CODE||typeof SUPA==='undefined'||typeof KEY==='undefined')return;
    fetch(SUPA+'/rest/v1/rpc/family_log_client_error',{
      method:'POST',
      headers:{'Content-Type':'application/json','apikey':KEY},
      body:JSON.stringify({
        p_code:CODE,
        p_version:typeof APP_VERSION==='undefined'?'':APP_VERSION,
        p_section:record.section,
        p_message:record.message,
        p_stack:record.stack||null,
        p_user_agent:navigator.userAgent||null
      })
    }).catch(()=>{});
  }catch(e){}
}

function report(value,extra=''){
  const x=normalizeError(value);
  if(!x.message||/aborterror|cancelled|canceled|cancelado/i.test(x.message))return;
  const section=activeSection();
  const stack=[x.stack,extra].filter(Boolean).join('\n').slice(0,5000);
  const key=section+'|'+x.message+'|'+stack.slice(0,180);
  const now=Date.now(),last=seen.get(key)||0;
  if(now-last<60000)return;
  seen.set(key,now);
  const record={at:new Date().toISOString(),section,message:x.message.slice(0,1000),stack};
  remember(record);
  send(record);
}

window.addEventListener('error',event=>{
  const extra=event.filename?(event.filename+':'+(event.lineno||0)+':'+(event.colno||0)):'';
  report(event.error||event.message,extra);
});

window.addEventListener('unhandledrejection',event=>report(event.reason));

window.familyReportError=(value,context='')=>report(value,context);
window.familyDiagnostics=()=>{
  let errors=[];
  try{errors=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]')}catch(e){}
  return {
    version:typeof APP_VERSION==='undefined'?null:APP_VERSION,
    section:activeSection(),
    online:navigator.onLine,
    recentErrors:errors.slice(-10)
  };
};
})();
