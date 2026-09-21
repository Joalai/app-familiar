(()=>{
'use strict';
const DEFAULTS=['ChatGPT','Netflix','Max / HBO Max','DIGI','Amazon Prime','Strava','Disney+'];
const KEY='family_subscriptions_v1';
let editing=null;

const css=document.createElement('style');
css.textContent=`
.subHero{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:0 0 14px}
.subMetric{background:#fff;border:1px solid var(--line);border-radius:15px;padding:12px;min-height:78px}
.subMetricIcon{font-size:19px;display:block;margin-bottom:5px}
.subMetric small{display:block;color:var(--mut);font-size:10px;font-weight:850;text-transform:uppercase;letter-spacing:.04em}
.subMetric b{display:block;font-size:18px;margin-top:4px;line-height:1.12}
.subMetric .subTiny{font-size:10px;color:var(--mut);font-weight:700;margin-top:4px}
.subHint{font-size:11px;color:var(--mut);margin:0 0 12px}
.subList{display:grid;gap:9px}
.subCard{background:#fff;border:1px solid var(--line);border-radius:15px;padding:13px}
.subTop{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}
.subIdentity{display:flex;gap:10px;align-items:center;min-width:0}
.subIcon{width:42px;height:42px;flex:0 0 42px;border-radius:13px;display:grid;place-items:center;background:#f1f5f9;font-size:21px}
.subName{font-weight:900;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.subChip{display:inline-flex;align-items:center;border-radius:999px;padding:3px 7px;background:#eef2ff;color:#4338ca;font-size:9px;font-weight:900;margin-top:4px}
.subEdit{border:1px solid var(--line);background:#f8fafc;color:#2563eb;border-radius:9px;padding:6px 9px;font-size:11px;font-weight:850}
.subPriceLine{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin-top:12px}
.subPrice{font-size:23px;font-weight:950;letter-spacing:-.02em}
.subPrice small{font-size:11px;color:var(--mut);font-weight:750;margin-left:3px}
.subImpact{font-size:10px;color:var(--mut);font-weight:750;text-align:right}
.subEquiv{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:10px}
.subEq{background:#f8fafc;border-radius:10px;padding:8px 9px}
.subEq small{display:block;color:var(--mut);font-size:9px;font-weight:850;text-transform:uppercase}
.subEq b{display:block;margin-top:2px;font-size:13px}
.subBarWrap{margin-top:10px}
.subBarMeta{display:flex;justify-content:space-between;gap:8px;font-size:9px;color:var(--mut);font-weight:800;margin-bottom:4px}
.subBar{height:7px;background:#eef2f6;border-radius:999px;overflow:hidden}
.subBar>span{display:block;height:100%;background:linear-gradient(90deg,#2563eb,#60a5fa);border-radius:999px}
.subEditor{margin-top:12px;padding-top:12px;border-top:1px solid var(--line)}
.subFields{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.subActions{display:flex;gap:7px;margin-top:10px;flex-wrap:wrap}
.subActions .danger{margin-left:auto}
.subEmptyPrice{color:var(--mut);font-size:13px;font-weight:800}
@media(max-width:760px){
 .subHero{grid-template-columns:1fr 1fr}
 .subFields{grid-template-columns:1fr}
 .subPriceLine{align-items:flex-start}
}
`;
document.head.appendChild(css);

function load(){
  try{
    const raw=JSON.parse(localStorage.getItem(KEY)||'null');
    if(Array.isArray(raw))return raw.map((v,i)=>({id:v.id||'sub-'+(i+1),name:v.name||'',price:v.price||'',period:v.period||''}));
  }catch(e){}
  return DEFAULTS.map((name,i)=>({id:'sub-'+(i+1),name,price:'',period:''}));
}
let items=load();
function save(){localStorage.setItem(KEY,JSON.stringify(items))}
save();

function money(v){
  const n=Number(String(v??'').replace(',','.'));
  return Number.isFinite(n)?n:0;
}
function monthly(x){
  const p=money(x.price);
  if(!p||!x.period)return null;
  if(x.period==='Mensual')return p;
  if(x.period==='Trimestral')return p/3;
  if(x.period==='Semestral')return p/6;
  if(x.period==='Anual')return p/12;
  return null;
}
function annual(x){
  const m=monthly(x);
  return m===null?null:m*12;
}
function euro(n){return Number(n||0).toLocaleString('es-ES',{style:'currency',currency:'EUR'})}
function icon(name=''){
  const s=name.toLowerCase();
  if(s.includes('chatgpt'))return '🤖';
  if(s.includes('netflix'))return '🎬';
  if(s.includes('max')||s.includes('hbo'))return '🍿';
  if(s.includes('digi'))return '📶';
  if(s.includes('amazon'))return '📦';
  if(s.includes('strava'))return '🏃';
  if(s.includes('disney'))return '✨';
  return '💳';
}
function periodShort(p){
  return {Mensual:'/ mes',Trimestral:'/ trimestre',Semestral:'/ semestre',Anual:'/ año',Otra:''}[p]||'';
}
function safe(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}

function ensure(){
  const main=document.querySelector('main');
  if(!main||document.getElementById('subscriptions'))return;
  const s=document.createElement('section');
  s.id='subscriptions';
  s.className='view';
  s.innerHTML='<div class="ey">Gasto recurrente</div><div class="title">💳 Suscripciones</div><p class="subHint">Vista rápida de lo que supone cada servicio al mes y al año.</p><div id="subBody"></div>';
  main.appendChild(s);
  render();
}
function editor(x){
  const periods=['Mensual','Trimestral','Semestral','Anual','Otra'];
  return `<div class="subEditor" data-editor="${x.id}">
    <div class="subFields">
      <div class="field"><label>Servicio</label><input data-k="name" value="${safe(x.name)}"></div>
      <div class="field"><label>Precio (€)</label><input data-k="price" inputmode="decimal" value="${safe(x.price)}"></div>
      <div class="field"><label>Periodicidad</label><select data-k="period"><option value="">Sin indicar</option>${periods.map(p=>`<option value="${p}" ${x.period===p?'selected':''}>${p}</option>`).join('')}</select></div>
    </div>
    <div class="subActions">
      <button type="button" class="primary" data-save-sub="${x.id}">Guardar</button>
      <button type="button" class="secondary" data-cancel-sub="${x.id}">Cancelar</button>
      <button type="button" class="secondary danger" data-del-sub="${x.id}">Eliminar</button>
    </div>
  </div>`;
}
function card(x,totalMonthly){
  const m=monthly(x),a=annual(x),share=m!==null&&totalMonthly>0?Math.min(100,m/totalMonthly*100):0;
  const price=money(x.price);
  return `<article class="subCard">
    <div class="subTop">
      <div class="subIdentity">
        <div class="subIcon">${icon(x.name)}</div>
        <div style="min-width:0">
          <div class="subName">${safe(x.name||'Nueva suscripción')}</div>
          <span class="subChip">${safe(x.period||'Periodicidad pendiente')}</span>
        </div>
      </div>
      <button type="button" class="subEdit" data-edit-sub="${x.id}">${editing===x.id?'Cerrar':'Editar'}</button>
    </div>
    <div class="subPriceLine">
      <div>${price?`<span class="subPrice">${euro(price)}<small>${safe(periodShort(x.period))}</small></span>`:'<span class="subEmptyPrice">Precio pendiente</span>'}</div>
      <div class="subImpact">${m!==null&&totalMonthly>0?(m/totalMonthly*100).toLocaleString('es-ES',{maximumFractionDigits:1})+' % del gasto mensual':''}</div>
    </div>
    <div class="subEquiv">
      <div class="subEq"><small>Equiv. / mes</small><b>${m===null?'—':euro(m)}</b></div>
      <div class="subEq"><small>Equiv. / año</small><b>${a===null?'—':euro(a)}</b></div>
    </div>
    <div class="subBarWrap">
      <div class="subBarMeta"><span>Peso sobre el total</span><span>${m===null?'Falta periodicidad/precio':share.toLocaleString('es-ES',{maximumFractionDigits:1})+' %'}</span></div>
      <div class="subBar"><span style="width:${share}%"></span></div>
    </div>
    ${editing===x.id?editor(x):''}
  </article>`;
}
function render(){
  const body=document.getElementById('subBody');
  if(!body)return;
  const known=items.map(x=>({x,m:monthly(x)})).filter(y=>y.m!==null);
  const totalMonthly=known.reduce((a,y)=>a+y.m,0);
  const totalAnnual=totalMonthly*12;
  const expensive=[...known].sort((a,b)=>b.m-a.m)[0];
  const sorted=[...items].sort((a,b)=>{
    const am=monthly(a),bm=monthly(b);
    if(am===null&&bm===null)return a.name.localeCompare(b.name,'es');
    if(am===null)return 1;if(bm===null)return -1;
    return bm-am;
  });
  body.innerHTML=`
    <div class="subHero">
      <div class="subMetric"><span class="subMetricIcon">💸</span><small>Total / mes</small><b>${euro(totalMonthly)}</b><div class="subTiny">equivalente conocido</div></div>
      <div class="subMetric"><span class="subMetricIcon">📅</span><small>Total / año</small><b>${euro(totalAnnual)}</b><div class="subTiny">proyección anual</div></div>
      <div class="subMetric"><span class="subMetricIcon">🔢</span><small>Suscripciones</small><b>${items.length}</b><div class="subTiny">${known.length} con coste calculable</div></div>
      <div class="subMetric"><span class="subMetricIcon">🏆</span><small>Más cara / mes</small><b>${expensive?safe(expensive.x.name):'—'}</b><div class="subTiny">${expensive?euro(expensive.m)+'/mes':'Completa precios'}</div></div>
    </div>
    <div class="subList">${sorted.map(x=>card(x,totalMonthly)).join('')}</div>
    <button type="button" id="addSubscription" class="primary" style="margin-top:12px">＋ Añadir suscripción</button>
  `;
  body.querySelectorAll('[data-edit-sub]').forEach(b=>b.onclick=()=>{editing=editing===b.dataset.editSub?null:b.dataset.editSub;render()});
  body.querySelectorAll('[data-cancel-sub]').forEach(b=>b.onclick=()=>{editing=null;render()});
  body.querySelectorAll('[data-save-sub]').forEach(b=>b.onclick=()=>{
    const box=body.querySelector('[data-editor="'+b.dataset.saveSub+'"]'),x=items.find(v=>v.id===b.dataset.saveSub);
    if(!box||!x)return;
    box.querySelectorAll('[data-k]').forEach(el=>x[el.dataset.k]=el.value.trim());
    save();editing=null;render();
  });
  body.querySelectorAll('[data-del-sub]').forEach(b=>b.onclick=()=>{
    const x=items.find(v=>v.id===b.dataset.delSub);
    if(!x||!confirm('¿Eliminar '+(x.name||'esta suscripción')+'?'))return;
    items=items.filter(v=>v.id!==b.dataset.delSub);save();editing=null;render();
  });
  document.getElementById('addSubscription').onclick=()=>{
    const id='sub-'+Date.now();
    items.push({id,name:'Nueva suscripción',price:'',period:''});
    save();editing=id;render();
    setTimeout(()=>body.querySelector('[data-editor="'+id+'"] input[data-k="name"]')?.focus(),30);
  };
}
ensure();
window.familySubscriptionsRefresh=render;
})();
