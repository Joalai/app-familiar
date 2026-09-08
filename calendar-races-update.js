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
      id:'candidate-media-getxo-2027',title:'Media Maratón de Getxo',
      event_date:'2027-04-04',start_time:'09:00',distance:'21,097 km',place:'Getxo',finish:'Getxo',
      optional:true,date_state:'confirmed',status_text:'Opcional',date_text:'4 abril 2027 · 09:00 · fecha confirmada',
      notes:'IV edición. La fecha de 2027 ya está publicada; participación de Igor todavía no confirmada.',
      source_url:'https://www.bizkaia.eus/es/kirolbidepro/evento-detalle/-/asset_publisher/hAfe1q5ipej5/content/inscripcion-media-maraton-de-getxo-2027/880303',sort_date:'2027-04-04'
    },
    {
      id:'candidate-zazpi-trokak-2027',title:'Zazpi Trokak Galdakao',
      event_date:null,start_time:null,distance:'22–23 km / modalidad corta ~16 km',place:'Galdakao',finish:'Galdakao',
      optional:true,date_state:'pending',status_text:'Opcional',date_text:'Abril 2027 · día pendiente de publicación',
      notes:'Las ediciones recientes se han celebrado en abril (2025 y 2026). Se usa abril solo para situarla mentalmente; no hay día de 2027 confirmado.',
      source_url:'https://www.gangurenmt.net/',sort_date:'2027-04-15',sort_is_approx:true
    },
    {
      id:'candidate-vitoria-2027',title:'Vitoria-Gasteiz Maratón Martín Fiz',
      event_date:'2027-05-16',start_time:'08:30',distance:'42,195 km',place:'Mendizorroza, Vitoria-Gasteiz',finish:'Vitoria-Gasteiz',
      optional:true,date_state:'confirmed',status_text:'Opcional',date_text:'16 mayo 2027 · 08:30 · fecha confirmada',
      notes:'La organización ya publica la edición 2027. Participación de Igor todavía no confirmada.',
      source_url:'https://www.maratonmartinfiz.com/',sort_date:'2027-05-16'
    },
    {
      id:'candidate-empresas-bilbao-2027',title:'Carrera de Empresas Bilbao',
      event_date:null,start_time:null,distance:'6 km aprox.',place:'Bilbao',finish:'Bilbao',
      optional:true,date_state:'pending',status_text:'Opcional',date_text:'Junio 2027 · día pendiente de publicación',
      notes:'La edición 2026 se celebró el 7 de junio. Junio se usa únicamente como referencia de colocación hasta que se publique la edición 2027.',
      source_url:'https://www.carrera-empresas.com/',sort_date:'2027-06-15',sort_is_approx:true
    },
    {
      id:'candidate-hiri-krosa-2027',title:'Hiri Krosa Aste Nagusia',
      event_date:null,start_time:null,distance:'6 km aprox.',place:'Bilbao',finish:'Bilbao',
      optional:true,date_state:'pending',status_text:'Opcional',date_text:'Agosto 2027 · Aste Nagusia · día pendiente',
      notes:'Es una prueba de Aste Nagusia. Se coloca en agosto para visualizarla en la temporada, pero el día de 2027 todavía no está publicado.',
      source_url:'https://www.bilbokokonpartsak.eus/aste-nagusia/hiri-krosa?lang=es',sort_date:'2027-08-25',sort_is_approx:true
    },
    {
      id:'candidate-milla-bakio-2027',title:'Milla Popular de Bakio',
      event_date:null,start_time:null,distance:'1.640 m categoría adultos',place:'Bakio',finish:'Bakio',
      optional:true,date_state:'pending',status_text:'Opcional',date_text:'Agosto 2027 · día pendiente de publicación',
      notes:'En 2026 se celebró el 28 de agosto y la organización avisó de un cambio de fecha respecto a otros años. Agosto se usa solo como referencia; no se proyecta el día 28 a 2027.',
      source_url:'https://www.durangaldeagaur.eus/es/2026/08/13/se-ha-abierto-el-plazo-de-inscripcion-para-la-xvi-milla-popular-de-bakio/',sort_date:'2027-08-28',sort_is_approx:true
    },
    {
      id:'candidate-hiru-gurutzeak-2027',title:'Hiru Gurutzeak · Marcha de las 3 Cruces',
      event_date:null,start_time:null,distance:'80–85 km aprox.',place:'Galdakao',finish:'Galdakao',
      optional:true,date_state:'pending',status_text:'Opcional',date_text:'Septiembre 2027 · edición bianual · día pendiente',
      notes:'Se celebra cada 2 años. Las ediciones 2023 y 2025 fueron a finales de septiembre; se coloca en septiembre de 2027 como referencia, sin asignar un día hasta que lo publique la organización.',
      source_url:'https://www.gangurenmt.net/index.php?Itemid=36&id=85&lang=eu&option=com_content&view=article',sort_date:'2027-09-30',sort_is_approx:true,periodicity:'Bianual'
    },
    {
      id:'candidate-mugarriz-mugarri-2028',title:'Mugarriz Mugarri',
      event_date:null,start_time:null,distance:'50 km aprox. / recorrido corto ~20–24 km',place:'Galdakao',finish:'Galdakao',
      optional:true,date_state:'pending',status_text:'Opcional',date_text:'2028 · edición bianual · fecha pendiente',
      notes:'Se celebra cada 2 años. La XI edición fue el 23 de mayo de 2026, por lo que no corresponde una edición en 2027. La siguiente se sitúa en 2028 sin inventar día ni mes definitivo.',
      source_url:'https://www.gangurenmt.net/index.php?Itemid=61&id=86&lang=es-ES&option=com_content&view=article',sort_date:'2028-05-31',sort_is_approx:true,periodicity:'Bianual'
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
        const x=eventById(row.dataset.detailEvent)||(typeof raceEvents==='function'?raceEvents().find(e=>String(e.id)===String(row.dataset.detailEvent)):null);
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

  const raceStyle=document.createElement('style');
  raceStyle.textContent=`.raceCard.raceOptional{border:2px solid #f59e0b;background:#fffbeb}.raceOptional .raceHead{align-items:center}.optionalFlag{display:inline-flex;align-items:center;gap:4px;background:#f59e0b;color:#fff;border-radius:999px;padding:5px 8px;font-size:10px;font-weight:950;letter-spacing:.04em}.datePendingFlag{display:inline-block;font-size:9px;font-weight:900;color:#92400e;background:#fef3c7;border-radius:999px;padding:4px 7px}.dateConfirmedFlag{display:inline-block;font-size:9px;font-weight:900;color:#166534;background:#dcfce7;border-radius:999px;padding:4px 7px}.raceChronologyHint{margin:0 0 10px;padding:9px 11px;border:1px solid #fde68a;background:#fffbeb;border-radius:11px;font-size:11px;color:#78350f}`;
  document.head.appendChild(raceStyle);

  function baseRaceDate(x){
    const d=fmt(new Date(x.event_date+'T12:00:00'),{weekday:'long',day:'numeric',month:'long',year:'numeric'});
    return x.start_time?d+' · '+x.start_time.slice(0,5):d+' · horario por confirmar';
  }
  function sourceButton(x){return x.source_url?`<a class="miniBtn raceSource" href="${esc(x.source_url)}" target="_blank" rel="noopener">Web / fuente</a>`:'<span class="miniBtn" style="opacity:.55;text-align:center">Web pendiente</span>'}
  function standardRaceCard(x){
    return `<article class="raceCard"><div class="raceHead"><div class="name">🏃 ${esc(x.title)}</div><span class="raceStatus ${x.status}">${esc(x.status_text)}</span></div><div class="raceDate">${esc(baseRaceDate(x))}</div><div class="raceFacts"><div class="raceFact"><span>🏁</span><div><b>${esc(x.distance)}</b></div></div><div class="raceFact"><span>📍</span><div><b>Salida</b><br>${mapLink(x.place)}</div></div><div class="raceFact"><span>🏆</span><div><b>Meta</b><br>${esc(x.finish)}</div></div></div><div class="raceNote">${esc(x.notes)}</div><div class="raceActions"><a class="miniBtn" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(x.place)}" target="_blank" rel="noopener">Cómo llegar</a>${sourceButton(x)}<button type="button" class="miniBtn" data-race-google="${x.id}">Google Calendar</button><button type="button" class="miniBtn" data-race-apple="${x.id}">Apple Calendar</button></div></article>`;
  }
  function candidateCard(x){
    const dateBadge=x.date_state==='confirmed'?'<span class="dateConfirmedFlag">FECHA CONFIRMADA</span>':'<span class="datePendingFlag">FECHA PENDIENTE</span>';
    const cal=x.event_date?`<button type="button" class="miniBtn" data-candidate-google="${x.id}">Google Calendar</button><button type="button" class="miniBtn" data-candidate-apple="${x.id}">Apple Calendar</button>`:'<span class="miniBtn" style="opacity:.55;text-align:center">Calendario cuando haya fecha</span>';
    return `<article class="raceCard raceOptional"><div class="raceHead"><div class="name">🏃 ${esc(x.title)}</div><span class="optionalFlag">☆ OPCIONAL</span></div><div class="raceDate">${esc(x.date_text)}</div><div style="margin:6px 0">${dateBadge}${x.periodicity?` <span style="font-size:9px;font-weight:900;color:#475569;background:#e2e8f0;border-radius:999px;padding:4px 7px">${esc(x.periodicity.toUpperCase())}</span>`:''}</div><div class="raceFacts"><div class="raceFact"><span>🏁</span><div><b>${esc(x.distance)}</b></div></div><div class="raceFact"><span>📍</span><div><b>Salida</b><br>${mapLink(x.place)}</div></div><div class="raceFact"><span>🏆</span><div><b>Meta</b><br>${esc(x.finish)}</div></div></div><div class="raceNote">${esc(x.notes)}</div><div class="raceActions"><a class="miniBtn" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(x.place)}" target="_blank" rel="noopener">Cómo llegar</a>${sourceButton(x)}${cal}</div></article>`;
  }
  function candidateById(id){return OPTIONAL_RACES.find(x=>x.id===id)}
  function bindRaceButtonsV4(){
    document.querySelectorAll('[data-race-google]').forEach(b=>b.onclick=()=>window.open(googleCalendar(raceCalendarEvent(raceById(b.dataset.raceGoogle))),'_blank','noopener'));
    document.querySelectorAll('[data-race-apple]').forEach(b=>b.onclick=()=>downloadIcs(raceCalendarEvent(raceById(b.dataset.raceApple))));
    document.querySelectorAll('[data-candidate-google]').forEach(b=>b.onclick=()=>{const x=candidateById(b.dataset.candidateGoogle);if(x?.event_date)window.open(googleCalendar(raceCalendarEvent(x)),'_blank','noopener')});
    document.querySelectorAll('[data-candidate-apple]').forEach(b=>b.onclick=()=>{const x=candidateById(b.dataset.candidateApple);if(x?.event_date)downloadIcs(raceCalendarEvent(x))});
  }
  renderRaces=function(){
    const future=RACES.filter(x=>!eventIsPast(x));
    const past=RACES.filter(eventIsPast).sort((a,b)=>b.event_date.localeCompare(a.event_date));
    const chronology=[...future.map(x=>({kind:'normal',sort_date:x.event_date,item:x})),...OPTIONAL_RACES.map(x=>({kind:'optional',sort_date:x.sort_date,item:x}))].sort((a,b)=>a.sort_date.localeCompare(b.sort_date));
    let html='<div class="raceChronologyHint">Las pruebas están ordenadas cronológicamente. Las tarjetas amarillas con <b>☆ OPCIONAL</b> son posibilidades, no compromisos de participación. Cuando el día no está publicado, la posición en el año es orientativa.</div>';
    html+=chronology.length?chronology.map(x=>x.kind==='optional'?candidateCard(x.item):standardRaceCard(x.item)).join(''):'<div class="card pad">No hay carreras próximas.</div>';
    if(past.length)html+=`<details class="pastDrawer"><summary>Ver carreras pasadas<span>${past.length}</span></summary><div class="pastContent pastGrid">${past.map(standardRaceCard).join('')}</div></details>`;
    $('raceList').innerHTML=html;bindRaceButtonsV4();
  };

  renderRaces();
  rc();
})();
