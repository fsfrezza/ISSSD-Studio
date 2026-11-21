const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export const soundLabel=slot=>(slot.kind==='voice'?'Voz · ':'Efeito · ')+slot.id.replace(/([a-z])([A-Z])/g,'$1 $2');
export function filterSounds(slots,changes={},query='',kind='all',source='all'){
 return slots.filter(slot=>(kind==='all'||slot.kind===kind)&&(source==='all'||(source==='modified'?!!changes[slot.id]:source==='original'?!changes[slot.id]:changes[slot.id]?.source===source))&&normalize(soundLabel(slot)+' '+slot.id).includes(normalize(query.trim())));
}
export function waveformEnvelope(samples,width){
 return Array.from({length:width},(_,i)=>{let lo=0,hi=0;const from=Math.floor(i*samples.length/width),to=Math.min(samples.length,Math.max(from+1,Math.floor((i+1)*samples.length/width)));for(let j=from;j<to;j++){lo=Math.min(lo,samples[j]);hi=Math.max(hi,samples[j]);}return [lo,hi];});
}
export function installSoundWorkspace(select,onFilter,onNavigate){
 const label=select.parentElement,doc=select.ownerDocument;
 if(!label||!doc)return {query:'',kind:'all',source:'all',update(){},draw(){}};
 const workspace=doc.createElement('div');workspace.className='sound-workspace';
 const toolbar=doc.createElement('div');toolbar.className='sound-toolbar';
 const search=doc.createElement('input');search.type='search';search.placeholder='Buscar sons ou vozes…';search.setAttribute('aria-label','Buscar sons');
 const filter=(name,choices)=>{const el=doc.createElement('select');el.setAttribute('aria-label',name);for(const [value,text]of choices){const option=doc.createElement('option');option.value=value;option.textContent=text;el.append(option);}return el;};
 const kind=filter('Tipo de áudio',[['all','Todos os tipos'],['voice','Vozes'],['effect','Efeitos']]);
 const source=filter('Origem do áudio',[['all','Todas as origens'],['original','Originais'],['modified','Modificados'],['custom','Importados'],['galvao','Galvão'],['fb96','FB96']]);
 search.oninput=kind.onchange=source.onchange=onFilter;toolbar.append(search,kind,source);
 const summary=doc.createElement('div');summary.className='sound-summary';
 const navigation=doc.createElement('div');navigation.className='sound-navigation';
 const previous=doc.createElement('button'),next=doc.createElement('button'),position=doc.createElement('span');
 previous.type=next.type='button';previous.textContent='← Anterior';next.textContent='Próximo →';previous.onclick=()=>onNavigate(-1);next.onclick=()=>onNavigate(1);navigation.append(previous,position,next);
 const canvas=doc.createElement('canvas');canvas.width=480;canvas.height=96;canvas.setAttribute('aria-label','Forma de onda do original e da amostra atual');
 const legend=doc.createElement('p');legend.className='hint';legend.textContent='Cinza: original · Azul: atual';
 const budget=doc.createElement('div');budget.className='sound-budget';
 workspace.append(toolbar,summary,navigation,canvas,legend,budget);label.after(workspace);
 search.disabled=kind.disabled=source.disabled=previous.disabled=next.disabled=true;
 canvas.hidden=legend.hidden=budget.hidden=true;
 summary.textContent='Abra a ROM para consultar as amostras.';
 return {
  get query(){return search.value;},get kind(){return kind.value;},get source(){return source.value;},
  update(slots,all,changes,id,ready){search.disabled=kind.disabled=source.disabled=!ready;const index=slots.findIndex(s=>s.id===id);previous.disabled=index<=0;next.disabled=index<0||index===slots.length-1;position.textContent=index<0?'Nenhum som':(index+1)+' / '+slots.length;summary.textContent=slots.length+' de '+all.length+' sons · '+all.filter(s=>changes?.[s.id]).length+' modificados';if(index<0){canvas.hidden=legend.hidden=budget.hidden=true;}},
  draw(original,current,originalBytes,currentBytes,rate){
   canvas.hidden=legend.hidden=budget.hidden=false;const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
   ctx.clearRect(0,0,w,h);ctx.fillStyle='#e2e8f0';ctx.fillRect(0,h/2,w,1);
   for(const [samples,color,mid] of [[original,'#94a3b8',h/4],[current,'#2563eb',h*3/4]]){ctx.fillStyle=color;waveformEnvelope(samples,w).forEach(([lo,hi],i)=>ctx.fillRect(i,mid-hi*h/4,1,Math.max(1,(hi-lo)*h/4)));}
   budget.textContent=currentBytes+' / '+originalBytes+' bytes ('+Math.round(currentBytes/originalBytes*100)+'%) · '+(current.length/rate).toFixed(2)+' s na prévia · '+(originalBytes-currentBytes)+' bytes livres';
  }
 };
}
