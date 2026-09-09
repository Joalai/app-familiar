(()=>{
'use strict';

const UPCOMING_RANGE_KEY='family_upcoming_range',UPCOMING_PERSON_KEY='family_upcoming_person';
const UP_PEOPLE=['Todos','Igor','Mirari','Joane','Laia','Alain'];

function optionalRaces(){return Array.isArray(window.familyOptionalRaces)?window.familyOptionalRaces:[]}
function weekKey(ds){return iso(mon(new Date(ds+'T12:00:00')))}
function addDays(ds,n){const d=new Date(ds+'T12:00:00');d.setDate(d.getDate()+n);return iso(d)}
function rangeValue(){const v=localStorage.getItem(UPCOMING_RANGE_KEY)||'60';return ['7','30','60','all'].includes(v)?v:'60'}
function personValue(){const v=localStorage.getItem(UPCOMING_PERSON_KEY)||'Todos';return UP_PEOPLE.includes(v)?v:'Todos'}
function approxDateBox(ds){const d=new Date(ds+'T12:00:00'),mo=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][d.getMonth()];return `<div class="date approx"><span>APROX.</span><b>~</b><small>${mo}</small></div>`}
function optionalHomeCard(x){
 const dateBox=x.event_date?db(x.event_date):approxDateBox(x.sort_date);
 return `<div class="ev homeOptionalRace" data-optional-race-id="${esc(x.id)}">${dateBox}<div><strong>🏃 ${esc(x.title)} <span class="homeOptionalTag">☆ OPCIONAL</span></strong><em>${esc(x.date_text)}${x.place?' · '+mapLink(x.place):''}</em><div class="itemactions"><button type="button" class="miniBtn" data-home-open-races>Ver en Carreras</button></div></div></div>`;
}
function eventKey(x){return [x._school?'school':x._race?'race':'event',x.id||x.title,x._home_date||x.event_date].join('|')}
function personMatches(x,person){
 if(person==='Todos')return true;
 if(x._optional_home||x._race)return person==='Igor';
 if(x._school)return ['Joane','Laia','Alain'].includes(person);
 const names=x.member_names||[];
 return names.includes(person)||names.includes('Familia');
}
function schoolMarkers(n,normalEnd,exactWeeks,person){
 if(!personMatches({_school:true},person))return [];
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
function latestRelevantDate(n){
 const dates=[addDays(n,365),...(D.events||[]).map(x=>x.event_date).filter(Boolean),...(D.school_calendar||[]).map(x=>x.end_date).filter(Boolean),...optionalRaces().map(x=>x.event_date||x.sort_date).filter(Boolean)];
 if(typeof raceEvents==='function')dates.push(...raceEvents().map(x=>x.event_date).filter(Boolean));
 return dates.sort().at(-1)||addDays(n,365);
}
function dailyCount(ds,person){
 const seen=new Set(),items=[];
 const add=(key,x)=>{if(!personMatches(x,person)||seen.has(key))return;seen.add(key);items.push(x)};
 (D.events||[]).filter(x=>x.event_date===ds).forEach(x=>add('e|'+x.id,x));
 if(typeof raceEvents==='function')raceEvents().filter(x=>x.event_date===ds).forEach(x=>add('r|'+x.id,{...x,_race:true}));
 optionalRaces().filter(x=>x.event_date===ds).forEach(x=>add('o|'+x.id,{...x,_optional_home:true}));
 try{rf(new Date(ds+'T12:00:00')).forEach(x=>add('rr|'+x.id,x))}catch(e){}
 try{const s=schoolMarker(new Date(ds+'T12:00:00'));if(s)add('s|'+s.title,{...s,_school:true})}catch(e){}
 return items.length;
}
function weekendRange(n){
 const d=new Date(n+'T12:00:00'),day=d.getDay();
 let delta=day===0?-1:day===6?0:6-day;
 const sat=new Date(d);sat.setDate(sat.getDate()+delta);
 return [iso(sat),addDays(iso(sat),1)];
}
function toolbar(n,person,range){
 const tomorrow=addDays(n,1),[sat,sun]=weekendRange(n),weekend=dailyCount(sat,person)+dailyCount(sun,person);
 return `<div class="upcomingControls"><div class="upQuick"><div><b>${dailyCount(n,person)}</b><span>HOY</span></div><div><b>${dailyCount(tomorrow,person)}</b><span>MAÑANA</span></div><div><b>${weekend}</b><span>FIN DE SEMANA</span></div></div><div class="upFilterLabel">Periodo</div><div class="upFilterRow">${[['7','7 días'],['30','30 días'],['60','60 días'],['all','Todo']].map(([v,t])=>`<button type="button" class="${range===v?'on':''}" data-up-range="${v}">${t}</button>`).join('')}</div><div class="upFilterLabel">Persona</div><div class="upFilterRow">${UP_PEOPLE.map(p=>`<button type="button" class="${person===p?'on':''}" data-up-person="${p}">${p}</button>`).join('')}</div><div class="upFilterHint">Las carreras opcionales de Igor se mantienen visibles aunque queden fuera del periodo, para poder comparar esa semana con el resto del calendario.</div></div>`;
}
function bindFilters(){
 document.querySelectorAll('[data-up-range]').forEach(b=>b.onclick=()=>{localStorage.setItem(UPCOMING_RANGE_KEY,b.dataset.upRange);rh()});
 document.querySelectorAll('[data-up-person]').forEach(b=>b.onclick=()=>{localStorage.setItem(UPCOMING_PERSON_KEY,b.dataset.upPerson);rh()});
}

const style=document.createElement('style');
style.textContent=`.upcomingControls{margin:0 0 12px}.upQuick{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px}.upQuick>div{background:#fff;border:1px solid var(--line);border-radius:12px;padding:9px;text-align:center}.upQuick b{display:block;font-size:20px}.upQuick span{display:block;font-size:9px;font-weight:900;color:var(--mut);margin-top:2px}.upFilterLabel{font-size:9px;font-weight:900;color:var(--mut);text-transform:uppercase;letter-spacing:.08em;margin:8px 0 5px}.upFilterRow{display:flex;gap:5px;overflow:auto;padding-bottom:2px}.upFilterRow button{border:1px solid var(--line);background:#fff;border-radius:999px;padding:7px 10px;font-weight:800;white-space:nowrap}.upFilterRow button.on{background:#0f172a;color:#fff;border-color:#0f172a}.upFilterHint{font-size:10px;line-height:1.35;color:var(--mut);margin-top:8px}.weekNow{background:#eff6ff!important;color:#1d4ed8!important}`;
document.head.appendChild(style);

rh=function(){
 const n=iso(new Date()),range=rangeValue(),person=personValue(),normalEnd=range==='all'?latestRelevantDate(n):addDays(n,Number(range));
 const opts=optionalRaces().filter(x=>(x.event_date||x.sort_date)>=n).filter(x=>personMatches({...x,_optional_home:true},person)).sort((a,b)=>a.sort_date.localeCompare(b.sort_date));
 const exactWeeks=new Set(opts.filter(x=>x.event_date).map(x=>weekKey(x.event_date)));
 const inNormalOrRaceWeek=ds=>ds>=n&&(ds<=normalEnd||exactWeeks.has(weekKey(ds)));
 const standard=[];
 (D.events||[]).filter(x=>x.event_date&&inNormalOrRaceWeek(x.event_date)&&personMatches(x,person)).forEach(x=>standard.push({...x,_home_date:x.event_date}));
 if(typeof raceEvents==='function')raceEvents().filter(x=>x.event_date&&inNormalOrRaceWeek(x.event_date)&&personMatches({...x,_race:true},person)).forEach(x=>standard.push({...x,_home_date:x.event_date}));
 standard.push(...schoolMarkers(n,normalEnd,exactWeeks,person));
 const optional=opts.map(x=>({...x,_optional_home:true,_home_date:x.event_date||x.sort_date}));
 const seen=new Set(),all=[];
 [...standard,...optional].sort((a,b)=>a._home_date.localeCompare(b._home_date)||(a.start_time||'99').localeCompare(b.start_time||'99')).forEach(x=>{const k=x._optional_home?'optional|'+x.id:eventKey(x);if(seen.has(k))return;seen.add(k);all.push(x)});
 const g={};all.forEach(x=>{const k=weekKey(x._home_date);(g[k]??=[]).push(x)});
 const thisWeek=weekKey(n);
 const groups=Object.entries(g).map(([k,x])=>{const d=new Date(k+'T12:00:00'),z=new Date(d);z.setDate(z.getDate()+6);const hasOptional=x.some(v=>v._optional_home),exactOptional=x.some(v=>v._optional_home&&v.event_date);const note=hasOptional?`<div class="ghead" style="background:#fffbeb;color:#92400e">${exactOptional?'☆ SEMANA CON CARRERA OPCIONAL · comprueba la carga de agenda':'☆ REFERENCIA APROXIMADA · fecha de carrera pendiente'}</div>`:'';return `<div class="group"><div class="ghead ${k===thisWeek?'weekNow':''}">SEMANA · ${fmt(d)} – ${fmt(z)}${k===thisWeek?' · ESTA SEMANA':''}</div>${note}<div class="cards">${x.map(v=>v._optional_home?optionalHomeCard(v):homeCard(v)).join('')}</div></div>`}).join('');
 $('coming').innerHTML=toolbar(n,person,range)+(groups||'<div class="card pad">Nada excepcional próximo.</div>');
 bindOptionalLinks();bindFilters();
 document.dispatchEvent(new CustomEvent('family-upcoming-rendered'));
}

if(typeof CODE!=='undefined'&&CODE)rh();
window.familyRefreshUpcoming=()=>rh();
})();
