import {DELUXE_SCREEN_EDITORS,deluxeScreenScene,MOVED_MENU_SECTIONS} from '../src/core/deluxe-screen-scenes.mjs';
import {DELUXE_MENU_SECTIONS,encodeNativeMenuField} from '../src/core/deluxe-menu-text.mjs';
import {PREMATCH_GRAPHIC_LABELS,applyDeluxePrematchLabels} from '../src/core/deluxe-prematch-labels.mjs';
import {splitRom} from '../src/core/deluxe-project.mjs';
export const screenPrefix=id=>'screen'+id.split('-').map(s=>s[0].toUpperCase()+s.slice(1)).join('');
export function installScreenEditors({getProject,getFile,textControl,addPresetButtons,onStatus}){
 const $=id=>document.getElementById(id);
 function draw(config){
  const p=getProject(),prefix=screenPrefix(config.id),canvas=$(prefix+'Preview'),ctx=canvas.getContext('2d');
  if(!p){ctx.clearRect(0,0,256,224);return;}
  try{const selected=Number($(prefix+'Selection').value)||0,scene=deluxeScreenScene(splitRom(getFile()).rom,config.id,p,selected),data=ctx.createImageData(256,224);data.data.set(scene.rgba);ctx.putImageData(data,0,0);$(prefix+'Status').textContent='';}
  catch(error){$(prefix+'Status').textContent='Prévia indisponível: '+error.message;}
 }
 function updateMenu(config,sectionId,key,value,original){
  const p=getProject(),menus=p.changes.menuTexts??={},entries=menus[sectionId]??={};
  if(value===original)delete entries[key];else entries[key]=value;
  if(!Object.keys(entries).length)delete menus[sectionId];if(!Object.keys(menus).length)delete p.changes.menuTexts;draw(config);
 }
 function render(){
  const p=getProject();
  for(const config of DELUXE_SCREEN_EDITORS){
   const prefix=screenPrefix(config.id),fields=$(prefix+'Fields'),selection=$(prefix+'Selection'),actions=$(prefix+'Actions');fields.replaceChildren();actions.replaceChildren();const previous=Number(selection.value)||0;selection.replaceChildren();selection.disabled=!p;$(prefix+'Reset').disabled=!p;
   $(prefix+'Status').textContent='';if(!p){draw(config);continue;}
   config.choices.forEach((id,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=config.choiceLabels[i];selection.append(option);});selection.value=String(previous<config.choices.length?previous:0);
   addPresetButtons(actions,config.id==='pre-match'?'preMatchLabels':config.section);
   if(config.id==='pre-match'){
    for(const [id,original]of PREMATCH_GRAPHIC_LABELS)textControl(fields,{scope:'preMatchLabels',key:id,label:original+' · rótulo gráfico',original,value:p.changes.preMatchLabels?.[id]??original,validate:value=>{const base=splitRom(getFile()).rom;applyDeluxePrematchLabels(base.slice(),base,{...p.changes.preMatchLabels,[id]:value});},onChange:value=>{const entries=p.changes.preMatchLabels??={};if(value===original)delete entries[id];else entries[id]=value;if(!Object.keys(entries).length)delete p.changes.preMatchLabels;draw(config);}});
   }
   for(const sectionId of(config.sections??[config.section]).filter(Boolean)){
   const section=DELUXE_MENU_SECTIONS.find(s=>s.id===sectionId);
   for(const f of section.fields){const original=f[1],segments=f[3].pool.segments;
    textControl(fields,{scope:'menuTexts',key:section.id+'/'+f[0],label:(f[3].label??f[0])+' · '+segments.map(s=>f[3].pool.capacity??s.original.length).join('/')+' células',original,value:p.changes.menuTexts?.[section.id]?.[f[0]]??original,multiline:segments.length>1,validate:value=>encodeNativeMenuField(f,value),onChange:value=>updateMenu(config,section.id,f[0],value,original)});
   }
   }
   draw(config);
  }
 }
 for(const config of DELUXE_SCREEN_EDITORS){const prefix=screenPrefix(config.id);$(prefix+'Selection').onchange=()=>draw(config);$(prefix+'Reset').onclick=()=>{const p=getProject();if(!p)return;if(p.changes.menuTexts){for(const id of(config.sections??[config.section]).filter(Boolean))delete p.changes.menuTexts[id];if(!Object.keys(p.changes.menuTexts).length)delete p.changes.menuTexts;}if(config.id==='pre-match')delete p.changes.preMatchLabels;render();onStatus(config.title+': textos originais restaurados.');};}
 render();return {render,ownsSection:id=>MOVED_MENU_SECTIONS.has(id)};
}
