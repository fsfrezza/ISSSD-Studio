import {createDeluxeProject,buildDeluxeProject,IMPROVEMENTS,splitRom} from '../src/core/deluxe-project.mjs';
import {PLUS_STRATEGY_TEXTS,readPlusStrategyText} from '../src/core/plus-strategy-text.mjs';
const $=id=>document.getElementById(id);
let file=null,project=null,opening=0;
function status(value){$('status').textContent=value;}
function download(data,name,type){const url=URL.createObjectURL(new Blob([data],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function render(){
  $('texts').replaceChildren();
  if(!project)return;
  const {rom}=splitRom(file);
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
