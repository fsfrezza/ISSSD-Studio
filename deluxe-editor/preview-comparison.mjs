// Presentation-only controls; never write to project or ROM.
export function installPreviewComparison(preview,original,{label='Original',initial='preview'}={}){
 const host=preview.parentElement;
 if(!host)return {setAvailable(available){preview.hidden=!available;original.hidden=available;}};
 const doc=preview.ownerDocument,toolbar=doc.createElement('div'),grid=doc.createElement('div');
 host.classList.add('has-preview-comparison');
 toolbar.className='preview-modes';grid.className='preview-comparison';
 toolbar.setAttribute('role','group');toolbar.setAttribute('aria-label','Modo de visualização');
 let mode=initial,available=false;
 const panels=[original,preview].map((element,i)=>{
  const panel=doc.createElement('div'),caption=doc.createElement('span');
  panel.className='preview-comparison-panel';caption.textContent=i?'Prévia do projeto':label;
  panel.append(caption,element);grid.append(panel);return panel;
 });
 const buttons=['original','preview','compare'].map((key,i)=>{
  const button=doc.createElement('button');button.type='button';button.textContent=['Original','Prévia','Comparar'][i];
  button.onclick=()=>{mode=key;render();};toolbar.append(button);return button;
 });
 function render(){
  const active=available?mode:'original';
  panels[0].hidden=active==='preview';panels[1].hidden=active==='original';
  original.hidden=false;preview.hidden=!available;
  grid.classList.toggle('is-comparing',active==='compare');
  buttons.forEach((button,i)=>{button.disabled=i!==0&&!available;button.setAttribute('aria-pressed',String(active===['original','preview','compare'][i]));});
 }
 host.append(toolbar,grid);render();
 return {setAvailable(value){available=!!value;render();}};
}
