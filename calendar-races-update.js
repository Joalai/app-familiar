(()=>{
  'use strict';

  const OPTIONAL_RACES=[
    {
      id:'candidate-ponle-freno-bilbao-2026',title:'Ponle Freno Bilbao 10K',
      event_date:'2026-09-20',start_time:'10:30',distance:'10 km',place:'Bilbao',finish:'Bilbao',
      optional:true,date_state:'confirmed',status_text:'Opcional',date_text:'20 septiembre 2026 · 10:30 · fecha confirmada',
      notes:'Edición de Bilbao 2026 confirmada. Participación de Igor todavía no confirmada.',
      source_url:'https://www.atresmedia.com/ponle-freno/carreras/2026/bilbao/reglamento-carrera-ponle-freno-bilbao-2026_202608266a8c17027b9bc81c9ed6e392.html',sort_date:'2026-09-20'
    },
    {
      id:'candidate-hiru-gurutzeak-2027',title:'Hiru Gurutzeak · Marcha de las 3 Cruces',
      event_date:null,start_time:null,distance:'85 km aprox.',place:'Galdakao',finish:'Galdakao',
      optional:true,date_state:'pending',status_text:'Opcional',date_text:'Próxima edición prevista en 2027 · fecha pendiente',
      notes:'Se celebra cada 2 años. La última edición fue en 2025, por lo que la siguiente corresponde a 2027; no se asigna un día hasta que lo publique la organización.',
      source_url:'https://www.gangurenmt.net/index.php?Itemid=36&id=85&lang=eu&option=com_content&view=article',sort_date:'2027-12-01',periodicity:'Bianual'
    },
    {
      id:'candidate-media-getxo-2027',title:'Media Maratón de Getxo',
      event_date:'2027-04-04',start_time:'09:00',distance:'21,097 km',place:'Getxo',finish:'Getxo',
      optional:true,date_state:'confirmed',status_text:'Opcional',date_text:'4 abril 2027 · 09:00 · fecha confirmada',
      notes:'IV edición. La fecha de 2027 ya está publicada; participación de Igor todavía no confirmada.',
      source_url:'https://www.bizkaia.eus/es/kirolbidepro/evento-detalle/-/asset_publisher/hAfe1q5ipej5/content/inscripcion-media-maraton-de-getxo-2027/880303',sort_date:'2027-04-04'
    },
    {
      id:'candidate-zazpi-trokak-2027',title:'Zazpi Trokak Galdakao',
      event_date:null,start_time:null,distance:'22–23 km / modalidad corta ~16 km',place:'Galdakao',finish:'Galdakao',
      optional:true,date_state:'pending',status_text:'Opcional',date_text:'Próxima edición esperable en 2027 · fecha pendiente',
      notes:'La prueba se ha celebrado de forma consecutiva en los últimos años. La edición 2027 aún no tiene fecha publicada, así que no se coloca en el calendario.',
      source_url:'https://www.gangurenmt.net/',sort_date:'2027-12-02'
    },
    {
      id:'candidate-vitoria-2027',title:'Vitoria-Gasteiz Maratón Martín Fiz',
      event_date:'2027-05-16',start_time:'08:30',distance:'42,195 km',place:'Mendizorroza, Vitoria-Gasteiz',finish:'Vitoria-Gasteiz',
      optional:true,date_state:'confirmed',status_text:'Opcional',date_text:'16 mayo 2027 · 08:30 · fecha confirmada',
      notes:'La organización ya publica la edición 2027. Participación de Igor todavía no confirmada.',
      source_url:'https://www.maratonmartinfiz.com/',sort_date:'2027-05-16'
    },
    {
      id:'candidate-mugarriz-mugarri-2028',title:'Mugarriz Mugarri',
      event_date:null,start_time:null,distance:'50 km aprox. / recorrido corto ~20–24 km',place:'Galdakao',finish:'Galdakao',
      optional:true,date_state:'pending',status_text:'Opcional',date_text:'Próxima edición prevista en 2028 · fecha pendiente',
      notes:'Se celebra cada 2 años. La XI edición fue el 23 de mayo de 2026, por lo que no corresponde una edición en 2027. No se inventa una fecha para 2028.',
      source_url:'https://www.gangurenmt.net/index.php?Itemid=61&id=86&lang=es-ES&option=com_content&view=article',sort_date:'2028-12-01',periodicity:'Bianual'
    },
    {
      id:'candidate-empresas-bilbao-2027',title:'Carrera de Empresas Bilbao',
      event_date:null,start_time:null,distance:'6 km aprox.',place:'Bilbao',finish:'Bilbao',
      optional:true,date_state:'pending',status_text:'Opcional',date_text:'Edición 2027 · fecha pendiente de publicación',
      notes:'La edición 2026 se celebró el 7 de junio. No se reutiliza esa fecha para 2027 hasta que la organización publique el nuevo reglamento.',
      source_url:'https://www.carrera-empresas.com/',sort_date:'2027-12-03'
    },
    {
      id:'candidate-hiri-krosa-2027',title:'Hiri Krosa Aste Nagusia',
      event_date:null,start_time:null,distance:'6 km aprox.',place:'Bilbao',finish:'Bilbao',
      optional:true,date_state:'pending',status_text:'Opcional',date_text:'Edición 2027 · fecha pendiente',
      notes:'La edición 2026 fue el 28 de agosto dentro de Aste Nagusia. Para 2027 se esperará al programa oficial antes de fijar día y hora.',
      source_url:'https://www.bilbokokonpartsak.eus/aste-nagusia/hiri-krosa?lang=es',sort_date:'2027-12-04'
    },
    {
      id:'candidate-milla-bakio-2027',title:'Milla Popular de Bakio',
      event_date:null,start_time:null,distance:'1.640 m categoría adultos',place:'Bakio',finish:'Bakio',
      optional:true,date_state:'pending',status_text:'Opcional',date_text:'Edición 2027 · fecha pendiente',
      notes:'En 2026 se celebró el 28 de agosto y la propia organización avisó de un cambio de fecha respecto a años anteriores. Por eso no se proyecta ese día a 2027.',
      source_url:'https://www.durangaldeagaur.eus/es/2026/08/13/se-ha-abierto-el-plazo-de-inscripcion-para-la-xvi-milla-popular-de-bakio/',sort_date:'2027-12-05'
    }
  ];

  function todayIso(){return iso(new Date())}
  function eventIsPast(x){
    if(!x.event_date)return false;
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
    const details=document.createElement('details');details.className='pastDrawer calendarPastDrawer';
    const summary=document.createElement('summary');summary.innerHTML=`Ver acontecimientos pasados <span>${pastEventRows.length+pastSchoolRows.length}</span>`;details.append(summary);
    const content=document.createElement('div');content.className='pastContent';details.append(content);
    if(pastEventRows.length){const title=document.createElement('div');title.className='calendarSectionTitle';title.textContent='EVENTOS Y PARTIDOS PASADOS';content.append(title);pastEventRows.forEach(x=>content.append(x))}
    if(pastSchoolRows.length){const title=document.createElement('div');title.className='calendarSectionTitle';title.textContent='IKASTOLA · PASADO';content.append(title);pastSchoolRows.forEach(x=>content.append(x))}
    body.append(details);
  };

  function baseRaceDate(x){
    const d=fmt(new Date(x.event_date+'T12:00:00'),{weekday:'long',day:'numeric',month:'long',year:'numeric'});
    return x.start_time?d+' · '+x.start_time.slice(0,5):d+' · horario por confirmar';
  }
  function sourceButton(x){return x.source_url?`<a class="miniBtn raceSource" href="${esc(x.source_url)}" target="_blank" rel="noopener">Web / fuente</a>`:'<span class="miniBtn" style="opacity:.55;text-align:center">Web pendiente</span>'}
  function standardRaceCard(x){
    return `<article class="raceCard"><div class="raceHead"><div class="name">🏃 ${esc(x.title)}</div><span class="raceStatus ${x.status}">${esc(x.status_text)}</span></div><div class="raceDate">${esc(baseRaceDate(x))}</div><div class="raceFacts"><div class="raceFact"><span>🏁</span><div><b>${esc(x.distance)}</b></div></div><div class="raceFact"><span>📍</span><div><b>Salida</b><br>${mapLink(x.place)}</div></div><div class="raceFact"><span>🏆</span><div><b>Meta</b><br>${esc(x.finish)}</div></div></div><div class="raceNote">${esc(x.notes)}</div><div class="raceActions"><a class="miniBtn" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(x.place)}" target="_blank" rel="noopener">Cómo llegar</a>${sourceButton(x)}<button type="button" class="miniBtn" data-race-google="${x.id}">Google Calendar</button><button type="button" class="miniBtn" data-race-apple="${x.id}">Apple Calendar</button></div></article>`;
  }
  function candidateCard(x){
    const dateBadge=x.date_state==='confirmed'?'<span style="font-size:9px;font-weight:900;color:#166534;background:#dcfce7;border-radius:999px;padding:4px 7px">FECHA CONFIRMADA</span>':'<span style="font-size:9px;font-weight:900;color:#92400e;background:#fef3c7;border-radius:999px;padding:4px 7px">FECHA PENDIENTE</span>';
    const cal=x.event_date?`<button type="button" class="miniBtn" data-candidate-google="${x.id}">Google Calendar</button><button type="button" class="miniBtn" data-candidate-apple="${x.id}">Apple Calendar</button>`:'<span class="miniBtn" style="opacity:.55;text-align:center">Calendario cuando haya fecha</span>';
    return `<article class="raceCard"><div class="raceHead"><div class="name">🏃 ${esc(x.title)}</div><span class="raceStatus estimated">${esc(x.status_text)}</span></div><div class="raceDate">${esc(x.date_text)}</div><div style="margin:6px 0">${dateBadge}${x.periodicity?` <span style="font-size:9px;font-weight:900;color:#475569;background:#e2e8f0;border-radius:999px;padding:4px 7px">${esc(x.periodicity.toUpperCase())}</span>`:''}</div><div class="raceFacts"><div class="raceFact"><span>🏁</span><div><b>${esc(x.distance)}</b></div></div><div class="raceFact"><span>📍</span><div><b>Salida</b><br>${mapLink(x.place)}</div></div><div class="raceFact"><span>🏆</span><div><b>Meta</b><br>${esc(x.finish)}</div></div></div><div class="raceNote">${esc(x.notes)}</div><div class="raceActions"><a class="miniBtn" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(x.place)}" target="_blank" rel="noopener">Cómo llegar</a>${sourceButton(x)}${cal}</div></article>`;
  }
  function candidateById(id){return OPTIONAL_RACES.find(x=>x.id===id)}
  function bindRaceButtonsV3(){
    document.querySelectorAll('[data-race-google]').forEach(b=>b.onclick=()=>window.open(googleCalendar(raceCalendarEvent(raceById(b.dataset.raceGoogle))),'_blank','noopener'));
    document.querySelectorAll('[data-race-apple]').forEach(b=>b.onclick=()=>downloadIcs(raceCalendarEvent(raceById(b.dataset.raceApple))));
    document.querySelectorAll('[data-candidate-google]').forEach(b=>b.onclick=()=>{const x=candidateById(b.dataset.candidateGoogle);if(x?.event_date)window.open(googleCalendar(raceCalendarEvent(x)),'_blank','noopener')});
    document.querySelectorAll('[data-candidate-apple]').forEach(b=>b.onclick=()=>{const x=candidateById(b.dataset.candidateApple);if(x?.event_date)downloadIcs(raceCalendarEvent(x))});
  }
  renderRaces=function(){
    const future=RACES.filter(x=>!eventIsPast(x)).sort((a,b)=>a.event_date.localeCompare(b.event_date));
    const past=RACES.filter(eventIsPast).sort((a,b)=>b.event_date.localeCompare(a.event_date));
    const candidates=[...OPTIONAL_RACES].sort((a,b)=>a.sort_date.localeCompare(b.sort_date));
    let html=future.length?future.map(standardRaceCard).join(''):'<div class="card pad">No hay carreras confirmadas próximas.</div>';
    if(candidates.length)html+=`<details class="pastDrawer" open><summary>Carreras opcionales · participación no confirmada<span>${candidates.length}</span></summary><div class="pastContent pastGrid">${candidates.map(candidateCard).join('')}</div></details>`;
    if(past.length)html+=`<details class="pastDrawer"><summary>Ver carreras pasadas<span>${past.length}</span></summary><div class="pastContent pastGrid">${past.map(standardRaceCard).join('')}</div></details>`;
    $('raceList').innerHTML=html;bindRaceButtonsV3();
  };

  renderRaces();
  rc();
})();
