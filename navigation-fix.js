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
})();
