import {createDeluxeProject,buildDeluxeProject,IMPROVEMENTS,splitRom} from '../src/core/deluxe-project.mjs';
import {PLUS_STRATEGY_TEXTS,readPlusStrategyText} from '../src/core/plus-strategy-text.mjs';
import {NATIVE_SCREEN_TEXT_FIELDS,CURSOR_HELP_FIELDS,readStadiums,readNativeField,readCursorHelp,encodeNativeField} from '../src/core/deluxe-native-fields.mjs';
import {encodeCursorText} from '../src/core/cursor-text-codec.mjs';
const $=id=>document.getElementById(id);
let file=null,project=null,opening=0;
function status(value){$('status').textContent=value;}
function download(data,name,type){const url=URL.createObjectURL(new Blob([data],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function render(){
  for(const id of ['texts','stadiums','nativeTexts','cursorHelp'])$(id).replaceChildren();
  $('title').value='';$('title').disabled=!project;$('resetTitle').disabled=!project;
  if(!project)return;
  const {rom}=splitRom(file);
  renderNative(rom);
  for(const item of PLUS_STRATEGY_TEXTS){
    const label=document.createElement('label');label.textContent=item.label;
    const input=document.createElement('input');input.type='text';input.maxLength=21;
    input.value=project.changes.strategyTexts[item.id]??readPlusStrategyText(rom,item.id);
    input.oninput=()=>{const original=readPlusStrategyText(rom,item.id);if(input.value===original)delete project.changes.strategyTexts[item.id];else project.changes.strategyTexts[item.id]=input.value;};
    label.append(input);$('texts').append(label);
  }
}
for(const item of IMPROVEMENTS){const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.disabled=true;label.append(input,document.createTextNode(' '+item.label+' — em mapeamento'));$('improvements').append(label);}
$('rom').onchange=async()=>{
 const token=++opening;file=null;project=null;render();for(const id of ['save','load','export'])$(id).disabled=true;
 try{const selected=$('rom').files[0];if(!selected)return;const bytes=new Uint8Array(await selected.arrayBuffer()),p=await createDeluxeProject(bytes);if(token!==opening)return;file=bytes;project=p;render();for(const id of ['save','load','export'])$(id).disabled=false;status('Deluxe original reconhecido · 2 MB. Sem edições, a exportação preserva o arquivo inteiro.');}catch(error){if(token===opening)status(error.message);}
};
$('save').onclick=async()=>{try{await buildDeluxeProject(file,project);download(JSON.stringify(project,null,2),'Deluxe.issdproj','application/json');}catch(error){status(error.message);}};
$('load').onchange=async()=>{const current=file;try{const selected=$('load').files[0];if(!selected)return;const p=JSON.parse(await selected.text());await buildDeluxeProject(current,p);if(file!==current)return;project=p;render();status('Projeto Deluxe reaberto.');}catch(error){status(error.message);}finally{$('load').value='';}};
$('export').onclick=async()=>{try{const result=await buildDeluxeProject(file,project);download(result.rom,'Deluxe-editado.'+(project.base.headerSize?'smc':'sfc'),'application/octet-stream');status('ROM gerada · '+result.diff.changedBytes+' bytes alterados · sem expansão.');}catch(error){status(error.message);}};

function updateChange(section,key,value,original){
 const entries=project.changes[section]??={};
 if(JSON.stringify(value)===JSON.stringify(original))delete entries[key];else entries[key]=value;
 if(!Object.keys(entries).length)delete project.changes[section];
}
function textControl(container,{label,value,original,multiline=false,validate,onChange}){
 const row=document.createElement('label');row.textContent=label;
 const input=document.createElement(multiline?'textarea':'input');if(!multiline)input.type='text';
 if(multiline)input.rows=Math.min(10,original.split('\n').length+1);
 input.value=value;
 input.addEventListener('input',()=>{try{validate(input.value);input.setCustomValidity('');onChange(input.value);}catch(e){input.setCustomValidity(e.message);onChange(input.value);} });
 const reset=document.createElement('button');reset.type='button';reset.textContent='Restaurar original';
 reset.onclick=()=>{input.value=original;input.setCustomValidity('');onChange(original);};
 row.append(input,reset);container.append(row);
}
const bgrToHex=v=>'#'+[0,5,10].map(shift=>Math.round(((v>>shift)&31)*255/31).toString(16).padStart(2,'0')).join('');
const hexToBgr=hex=>[1,3,5].reduce((v,at,i)=>v|(Math.round(parseInt(hex.slice(at,at+2),16)*31/255)<<(i*5)),0);
function renderNative(rom){
 $('title').value=project.changes.internalTitle??project.base.title;
 for(const f of NATIVE_SCREEN_TEXT_FIELDS){
  const original=readNativeField(rom,f);
  textControl($('nativeTexts'),{label:f.name+' · até '+f.capacity+' caracteres',value:project.changes.nativeTexts?.[f.pc]??original,original,validate:v=>encodeNativeField(v,f),onChange:v=>updateChange('nativeTexts',String(f.pc),v,original)});
 }
 for(const f of CURSOR_HELP_FIELDS){
  const original=readCursorHelp(rom,f),details=document.createElement('details'),summary=document.createElement('summary');summary.textContent=f[3].label??f[0];details.append(summary);$('cursorHelp').append(details);
  textControl(details,{label:'Instrução',value:project.changes.cursorHelp?.[f[0]]??original,original,multiline:true,validate:v=>encodeCursorText(f,v),onChange:v=>updateChange('cursorHelp',f[0],v,original)});
 }
 for(const stadium of readStadiums(rom)){
  const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent=stadium.name;details.append(summary);
  const palette=document.createElement('div');palette.className='palette';details.append(palette);
  const colors=(project.changes.stadiums?.[stadium.id]??stadium.colors).slice();
  colors.forEach((v,i)=>{const label=document.createElement('label');label.textContent=String(i+1);const input=document.createElement('input');input.type='color';input.value=bgrToHex(v);input.setAttribute('aria-label',stadium.name+' cor '+(i+1));input.oninput=()=>{colors[i]=hexToBgr(input.value);updateChange('stadiums',String(stadium.id),colors.slice(),stadium.colors);};label.append(input);palette.append(label);});
  const reset=document.createElement('button');reset.textContent='Restaurar cores originais';reset.onclick=()=>{delete project.changes.stadiums?.[stadium.id];render();};details.append(reset);$('stadiums').append(details);
 }
}
$('title').oninput=()=>{if($('title').value===project.base.title)delete project.changes.internalTitle;else project.changes.internalTitle=$('title').value;};
$('resetTitle').onclick=()=>{delete project.changes.internalTitle;render();};
