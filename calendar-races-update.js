(()=>{
  'use strict';

  const OPTIONAL_RACES=[
    {id:'race-ponle-freno-bilbao-2026',title:'Ponle Freno Bilbao 10K',event_date:'2026-09-20',start_time:null,end_time:null,distance:'10 km aprox.',place:'Bilbao',finish:'Bilbao',status:'estimated',status_text:'Opcional · no confirmada',optional:true,notes:'Carrera que figuraba en la lista personal. Fecha orientativa para 2026; participación y datos definitivos pendientes de confirmar.',source_url:''},
    {id:'race-tres-cruces-2026',title:'Marcha de las 3 Cruces',event_date:'2026-09-27',start_time:null,end_time:null,distance:'Distancia por confirmar',place:'Bizkaia',finish:'Bizkaia',status:'estimated',status_text:'Opcional · no confirmada',optional:true,notes:'Prueba que figuraba en la lista personal. Fecha orientativa; recorrido y participación pendientes de confirmar.',source_url:''},
    {id:'race-media-getxo-2027',title:'Media Maratón de Getxo',event_date:'2027-04-11',start_time:null,end_time:null,distance:'21,1 km aprox.',place:'Getxo',finish:'Getxo',status:'estimated',status_text:'Opcional · no confirmada',optional:true,notes:'Prueba que figuraba en la lista personal para abril. Fecha concreta de 2027 todavía pendiente de confirmar.',source_url:''},
    {id:'race-zazpi-trokak-2027',title:'Zazpi Trokak Galdakao',event_date:'2027-04-18',start_time:null,end_time:null,distance:'Distancia por confirmar',place:'Galdakao',finish:'Galdakao',status:'estimated',status_text:'Opcional · no confirmada',optional:true,notes:'Prueba local incluida como opción para abril de 2027. Fecha, distancia y horario pendientes de confirmar.',source_url:''},
    {id:'race-maraton-vitoria-2027',title:'Maratón de Vitoria',event_date:'2027-05-09',start_time:null,end_time:null,distance:'42,195 km',place:'Vitoria-Gasteiz',finish:'Vitoria-Gasteiz',status:'estimated',status_text:'Opcional · no confirmada',optional:true,notes:'Figuraba en la lista personal como opción de mayo. Fecha de 2027 y participación pendientes de confirmar.',source_url:''},
    {id:'race-mugarriz-mugarri-2027',title:'Mugarriz Mugarri',event_date:'2027-05-23',start_time:null,end_time:null,distance:'Distancia por confirmar',place:'Bizkaia',finish:'Bizkaia',status:'estimated',status_text:'Opcional · no confirmada',optional:true,notes:'Incluida como opción para mayo de 2027. Fecha, recorrido y horario pendientes de confirmar.',source_url:''},
    {id:'race-empresas-2027',title:'Carrera de Empresas',event_date:'2027-06-06',start_time:null,end_time:null,distance:'Distancia por confirmar',place:'Bilbao',finish:'Bilbao',status:'estimated',status_text:'Opcional · no confirmada',optional:true,notes:'Incluida como opción para junio de 2027. Fecha concreta, recorrido y horario pendientes de confirmar.',source_url:''},
    {id:'race-hiri-krosa-aste-nagusia-2027',title:'Hiri Krosa Aste Nagusia',event_date:'2027-08-22',start_time:null,end_time:null,distance:'Distancia por confirmar',place:'Bilbao',finish:'Bilbao',status:'estimated',status_text:'Opcional · no confirmada',optional:true,notes:'Incluida como opción para agosto de 2027. Fecha concreta y datos de la edición pendientes de confirmar.',source_url:''},
    {id:'race-milla-bakio-2027',title:'Milla de Bakio',event_date:'2027-08-28',start_time:null,end_time:null,distance:'1 milla',place:'Bakio',finish:'Bakio',status:'estimated',status_text:'Opcional · no confirmada',optional:true,notes:'Incluida como opción para agosto de 2027. Fecha concreta y participación pendientes de confirmar.',source_url:''}
  ];

  OPTIONAL_RACES.forEach(r=>{if(!RACES.some(x=>x.id===r.id))RACES.push(r)});

  function todayIso(){return iso(new Date())}
  function eventIsPast(x){
    const today=todayIso();
    if(x.event_date<today)return true;
    if(x.event_date>today)return false;
    const now=new Date(),clock=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
    const end=(x.end_time||x.start_time||'').slice(0,5);
    return end?end<clock:false;
  }

  const baseRc=rc;
  rc=function(){
    baseRc();
    const body=$('cbody');
    if(!body)return;
    const pastEventRows=[],pastSchoolRows=[];

    const eventSection=[...body.querySelectorAll('.calendarSection')].find(s=>s.querySelector('.calendarSectionTitle')?.textContent.trim()==='EVENTOS Y PARTIDOS');
    if(eventSection){
      [...eventSection.querySelectorAll('.item[data-detail-event]')].forEach(row=>{
        const x=eventById(row.dataset.detailEvent);
        if(x&&eventIsPast(x)){pastEventRows.push(row);row.remove()}
      });
      if(!eventSection.querySelector('.item'))eventSection.remove();
    }

    const schoolSection=[...body.querySelectorAll('.calendarSection')].find(s=>s.querySelector('.calendarSectionTitle')?.textContent.trim()==='IKASTOLA');
    if(schoolSection){
      const schoolRows=[...schoolSection.querySelectorAll('.item')];
      const schoolData=[...(D.school_calendar||[])].sort((a,b)=>a.start_date.localeCompare(b.start_date));
      schoolRows.forEach((row,i)=>{
        const x=schoolData[i];
        if(x&&x.end_date<todayIso()){pastSchoolRows.push(row);row.remove()}
      });
      if(!schoolSection.querySelector('.item'))schoolSection.remove();
    }

    if(!pastEventRows.length&&!pastSchoolRows.length)return;
    const details=document.createElement('details');
    details.className='pastDrawer calendarPastDrawer';
    const summary=document.createElement('summary');
    const total=pastEventRows.length+pastSchoolRows.length;
    summary.innerHTML=`Ver acontecimientos pasados <span>${total}</span>`;
    details.append(summary);
    const content=document.createElement('div');content.className='pastContent';details.append(content);
    if(pastEventRows.length){const title=document.createElement('div');title.className='calendarSectionTitle';title.textContent='EVENTOS Y PARTIDOS PASADOS';content.append(title);pastEventRows.forEach(x=>content.append(x))}
    if(pastSchoolRows.length){const title=document.createElement('div');title.className='calendarSectionTitle';title.textContent='IKASTOLA · PASADO';content.append(title);pastSchoolRows.forEach(x=>content.append(x))}
    body.append(details);
  };

  function raceDisplayDate(x){
    const d=fmt(new Date(x.event_date+'T12:00:00'),{weekday:'long',day:'numeric',month:'long',year:'numeric'});
    return x.start_time?d+' · '+x.start_time.slice(0,5):d+' · horario por confirmar';
  }
  function raceCardV2(x){
    const source=x.source_url?`<a class="miniBtn raceSource" href="${esc(x.source_url)}" target="_blank" rel="noopener">Web oficial</a>`:'<span class="miniBtn" style="opacity:.55;text-align:center">Web pendiente</span>';
    return `<article class="raceCard"><div class="raceHead"><div class="name">🏃 ${esc(x.title)}</div><span class="raceStatus ${x.status}">${esc(x.status_text)}</span></div><div class="raceDate">${esc(raceDisplayDate(x))}</div><div class="raceFacts"><div class="raceFact"><span>🏁</span><div><b>${esc(x.distance)}</b></div></div><div class="raceFact"><span>📍</span><div><b>Salida</b><br>${mapLink(x.place)}</div></div><div class="raceFact"><span>🏆</span><div><b>Meta</b><br>${esc(x.finish)}</div></div></div><div class="raceNote">${esc(x.notes)}</div><div class="raceActions"><a class="miniBtn" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(x.place)}" target="_blank" rel="noopener">Cómo llegar</a>${source}<button type="button" class="miniBtn" data-race-google="${x.id}">Google Calendar</button><button type="button" class="miniBtn" data-race-apple="${x.id}">Apple Calendar</button></div></article>`;
  }
  function bindRaceButtonsV2(){
    document.querySelectorAll('[data-race-google]').forEach(b=>b.onclick=()=>window.open(googleCalendar(raceCalendarEvent(raceById(b.dataset.raceGoogle))),'_blank','noopener'));
    document.querySelectorAll('[data-race-apple]').forEach(b=>b.onclick=()=>downloadIcs(raceCalendarEvent(raceById(b.dataset.raceApple))));
  }
  renderRaces=function(){
    const future=RACES.filter(x=>!eventIsPast(x)).sort((a,b)=>a.event_date.localeCompare(b.event_date));
    const past=RACES.filter(eventIsPast).sort((a,b)=>b.event_date.localeCompare(a.event_date));
    const confirmed=future.filter(x=>!x.optional),optional=future.filter(x=>x.optional);
    let html='';
    if(confirmed.length)html+=confirmed.map(raceCardV2).join('');
    else html+='<div class="card pad">No hay carreras confirmadas próximas.</div>';
    if(optional.length)html+=`<details class="pastDrawer" open><summary>Carreras opcionales · no confirmadas<span>${optional.length}</span></summary><div class="pastContent pastGrid">${optional.map(raceCardV2).join('')}</div></details>`;
    if(past.length)html+=`<details class="pastDrawer"><summary>Ver carreras pasadas<span>${past.length}</span></summary><div class="pastContent pastGrid">${past.map(raceCardV2).join('')}</div></details>`;
    $('raceList').innerHTML=html;bindRaceButtonsV2();
  };

  renderRaces();
  rc();
})();
