const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
export function matchesTextField(field,query='',mode='all'){
 const modified=field.value!==field.original;
 if(mode==='changed'&&!modified||mode==='original'&&modified||mode==='invalid'&&!field.invalid)return false;
 const haystack=normalize([field.label,field.key,field.original,field.value,field.portuguese].join(' '));
 return normalize(query).trim().split(/\s+/).every(word=>haystack.includes(word));
}
const states=new WeakMap();
function stateFor(panel){if(!states.has(panel))states.set(panel,{query:'',mode:'all'});return states.get(panel);}
function refresh(panel){
 const state=stateFor(panel),rows=Array.from(panel.querySelectorAll('.text-workspace-row'));
 let shown=0,modified=0,invalid=0;
 for(const row of rows){
  const info=row.textWorkspaceField;if(!info)continue;
  row.hidden=!matchesTextField(info,state.query,state.mode);
  if(!row.hidden&&(state.query.trim()||state.mode!=='all'))for(let detail=row.closest?.('details');detail&&panel.contains(detail);detail=detail.parentElement?.closest('details'))detail.open=true;
  if(!row.hidden)shown++;
  if(info.value!==info.original)modified++;
  if(info.invalid)invalid++;
 }
 if(state.count)state.count.textContent=shown+' / '+rows.length+' campos · '+modified+' modificados'+(invalid?' · '+invalid+' inválidos':'');
}
export function attachTextField(row,container,field){
 const panel=container.closest?.('[data-panel]');
 row.textWorkspaceField=field;
 row.className='text-workspace-row';
 function update(value,invalid=false){
  field.value=value;field.invalid=invalid;
  row.classList?.toggle('text-modified',value!==field.original);
  row.classList?.toggle('text-invalid',invalid);
  if(panel){const state=stateFor(panel);if(!state.pending){state.pending=true;queueMicrotask(()=>{state.pending=false;refresh(panel);});}}
 }
 update(field.value,field.invalid);return update;
}
export function installTextFilters(host){
 const panel=host.closest?.('[data-panel]');if(!panel)return;
 const state=stateFor(panel),doc=host.ownerDocument;
 const group=doc.createElement('div');group.className='text-filter-toolbar';
 const input=doc.createElement('input');input.type='search';input.placeholder='Buscar texto original ou editado…';input.setAttribute('aria-label','Buscar textos');input.value=state.query;
 const select=doc.createElement('select');select.setAttribute('aria-label','Filtrar textos');
 for(const [value,label] of [['all','Todos'],['changed','Modificados'],['original','Originais'],['invalid','Inválidos']]){const option=doc.createElement('option');option.value=value;option.textContent=label;select.append(option);}
 select.value=state.mode;
 const count=doc.createElement('span');count.className='text-filter-count';count.setAttribute('role','status');state.count=count;
 input.oninput=()=>{state.query=input.value;refresh(panel);};select.onchange=()=>{state.mode=select.value;refresh(panel);};
 group.append(input,select,count);host.append(group);queueMicrotask(()=>refresh(panel));
}
