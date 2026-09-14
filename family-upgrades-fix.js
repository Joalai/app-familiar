(()=>{
'use strict';

const unsavedIds=['sn','sd','pn','pd','ph','pe','pp','pnotes','hn','hd','hh','he','hp','hnotes','rn','rst','ren','rfrom','runtil','rplace','docNumber','docExpiry'];
const carIds=['cvName','cvReg','cvNotes','crNext','crReminder','crTitle','crProvider','crMileage','crAmount','crNotes','carName','carReg','carNotes','carEditName','carEditReg','carEditNotes'];
hasUnsaved=()=>unsavedIds.some(id=>document.getElementById(id)?.value?.trim())||carIds.some(id=>document.getElementById(id)?.value?.trim())||Boolean(document.getElementById('carRecordDrawer')?.open&&document.getElementById('crDate')?.value);

const q=id=>document.getElementById(id);

function selectedVehicle(){
  const id=document.querySelector('#carsCards .carVehicleCard.on')?.dataset.pick;
  return (D?.vehicles||[]).find(v=>v.id===id)||(D?.vehicles||[])[0]||null;
}

function ensureCarEditUi(){
  const cards=q('carsCards');
  if(!cards)return;
  let tools=q('carVehicleEditTools');
  if(!tools){
    tools=document.createElement('div');
    tools.id='carVehicleEditTools';
    tools.style.cssText='display:flex;justify-content:flex-end;margin:-4px 0 12px';
    tools.innerHTML='<button type="button" class="miniBtn" id="carEditOpen">✏️ Editar coche</button>';
    cards.insertAdjacentElement('afterend',tools);

    const drawer=document.createElement('details');
    drawer.id='carEditDrawer';
    drawer.className='formDrawer';
    drawer.innerHTML=`<summary>Editar coche <span>Modificar o eliminar</span></summary>
      <div class="card pad">
        <div class="form">
          <div class="field"><label>Nombre</label><input id="carEditName" placeholder="Ej. Toyota, coche Igor…"></div>
          <div class="field"><label>Matrícula</label><input id="carEditReg"></div>
          <div class="field"><label>Notas</label><textarea id="carEditNotes"></textarea></div>
          <div class="formactions">
            <button id="carEditSave" class="primary" type="button">Guardar cambios</button>
            <button id="carEditCancel" class="secondary" type="button">Cancelar</button>
          </div>
          <button id="carDelete" class="secondary danger" type="button" style="margin-top:4px">Eliminar coche</button>
          <div id="carEditMsg" class="meta"></div>
        </div>
      </div>`;
    tools.insertAdjacentElement('afterend',drawer);

    q('carEditOpen').onclick=openCarEdit;
    q('carEditSave').onclick=saveCarEdit;
    q('carEditCancel').onclick=closeCarEdit;
    q('carDelete').onclick=deleteCar;
  }
  const v=selectedVehicle();
  tools.hidden=!v;
  const open=q('carEditOpen');
  const label=v?'✏️ Editar '+(v.name||'coche'):'✏️ Editar coche';
  if(open&&open.textContent!==label)open.textContent=label;
}

function openCarEdit(){
  const v=selectedVehicle();
  if(!v)return;
  const drawer=q('carEditDrawer');
  drawer.dataset.vehicleId=v.id;
  q('carEditName').value=v.name||'';
  q('carEditReg').value=v.registration||'';
  q('carEditNotes').value=v.notes||'';
  q('carEditMsg').textContent='';
  drawer.open=true;
  drawer.scrollIntoView({behavior:'smooth',block:'start'});
}

function closeCarEdit(){
  const drawer=q('carEditDrawer');
  if(drawer)drawer.open=false;
  if(q('carEditMsg'))q('carEditMsg').textContent='';
}

async function saveCarEdit(){
  const drawer=q('carEditDrawer'),msg=q('carEditMsg'),button=q('carEditSave');
  const id=drawer?.dataset.vehicleId,name=q('carEditName')?.value.trim();
  if(!id)return;
  if(!name){msg.textContent='Escribe un nombre para el coche.';return}
  button.disabled=true;
  msg.textContent='Guardando…';
  try{
    await rpc('family_update_vehicle',{
      p_code:CODE,
      p_id:id,
      p_name:name,
      p_registration:q('carEditReg').value.trim()||null,
      p_notes:q('carEditNotes').value.trim()||null
    });
    await load();
    if(typeof window.familyCarsRender==='function')window.familyCarsRender();
    drawer.open=false;
  }catch(e){
    console.error(e);
    msg.textContent='No se han podido guardar los cambios.';
  }finally{
    button.disabled=false;
    ensureCarEditUi();
  }
}

async function deleteCar(){
  const drawer=q('carEditDrawer'),id=drawer?.dataset.vehicleId;
  const v=(D?.vehicles||[]).find(x=>x.id===id);
  if(!v)return;
  if(!confirm(`¿Eliminar ${v.name||'este coche'}? También se borrará su historial de ITV, seguro y taller. Esta acción no se puede deshacer.`))return;
  const button=q('carDelete'),msg=q('carEditMsg');
  button.disabled=true;
  msg.textContent='Eliminando…';
  try{
    await rpc('family_delete_vehicle',{p_code:CODE,p_id:id});
    drawer.open=false;
    drawer.dataset.vehicleId='';
    await load();
    if(typeof window.familyCarsRender==='function')window.familyCarsRender();
  }catch(e){
    console.error(e);
    msg.textContent='No se ha podido eliminar el coche.';
  }finally{
    button.disabled=false;
    ensureCarEditUi();
  }
}

let scheduled=false;
function scheduleEnhance(){
  if(scheduled)return;
  scheduled=true;
  setTimeout(()=>{scheduled=false;ensureCarEditUi()},0);
}
new MutationObserver(scheduleEnhance).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('click',e=>{if(e.target.closest?.('#carsCards .carVehicleCard'))setTimeout(ensureCarEditUi,0)});
scheduleEnhance();
})();
