(()=>{
'use strict';

const unsavedIds=['sn','sd','pn','pd','ph','pe','pp','pnotes','hn','hd','hh','he','hp','hnotes','rn','rst','ren','rfrom','runtil','rplace','docNumber','docExpiry'];
const carIds=['cvName','cvReg','cvNotes','crNext','crReminder','crTitle','crProvider','crMileage','crAmount','crNotes','carName','carReg','carNotes','carEditName','carEditReg','carEditNotes'];
hasUnsaved=()=>unsavedIds.some(id=>document.getElementById(id)?.value?.trim())||carIds.some(id=>document.getElementById(id)?.value?.trim())||Boolean(document.getElementById('carRecordDrawer')?.open&&document.getElementById('crDate')?.value);

const q=id=>document.getElementById(id);
let lastSignature='';

function vehicles(){return Array.isArray(D?.vehicles)?D.vehicles:[]}
function records(){return Array.isArray(D?.vehicle_records)?D.vehicle_records:[]}
function dataSignature(){
  return JSON.stringify({v:vehicles().map(x=>[x.id,x.name,x.registration,x.notes,x.updated_at]),r:records().map(x=>[x.id,x.vehicle_id,x.kind,x.next_date,x.reminder_date,x.updated_at])});
}

function installStyles(){
  if(q('carEditFixStyles'))return;
  const style=document.createElement('style');
  style.id='carEditFixStyles';
  style.textContent=`
#cars .carVehicleShell{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:stretch}
#cars .carVehicleShell .carVehicleCard{width:100%;margin:0}
#cars .carInlineEdit{align-self:stretch;border:1px solid var(--line);background:#fff;border-radius:14px;padding:0 12px;font-weight:850;color:#2563eb;min-width:72px}
#cars .carInlineEdit:active{background:#eff6ff}
#cars #carEditDrawer{margin:0 0 12px}
@media(max-width:700px){#cars .carVehicleGrid{grid-template-columns:1fr!important}#cars .carVehicleShell{grid-template-columns:1fr auto}#cars .carInlineEdit{padding:0 14px;font-size:13px}}
`;
  document.head.appendChild(style);
}

function ensureEditDrawer(){
  const cards=q('carsCards');
  if(!cards)return null;
  let drawer=q('carEditDrawer');
  if(drawer)return drawer;
  drawer=document.createElement('details');
  drawer.id='carEditDrawer';
  drawer.className='formDrawer';
  drawer.innerHTML=`<summary>Editar coche <span>Modificar o eliminar</span></summary>
    <div class="card pad"><div class="form">
      <div class="field"><label>Nombre</label><input id="carEditName" placeholder="Ej. Volkswagen Golf"></div>
      <div class="field"><label>Matrícula</label><input id="carEditReg"></div>
      <div class="field"><label>Notas</label><textarea id="carEditNotes"></textarea></div>
      <div class="formactions"><button id="carEditSave" class="primary" type="button">Guardar cambios</button><button id="carEditCancel" class="secondary" type="button">Cancelar</button></div>
      <button id="carDelete" class="secondary danger" type="button">Eliminar coche</button>
      <div id="carEditMsg" class="meta"></div>
    </div></div>`;
  cards.insertAdjacentElement('afterend',drawer);
  q('carEditSave').onclick=saveVehicle;
  q('carEditCancel').onclick=()=>{drawer.open=false;q('carEditMsg').textContent=''};
  q('carDelete').onclick=deleteVehicle;
  return drawer;
}

function enhanceCards(){
  installStyles();
  const grid=q('carsCards');
  if(!grid)return;
  q('carVehicleEditTools')?.remove();
  const oldDrawer=q('carEditDrawer');
  if(oldDrawer && !oldDrawer.dataset.stable)oldDrawer.remove();
  const drawer=ensureEditDrawer();
  if(drawer)drawer.dataset.stable='1';

  [...grid.querySelectorAll('.carVehicleCard[data-pick]')].forEach(card=>{
    if(card.parentElement?.classList.contains('carVehicleShell'))return;
    const id=card.dataset.pick;
    const shell=document.createElement('div');
    shell.className='carVehicleShell';
    card.parentNode.insertBefore(shell,card);
    shell.appendChild(card);
    const edit=document.createElement('button');
    edit.type='button';
    edit.className='carInlineEdit';
    edit.dataset.editVehicle=id;
    edit.textContent='Editar';
    shell.appendChild(edit);
  });

  if(vehicles().length && !grid.querySelector('.carVehicleCard')){
    if(typeof window.familyCarsRender==='function'){
      window.familyCarsRender();
      setTimeout(enhanceCards,0);
      return;
    }
  }
}

function openVehicle(id){
  const v=vehicles().find(x=>x.id===id);
  const drawer=ensureEditDrawer();
  if(!v||!drawer)return;
  drawer.dataset.vehicleId=v.id;
  q('carEditName').value=v.name||'';
  q('carEditReg').value=v.registration||'';
  q('carEditNotes').value=v.notes||'';
  q('carEditMsg').textContent='';
  drawer.open=true;
  drawer.scrollIntoView({behavior:'smooth',block:'start'});
}

async function saveVehicle(){
  const drawer=q('carEditDrawer'),msg=q('carEditMsg'),button=q('carEditSave');
  const id=drawer?.dataset.vehicleId,name=q('carEditName')?.value.trim();
  if(!id)return;
  if(!name){msg.textContent='Escribe un nombre para el coche.';return}
  button.disabled=true;msg.textContent='Guardando…';
  try{
    await rpc('family_update_vehicle',{p_code:CODE,p_id:id,p_name:name,p_registration:q('carEditReg').value.trim()||null,p_notes:q('carEditNotes').value.trim()||null});
    await load();
    lastSignature='';
    if(typeof window.familyCarsRender==='function')window.familyCarsRender();
    drawer.open=false;
    setTimeout(enhanceCards,0);
  }catch(e){console.error(e);msg.textContent='No se han podido guardar los cambios.'}
  finally{button.disabled=false}
}

async function deleteVehicle(){
  const drawer=q('carEditDrawer'),id=drawer?.dataset.vehicleId,v=vehicles().find(x=>x.id===id);
  if(!v)return;
  if(!confirm(`¿Eliminar ${v.name||'este coche'}? También se borrará su historial de ITV, seguro y taller. Esta acción no se puede deshacer.`))return;
  const button=q('carDelete'),msg=q('carEditMsg');button.disabled=true;msg.textContent='Eliminando…';
  try{
    await rpc('family_delete_vehicle',{p_code:CODE,p_id:id});
    drawer.open=false;drawer.dataset.vehicleId='';
    await load();
    lastSignature='';
    if(typeof window.familyCarsRender==='function')window.familyCarsRender();
    setTimeout(enhanceCards,0);
  }catch(e){console.error(e);msg.textContent='No se ha podido eliminar el coche.'}
  finally{button.disabled=false}
}

function syncCars(force=false){
  const grid=q('carsCards');
  if(!grid)return;
  const sig=dataSignature();
  if(force||sig!==lastSignature){
    lastSignature=sig;
    if(typeof window.familyCarsRender==='function')window.familyCarsRender();
    setTimeout(enhanceCards,0);
  }else enhanceCards();
}

document.addEventListener('click',e=>{
  const edit=e.target.closest?.('[data-edit-vehicle]');
  if(edit){e.preventDefault();e.stopPropagation();openVehicle(edit.dataset.editVehicle);return}
  if(e.target.closest?.('#nav button[data-v="cars"]'))setTimeout(()=>syncCars(true),0);
  if(e.target.closest?.('#carsCards .carVehicleCard'))setTimeout(enhanceCards,0);
});

document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(()=>syncCars(true),100)});
setTimeout(()=>syncCars(true),150);
setInterval(()=>syncCars(false),1000);
})();
