(()=>{
  'use strict';

  const FILTER_KEY='family_calendar_filters_v2';
  const FILTERS=[
    ['Ikastola','🏫'],['Joane','🟣'],['Laia','🟢'],['Alain','🟠'],['Igor','🔵'],['Mirari','🩷'],
    ['Athletic','⚽'],['Bilbao Basket','🏀'],['Sestao River','⚽'],['Carreras','🏃'],['Otros deportes','🏅']
  ];
  const ALL_FILTERS=FILTERS.map(x=>x[0]);
  const SPORT_FILTERS=['Athletic','Bilbao Basket','Sestao River','Carreras','Otros deportes'];
  let selectedFilters=[];
  try{selectedFilters=JSON.parse(localStorage.getItem(FILTER_KEY)||'[]')}catch(e){selectedFilters=[]}
  if(!Array.isArray(selectedFilters))selectedFilters=[];
  selectedFilters=selectedFilters.filter(x=>ALL_FILTERS.includes(x));

  const style=document.createElement('style');
  style.textContent=`
    .pastDrawer{margin-top:12px;border-top:1px solid var(--line);padding-top:10px}
    .pastDrawer>summary{cursor:pointer;list-style:none;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:#f8fafc;font-weight:850;color:#475569}
    .pastDrawer>summary::-webkit-details-marker{display:none}.pastDrawer>summary::after{content:'⌄';font-size:18px}.pastDrawer[open]>summary::after{content:'⌃'}
    .pastDrawer .pastContent{padding-top:8px}.pastDrawer .item{opacity:.82}.pastDrawer .raceCard{opacity:.82}
    #cal .calendarFilterHead{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:9px}
    #cal .calendarFilterHead .hint{max-width:650px}#cal #ctabs{gap:7px;margin-bottom:12px}
    #cal #ctabs button{display:flex;align-items:center;justify-content:center;gap:4px;padding:8px 11px;transition:.15s}
    #cal #ctabs button.on{outline:0;border-color:#2563eb;background:#eff6ff;color:#1d4ed8;box-shadow:inset 0 0 0 1px #2563eb}
    #cal #ctabs button.groupFilter{font-weight:900}#cal #ctabs button.groupFilter.on{background:#fff7ed;color:#9a3412;border-color:#fb923c;box-shadow:inset 0 0 0 1px #fb923c}
    #cal .calendarSummary{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 12px}#cal .calendarSummary span{font-size:10px;font-weight:850;background:#f1f5f9;border-radius:999px;padding:5px 8px}
    #cal .calendarSection{margin-bottom:18px}#cal .calendarSectionTitle{font-size:13px;font-weight:900;margin:3px 0 7px;color:#475569}
    #cal .calendarCombined{border-left:4px solid #94a3b8;padding-left:8px}#cal .calendarSource{font-size:9px;font-weight:850;color:#64748b;background:#f1f5f9;padding:4px 6px;border-radius:999px;white-space:nowrap}
    #cal .calendarWeekday{width:34px;height:34px;display:grid;place-items:center;border-radius:10px;background:#f1f5f9;font-weight:900}
    #races .pastDrawer{grid-column:1/-1;border-top:0;padding-top:0;margin-top:2px}#races .pastDrawer .pastContent{padding-top:10px}#races .pastGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px}
    @media(max-width:700px){#cal .calendarFilterHead{display:block}#cal #ctabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}#cal #ctabs button{padding:10px 7px}#cal .calendarCombined{grid-template-columns:auto 1fr}#cal .calendarSource{grid-column:2;justify-self:start}}
  `;
  document.head.appendChild(style);

  function nowParts(){const d=new Date();return{day:iso(d),time:String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')}}
  function isPastEvent(x){const n=nowParts();if(x.event_date<n.day)return true;if(x.event_date>n.day)return false;const end=(x.end_time||x.start_time||'').slice(0,5);return end?end<n.time:false}
  function splitPast(rows){const upcoming=[],past=[];rows.forEach(x=>(isPastEvent(x)?past:upcoming).push(x));upcoming.sort((a,b)=>a.event_date.localeCompare(b.event_date)||(a.start_time||'99').localeCompare(b.start_time||'99'));past.sort((a,b)=>b.event_date.localeCompare(a.event_date)||(b.start_time||'').localeCompare(a.start_time||''));return{upcoming,past}}
  function pastDrawer(label,count,html){return count?`<details class="pastDrawer"><summary>${esc(label)}<span>${count}</span></summary><div class="pastContent">${html}</div></details>`:''}

  function planRow(x){return `<div class="item" data-detail-event="${x.id}"><div>${db(x.event_date)}</div><div><div class="name">${esc(displayTitle(x))}</div><div class="meta">${x.start_time?x.start_time.slice(0,5):'Hora pendiente'}${x.end_time?'–'+x.end_time.slice(0,5):''} · ${esc((x.member_names||[]).join(', '))}${x.place?' · '+mapLink(x.place):''}${author(x)}</div></div>${eventButtons(x,'plan')}</div>`}
  function healthRow(x){return `<div class="item health" data-detail-event="${x.id}"><div>${db(x.event_date)}</div><div><div class="name">${esc(displayTitle(x))}</div><div class="meta">${x.start_time?x.start_time.slice(0,5):'Hora pendiente'}${x.end_time?'–'+x.end_time.slice(0,5):''} · ${esc((x.member_names||[]).join(', '))}${x.place?' · '+mapLink(x.place):''}${author(x)}</div></div>${eventButtons(x,'health')}</div>`}

  rplans=function(){
    const rows=D.events.filter(e=>e.source==='family'&&!isHealth(e)),parts=splitPast(rows);
    $('plist').innerHTML=(parts.upcoming.length?parts.upcoming.map(planRow).join(''):'<div class="meta">No hay próximos planes.</div>')+pastDrawer('Ver planes y cumples pasados',parts.past.length,parts.past.map(planRow).join(''));
    bindEventButtons('plan');
  };

  rhealth=function(){
    const parts=splitPast(D.events.filter(isHealth));
    $('hlist').innerHTML=(parts.upcoming.length?parts.upcoming.map(healthRow).join(''):'<div class="meta">No hay próximas citas.</div>')+pastDrawer('Ver citas pasadas',parts.past.length,parts.past.map(healthRow).join(''));
    bindEventButtons('health');
  };

  function raceCard(x){
    return `<article class="raceCard"><div class="raceHead"><div class="name">🏃 ${esc(x.title)}</div><span class="raceStatus ${x.status}">${esc(x.status_text)}</span></div><div class="raceDate">${esc(raceDateText(x))}</div><div class="raceFacts"><div class="raceFact"><span>🏁</span><div><b>${esc(x.distance)}</b></div></div><div class="raceFact"><span>📍</span><div><b>Salida</b><br>${mapLink(x.place)}</div></div><div class="raceFact"><span>🏆</span><div><b>Meta</b><br>${esc(x.finish)}</div></div></div><div class="raceNote">${esc(x.notes)}</div><div class="raceActions"><a class="miniBtn" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(x.place)}" target="_blank" rel="noopener">Cómo llegar</a><a class="miniBtn raceSource" href="${esc(x.source_url)}" target="_blank" rel="noopener">Web oficial</a><button type="button" class="miniBtn" data-race-google="${x.id}">Google Calendar</button><button type="button" class="miniBtn" data-race-apple="${x.id}">Apple Calendar</button></div></article>`;
  }
  function bindRaceButtons(){
    document.querySelectorAll('[data-race-google]').forEach(b=>b.onclick=()=>window.open(googleCalendar(raceCalendarEvent(raceById(b.dataset.raceGoogle))),'_blank','noopener'));
    document.querySelectorAll('[data-race-apple]').forEach(b=>b.onclick=()=>downloadIcs(raceCalendarEvent(raceById(b.dataset.raceApple))));
  }
  renderRaces=function(){
    const parts=splitPast([...RACES]);
    let html=parts.upcoming.length?parts.upcoming.map(raceCard).join(''):'<div class="card pad">No hay carreras próximas cargadas.</div>';
    if(parts.past.length)html+=`<details class="pastDrawer"><summary>Ver carreras pasadas<span>${parts.past.length}</span></summary><div class="pastContent pastGrid">${parts.past.map(raceCard).join('')}</div></details>`;
    $('raceList').innerHTML=html;bindRaceButtons();
  };

  function saveFilters(){localStorage.setItem(FILTER_KEY,JSON.stringify(selectedFilters))}
  function filterOn(x){return selectedFilters.includes(x)}
  function setFilters(next){selectedFilters=[...new Set(next)].filter(x=>ALL_FILTERS.includes(x));saveFilters();rc()}
  function toggleFilter(x){setFilters(filterOn(x)?selectedFilters.filter(v=>v!==x):[...selectedFilters,x])}
  function toggleGroup(group){const complete=group.every(filterOn);setFilters(complete?selectedFilters.filter(x=>!group.includes(x)):[...selectedFilters,...group])}
  function addUnique(map,key,value){if(!map.has(key))map.set(key,value)}
  function eventMeta(x){const people=(x.member_names||[]).join(', '),parts=[];parts.push(x.start_time?x.start_time.slice(0,5)+(x.end_time?'–'+x.end_time.slice(0,5):''):'Hora pendiente');if(people)parts.push(esc(people));if(x.place)parts.push(mapLink(x.place));return parts.join(' · ')}
  function calendarEventRow(x){return `<div class="item calendarCombined ${ce(x)}" data-detail-event="${esc(x.id)}"><div>${db(x.event_date)}</div><div><div class="name">${esc(displayTitle(x))}</div><div class="meta">${eventMeta(x)}</div></div><span class="calendarSource">${esc(isRace(x)?'Carreras':x.source_ref||x.category||'Familia')}</span></div>`}
  function calendarSchoolRow(x){const same=x.start_date===x.end_date,range=same?fmt(new Date(x.start_date+'T12:00:00'),{weekday:'long',day:'numeric',month:'long'}):fmt(new Date(x.start_date+'T12:00:00'),{day:'numeric',month:'short'})+' – '+fmt(new Date(x.end_date+'T12:00:00'),{day:'numeric',month:'short'});return `<div class="item ${schoolClass(x)}"><div>${db(x.start_date)}</div><div><div class="name">🏫 ${esc(x.title)}</div><div class="meta">${range}${x.extracurriculars_allowed&&x.no_class?' · Sí hay extraescolares':x.no_class?' · No hay extraescolares':' · Hay clase'}</div></div><span class="calendarSource">Ikastola</span></div>`}
  function calendarRoutineRow(x){const people=(x.member_names||[]).join(', ');return `<div class="item calendarCombined ${memberClass(x.member_names)}" data-detail-routine="${esc(x.id)}"><div class="calendarWeekday">${['','L','M','X','J','V','S','D'][x.weekday]}</div><div><div class="name">${esc(displayTitle(x))}</div><div class="meta">${['','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'][x.weekday]} · ${x.start_time.slice(0,5)}–${x.end_time.slice(0,5)}${people?' · '+esc(people):''}${x.place?' · '+mapLink(x.place):''}</div></div><span class="calendarSource">Rutina</span></div>`}

  rc=function(){
    const tabs=$('ctabs'),body=$('cbody'),allOn=ALL_FILTERS.every(filterOn),sportsOn=SPORT_FILTERS.every(filterOn);
    tabs.innerHTML=`<button type="button" class="groupFilter ${allOn?'on':''}" data-cal-group="all">✓ Todos</button><button type="button" class="groupFilter ${sportsOn?'on':''}" data-cal-group="sports">🏅 Deportes</button>`+FILTERS.map(([name,icon])=>`<button type="button" class="${filterOn(name)?'on':''}" data-cal-filter="${esc(name)}">${icon} ${esc(name)}</button>`).join('');
    tabs.querySelector('[data-cal-group="all"]').onclick=()=>toggleGroup(ALL_FILTERS);
    tabs.querySelector('[data-cal-group="sports"]').onclick=()=>toggleGroup(SPORT_FILTERS);
    tabs.querySelectorAll('[data-cal-filter]').forEach(b=>b.onclick=()=>toggleFilter(b.dataset.calFilter));

    if(!selectedFilters.length){body.innerHTML='<div class="calendarFilterHead"><div><div class="title" style="font-size:18px;margin-bottom:4px">Combina calendarios</div><div class="hint">Selecciona uno o varios a la vez. <b>Deportes</b> activa de una vez equipos, carreras y otros eventos deportivos.</div></div></div><div class="meta">No hay ningún calendario seleccionado.</div>';return}

    const events=new Map(),routines=new Map(),schools=new Map();
    if(filterOn('Ikastola'))(D.school_calendar||[]).forEach(x=>addUnique(schools,x.id||x.start_date+'|'+x.title,x));
    const people=['Joane','Laia','Alain','Igor','Mirari'].filter(filterOn);
    if(people.length){
      (D.recurring||[]).filter(x=>(x.member_names||[]).some(n=>people.includes(n))).forEach(x=>addUnique(routines,x.id,x));
      (D.events||[]).filter(x=>(x.member_names||[]).some(n=>people.includes(n))).forEach(x=>addUnique(events,x.id,x));
    }
    ['Athletic','Bilbao Basket','Sestao River'].filter(filterOn).forEach(team=>(D.events||[]).filter(x=>x.source_ref===team).forEach(x=>addUnique(events,x.id,x)));
    if(filterOn('Carreras'))raceEvents().forEach(x=>addUnique(events,x.id,x));
    if(filterOn('Otros deportes'))(D.events||[]).filter(x=>String(x.category||'').toLowerCase()==='sport'&&!['Athletic','Bilbao Basket','Sestao River'].includes(x.source_ref)).forEach(x=>addUnique(events,x.id,x));

    const eventList=[...events.values()].sort((a,b)=>a.event_date.localeCompare(b.event_date)||(a.start_time||'99').localeCompare(b.start_time||'99'));
    const schoolList=[...schools.values()].sort((a,b)=>a.start_date.localeCompare(b.start_date));
    const routineList=[...routines.values()].sort((a,b)=>a.weekday-b.weekday||(a.start_time||'').localeCompare(b.start_time||''));
    let html=`<div class="calendarFilterHead"><div><div class="title" style="font-size:18px;margin-bottom:4px">Calendarios combinados</div><div class="hint">Activa y desactiva tantos como quieras.</div></div></div><div class="calendarSummary">${selectedFilters.map(x=>`<span>${esc(x)}</span>`).join('')}</div>`;
    if(eventList.length)html+=`<section class="calendarSection"><div class="calendarSectionTitle">EVENTOS Y PARTIDOS</div>${eventList.map(calendarEventRow).join('')}</section>`;
    if(schoolList.length)html+=`<section class="calendarSection"><div class="calendarSectionTitle">IKASTOLA</div>${schoolList.map(calendarSchoolRow).join('')}</section>`;
    if(routineList.length)html+=`<section class="calendarSection"><div class="calendarSectionTitle">RUTINAS</div>${routineList.map(calendarRoutineRow).join('')}</section>`;
    if(!eventList.length&&!schoolList.length&&!routineList.length)html+='<div class="meta">No hay elementos en los calendarios seleccionados.</div>';
    body.innerHTML=html;
  };

  C='';
  rplans();rhealth();renderRaces();rc();
})();
