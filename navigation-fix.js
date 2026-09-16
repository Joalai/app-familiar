(()=>{
  'use strict';

  function activateView(v){
    const target=document.getElementById(v);
    if(!target)return false;
    document.querySelectorAll('.view').forEach(x=>x.classList.toggle('on',x.id===v));
    document.querySelectorAll('#nav button[data-v]').forEach(x=>x.classList.toggle('on',x.dataset.v===v));
    return true;
  }

  function renderView(v){
    try{
      if(v==='week'&&typeof rw==='function')rw();
      else if(v==='month'&&typeof rm==='function')rm();
      else if(v==='races'&&typeof renderRaces==='function')renderRaces();
      else if(v==='documents'&&typeof openDocuments==='function')openDocuments();
      else if(v==='routines'&&typeof rroutines==='function')rroutines();
      else if(v==='sports'&&typeof rs==='function')rs();
      else if(v==='cal'&&typeof rc==='function')rc();
      else if(v==='packing'&&typeof window.familyPackingLoad==='function')window.familyPackingLoad();
      else if(v==='tasks'&&typeof window.familyTasksOpen==='function')window.familyTasksOpen();
    }catch(err){
      console.error('Error al renderizar '+v,err);
    }
  }

  function safeOpen(v){
    const current=document.querySelector('.view.on')?.id;
    if(current==='documents'&&v!=='documents'){
      try{
        const dirty=(document.getElementById('docNumber')?.value||document.getElementById('docExpiry')?.value);
        if(dirty&&!confirm('Hay cambios de documentación sin guardar. ¿Salir igualmente?'))return false;
        if(typeof lockDocuments==='function')lockDocuments();
      }catch(e){}
    }
    if(v==='tasks'&&typeof window.familyTasksOpen==='function'){
      window.familyTasksOpen();
      return true;
    }
    if(!activateView(v))return false;
    renderView(v);
    try{window.scrollTo({top:0,left:0,behavior:'auto'})}catch(e){window.scrollTo(0,0)}
    return true;
  }

  try{window.show=safeOpen}catch(e){}

  document.addEventListener('click',e=>{
    const b=e.target.closest?.('#nav button[data-v]');
    if(!b||typeof b.onclick==='function')return;
    safeOpen(b.dataset.v);
  });

  window.familySafeOpen=safeOpen;

  // Respaldo de actualización: las mejoras nuevas se cargan aunque el HTML
  // antiguo siga en caché en un iPhone. Esperamos a DOMContentLoaded para no
  // duplicarlas cuando el service worker ya las haya inyectado.
  function loadFamilyUpgrades(){
    if(document.getElementById('cars'))return;
    const existing=[...document.scripts].some(s=>(s.src||'').includes('family-upgrades.js'));
    if(existing)return;
    const s=document.createElement('script');
    s.src='family-upgrades.js?v=2026.09.16.1';
    s.dataset.familyUpgrades='1';
    s.onload=()=>{
      if([...document.scripts].some(x=>(x.src||'').includes('family-upgrades-fix.js')))return;
      const f=document.createElement('script');
      f.src='family-upgrades-fix.js?v=2026.09.16.1';
      f.dataset.familyUpgradesFix='1';
      document.body.appendChild(f);
    };
    document.body.appendChild(s);
  }

  // Tareas debe cargarse también desde un archivo que ya forma parte del HTML
  // base. Así no dependemos de que el service worker haya podido inyectar el
  // módulo nuevo en una instalación antigua de iOS.
  function loadTasksModule(){
    try{
      if(!Object.getOwnPropertyDescriptor(window,'D')){
        Object.defineProperty(window,'D',{configurable:true,get:()=>D});
      }
    }catch(e){}
    if(window.familyTasksModuleLoaded)return;
    if([...document.scripts].some(s=>(s.src||'').includes('tasks.js')))return;
    const s=document.createElement('script');
    s.src='tasks.js?v=2026.09.16.1';
    s.dataset.familyTasks='1';
    document.body.appendChild(s);
  }

  // Sincronización entre móviles. La cargamos también desde navigation-fix,
  // que ya existe en instalaciones antiguas, para no depender solo del SW.
  function loadSyncModule(){
    if(window.familyLiveSyncLoaded)return;
    if([...document.scripts].some(s=>(s.src||'').includes('sync-fix.js')))return;
    const s=document.createElement('script');
    s.src='sync-fix.js?v=2026.09.16.1';
    s.dataset.familySync='1';
    document.body.appendChild(s);
  }

  function bootFallbacks(){
    setTimeout(loadFamilyUpgrades,0);
    setTimeout(loadTasksModule,60);
    setTimeout(loadSyncModule,120);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootFallbacks,{once:true});
  else bootFallbacks();

  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible'){
      setTimeout(loadTasksModule,50);
      setTimeout(loadSyncModule,90);
    }
  });
})();
