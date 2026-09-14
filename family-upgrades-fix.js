(()=>{
'use strict';
const unsavedIds=['sn','sd','pn','pd','ph','pe','pp','pnotes','hn','hd','hh','he','hp','hnotes','rn','rst','ren','rfrom','runtil','rplace','docNumber','docExpiry'];
const carIds=['cvName','cvReg','cvNotes','crNext','crReminder','crTitle','crProvider','crMileage','crAmount','crNotes'];
hasUnsaved=()=>unsavedIds.some(id=>document.getElementById(id)?.value?.trim())||carIds.some(id=>document.getElementById(id)?.value?.trim())||Boolean(document.getElementById('carRecordDrawer')?.open&&document.getElementById('crDate')?.value);
})();
