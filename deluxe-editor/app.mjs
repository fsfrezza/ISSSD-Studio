import {IMPROVEMENT_SECTIONS,deluxeImprovementState,deluxeStructureSummary} from '../src/core/deluxe-improvements.mjs';
import {availablePlusTeams,addPlusCatalogGroup,applyPlusGroupOrganization} from '../src/core/deluxe-group-catalog.mjs';
import {deluxeGroupView,swapDeluxeProjectGroups,structureGroupRows,setStructureGroupRows} from '../src/core/deluxe-team-identity.mjs';
import {TITLE_FONT_ROWS} from '../src/core/title-font-glyphs.mjs';
import {installTitleComposer} from './title-composer.mjs';
import {titlePhotoPixels,importTitlePhoto} from '../src/core/deluxe-title-photos.mjs';
import {textPresetFields,applyTextPreset} from '../src/core/deluxe-text-presets.mjs';
import {deluxeMainMenuScene} from '../src/core/deluxe-main-menu-scene.mjs';
import {addDeluxeStructureGroup,prepareDeluxeStructure,validateDeluxeStructure} from '../src/core/deluxe-structure.mjs';
import {readDeluxeGroups,DELUXE_GROUP_LABELS,moveDeluxeGroupTeam} from '../src/core/deluxe-groups.mjs';
import {DELUXE_TEAMS,PLAYER_SKILLS,PLAYER_POSITIONS,readDeluxePlayer,planDeluxeJerseySwap,applyDeluxePlayers} from '../src/core/deluxe-players.mjs';
import {TITLE_LAYERS,titleBackgroundPixels,importTitleBackground,titleCompositePixels,transformTitleLayer} from '../src/core/deluxe-title-background.mjs';
import {createDeluxeProject,buildDeluxeProject,DELUXE_SCHEMA,splitRom} from '../src/core/deluxe-project.mjs';
import {PLUS_STRATEGY_TEXTS,readPlusStrategyText,encodePlusStrategyText} from '../src/core/plus-strategy-text.mjs';
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
let file=null,project=null,opening=0,pendingProject=null;
let audioContext=null,audioSource=null;
function status(value){$('status').textContent=value;}
function requestProjectRom(){try{$('rom').click();}catch{$('status').textContent='O navegador não abriu o seletor automaticamente. Use Selecionar ROM e abrir projeto.';}}
$('selectProjectRom').onclick=requestProjectRom;
function showProjectRomRequest(value,name='Projeto Deluxe'){$('projectRomRequest').hidden=!value;$('pendingProjectName').textContent=value?name:'';}

function download(data,name,type){const url=URL.createObjectURL(new Blob([data],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function render(){
  renderImprovements();
  if(!project)renderTextActions();
  for(const id of ['resetGroups','addStructureGroup','resetStructure','teamSelection'])$(id).disabled=!project;$('groupCards').replaceChildren();$('teamCards').replaceChildren();if(!project)$('teamSelection').replaceChildren();$('groupStatus').textContent='';$('newGroupPanel').hidden=true;$('applyPlusGroups').disabled=!project;
  for(const id of ['playerTeam','playerSelection','resetPlayer','resetPlayerTeam'])$(id).disabled=!project;
  $('playerFields').replaceChildren();$('playerStatus').textContent='';if(!project){$('playerTeam').replaceChildren();$('playerSelection').replaceChildren();}
  for(const id of ['texts','stadiums','nativeTexts','cursorHelp','menuTexts','mainMenu','trainingHud','matchStatistics','titleTexts','titlePalettes'])$(id).replaceChildren();
  for(const id of ['menuScale','menuSelection','resetMenu'])$(id).disabled=!project;
  if(!project){$('menuPreview').getContext('2d').clearRect(0,0,256,224);$('menuStatus').textContent='';}
  $('title').value='';$('title').disabled=!project;$('resetTitle').disabled=!project;
  if(!project){titleComposer.render();renderSounds();return;}
  const {rom}=splitRom(file);
  renderSounds();
  renderPlayers();
  renderGroups();
  renderTeams();
  renderTitleScreen(rom);
  renderNative(rom);
  renderMatchTexts(rom);
  renderMainMenu(rom);
  for(const item of PLUS_STRATEGY_TEXTS){const original=readPlusStrategyText(rom,item.id);textControl($('texts'),{scope:'texts',key:item.id,label:item.label,value:project.changes.strategyTexts[item.id]??original,original,validate:v=>encodePlusStrategyText(v),onChange:v=>{if(v===original)delete project.changes.strategyTexts[item.id];else project.changes.strategyTexts[item.id]=v;}});}
  renderTextActions();
}
function renderImprovements(){
 const root=$('improvements');root.replaceChildren();
 const summary=document.createElement('p');summary.className='improvements-project';summary.textContent=deluxeStructureSummary(project);root.append(summary);
 for(const section of IMPROVEMENT_SECTIONS){
  const card=document.createElement('details'),heading=document.createElement('summary'),body=document.createElement('div'),description=document.createElement('p');card.className='card';card.open=true;heading.textContent=section.title;body.className='card-body improvements-list';description.className='help';description.textContent=section.description;body.append(description);card.append(heading,body);
  for(const item of section.items){const row=document.createElement('div'),title=document.createElement('strong'),badge=document.createElement('span'),detail=document.createElement('p'),state=deluxeImprovementState(item,project);row.className='improvement-row';row.setAttribute('data-improvement',item.id);title.textContent=item.label;badge.className='improvement-status status-'+state.kind;badge.textContent=state.label;detail.textContent=item.description;row.append(title,badge,detail);body.append(row);}
  root.append(card);
 }
}
renderImprovements();
$('rom').onchange=async()=>{
 const selected=$('rom').files[0];if(!selected)return;
 const token=++opening,pending=pendingProject;
 try{const bytes=new Uint8Array(await selected.arrayBuffer()),p=await createDeluxeProject(bytes);if(pending)await buildDeluxeProject(bytes,pending);if(token!==opening)return;file=bytes;project=pending??p;pendingProject=null;showProjectRomRequest(false);render();for(const id of ['save','export'])$(id).disabled=false;status(pending?'Projeto Deluxe reaberto com a ROM selecionada.':'Deluxe original reconhecido · 2 MB. Sem edições, a exportação preserva o arquivo inteiro.');}catch(error){if(token===opening)status(error.message+(pending?' O projeto continua aguardando a ROM correta. Clique em Abrir ROM para tentar novamente.':''));}finally{$('rom').value='';}
};
$('rom').addEventListener('cancel',()=>{if(pendingProject)status('Seleção de ROM cancelada. O projeto continua aguardando; clique em Abrir ROM para continuar.');});
$('save').onclick=async()=>{try{await buildDeluxeProject(file,project);download(JSON.stringify(project,null,2),'Deluxe.issdproj','application/json');}catch(error){status(error.message);}};
$('load').onchange=async()=>{
 const selected=$('load').files[0];if(!selected)return;const token=++opening;pendingProject=null;showProjectRomRequest(false);
 try{const p=JSON.parse(await selected.text());if(token!==opening)return;if(p?.schema!==DELUXE_SCHEMA||p.version!==1||!p.base||!p.changes)throw Error('Selecione um projeto do Editor Deluxe válido.');
 if(!file){pendingProject=p;showProjectRomRequest(true,selected.name??'Projeto Deluxe');status('Projeto selecionado. Escolha a ROM Deluxe original (USA) no botão Selecionar ROM e abrir projeto.');requestProjectRom();return;}
 const current=file;await buildDeluxeProject(current,p);if(token!==opening||file!==current)return;project=p;render();status('Projeto Deluxe reaberto.');
 }catch(error){if(token===opening)status(error.message);}finally{$('load').value='';}
};
$('export').onclick=async()=>{try{const result=await buildDeluxeProject(file,project);download(result.rom,'Deluxe-editado.'+(project.base.headerSize?'smc':'sfc'),'application/octet-stream');status('ROM gerada · '+result.diff.changedBytes+' bytes alterados · '+(result.expanded?'4 MB.':'sem expansão.')+(project.changes.structure?' Estrutura experimental: '+project.changes.structure.teams.length+' equipes; valide no emulador.':'')+(project.changes.titleComposer&&!project.changes.titleComposer.prepared?' Há um rascunho de composição não implementado.':''));}catch(error){status(error.message);}};

function updateChange(section,key,value,original){
 const entries=project.changes[section]??={};
 if(JSON.stringify(value)===JSON.stringify(original))delete entries[key];else entries[key]=value;
 if(!Object.keys(entries).length)delete project.changes[section];
}
function textControl(container,{label,value,original,multiline=false,validate,onChange,scope,key}){
 const row=document.createElement('label');row.textContent=label;
 const input=document.createElement(multiline?'textarea':'input');if(!multiline)input.type='text';
 if(multiline)input.rows=Math.min(10,original.split('\n').length+1);
 input.value=value;
 input.addEventListener('input',()=>{try{validate(input.value);input.setCustomValidity('');onChange(input.value);}catch(e){input.setCustomValidity(e.message);onChange(input.value);} });
 const reset=document.createElement('button');reset.type='button';reset.textContent='Restaurar original';
 reset.onclick=()=>{input.value=original;input.setCustomValidity('');onChange(original);};
 row.append(input,reset);
 const pt=textPt(scope,key);if(typeof pt==='string'){const button=document.createElement('button');button.type='button';button.textContent='Português';button.onclick=()=>{try{validate(pt);input.value=pt;input.setCustomValidity('');onChange(pt);}catch(e){input.setCustomValidity(e.message);status(e.message);}};row.append(button);}
 container.append(row);
}
const bgrToHex=v=>'#'+[0,5,10].map(shift=>Math.round(((v>>shift)&31)*255/31).toString(16).padStart(2,'0')).join('');
const hexToBgr=hex=>[1,3,5].reduce((v,at,i)=>v|(Math.round(parseInt(hex.slice(at,at+2),16)*31/255)<<(i*5)),0);
function renderNative(rom){
 $('title').value=project.changes.internalTitle??project.base.title;
 for(const section of DELUXE_MENU_SECTIONS){
  const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent=section.title+' · '+section.fields.length+' campos';details.append(summary);$('menuTexts').append(details);
  for(const f of section.fields){
   const original=f[1],segments=f[3].pool.segments;
   textControl(details,{scope:'menuTexts',key:section.id+'/'+f[0],label:(f[3].label??f[0])+' · '+segments.map(s=>f[3].pool.capacity??s.original.length).join('/')+' células',value:project.changes.menuTexts?.[section.id]?.[f[0]]??original,original,multiline:segments.length>1,validate:v=>encodeNativeMenuField(f,v),onChange:v=>{
    const menus=project.changes.menuTexts??={},entries=menus[section.id]??={};
    if(v===original)delete entries[f[0]];else entries[f[0]]=v;
    if(!Object.keys(entries).length)delete menus[section.id];
    if(!Object.keys(menus).length)delete project.changes.menuTexts;
   }});
  }
  const actions=document.createElement('div');actions.className='preset-toolbar';addPresetButtons(actions,section.id);details.append(actions);
 }
 for(const f of NATIVE_SCREEN_TEXT_FIELDS){
  const original=readNativeField(rom,f);
  textControl($('nativeTexts'),{scope:'nativeTexts',key:String(f.pc),label:f.name+' · até '+f.capacity+' caracteres',value:project.changes.nativeTexts?.[f.pc]??original,original,validate:v=>encodeNativeField(v,f),onChange:v=>updateChange('nativeTexts',String(f.pc),v,original)});
 }
 for(const f of CURSOR_HELP_FIELDS){
  const original=readCursorHelp(rom,f),details=document.createElement('details'),summary=document.createElement('summary');summary.textContent=f[3].label??f[0];details.append(summary);$('cursorHelp').append(details);
  textControl(details,{scope:'cursorHelp',key:f[0],label:'Instrução',value:project.changes.cursorHelp?.[f[0]]??original,original,multiline:true,validate:v=>encodeCursorText(f,v),onChange:v=>updateChange('cursorHelp',f[0],v,original)});
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
  const preview=deluxeMainMenuScene(splitRom(file).rom,project.changes.mainMenu,Number($('menuSelection').value||0));
  const context=$('menuPreview').getContext('2d'),frame=context.createImageData(256,224);
  frame.data.set(preview.rgba);context.putImageData(frame,0,0);
  Array.from($('menuSelection').children).forEach((option,i)=>option.textContent=(project.changes.mainMenu?.texts?.[PLUS_MAIN_MENU_IDS[i]]??PLUS_MAIN_MENU_ORIGINAL[PLUS_MAIN_MENU_IDS[i]]).replace(/\n/g,' '));
  $('menuStatus').textContent=preview.regions.length?'Prévia atualizada. O menu cabe no espaço original.':'Menu original preservado.';
 }catch(error){$('menuStatus').textContent='Menu não pode ser gerado: '+error.message+'. A prévia mantém a última versão válida.';}
}
function renderMainMenu(){
 $('menuSelection').replaceChildren();
 PLUS_MAIN_MENU_IDS.forEach((id,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=PLUS_MAIN_MENU_ORIGINAL[id];$('menuSelection').append(option);
  textControl($('mainMenu'),{scope:'mainMenu',key:id,label:PLUS_MAIN_MENU_ORIGINAL[id],value:project.changes.mainMenu?.texts?.[id]??PLUS_MAIN_MENU_ORIGINAL[id],original:PLUS_MAIN_MENU_ORIGINAL[id],multiline:true,validate:()=>{},onChange:value=>updateMenu(id,value)});
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
   textControl($(section),{scope:section,key:id,label:original,value:project.changes[section]?.[id]??original,original,validate:v=>{if(section==='trainingHud')encodeTrainingHud(f,v);else renderMatchStatistics({[id]:v},rom);},onChange:v=>updateChange(section,id,v,original)});
  }
 }
}

function titleChange(kind,id,value,original){
 const title=project.changes.titleScreen??={},items=title[kind]??={};
 if(JSON.stringify(value)===JSON.stringify(original))delete items[id];else items[id]=value;
 if(!Object.keys(items).length)delete title[kind];if(!Object.keys(title).length)delete project.changes.titleScreen;
}
function renderTitleScreen(rom){
 for(const id of ['titleTexts','titlePalettes','titleTextsActions'])$(id).replaceChildren();
 for(const f of TITLE_TEXT_FIELDS){const original=readTitleText(rom,f);textControl($('titleTexts'),{scope:'titleTexts',key:f.id,label:f.label+' · até '+f.count+' letras',value:project.changes.titleScreen?.texts?.[f.id]??original,original,validate:v=>validateTitleText(v,f),onChange:v=>{titleChange('texts',f.id,v,original);const chars=[...v.normalize('NFC').toUpperCase()];for(const c of chars){if(c===' '||TITLE_SUPPORTED_CHARACTERS.includes(c)||TITLE_FONT_ROWS[c])continue;const canvas=document.createElement('canvas');canvas.width=8;canvas.height=8;const ctx=canvas.getContext('2d');ctx.font='bold 8px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(c,4,4);const data=ctx.getImageData(0,0,8,8).data,rows=Array.from({length:8},(_,y)=>Array.from({length:8},(_,x)=>data[(y*8+x)*4+3]>48?1<<(7-x):0).reduce((a,b)=>a|b,0));const title=project.changes.titleScreen??={};(title.fontGlyphs??={})[c]=rows;}}});}
 const hint=document.createElement('p');hint.className='hint';hint.textContent='Letras, números, acentos e símbolos são aceitos. A fonte é gerada ao salvar. Limites: 29 e 18 caracteres visíveis; até 31 caracteres diferentes nas duas linhas.';$('titleTexts').append(hint);
 for(const p of readTitlePalettes(rom)){
  const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent=p.label;details.append(summary);const palette=document.createElement('div');palette.className='palette';details.append(palette);
  const colors=(project.changes.titleScreen?.palettes?.[p.id]??p.colors).slice();
  colors.forEach((v,i)=>{const label=document.createElement('label');label.textContent=String(i+1);const input=document.createElement('input');input.type='color';input.value=bgrToHex(v);input.setAttribute('aria-label',p.label+' cor '+(i+1));input.oninput=()=>{colors[i]=hexToBgr(input.value);titleChange('palettes',p.id,colors.slice(),p.colors);drawTitleLogo();};label.append(input);palette.append(label);});
  const reset=document.createElement('button');reset.textContent='Restaurar cores originais';reset.onclick=()=>{titleChange('palettes',p.id,p.colors,p.colors);render();};details.append(reset);$('titlePalettes').append(details);
 }
 try{drawTitleLogo();}catch(error){$('titleComposerRomStatus').textContent='Não foi possível desenhar a prévia: '+error.message;}
}

function drawTitleLogo(){titleComposer.render();}

function option(parent,value,label){const o=document.createElement('option');o.value=String(value);o.textContent=label;parent.append(o);}
function renderPlayers(){
 if(!project)return;const base=playerBase(),names=teamNames(),team=Math.min(Number($('playerTeam').value)||0,names.length-1),player=Number($('playerSelection').value)||0;
 $('playerCount').textContent=names.length+' equipes · 20 jogadores';$('playerTeam').replaceChildren();names.forEach((label,i)=>option($('playerTeam'),i,label));$('playerTeam').value=team;
 $('playerSelection').replaceChildren();for(let i=0;i<20;i++){const p=readDeluxePlayer(base,team,i,project.changes.players);option($('playerSelection'),i,(i+1)+' · '+p.name+' · Nº '+p.jersey);}$('playerSelection').value=player;
 $('playerFields').replaceChildren();const p=readDeluxePlayer(base,team,player,project.changes.players),original=readDeluxePlayer(base,team,player),id=team+':'+player;
 function change(edit){const next=structuredClone(project.changes.players??{});next[id]=edit;return next;}
 function commit(next,redraw=true){try{applyDeluxePlayers(base.slice(),base,next);project.changes.players=next;$('playerStatus').textContent='Alterações aplicadas ao projeto. Salve ou gere a ROM.';if(redraw)renderPlayers();return true;}catch(e){$('playerStatus').textContent=e.message;return false;}}
 function control(label,value,type,onChange,min,max){const l=document.createElement('label'),input=document.createElement('input');l.textContent=label;input.type=type;input.value=value;if(min!==undefined)input.min=min;if(max!==undefined)input.max=max;if(type==='number')input.step=1;else input.maxLength=8;input.onchange=()=>{const ok=onChange(type==='number'?Number(input.value):input.value);if(!ok)input.value=value;};l.append(input);$('playerFields').append(l);return input;}
 control('Nome · até 8 caracteres; centralizado na ROM',p.name,'text',v=>commit(change({...project.changes.players?.[id],name:v})));
 control('Número da camisa',p.jersey,'number',v=>{try{return commit(planDeluxeJerseySwap(base,project.changes.players??{},team,player,v));}catch(e){$('playerStatus').textContent=e.message;return false;}},1,20);
 const l=document.createElement('label'),select=document.createElement('select');l.textContent='Posição natural';PLAYER_POSITIONS.forEach((label,i)=>{if(p.isGoalkeeper?i===1:i!==1)option(select,i,label);});select.value=p.naturalPosition;select.disabled=p.isGoalkeeper;select.onchange=()=>{if(!commit(change({...project.changes.players?.[id],naturalPosition:Number(select.value)})))select.value=p.naturalPosition;};l.append(select);$('playerFields').append(l);
 for(const [key,label]of Object.entries(PLAYER_SKILLS)){
  const next=v=>change({...project.changes.players?.[id],skills:{...project.changes.players?.[id]?.skills,[key]:v}}),input=control(label,p.skills[key],'number',v=>commit(next(v)),1,10),row=Array.from($('playerFields').children).at(-1),range=document.createElement('input');row.className='skill-field';range.type='range';range.min=1;range.max=10;range.step=1;range.value=p.skills[key];range.setAttribute('aria-label',label);input.setAttribute('aria-label',label+' valor');
  range.oninput=()=>{const v=Number(range.value);if(commit(next(v),false)){input.value=v;input.setCustomValidity('');}};input.oninput=()=>{const v=Number(input.value);if(Number.isInteger(v)&&v>=1&&v<=10){range.value=v;input.setCustomValidity('');commit(next(v),false);}else input.setCustomValidity('Use um inteiro de 1 a 10');};row.append(range);
 }
 $('resetPlayer').onclick=()=>{const next=structuredClone(project.changes.players??{}),current=readDeluxePlayer(base,team,player,next);if(current.jersey!==original.jersey){const swapped=planDeluxeJerseySwap(base,next,team,player,original.jersey);delete swapped[id];commit(swapped);}else{delete next[id];commit(next);}};
 $('resetPlayerTeam').onclick=()=>{const next=structuredClone(project.changes.players??{});for(let i=0;i<20;i++)delete next[team+':'+i];commit(next);};
}
$('playerTeam').onchange=()=>{$('playerSelection').value=0;renderPlayers();$('playerStatus').textContent='';};
$('playerSelection').onchange=()=>{renderPlayers();$('playerStatus').textContent='';};

function renderGroups(){
 $('applyPlusGroups').disabled=!project;if(!project)return;const groups=(project.changes.structure?structureGroupRows(project.changes.structure):undefined)??project.changes.groups??readDeluxeGroups(splitRom(file).rom);$('addStructureGroup').disabled=groups.length>=9;$('groupCards').replaceChildren();
 groups.forEach((group,g)=>{const card=document.createElement('details'),summary=document.createElement('summary'),body=document.createElement('div');card.className='card';card.open=true;summary.textContent=deluxeGroupView(splitRom(file).rom,project)[g].name;body.className='card-body group-fields';card.append(summary,body);
 {const l=document.createElement('label'),input=document.createElement('input');l.className='group-title-field';l.textContent='Nome do grupo' ;input.value=summary.textContent;input.maxLength=32;input.onchange=()=>{if(!input.value.trim())return;const holder=project.changes.structure??project.changes,key=project.changes.structure?'labels':'groupLabels';holder[key]??=deluxeGroupView(splitRom(file).rom,project).map(row=>row.name);holder[key][g]=input.value.trim();renderGroups();};l.append(input);body.append(l);}
 const swapLabel=document.createElement('label'),swap=document.createElement('select');swapLabel.className='group-title-field';swapLabel.textContent='Trocar grupo de posição';option(swap,'','Escolha outro grupo…');deluxeGroupView(splitRom(file).rom,project).forEach((row,i)=>{if(i!==g)option(swap,i,row.name);});swap.onchange=()=>{if(swap.value==='')return;try{project=swapDeluxeProjectGroups(splitRom(file).rom,project,g,Number(swap.value));renderGroups();$('groupStatus').textContent='Grupos trocados. Elencos e edições das equipes preservados.';}catch(e){$('groupStatus').textContent=e.message;}};swapLabel.append(swap);body.append(swapLabel);
 group.forEach((team,slot)=>{const label=document.createElement('label'),select=document.createElement('select');select.setAttribute('aria-label',summary.textContent+' · equipe '+(slot+1));teamNames().forEach((name,id)=>option(select,id,name));select.value=team;select.onchange=()=>{const wanted=Number(select.value);let fromGroup=-1,fromSlot=-1;groups.forEach((row,i)=>{const at=row.indexOf(wanted);if(at>=0){fromGroup=i;fromSlot=at;}});try{if(project.changes.structure){const next=structuredClone(project.changes.structure);const rows=structureGroupRows(next);[rows[fromGroup][fromSlot],rows[g][slot]]=[rows[g][slot],rows[fromGroup][fromSlot]];setStructureGroupRows(next,rows);validateDeluxeStructure(next);project.changes.structure=next;}else project.changes.groups=moveDeluxeGroupTeam(groups,fromGroup,fromSlot,g,slot);renderGroups();$('groupStatus').textContent='Organização aplicada ao projeto. Salve ou gere a ROM.';}catch(e){select.value=team;$('groupStatus').textContent=e.message;}};label.append(select);body.append(label);});$('groupCards').append(card);});
}
$('resetGroups').onclick=()=>{if(project.changes.structure){const n=project.changes.structure.teams.length;if(project.changes.structure.secret)project.changes.structure.secret=[54,55,56,57,58,59];project.changes.structure.groups=[...readDeluxeGroups(splitRom(file).rom),...Array.from({length:project.changes.structure.groups.length-6},(_,g)=>Array.from({length:6},(_,i)=>36+g*6+i))];}else {delete project.changes.groups;delete project.changes.groupLabels;}renderGroups();$('groupStatus').textContent='Grupos originais restaurados.';};

var structureCache;
function teamNames(){return project?.changes.structure?.teams.map(t=>t.name)??DELUXE_TEAMS;}
function playerBase(){const key=JSON.stringify(project.changes.structure);if(structureCache?.file!==file||structureCache?.key!==key)structureCache={file,key,base:prepareDeluxeStructure(splitRom(file).rom,project.changes.structure)};return structureCache.base;}
function renderTeams(){
 if(!project)return;const names=teamNames(),i=Math.min(Number($('teamSelection').value)||0,names.length-1);$('teamSelection').replaceChildren();names.forEach((name,id)=>option($('teamSelection'),id,name));$('teamSelection').value=i;$('teamCards').replaceChildren();
 const t=project.changes.structure?.teams[i],body=document.createElement('div');body.className='card-body compact-grid';
 const label=document.createElement('label'),input=document.createElement('input');label.textContent='Nome no projeto e no Editor';input.value=t?.name??names[i];input.maxLength=32;input.disabled=!t;input.onchange=()=>{if(!input.value.trim()){input.value=t.name;return;}t.name=input.value.trim();renderTeams();renderGroups();renderPlayers();};label.append(input);body.append(label);
 const l=document.createElement('label'),sel=document.createElement('select');l.textContent='Equipe-base dos recursos visuais';DELUXE_TEAMS.forEach((name,id)=>option(sel,id,name));sel.value=t?.sourceTeam??i;sel.disabled=i<36||!t;if(project.changes.teamVisuals&&t){l.textContent='Recursos visuais da equipe';sel.textContent='';option(sel,'own','Próprios · '+t.name);sel.value='own';sel.disabled=true;}sel.onchange=()=>{t.sourceTeam=Number(sel.value);renderPlayers();};l.append(sel);body.append(l);$('teamCards').append(body);
}
$('teamSelection').onchange=renderTeams;

let newGroupChoices=[];
function renderNewGroupChoices(){
 const choices=availablePlusTeams(project),used=new Set(newGroupChoices.filter(v=>v!==null));$('newGroupTeams').replaceChildren();
 for(let i=0;i<6;i++){const label=document.createElement('label'),select=document.createElement('select');label.textContent='Equipe '+(i+1);select.setAttribute('aria-label','Nova equipe '+(i+1));option(select,'','Selecione uma equipe…');for(const t of choices)if(!used.has(t.plusId)||t.plusId===newGroupChoices[i])option(select,t.plusId,t.name);select.value=newGroupChoices[i]??'';select.onchange=()=>{newGroupChoices[i]=select.value===''?null:Number(select.value);renderNewGroupChoices();};label.append(select);$('newGroupTeams').append(label);}
 $('confirmNewGroup').disabled=newGroupChoices.some(v=>v===null)||new Set(newGroupChoices).size!==6;
}
$('addStructureGroup').onclick=()=>{if(!project)return;newGroupChoices=Array(6).fill(null);$('newGroupPanel').hidden=false;$('newGroupStatus').textContent='';renderNewGroupChoices();};
$('cancelNewGroup').onclick=()=>{$('newGroupPanel').hidden=true;newGroupChoices=[];};
$('confirmNewGroup').onclick=async()=>{const p=project,current=file,signature=JSON.stringify(p.changes);try{const next=addPlusCatalogGroup(splitRom(current).rom,p,newGroupChoices);await buildDeluxeProject(current,next);if(project!==p||file!==current||JSON.stringify(p.changes)!==signature)throw Error('O projeto mudou. Selecione o grupo novamente.');project=next;$('newGroupPanel').hidden=true;render();$('groupStatus').textContent='Grupo criado com seis equipes e seus elencos Plus. Salve o projeto ou gere a ROM.';}catch(e){$('newGroupStatus').textContent=e.message;}};
$('applyPlusGroups').onclick=async()=>{const p=project,current=file,signature=JSON.stringify(p.changes);try{const next=applyPlusGroupOrganization(splitRom(current).rom,p);await buildDeluxeProject(current,next);if(project!==p||file!==current||JSON.stringify(p.changes)!==signature)throw Error('O projeto mudou. Repita a aplicação.');project=next;$('newGroupPanel').hidden=true;render();$('groupStatus').textContent='Nove grupos Plus aplicados. As edições existentes das equipes e jogadores foram preservadas.';}catch(e){$('groupStatus').textContent=e.message;}};
$('resetStructure').onclick=()=>{delete project.changes.structure;delete project.changes.groups;delete project.changes.groupLabels;for(const key of Object.keys(project.changes.players??{}))if(Number(key.split(':')[0])>=36)delete project.changes.players[key];$('playerTeam').value=0;render();$('groupStatus').textContent='Estrutura original restaurada. As edições dos 36 elencos nativos foram preservadas.';};

var presetFile,presetCatalog;
function textPt(scope,key){if(!scope)return undefined;if(presetFile!==file){presetFile=file;presetCatalog=textPresetFields(splitRom(file).rom);}return presetCatalog.find(f=>f.scope===scope&&f.key===key)?.portuguese;}
async function runTextPreset(scope,mode){const p=project,current=file,signature=JSON.stringify(p.changes);try{const next=applyTextPreset(p,splitRom(current).rom,scope,mode);await buildDeluxeProject(current,next);if(project!==p||file!==current||JSON.stringify(p.changes)!==signature){status('O projeto mudou durante a aplicação. Repita a ação.');return;}project=next;render();status(mode==='original'?'Textos originais restaurados na seção inteira.':'Português aplicado à seção inteira. Você pode editar cada texto livremente.');}catch(e){status('Nenhum texto foi aplicado: '+e.message);}}
function addPresetButtons(host,scope){for(const [mode,label]of [['original','Restaurar todos os textos'],['portuguese','Português em todos os textos']]){const b=document.createElement('button');b.type='button';b.textContent=label;b.disabled=!project;b.onclick=()=>runTextPreset(scope,mode);host.append(b);}}
function renderTextActions(){for(const scope of ['allTexts','texts','nativeTexts','menuTexts','trainingHud','matchStatistics','cursorHelp','mainMenu','titleTexts']){const host=$(scope+'Actions');host.replaceChildren();addPresetButtons(host,scope);}}

const titleComposer=installTitleComposer({getProject:()=>project,getFile:()=>file,onStatus:status});

document.addEventListener?.('deluxe:title-screen-open',()=>{if(!project){titleComposer.render();return;}try{renderTitleScreen(splitRom(file).rom);renderTextActions();}catch(error){status('Falha ao atualizar Tela de título: '+error.message);}});
