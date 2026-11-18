import {HANDICAP_LABELS,handicapLabelBitmaps} from '../src/core/deluxe-handicap-labels.mjs';
import {BUTTON_LABELS,applyDeluxeButtonLabels} from '../src/core/deluxe-button-labels.mjs';
import {DELUXE_SCREEN_EDITORS,deluxeScreenScene,MOVED_MENU_SECTIONS} from '../src/core/deluxe-screen-scenes.mjs';
import {DELUXE_MENU_SECTIONS,encodeNativeMenuField} from '../src/core/deluxe-menu-text.mjs';
import {PREMATCH_GRAPHIC_LABELS,applyDeluxePrematchLabels} from '../src/core/deluxe-prematch-labels.mjs';
import {splitRom} from '../src/core/deluxe-project.mjs';
import {announcementReferenceId} from '../src/core/deluxe-match-announcement-layout.mjs';
export const screenPrefix=id=>'screen'+id.split('-').map(s=>s[0].toUpperCase()+s.slice(1)).join('');
export function installScreenEditors({getProject,getFile,textControl,addPresetButtons,onStatus,updateImprovements}){
 const $=id=>document.getElementById(id),references=new Map();
 const layouts={'stadium-screen':['stadiumLayoutOptimized','stadium-layout'],'match-announcement':['announcementLayoutOptimized','announcement-layout']};
 let draftProject=null,highlightHour=true;const drafts=new Map();
 function layoutState(){const p=getProject();if(p!==draftProject){draftProject=p;drafts.clear();}return p;}
 function previewProject(p,id){
  if(!p||!layouts[id])return p;
  const key=layouts[id][1],selected=new Set(p.changes.improvements);
  if(drafts.has(id)){if(drafts.get(id))selected.add(key);else selected.delete(key);}
  return {...p,changes:{...p.changes,improvements:[...selected]}};
 }
 function draw(config){
  const current=layoutState(),prefix=screenPrefix(config.id),canvas=$(prefix+'Preview'),ctx=canvas.getContext('2d');
  const p=previewProject(current,config.id);
  if(!p){ctx.clearRect(0,0,256,224);return;}
  try{const selected=Number($(prefix+'Selection').value)||0,refId=config.id==='match-announcement'?announcementReferenceId(p.changes):config.id==='stadium-screen'&&p.changes.improvements.includes('stadium-layout')?(p.changes.improvements.includes('match-hour')?'stadium-optimized-hour':'stadium-optimized'):config.id;if(refId.startsWith('match-announcement-layout')&&!references.has(refId))return;const scene=deluxeScreenScene(splitRom(getFile()).rom,config.id,p,selected,references.get(refId)??references.get(config.id),highlightHour),data=ctx.createImageData(256,224);data.data.set(scene.rgba);ctx.putImageData(data,0,0);$(prefix+'Status').textContent='';}
  catch(error){$(prefix+'Status').textContent='Prévia indisponível: '+error.message;}
 }
 function updateMenu(config,sectionId,key,value,original){
  const p=getProject(),menus=p.changes.menuTexts??={},entries=menus[sectionId]??={};
  if(value===original)delete entries[key];else entries[key]=value;
  if(!Object.keys(entries).length)delete menus[sectionId];if(!Object.keys(menus).length)delete p.changes.menuTexts;for(const screen of DELUXE_SCREEN_EDITORS)draw(screen);
 }
 function render(){
  const p=layoutState();
  for(const [id,[boxId,key]] of Object.entries(layouts)){const box=$(boxId),applied=p?.changes?.improvements?.includes(key)??false;box.disabled=!p;box.checked=drafts.get(id)??applied;$(boxId+'Apply').disabled=!p||box.checked===applied;$(boxId+'Status').textContent=box.checked===applied?'Layout '+(applied?'otimizado':'original')+' definido no projeto.':'Prévia alterada. Clique em implementar para gravar a escolha.';}
  for(const config of DELUXE_SCREEN_EDITORS){
   const prefix=screenPrefix(config.id),fields=$(prefix+'Fields'),selection=$(prefix+'Selection'),actions=$(prefix+'Actions');fields.replaceChildren();actions.replaceChildren();const previous=Number(selection.value)||0;selection.replaceChildren();selection.disabled=!p||config.choices.length===1;$(prefix+'Reset').disabled=!p;
   $(prefix+'Status').textContent='';if(!p){draw(config);continue;}
   config.choices.forEach((id,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=config.choiceLabels[i];selection.append(option);});selection.value=String(previous<config.choices.length?previous:0);
   addPresetButtons(actions,config.id==='pre-match'?'preMatchLabels':config.fieldIds?config.id:config.section);
   const buttonsPt=document.createElement('button');buttonsPt.type='button';buttonsPt.textContent='CONFIRMA / CANCELA em todas as telas';buttonsPt.onclick=()=>{p.changes.buttonLabels=Object.fromEntries(BUTTON_LABELS.map(([id,,pt])=>[id,pt]));render();onStatus('Rótulos A/B em português, compartilhados entre as telas.');};actions.append(buttonsPt);
   for(const [id,original] of BUTTON_LABELS)textControl(fields,{scope:'buttonLabels',key:config.id+'/'+id,label:(id==='confirm'?'A → ':'B → ')+original+' · compartilhado entre telas',original,value:p.changes.buttonLabels?.[id]??original,validate:value=>{const base=splitRom(getFile()).rom;applyDeluxeButtonLabels(base.slice(),base,{...p.changes.buttonLabels,[id]:value});},onChange:value=>{const entries=p.changes.buttonLabels??={};if(value===original)delete entries[id];else entries[id]=value;if(!Object.keys(entries).length)delete p.changes.buttonLabels;render();}});
   if(config.id==='handicap'){
    for(const [id,original] of HANDICAP_LABELS)textControl(fields,{scope:'handicapLabels',key:id,label:original+' · rótulo gráfico',original,value:p.changes.handicapLabels?.[id]??original,validate:value=>handicapLabelBitmaps(id,value),onChange:value=>{const entries=p.changes.handicapLabels??={};if(value===original)delete entries[id];else entries[id]=value;if(!Object.keys(entries).length)delete p.changes.handicapLabels;draw(config);}});
   }
   if(config.id==='pre-match'){
    for(const [id,original]of PREMATCH_GRAPHIC_LABELS)textControl(fields,{scope:'preMatchLabels',key:id,label:original+' · rótulo gráfico',original,value:p.changes.preMatchLabels?.[id]??original,validate:value=>{const base=splitRom(getFile()).rom;applyDeluxePrematchLabels(base.slice(),base,{...p.changes.preMatchLabels,[id]:value});},onChange:value=>{const entries=p.changes.preMatchLabels??={};if(value===original)delete entries[id];else entries[id]=value;if(!Object.keys(entries).length)delete p.changes.preMatchLabels;draw(config);}});
   }
   for(const sectionId of(config.sections??[config.section]).filter(Boolean)){
   const section=DELUXE_MENU_SECTIONS.find(s=>s.id===sectionId);
   for(const f of section.fields.filter(f=>!config.fieldIds||config.fieldIds.includes(f[0]))){const original=f[1],segments=f[3].pool.segments;
    textControl(fields,{scope:'menuTexts',key:section.id+'/'+f[0],label:(f[3].label??f[0])+' · '+segments.map(s=>f[3].pool.capacity??s.original.length).join('/')+' células',original,value:p.changes.menuTexts?.[section.id]?.[f[0]]??original,multiline:segments.length>1,validate:value=>encodeNativeMenuField(f,value),onChange:value=>updateMenu(config,section.id,f[0],value,original)});
   }
   }
   draw(config);
  }
 }
 for(const [id,[boxId,key]] of Object.entries(layouts)){
  const box=$(boxId),apply=$(boxId+'Apply'),message=$(boxId+'Status'),config=DELUXE_SCREEN_EDITORS.find(s=>s.id===id);
  box.onchange=()=>{const p=layoutState();if(!p)return;drafts.set(id,box.checked);apply.disabled=box.checked===p.changes.improvements.includes(key);message.textContent=apply.disabled?'Prévia igual ao layout aplicado.':'Prévia alterada. A ROM ainda não foi modificada.';draw(config);};
  apply.onclick=async()=>{const p=layoutState();if(!p)return;const choice=box.checked,pending=new Map(drafts);box.disabled=apply.disabled=true;await updateImprovements([key],choice);const after=layoutState();for(const [other,value]of pending)if(other!==id)drafts.set(other,value);render();message.textContent=after?.changes.improvements.includes(key)===choice?'Escolha implementada no projeto. Será aplicada ao gerar a ROM.':'Não foi possível implementar a escolha.';};
 }
 for(const config of DELUXE_SCREEN_EDITORS){const prefix=screenPrefix(config.id);$(prefix+'Selection').onchange=()=>draw(config);$(prefix+'Reset').onclick=()=>{const p=getProject();if(!p)return;if(p.changes.menuTexts){for(const id of(config.sections??[config.section]).filter(Boolean)){if(config.fieldIds){for(const key of config.fieldIds)delete p.changes.menuTexts[id]?.[key];if(!Object.keys(p.changes.menuTexts[id]??{}).length)delete p.changes.menuTexts[id];}else delete p.changes.menuTexts[id];}if(!Object.keys(p.changes.menuTexts).length)delete p.changes.menuTexts;}if(config.id==='pre-match')delete p.changes.preMatchLabels;if(config.id==='handicap')delete p.changes.handicapLabels;render();onStatus(config.title+': textos originais restaurados.');};}
 for(const config of DELUXE_SCREEN_EDITORS){const img=document.createElement('img');img.onload=()=>{const canvas=document.createElement('canvas');canvas.width=256;canvas.height=224;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,256,224);references.set(config.id,ctx.getImageData(0,0,256,224).data);draw(config);};img.src='/deluxe-editor/assets/screens/'+config.id+'.png';}
 for(const id of ['stadium-optimized','stadium-optimized-hour']){const img=document.createElement('img');img.onload=()=>{const canvas=document.createElement('canvas');canvas.width=256;canvas.height=224;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,256,224);references.set(id,ctx.getImageData(0,0,256,224).data);draw(DELUXE_SCREEN_EDITORS.find(s=>s.id==='stadium-screen'));};img.src='/deluxe-editor/assets/screens/'+id+'.png';}
 for(const id of ['match-announcement-layout','match-announcement-layout-meters','match-announcement-layout-pt','match-announcement-layout-pt-meters']){const img=document.createElement('img');img.onload=()=>{const canvas=document.createElement('canvas');canvas.width=256;canvas.height=224;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,256,224);references.set(id,ctx.getImageData(0,0,256,224).data);draw(DELUXE_SCREEN_EDITORS.find(s=>s.id==='match-announcement'));};img.src='/deluxe-editor/assets/screens/'+id+'.png';}
 // Animate only the visible stadium preview, without touching saved project state.
 const timer=setInterval(()=>{const config=DELUXE_SCREEN_EDITORS.find(s=>s.id==='stadium-screen'),canvas=$(screenPrefix(config.id)+'Preview');if(canvas.offsetParent&&getProject()?.changes?.improvements?.includes('match-hour')){highlightHour=!highlightHour;draw(config);}},400);timer?.unref?.();
 render();return {render,ownsSection:id=>MOVED_MENU_SECTIONS.has(id)};
}
