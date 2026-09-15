(()=>{
'use strict';
if(window.familyTasksModuleLoaded)return;
window.familyTasksModuleLoaded=true;

const $t=id=>document.getElementById(id);
const safe=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
let editId=null,lastSig='';

function tasks(){return Array.isArray(window.D?.tasks)?D.tasks:[]}
function assigneesFromValue(v){if(v==='Igor')return['Igor'];if(v==='Mirari')return['Mirari'];if(v==='both')return['Igor','Mirari'];return[]}
function assigneeValue(a){a=Array.isArray(a)?a:[];if(a.includes('Igor')&&a.includes('Mirari'))return'both';if(a.includes('Igor'))return'Igor';if(a.includes('Mirari'))return'Mirari';return''}
function assigneeText(a){a=Array.isArray(a)?a:[];if(a.includes('Igor')&&a.includes('Mirari'))return'Igor y Mirari';return a[0]||'Sin asignar'}
function dateText(s){if(!s)return'Sin fecha límite';try{return new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'short'}).format(new Date(s+'T12:00:00'))}catch(e){return s}}
function dueState(s){
 if(!s)return{cls:'nodue',text:'Sin fecha límite'};
 const a=new Date();a.setHours(12,0,0,0);const b=new Date(s+'T12:00:00');const d=Math.round((b-a)/86400000);
 if(d<0)return{cls:'overdue',text:`Vencida hace ${Math.abs(d)} día${Math.abs(d)===1?'':'s'}`};
 if(d===0)return{cls:'today',text:'Vence hoy'};
 if(d===1)return{cls:'soon',text:'Vence mañana'};
 if(d<=7)return{cls:'soon',text:`En ${d} días`};
 return{cls:'normal',text:dateText(s)};
}
function sortOpen(a,b){
 if(a.due_date&&!b.due_date)return-1;if(!a.due_date&&b.due_date)return 1;
 if(a.due_date&&b.due_date&&a.due_date!==b.due_date)return a.due_date.localeCompare(b.due_date);
 return String(a.created_at||'').localeCompare(String(b.created_at||''));
}
function goHome(){
 try{if(typeof window.familySafeOpen==='function'){window.familySafeOpen('home');return}if(typeof show==='function'){show('home');return}}catch(e){}
 document.querySelector('#nav button[data-v="home"]')?.click();
}

function styles(){if($t('tasksStyles'))return;const st=document.createElement('style');st.id='tasksStyles';st.textContent=`
#tasks .taskTop{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}
#tasks .taskHome{border:1px solid var(--line);background:#fff;border-radius:10px;padding:8px 11px;font-weight:850;color:#2563eb}
#tasks .taskCard{display:grid;grid-template-columns:38px 1fr;gap:10px;padding:12px 0;border-bottom:1px solid var(--line)}
#tasks .taskCard:last-child{border-bottom:0}.taskCheck{width:34px;height:34px;border:2px solid #cbd5e1;background:#fff;border-radius:11px;font-size:18px;font-weight:900;color:#16a34a}
.taskTitle{font-size:16px;font-weight:900;line-height:1.2}.taskMeta{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px}.taskBadge{display:inline-flex;align-items:center;min-height:28px;padding:5px 8px;border-radius:9px;font-size:12px;font-weight:900;background:#f1f5f9;color:#475569}.taskBadge.overdue{background:#fee2e2;color:#b91c1c}.taskBadge.today{background:#ffedd5;color:#c2410c}.taskBadge.soon{background:#fef3c7;color:#92400e}.taskWho{background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe}.taskWho.unassigned{background:#f8fafc;color:#64748b;border-color:#e2e8f0}.taskNotes{font-size:12px;color:var(--mut);margin-top:6px;line-height:1.35}.taskActions{display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin-top:8px}.taskAssign{width:auto;min-width:125px;padding:7px 9px;font-size:13px;font-weight:800}.taskEdit{border:1px solid var(--line);background:#fff;border-radius:8px;padding:7px 10px;font-weight:800;color:#2563eb}.taskListCard{margin-bottom:10px}.taskAddDrawer>summary,.taskDoneDrawer>summary{padding:12px 14px}.taskDoneCard{opacity:.72}.taskDoneCard .taskTitle{text-decoration:line-through}.taskEmpty{padding:12px 0;color:var(--mut)}
@media(max-width:700px){#tasks .taskHome{font-size:12px;padding:7px 9px}.taskTitle{font-size:17px}.taskBadge{font-size:13px}.taskActions{align-items:stretch}.taskAssign{flex:1}.taskEdit{min-width:72px}}
`;document.head.appendChild(st)}

function makeSection(){
 if($t('tasks'))return;
 styles();
 const s=document.createElement('section');s.id='tasks';s.className='view';
 s.innerHTML=`<div class="taskTop"><div><div class="ey">Pendientes con fecha límite</div><div class="title">✅ Tareas</div></div><button type="button" class="taskHome" id="taskHome">← Inicio</button></div>
 <div class="card pad taskListCard"><div class="title" style="font-size:18px">Pendientes</div><div id="taskList"></div></div>
 <details class="formDrawer taskAddDrawer" id="taskFormDrawer"><summary>Añadir tarea <span>＋ Nueva tarea</span></summary><div class="card pad"><div class="form" data-dirty-form>
  <div class="field"><label>Tarea</label><input id="taskTitle" placeholder="Ej. Cambiar las lámparas de la habitación"></div>
  <div class="field"><label>Fecha límite (opcional)</label><input id="taskDue" type="date"></div>
  <div class="field"><label>Responsable</label><select id="taskAssignee"><option value="">Sin asignar</option><option value="Igor">Igor</option><option value="Mirari">Mirari</option><option value="both">Igor y Mirari</option></select></div>
  <div class="field"><label>Notas / pasos</label><textarea id="taskNotes" placeholder="Ej. Ir a elegirlas, coordinar instalación…"></textarea></div>
  <div class="formactions"><button type="button" id="taskSave" class="primary">Guardar tarea</button><button type="button" id="taskCancel" class="secondary">Cancelar</button></div>
  <button type="button" id="taskDelete" class="secondary danger" hidden>Eliminar tarea</button><div id="taskMsg" class="meta"></div>
 </div></div></details>
 <details class="formDrawer taskDoneDrawer" id="taskDoneDrawer" style="margin-top:10px"><summary>Terminadas <span id="taskDoneCount">0</span></summary><div class="card pad"><div id="taskDoneList"></div></div></details>`;
 const plans=$t('plans');if(plans)plans.parentNode.insertBefore(s,plans);else document.querySelector('main')?.appendChild(s);
 $t('taskHome').onclick=goHome;$t('taskSave').onclick=saveTask;$t('taskCancel').onclick=resetForm;$t('taskDelete').onclick=deleteTask;
 let nav=document.querySelector('#nav button[data-v="tasks"]');
 if(!nav){nav=document.createElement('button');nav.type='button';nav.dataset.v='tasks';nav.textContent='Tareas';const before=document.querySelector('#nav button[data-v="plans"]');before?before.parentNode.insertBefore(nav,before):$t('nav')?.appendChild(nav)}
 nav.onclick=()=>openTasks();
}

function openTasks(){
 makeSection();
 document.querySelectorAll('.view').forEach(x=>x.classList.toggle('on',x.id==='tasks'));
 document.querySelectorAll('#nav button[data-v]').forEach(x=>x.classList.toggle('on',x.dataset.v==='tasks'));
 render();try{window.scrollTo({top:0,behavior:'auto'})}catch(e){window.scrollTo(0,0)}
}

function taskRow(x,done=false){
 const due=dueState(x.due_date),who=assigneeText(x.assignees),whoClass=(x.assignees||[]).length?'':' unassigned';
 return `<div class="taskCard ${done?'taskDoneCard':''}" data-task="${safe(x.id)}"><button type="button" class="taskCheck" data-task-done="${safe(x.id)}" data-done="${done?'0':'1'}">${done?'↩':'✓'}</button><div><div class="taskTitle">${safe(x.title)}</div><div class="taskMeta"><span class="taskBadge ${due.cls}">📅 ${safe(due.text)}</span><span class="taskBadge taskWho${whoClass}">👤 ${safe(who)}</span></div>${x.notes?`<div class="taskNotes">${safe(x.notes)}</div>`:''}<div class="taskActions"><select class="taskAssign" data-task-assign="${safe(x.id)}"><option value="" ${assigneeValue(x.assignees)===''?'selected':''}>Sin asignar</option><option value="Igor" ${assigneeValue(x.assignees)==='Igor'?'selected':''}>Igor</option><option value="Mirari" ${assigneeValue(x.assignees)==='Mirari'?'selected':''}>Mirari</option><option value="both" ${assigneeValue(x.assignees)==='both'?'selected':''}>Igor y Mirari</option></select><button type="button" class="taskEdit" data-task-edit="${safe(x.id)}">Editar</button></div></div></div>`;
}

function bind(){
 document.querySelectorAll('[data-task-done]').forEach(b=>b.onclick=()=>setDone(b.dataset.taskDone,b.dataset.done==='1'));
 document.querySelectorAll('[data-task-edit]').forEach(b=>b.onclick=()=>editTask(b.dataset.taskEdit));
 document.querySelectorAll('[data-task-assign]').forEach(s=>s.onchange=()=>assignTask(s.dataset.taskAssign,s.value));
}
function render(){
 makeSection();const open=tasks().filter(x=>!x.is_done).sort(sortOpen),done=tasks().filter(x=>x.is_done).sort((a,b)=>String(b.completed_at||b.updated_at||'').localeCompare(String(a.completed_at||a.updated_at||'')));
 $t('taskList').innerHTML=open.length?open.map(x=>taskRow(x,false)).join(''):'<div class="taskEmpty">No hay tareas pendientes.</div>';
 $t('taskDoneList').innerHTML=done.length?done.map(x=>taskRow(x,true)).join(''):'<div class="taskEmpty">Todavía no hay tareas terminadas.</div>';
 $t('taskDoneCount').textContent=String(done.length);bind();
}

function resetForm(){editId=null;$t('taskTitle').value='';$t('taskDue').value='';$t('taskAssignee').value='';$t('taskNotes').value='';$t('taskSave').textContent='Guardar tarea';$t('taskDelete').hidden=true;$t('taskMsg').textContent='';$t('taskFormDrawer').open=false}
function editTask(id){const x=tasks().find(t=>t.id===id);if(!x)return;editId=id;$t('taskTitle').value=x.title||'';$t('taskDue').value=x.due_date||'';$t('taskAssignee').value=assigneeValue(x.assignees);$t('taskNotes').value=x.notes||'';$t('taskSave').textContent='Guardar cambios';$t('taskDelete').hidden=false;$t('taskMsg').textContent='';$t('taskFormDrawer').open=true;$t('taskFormDrawer').scrollIntoView({behavior:'smooth',block:'nearest'})}
async function saveTask(){
 const b=$t('taskSave'),msg=$t('taskMsg'),title=$t('taskTitle').value.trim();if(!title){msg.textContent='Escribe la tarea.';return}
 b.disabled=true;msg.textContent='Guardando…';try{
  const args={p_code:CODE,p_title:title,p_due_date:$t('taskDue').value||null,p_assignees:assigneesFromValue($t('taskAssignee').value),p_notes:$t('taskNotes').value.trim()||null};
  if(editId)await rpc('family_update_task',{...args,p_id:editId});else{const creator=typeof needUser==='function'?needUser():null;if(!creator){msg.textContent='Selecciona quién está usando la app.';return}await rpc('family_add_task',{...args,p_created_by:creator})}
  resetForm();await load();lastSig='';render();
 }catch(e){console.error(e);msg.textContent='No se ha podido guardar la tarea.'}finally{b.disabled=false}
}
async function setDone(id,done){try{await rpc('family_set_task_done',{p_code:CODE,p_id:id,p_done:done});await load();lastSig='';render()}catch(e){console.error(e);alert('No se ha podido actualizar la tarea.')}}
async function assignTask(id,value){try{await rpc('family_assign_task',{p_code:CODE,p_id:id,p_assignees:assigneesFromValue(value)});await load();lastSig='';render()}catch(e){console.error(e);alert('No se ha podido cambiar el responsable.')}}
async function deleteTask(){if(!editId)return;const x=tasks().find(t=>t.id===editId);if(!confirm(`¿Eliminar “${x?.title||'esta tarea'}”?`))return;try{await rpc('family_delete_task',{p_code:CODE,p_id:editId});resetForm();await load();lastSig='';render()}catch(e){console.error(e);$t('taskMsg').textContent='No se ha podido eliminar la tarea.'}}

function signature(){return JSON.stringify(tasks().map(x=>[x.id,x.title,x.due_date,x.assignees,x.is_done,x.updated_at]))}
function sync(){makeSection();const sig=signature();if(sig!==lastSig){lastSig=sig;render()}}

document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(sync,100)});
setTimeout(sync,250);setInterval(sync,1800);
})();
