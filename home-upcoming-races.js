(()=>{
'use strict';

function optionalRaces(){return Array.isArray(window.familyOptionalRaces)?window.familyOptionalRaces:[]}
function weekKey(ds){return iso(mon(new Date(ds+'T12:00:00')))}
function addDays(ds,n){const d=new Date(ds+'T12:00:00');d.setDate(d.getDate()+n);return iso(d)}
function approxDateBox(ds){const d=new Date(ds+'T12:00:00'),mo=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][d.getMonth()];return `<div class="date approx"><span>APROX.</span><b>~</b><small>${mo}</small></div>`}
function optionalHomeCard(x){
 const dateBox=x.event_date?db(x.event_date):approxDateBox(x.sort_date);
 return `<div class="ev homeOptionalRace">${dateBox}<div><strong>🏃 ${esc(x.title)} <span class="homeOptionalTag">☆ OPCIONAL</span></strong><em>${esc(x.date_text)}${x.place?' · '+mapLink(x.place):''}</em><div class="itemactions"><button type="button" class="miniBtn" data-home-open-races>Ver en Carreras</button></div></div></div>`;
}
function eventKey(x){return [x._school?'school':x._race?'race':'event',x.id||x.title,x._home_date||x.event_date].join('|')}
function schoolMarkers(n,normalEnd,exactWeeks){
 const out=[];
 (D.school_calendar||[]).forEach(x=>{
   if(x.end_date>=n&&x.start_date<=normalEnd){out.push({...x,event_date:x.start_date<n?n:x.start_date,_home_date:x.start_date<n?n:x.start_date,_school:true})}
   exactWeeks.forEach(w=>{
     const we=addDays(w,6);
     if(x.end_date<w||x.start_date>we)return;
     const d=x.start_date<w?w:x.start_date;
     if(d>=n)out.push({...x,event_date:d,_home_date:d,_school:true});
   });
 });
 return out;
}
function bindOptionalLinks(){document.querySelectorAll('[data-home-open-races]').forEach(b=>b.onclick=()=>{if(typeof window.familySafeOpen==='function')window.familySafeOpen('races');else if(typeof show==='function')show('races')})}

rh=function(){
 const n=iso(new Date()),limit=new Date();limit.setDate(limit.getDate()+60);const normalEnd=iso(limit);
 const opts=optionalRaces().filter(x=>(x.event_date||x.sort_date)>=n).sort((a,b)=>a.sort_date.localeCompare(b.sort_date));
 const exactWeeks=new Set(opts.filter(x=>x.event_date).map(x=>weekKey(x.event_date)));
 const inNormalOrRaceWeek=ds=>ds>=n&&(ds<=normalEnd||exactWeeks.has(weekKey(ds)));
 const standard=[];
 (D.events||[]).filter(x=>x.event_date&&inNormalOrRaceWeek(x.event_date)).forEach(x=>standard.push({...x,_home_date:x.event_date}));
 if(typeof raceEvents==='function')raceEvents().filter(x=>x.event_date&&inNormalOrRaceWeek(x.event_date)).forEach(x=>standard.push({...x,_home_date:x.event_date}));
 standard.push(...schoolMarkers(n,normalEnd,exactWeeks));
 const optional=opts.map(x=>({...x,_optional_home:true,_home_date:x.event_date||x.sort_date}));
 const seen=new Set(),all=[];
 [...standard,...optional].sort((a,b)=>a._home_date.localeCompare(b._home_date)||(a.start_time||'99').localeCompare(b.start_time||'99')).forEach(x=>{const k=x._optional_home?'optional|'+x.id:eventKey(x);if(seen.has(k))return;seen.add(k);all.push(x)});
 const g={};all.forEach(x=>{const k=weekKey(x._home_date);(g[k]??=[]).push(x)});
 $('coming').innerHTML=Object.entries(g).map(([k,x])=>{const d=new Date(k+'T12:00:00'),z=new Date(d);z.setDate(z.getDate()+6);const hasOptional=x.some(v=>v._optional_home),exactOptional=x.some(v=>v._optional_home&&v.event_date);const note=hasOptional?`<div class="ghead" style="background:#fffbeb;color:#92400e">${exactOptional?'☆ SEMANA CON CARRERA OPCIONAL · revisa posibles conflictos':'☆ REFERENCIA APROXIMADA · fecha de carrera pendiente'}</div>`:'';return `<div class="group"><div class="ghead">SEMANA · ${fmt(d)} – ${fmt(z)}</div>${note}<div class="cards">${x.map(v=>v._optional_home?optionalHomeCard(v):homeCard(v)).join('')}</div></div>`}).join('')||'<div class="card pad">Nada excepcional próximo.</div>';
 bindOptionalLinks();
}

if(typeof CODE!=='undefined'&&CODE)rh();
window.familyRefreshUpcoming=()=>rh();
})();
