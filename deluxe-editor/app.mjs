import {addDeluxeStructureGroup,prepareDeluxeStructure,validateDeluxeStructure} from '../src/core/deluxe-structure.mjs';
import {readDeluxeGroups,DELUXE_GROUP_LABELS,moveDeluxeGroupTeam} from '../src/core/deluxe-groups.mjs';
import {DELUXE_TEAMS,PLAYER_SKILLS,PLAYER_POSITIONS,readDeluxePlayer,planDeluxeJerseySwap,applyDeluxePlayers} from '../src/core/deluxe-players.mjs';
import {TITLE_LAYERS,titleBackgroundPixels,importTitleBackground,titleCompositePixels,transformTitleLayer} from '../src/core/deluxe-title-background.mjs';
import {createDeluxeProject,buildDeluxeProject,IMPROVEMENTS,splitRom} from '../src/core/deluxe-project.mjs';
import {PLUS_STRATEGY_TEXTS,readPlusStrategyText} from '../src/core/plus-strategy-text.mjs';
import {NATIVE_SCREEN_TEXT_FIELDS,CURSOR_HELP_FIELDS,readStadiums,readNativeField,readCursorHelp,encodeNativeField} from '../src/core/deluxe-native-fields.mjs';
import {encodeCursorText} from '../src/core/cursor-text-codec.mjs';
import {DELUXE_MENU_SECTIONS,encodeNativeMenuField} from '../src/core/deluxe-menu-text.mjs';
import {PLUS_MAIN_MENU_IDS,PLUS_MAIN_MENU_ORIGINAL,deluxeMainMenuPreview} from '../src/core/deluxe-main-menu.mjs';
import {SOUND_SLOTS,originalSound,selectedSound,soundEntry,decodeBrrPreview,galvaoSoundChoices,fb96SoundChoices} from '../src/core/deluxe-sounds.mjs';
import {GAME_AUDIO_RATE,prepareAudio,encodeBrr,pcmToWav} from '../src/core/audio-conversion.mjs';
import {TRAINING_HUD_FIELDS,MATCH_STATISTICS_FIELDS,encodeTrainingHud,renderMatchStatistics} from '../src/core/deluxe-match-texts.mjs';
import {TITLE_TEXT_FIELDS,TITLE_SUPPORTED_CHARACTERS,readTitleText,validateTitleText,readTitlePalettes} from '../src/core/deluxe-title-screen.mjs';
import {titleLogoPixels,importTitleLogo} from '../src/core/deluxe-title-logo.mjs';
const $=id=>document.getElementById(id);
let file=null,project=null,opening=0;
let audioContext=null,audioSource=null;
function status(value){$('status').textContent=value;}
function download(data,name,type){const url=URL.createObjectURL(new Blob([data],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function render(){
  for(const id of ['resetGroups','addStructureGroup','resetStructure'])$(id).disabled=!project;$('groupCards').replaceChildren();$('teamCards').replaceChildren();$('groupStatus').textContent='';
  for(const id of ['playerTeam','playerSelection','resetPlayer','resetPlayerTeam'])$(id).disabled=!project;
  $('playerFields').replaceChildren();$('playerStatus').textContent='';if(!project){$('playerTeam').replaceChildren();$('playerSelection').replaceChildren();}
  for(const id of ['texts','stadiums','nativeTexts','cursorHelp','menuTexts','mainMenu','trainingHud','matchStatistics','titleTexts','titlePalettes'])$(id).replaceChildren();
  for(const id of ['menuScale','menuSelection','resetMenu'])$(id).disabled=!project;
  if(!project){$('menuPreview').getContext('2d').clearRect(0,0,256,224);$('menuStatus').textContent='';}
  $('title').value='';$('title').disabled=!project;$('resetTitle').disabled=!project;
  for(const id of ['titleLogoFile','exportTitleLogo','resetTitleLogo','titleLayer','titleLayerFile','exportTitleLayer','resetTitleLayer','titleLayerX','titleLayerY','titleLayerScale','applyTitleTransform'])$(id).disabled=!project;
  if(!project){for(const id of ['titleComposite','titleLayerPreview'])$(id).getContext('2d').clearRect(0,0,256,224);$('titleLayerStatus').textContent='';$('titleLayerInfo').textContent='';$('titleLogoPreview').getContext('2d').clearRect(0,0,256,224);renderSounds();return;}
  const {rom}=splitRom(file);
  renderSounds();
  renderPlayers();
  renderGroups();
  renderTeams();
  renderTitleScreen(rom);
  renderNative(rom);
  renderMatchTexts(rom);
  renderMainMenu(rom);
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
$('export').onclick=async()=>{try{const result=await buildDeluxeProject(file,project);download(result.rom,'Deluxe-editado.'+(project.base.headerSize?'smc':'sfc'),'application/octet-stream');status('ROM gerada · '+result.diff.changedBytes+' bytes alterados · sem expansão.'+(project.changes.structure?' Estrutura experimental: '+project.changes.structure.teams.length+' equipes; valide no emulador.':''));}catch(error){status(error.message);}};

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
 for(const section of DELUXE_MENU_SECTIONS){
  const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent=section.title+' · '+section.fields.length+' campos';details.append(summary);$('menuTexts').append(details);
  for(const f of section.fields){
   const original=f[1],segments=f[3].pool.segments;
   textControl(details,{label:(f[3].label??f[0])+' · '+segments.map(s=>f[3].pool.capacity??s.original.length).join('/')+' células',value:project.changes.menuTexts?.[section.id]?.[f[0]]??original,original,multiline:segments.length>1,validate:v=>encodeNativeMenuField(f,v),onChange:v=>{
    const menus=project.changes.menuTexts??={},entries=menus[section.id]??={};
    if(v===original)delete entries[f[0]];else entries[f[0]]=v;
    if(!Object.keys(entries).length)delete menus[section.id];
    if(!Object.keys(menus).length)delete project.changes.menuTexts;
   }});
  }
 }
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

function updateMenu(id,value){
 const menu=project.changes.mainMenu??={texts:{},scale:80};
 if(id==='scale')menu.scale=value;
 else if(value===PLUS_MAIN_MENU_ORIGINAL[id])delete menu.texts[id];else menu.texts[id]=value;
 if(!Object.keys(menu.texts).length&&menu.scale===80)delete project.changes.mainMenu;
 drawMenu();
}
function drawMenu(){
 if(!project)return;
 try{
  const preview=deluxeMainMenuPreview(splitRom(file).rom,project.changes.mainMenu,Number($('menuSelection').value||0));
  const context=$('menuPreview').getContext('2d'),frame=context.createImageData(256,224);
  preview.pixels.forEach((v,i)=>{const color=v===17?[255,218,90]:v>=16?[8,14,27]:v?[168,201,242]:[8,14,27];frame.data.set([...color,255],i*4);});context.putImageData(frame,0,0);
  $('menuStatus').textContent=preview.regions.length?'Prévia atualizada. O menu cabe no espaço original.':'Menu original preservado.';
 }catch(error){$('menuPreview').getContext('2d').clearRect(0,0,256,224);$('menuStatus').textContent='Menu não pode ser gerado: '+error.message;}
}
function renderMainMenu(){
 $('menuSelection').replaceChildren();
 PLUS_MAIN_MENU_IDS.forEach((id,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=PLUS_MAIN_MENU_ORIGINAL[id];$('menuSelection').append(option);
  textControl($('mainMenu'),{label:PLUS_MAIN_MENU_ORIGINAL[id],value:project.changes.mainMenu?.texts?.[id]??PLUS_MAIN_MENU_ORIGINAL[id],original:PLUS_MAIN_MENU_ORIGINAL[id],multiline:true,validate:()=>{},onChange:value=>updateMenu(id,value)});
 });
 $('menuSelection').value='0';$('menuScale').value=project.changes.mainMenu?.scale??80;drawMenu();
}
$('menuScale').oninput=()=>updateMenu('scale',Number($('menuScale').value));
$('menuSelection').onchange=drawMenu;
$('resetMenu').onclick=()=>{delete project.changes.mainMenu;render();};

function stopAudio(){if(audioSource){audioSource.stop();audioSource=null;}}
function renderSounds(){
 stopAudio();
 for(const id of ['soundSelection','soundRate','soundFile','playOriginal','playSound','stopSound','downloadSound','downloadWav','resetSound','resetAllSounds','playGalvao','useGalvao','allGalvao','playFb96','useFb96','allFb96'])$(id).disabled=!project;
 if(!project){$('soundSelection').replaceChildren();$('soundInfo').textContent='';$('soundStatus').textContent='';return;}
 const previous=$('soundSelection').value;$('soundSelection').replaceChildren();
 for(const s of SOUND_SLOTS){const option=document.createElement('option');option.value=s.id;option.textContent=(s.kind==='voice'?'Voz · ':'Efeito · ')+s.id.replace(/([a-z])([A-Z])/g,'$1 $2');$('soundSelection').append(option);}
 $('soundSelection').value=SOUND_SLOTS.some(s=>s.id===previous)?previous:SOUND_SLOTS[0].id;updateSoundInfo();
}
function updateSoundInfo(){
 if(!project)return;const id=$('soundSelection').value,base=splitRom(file).rom,original=originalSound(base,id),current=selectedSound(base,id,project.changes.sounds);
 $('soundInfo').textContent=current.length+' de '+original.length+' bytes · '+(project.changes.sounds?.[id]?.source==='fb96'?'FB96':project.changes.sounds?.[id]?.source==='galvao'?'Galvão':project.changes.sounds?.[id]?'amostra substituída':'original');
}
async function playAudio(original){
 try{stopAudio();const base=splitRom(file).rom,id=$('soundSelection').value,bytes=original?originalSound(base,id):selectedSound(base,id,project.changes.sounds),samples=decodeBrrPreview(bytes);
 const Context=window.AudioContext??window.webkitAudioContext;if(!Context)throw Error('Reprodução não suportada neste navegador');
 audioContext??=new Context();await audioContext.resume();const buffer=audioContext.createBuffer(1,samples.length,Number($('soundRate').value));buffer.copyToChannel(samples,0);audioSource=audioContext.createBufferSource();audioSource.buffer=buffer;audioSource.connect(audioContext.destination);audioSource.start();$('soundStatus').textContent='Reproduzindo prévia aproximada.';
 }catch(error){$('soundStatus').textContent=error.message;}
}
$('soundSelection').onchange=()=>{stopAudio();updateSoundInfo();$('soundStatus').textContent='';};
$('playOriginal').onclick=()=>playAudio(true);$('playSound').onclick=()=>playAudio(false);$('stopSound').onclick=stopAudio;
$('soundFile').onchange=async()=>{
 const current=file,p=project,id=$('soundSelection').value;
 try{const selected=$('soundFile').files[0];if(!selected)return;const base=splitRom(current).rom,limit=originalSound(base,id).length;
 let bytes,info;
 if(selected.name?.toLowerCase().endsWith('.brr')||!selected.name){
  if(selected.size>limit)throw Error('Amostra excede o espaço original de '+limit+' bytes');
  bytes=new Uint8Array(await selected.arrayBuffer());info='Arquivo BRR importado.';
 }else{
  const Context=window.AudioContext??window.webkitAudioContext;if(!Context)throw Error('Conversão de áudio indisponível neste navegador');
  audioContext??=new Context();$('soundStatus').textContent='Convertendo áudio…';
  const decoded=await audioContext.decodeAudioData(await selected.arrayBuffer()),prepared=prepareAudio(Array.from({length:decoded.numberOfChannels},(_,i)=>decoded.getChannelData(i)),decoded.sampleRate);
  bytes=encodeBrr(prepared.samples,limit);info=selected.name+' · '+prepared.originalDuration.toFixed(2)+' s → '+prepared.duration.toFixed(2)+' s após remover silêncio · '+bytes.length+'/'+limit+' bytes BRR. Sem acelerar a fala.';
 }
 const entry=soundEntry(base,id,bytes);
 if(file!==current||project!==p)return;
 const original=originalSound(base,id);if(bytes.length===original.length&&bytes.every((b,i)=>b===original[i]))delete project.changes.sounds?.[id];else (project.changes.sounds??={})[id]=entry;
 updateSoundInfo();$('soundStatus').textContent=info+' Salve o projeto ou gere a ROM para aplicar.';
 }catch(error){$('soundStatus').textContent=error.message;}finally{$('soundFile').value='';}
};
$('downloadSound').onclick=()=>{try{const id=$('soundSelection').value;download(selectedSound(splitRom(file).rom,id,project.changes.sounds),id+'.brr','application/octet-stream');}catch(error){$('soundStatus').textContent=error.message;}};
$('resetSound').onclick=()=>{stopAudio();delete project.changes.sounds?.[$('soundSelection').value];updateSoundInfo();$('soundStatus').textContent='Amostra original restaurada.';};

$('downloadWav').onclick=()=>{try{const id=$('soundSelection').value,samples=decodeBrrPreview(selectedSound(splitRom(file).rom,id,project.changes.sounds));download(pcmToWav(samples),id+'.wav','audio/wav');}catch(error){$('soundStatus').textContent=error.message;}};
$('resetAllSounds').onclick=()=>{stopAudio();delete project.changes.sounds;updateSoundInfo();$('soundStatus').textContent='Todos os sons originais foram restaurados.';};

const soundPresets={
 galvao:{label:'Galvão',file:'galvao-samples.json',choices:galvaoSoundChoices},
 fb96:{label:'FB96',file:'fb96-samples.json',choices:fb96SoundChoices},
};
const presetPromises={};
async function soundReference(source){
 const preset=soundPresets[source];
 if(!presetPromises[source])presetPromises[source]=fetch('/deluxe-editor/'+preset.file).then(async response=>{if(!response.ok)throw Error('Não foi possível carregar '+preset.label);return response.json();}).catch(error=>{delete presetPromises[source];throw error;});
 return presetPromises[source];
}
async function applySoundPreset(source,all){
 const current=file,p=project,id=$('soundSelection').value,preset=soundPresets[source];
 try{const reference=await soundReference(source),base=splitRom(current).rom,values=preset.choices(base,reference,all?undefined:[id]);
 if(project!==p||file!==current)return;
 stopAudio();project.changes.sounds={...project.changes.sounds,...values};updateSoundInfo();$('soundStatus').textContent=preset.label+(all?' aplicado aos 74 sons catalogados.':' aplicado ao som selecionado.')+' Salve o projeto ou gere a ROM.';
 }catch(error){$('soundStatus').textContent=error.message;}
}
async function previewSoundPreset(source){
 const p=project,current=file,id=$('soundSelection').value,preset=soundPresets[source];
 try{const reference=await soundReference(source);if(project!==p||file!==current)return;stopAudio();
 const choices=preset.choices(splitRom(current).rom,reference,[id]),samples=decodeBrrPreview(selectedSound(splitRom(current).rom,id,choices));
 const Context=window.AudioContext??window.webkitAudioContext;if(!Context)throw Error('Reprodução não suportada neste navegador');audioContext??=new Context();await audioContext.resume();
 const buffer=audioContext.createBuffer(1,samples.length,Number($('soundRate').value));buffer.copyToChannel(samples,0);audioSource=audioContext.createBufferSource();audioSource.buffer=buffer;audioSource.connect(audioContext.destination);audioSource.start();$('soundStatus').textContent='Reproduzindo prévia '+preset.label+'.';
 }catch(error){$('soundStatus').textContent=error.message;}
}
for(const [source,suffix]of [['galvao','Galvao'],['fb96','Fb96']]){
 $('use'+suffix).onclick=()=>applySoundPreset(source,false);$('all'+suffix).onclick=()=>applySoundPreset(source,true);$('play'+suffix).onclick=()=>previewSoundPreset(source);
}

function renderMatchTexts(rom){
 for(const [section,fields]of [['trainingHud',TRAINING_HUD_FIELDS],['matchStatistics',MATCH_STATISTICS_FIELDS]]){
  for(const f of fields){const [id,original]=f;
   textControl($(section),{label:original,value:project.changes[section]?.[id]??original,original,validate:v=>{if(section==='trainingHud')encodeTrainingHud(f,v);else renderMatchStatistics({[id]:v},rom);},onChange:v=>updateChange(section,id,v,original)});
  }
 }
}

function titleChange(kind,id,value,original){
 const title=project.changes.titleScreen??={},items=title[kind]??={};
 if(JSON.stringify(value)===JSON.stringify(original))delete items[id];else items[id]=value;
 if(!Object.keys(items).length)delete title[kind];if(!Object.keys(title).length)delete project.changes.titleScreen;
}
function renderTitleScreen(rom){
 drawTitleLogo();
 for(const f of TITLE_TEXT_FIELDS){const original=readTitleText(rom,f);textControl($('titleTexts'),{label:f.label+' · até '+f.count+' letras',value:project.changes.titleScreen?.texts?.[f.id]??original,original,validate:v=>validateTitleText(v,f),onChange:v=>titleChange('texts',f.id,v,original)});}
 const hint=document.createElement('p');hint.className='hint';hint.textContent='Caracteres da fonte original: '+TITLE_SUPPORTED_CHARACTERS+'. Espaços são permitidos.';$('titleTexts').append(hint);
 for(const p of readTitlePalettes(rom)){
  const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent=p.label;details.append(summary);const palette=document.createElement('div');palette.className='palette';details.append(palette);
  const colors=(project.changes.titleScreen?.palettes?.[p.id]??p.colors).slice();
  colors.forEach((v,i)=>{const label=document.createElement('label');label.textContent=String(i+1);const input=document.createElement('input');input.type='color';input.value=bgrToHex(v);input.setAttribute('aria-label',p.label+' cor '+(i+1));input.oninput=()=>{colors[i]=hexToBgr(input.value);titleChange('palettes',p.id,colors.slice(),p.colors);drawTitleLogo();};label.append(input);palette.append(label);});
  const reset=document.createElement('button');reset.textContent='Restaurar cores originais';reset.onclick=()=>{titleChange('palettes',p.id,p.colors,p.colors);render();};details.append(reset);$('titlePalettes').append(details);
 }
}

function drawTitleLogo(){
 if(!project)return;const preview=titleLogoPixels(splitRom(file).rom,project.changes.titleScreen),canvas=$('titleLogoPreview');canvas.width=preview.width;canvas.height=preview.height;
 const context=canvas.getContext('2d'),image=context.createImageData(preview.width,preview.height);image.data.set(preview.rgba);context.putImageData(image,0,0);
 drawTitleComposition();
 $('titleLogoInfo').textContent=preview.width+' × '+preview.height+' pixels. Transparência e paleta do letreiro são preservadas. A estrutura de sprites original limita a área editável.';
}
$('titleLogoFile').onchange=async()=>{
 const p=project,current=file;let bitmap;
 try{const selected=$('titleLogoFile').files[0];if(!selected)return;bitmap=await createImageBitmap(selected);const expected=titleLogoPixels(splitRom(current).rom,p.changes.titleScreen);if(bitmap.width!==expected.width||bitmap.height!==expected.height)throw Error('Use uma imagem de '+expected.width+' × '+expected.height+' pixels');const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;const context=canvas.getContext('2d');context.drawImage(bitmap,0,0);
 const tiles=importTitleLogo(splitRom(current).rom,p.changes.titleScreen??{},context.getImageData(0,0,canvas.width,canvas.height).data,canvas.width,canvas.height),trial=structuredClone(p);(trial.changes.titleScreen??={}).logoTiles=Array.from(tiles);await buildDeluxeProject(current,trial);
 if(project!==p||file!==current)return;(project.changes.titleScreen??={}).logoTiles=Array.from(tiles);drawTitleLogo();$('titleLogoStatus').textContent='Letreiro convertido. Salve o projeto ou gere a ROM.';
 }catch(error){$('titleLogoStatus').textContent=error.message;}finally{bitmap?.close();$('titleLogoFile').value='';}
};
$('exportTitleLogo').onclick=()=>{try{$('titleLogoPreview').toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Letreiro-Deluxe.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},'image/png');}catch(error){$('titleLogoStatus').textContent=error.message;}};
$('resetTitleLogo').onclick=()=>{delete project.changes.titleScreen?.logoTiles;drawTitleLogo();$('titleLogoStatus').textContent='Letreiro original restaurado.';};

function selectedTitleLayer(){return $('titleLayer').value||'ball';}
function layerImage(base,id,changes){return id==='logo'?titleLogoPixels(base,changes):titleBackgroundPixels(base,id,changes);}
function drawTitleCanvas(id,p){const c=$(id);c.width=p.width;c.height=p.height;const ctx=c.getContext('2d'),im=ctx.createImageData(p.width,p.height);im.data.set(p.rgba);ctx.putImageData(im,0,0);}
function drawTitleComposition(){if(!project)return;const base=splitRom(file).rom,changes=project.changes.titleScreen??{},id=selectedTitleLayer(),p=layerImage(base,id,changes);drawTitleCanvas('titleComposite',titleCompositePixels(base,changes));drawTitleCanvas('titleLayerPreview',p);$('titleLayerInfo').textContent=p.width+' × '+p.height+' pixels. Use PNG/WebP deste tamanho. Cores convertidas para a paleta nativa; conflitos e excesso de espaço bloqueiam a aplicação.';}
function titleLayerKey(id){return id==='logo'?'logoTiles':id==='photos'?'photoTiles':'backgroundTiles';}
async function commitTitleLayer(p,current,id,image){const base=splitRom(current).rom,changes=p.changes.titleScreen??{},raw=id==='logo'?importTitleLogo(base,changes,image.rgba,image.width,image.height):importTitleBackground(base,id,changes,image.rgba,image.width,image.height),trial=structuredClone(p),key=titleLayerKey(id);(trial.changes.titleScreen??={})[key]=Array.from(raw);await buildDeluxeProject(current,trial);if(project!==p||file!==current)return false;(project.changes.titleScreen??={})[key]=Array.from(raw);drawTitleLogo();$('titleLayerStatus').textContent='Camada convertida e validada para gravação na ROM. Salve o projeto ou gere a ROM.';return true;}
$('titleLayer').onchange=()=>{for(const [id,v]of [['titleLayerX',0],['titleLayerY',0],['titleLayerScale',100]])$(id).value=v;$('titleLayerStatus').textContent='';drawTitleComposition();};
$('titleLayerFile').onchange=async()=>{const p=project,current=file,id=selectedTitleLayer();let bitmap;try{const f=$('titleLayerFile').files[0];if(!f)return;bitmap=await createImageBitmap(f);const expected=layerImage(splitRom(current).rom,id,p.changes.titleScreen??{});if(bitmap.width!==expected.width||bitmap.height!==expected.height)throw Error('Use uma imagem de '+expected.width+' × '+expected.height+' pixels');const c=document.createElement('canvas');c.width=bitmap.width;c.height=bitmap.height;const ctx=c.getContext('2d');ctx.drawImage(bitmap,0,0);await commitTitleLayer(p,current,id,{width:c.width,height:c.height,rgba:ctx.getImageData(0,0,c.width,c.height).data});}catch(e){$('titleLayerStatus').textContent=e.message;}finally{bitmap?.close();$('titleLayerFile').value='';}};
$('applyTitleTransform').onclick=async()=>{const p=project,current=file,id=selectedTitleLayer();try{const image=layerImage(splitRom(current).rom,id,p.changes.titleScreen??{}),next=transformTitleLayer(image,{x:Number($('titleLayerX').value),y:Number($('titleLayerY').value),scale:Number($('titleLayerScale').value)});if(await commitTitleLayer(p,current,id,next)){ $('titleLayerX').value=0;$('titleLayerY').value=0;$('titleLayerScale').value=100;}}catch(e){$('titleLayerStatus').textContent=e.message;}};
$('exportTitleLayer').onclick=()=>{try{$('titleLayerPreview').toBlob(blob=>{if(blob)download(blob,'Deluxe-'+selectedTitleLayer()+'.png','image/png');},'image/png');}catch(e){$('titleLayerStatus').textContent=e.message;}};
$('resetTitleLayer').onclick=async()=>{if(!project)return;const p=project,current=file,id=selectedTitleLayer(),changes=structuredClone(p.changes.titleScreen??{}),key=titleLayerKey(id);delete changes[key];try{if(await commitTitleLayer(p,current,id,layerImage(splitRom(current).rom,id,changes)))$('titleLayerStatus').textContent='Camada original restaurada; as demais camadas foram preservadas.';}catch(e){$('titleLayerStatus').textContent=e.message;}};

function option(parent,value,label){const o=document.createElement('option');o.value=String(value);o.textContent=label;parent.append(o);}
function renderPlayers(){
 if(!project)return;const base=playerBase(),names=teamNames(),team=Math.min(Number($('playerTeam').value)||0,names.length-1),player=Number($('playerSelection').value)||0;
 $('playerCount').textContent=names.length+' equipes · 20 jogadores';$('playerTeam').replaceChildren();names.forEach((label,i)=>option($('playerTeam'),i,label));$('playerTeam').value=team;
 $('playerSelection').replaceChildren();for(let i=0;i<20;i++){const p=readDeluxePlayer(base,team,i,project.changes.players);option($('playerSelection'),i,(i+1)+' · '+p.name+' · Nº '+p.jersey);}$('playerSelection').value=player;
 $('playerFields').replaceChildren();const p=readDeluxePlayer(base,team,player,project.changes.players),original=readDeluxePlayer(base,team,player),id=team+':'+player;
 function change(edit){const next=structuredClone(project.changes.players??{});next[id]=edit;return next;}
 function commit(next){try{applyDeluxePlayers(base.slice(),base,next);project.changes.players=next;$('playerStatus').textContent='Alterações aplicadas ao projeto. Salve ou gere a ROM.';renderPlayers();return true;}catch(e){$('playerStatus').textContent=e.message;return false;}}
 function control(label,value,type,onChange,min,max){const l=document.createElement('label'),input=document.createElement('input');l.textContent=label;input.type=type;input.value=value;if(min!==undefined)input.min=min;if(max!==undefined)input.max=max;if(type==='number')input.step=1;else input.maxLength=8;input.onchange=()=>{const ok=onChange(type==='number'?Number(input.value):input.value);if(!ok)input.value=value;};l.append(input);$('playerFields').append(l);return input;}
 control('Nome · até 8 caracteres; centralizado na ROM',p.name,'text',v=>commit(change({...project.changes.players?.[id],name:v})));
 control('Número da camisa',p.jersey,'number',v=>{try{return commit(planDeluxeJerseySwap(base,project.changes.players??{},team,player,v));}catch(e){$('playerStatus').textContent=e.message;return false;}},1,20);
 const l=document.createElement('label'),select=document.createElement('select');l.textContent='Posição natural';PLAYER_POSITIONS.forEach((label,i)=>option(select,i,label));select.value=p.naturalPosition;select.onchange=()=>{if(!commit(change({...project.changes.players?.[id],naturalPosition:Number(select.value)})))select.value=p.naturalPosition;};l.append(select);$('playerFields').append(l);
 for(const [key,label]of Object.entries(PLAYER_SKILLS))control(label,p.skills[key],'number',v=>commit(change({...project.changes.players?.[id],skills:{...project.changes.players?.[id]?.skills,[key]:v}})),1,10);
 $('resetPlayer').onclick=()=>{const next=structuredClone(project.changes.players??{}),current=readDeluxePlayer(base,team,player,next);if(current.jersey!==original.jersey){const swapped=planDeluxeJerseySwap(base,next,team,player,original.jersey);delete swapped[id];commit(swapped);}else{delete next[id];commit(next);}};
 $('resetPlayerTeam').onclick=()=>{const next=structuredClone(project.changes.players??{});for(let i=0;i<20;i++)delete next[team+':'+i];commit(next);};
}
$('playerTeam').onchange=()=>{$('playerSelection').value=0;renderPlayers();$('playerStatus').textContent='';};
$('playerSelection').onchange=()=>{renderPlayers();$('playerStatus').textContent='';};

function renderGroups(){
 if(!project)return;const groups=project.changes.structure?.groups??project.changes.groups??readDeluxeGroups(splitRom(file).rom);$('addStructureGroup').disabled=groups.length>=9;$('groupCards').replaceChildren();
 groups.forEach((group,g)=>{const card=document.createElement('details'),summary=document.createElement('summary'),body=document.createElement('div');card.className='card';card.open=true;summary.textContent=project.changes.structure?.labels?.[g]??DELUXE_GROUP_LABELS[g]??('GRUPO '+(g+1));body.className='card-body';card.append(summary,body);
 if(project.changes.structure){const l=document.createElement('label'),input=document.createElement('input');l.textContent='Título no projeto e no Editor';input.value=summary.textContent;input.maxLength=32;input.onchange=()=>{if(!input.value.trim())return;project.changes.structure.labels??=groups.map((_,i)=>DELUXE_GROUP_LABELS[i]??('GRUPO '+(i+1)));project.changes.structure.labels[g]=input.value.trim();renderGroups();};l.append(input);body.append(l);}
 group.forEach((team,slot)=>{const label=document.createElement('label'),select=document.createElement('select');label.textContent='Vaga '+(slot+1);teamNames().forEach((name,id)=>option(select,id,name));select.value=team;select.onchange=()=>{const wanted=Number(select.value);let fromGroup=-1,fromSlot=-1;groups.forEach((row,i)=>{const at=row.indexOf(wanted);if(at>=0){fromGroup=i;fromSlot=at;}});try{if(project.changes.structure){const next=structuredClone(project.changes.structure);[next.groups[fromGroup][fromSlot],next.groups[g][slot]]=[next.groups[g][slot],next.groups[fromGroup][fromSlot]];validateDeluxeStructure(next);project.changes.structure=next;}else project.changes.groups=moveDeluxeGroupTeam(groups,fromGroup,fromSlot,g,slot);renderGroups();$('groupStatus').textContent='Organização aplicada ao projeto. Salve ou gere a ROM.';}catch(e){select.value=team;$('groupStatus').textContent=e.message;}};label.append(select);body.append(label);});$('groupCards').append(card);});
}
$('resetGroups').onclick=()=>{if(project.changes.structure){const n=project.changes.structure.teams.length;project.changes.structure.groups=[...readDeluxeGroups(splitRom(file).rom),...Array.from({length:n/6-6},(_,g)=>Array.from({length:6},(_,i)=>36+g*6+i))];}else delete project.changes.groups;renderGroups();$('groupStatus').textContent='Grupos originais restaurados.';};

var structureCache;
function teamNames(){return project?.changes.structure?.teams.map(t=>t.name)??DELUXE_TEAMS;}
function playerBase(){const key=JSON.stringify(project.changes.structure);if(structureCache?.file!==file||structureCache?.key!==key)structureCache={file,key,base:prepareDeluxeStructure(splitRom(file).rom,project.changes.structure)};return structureCache.base;}
function renderTeams(){if(!project)return;$('teamCards').replaceChildren();if(!project.changes.structure)return;project.changes.structure.teams.forEach((t,i)=>{const d=document.createElement('details'),summary=document.createElement('summary'),body=document.createElement('div');d.className='card';summary.textContent=(i+1)+' · '+t.name;body.className='card-body';d.append(summary,body);const label=document.createElement('label'),input=document.createElement('input');label.textContent='Nome no projeto e no Editor';input.value=t.name;input.maxLength=32;input.onchange=()=>{if(!input.value.trim()){input.value=t.name;return;}t.name=input.value.trim();renderTeams();renderGroups();renderPlayers();};label.append(input);body.append(label);if(i>=36){const l=document.createElement('label'),sel=document.createElement('select');l.textContent='Equipe-base para elenco e recursos visuais';DELUXE_TEAMS.forEach((name,id)=>option(sel,id,name));sel.value=t.sourceTeam;sel.onchange=()=>{t.sourceTeam=Number(sel.value);renderPlayers();};l.append(sel);body.append(l);}$('teamCards').append(d);});}
$('addStructureGroup').onclick=()=>{try{project.changes.structure=addDeluxeStructureGroup(splitRom(file).rom,project.changes.structure,project.changes.groups);delete project.changes.groups;render();$('groupStatus').textContent='Estrutura experimental: '+project.changes.structure.teams.length+' equipes. Confira a ROM no emulador antes de usar.';}catch(e){$('groupStatus').textContent=e.message;}};
$('resetStructure').onclick=()=>{delete project.changes.structure;delete project.changes.groups;for(const key of Object.keys(project.changes.players??{}))if(Number(key.split(':')[0])>=36)delete project.changes.players[key];$('playerTeam').value=0;render();$('groupStatus').textContent='Estrutura original restaurada. As edições dos 36 elencos nativos foram preservadas.';};
