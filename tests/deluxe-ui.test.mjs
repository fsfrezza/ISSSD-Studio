import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createDeluxeProject,splitRom} from '../src/core/deluxe-project.mjs';
import {readStadiums} from '../src/core/deluxe-native-fields.mjs';
const fixture=process.env.ISSSD_DELUXE_ROM;
test('UI handlers: abrir, editar, salvar projeto, reabrir, exportar e restaurar',{skip:!fixture},async()=>{
 class Element{
  constructor(tag){this.tag=tag;this.children=[];this.value='';this.files=[];this.listeners={};}
  getContext(){return {drawImage(){},getImageData(x,y,w,h){return {data:new Uint8ClampedArray(w*h*4)};},clearRect(){},createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4)};},putImageData(){}};}
  append(...children){this.children.push(...children);}
  replaceChildren(...children){this.children=children;}
  setAttribute(key,value){this[key]=value;}
  setCustomValidity(value){this.validationMessage=value;}
  addEventListener(name,fn){this.listeners[name]=fn;}
  click(){this.clicked=true;if(this.tag==='a')downloads.push({name:this.download,blob:blobs.get(this.href)});}
 }
 const composerIds=[...fs.readFileSync(new URL('../deluxe-editor/index.html',import.meta.url),'utf8').matchAll(/id="(titleComposer[^"]+)"/g)].map(m=>m[1]);
 const ids=Object.fromEntries([...composerIds,'projectRomRequest','pendingProjectName','selectProjectRom','applyPlusGroups','newGroupPanel','newGroupTeams','confirmNewGroup','cancelNewGroup','newGroupStatus','rom','status','texts','stadiums','nativeTexts','cursorHelp','title','resetTitle','save','load','export','improvements','menuTexts','mainMenu','menuScale','menuSelection','resetMenu','menuPreview','menuStatus','soundSelection','soundRate','soundFile','playOriginal','playSound','stopSound','downloadSound','resetSound','soundInfo','soundStatus','downloadWav','resetAllSounds','playGalvao','useGalvao','allGalvao','trainingHud','matchStatistics','playFb96','useFb96','allFb96','titleTexts','titlePalettes','titleLogoPreview','titleLogoInfo','titleLogoFile','exportTitleLogo','resetTitleLogo','titleLogoStatus','titleComposite','titleLayerPreview','titleLayer','titleLayerFile','exportTitleLayer','resetTitleLayer','titleLayerX','titleLayerY','titleLayerScale','applyTitleTransform','titleLayerInfo','titleLayerStatus','playerTeam','playerSelection','playerFields','playerStatus','resetPlayer','resetPlayerTeam','resetGroups','groupCards','groupStatus','teamCards','addStructureGroup','resetStructure','playerCount','teamSelection','allTextsActions','textsActions','nativeTextsActions','menuTextsActions','trainingHudActions','matchStatisticsActions','cursorHelpActions','mainMenuActions','titleTextsActions'].map(id=>[id,new Element(id)]));
 const downloads=[],blobs=new Map();let serial=0;
 const previous={bitmap:globalThis.createImageBitmap,fetch:globalThis.fetch,window:globalThis.window,document:globalThis.document,create:URL.createObjectURL,revoke:URL.revokeObjectURL};
 const pageEvents={};
 globalThis.document={addEventListener:(name,fn)=>pageEvents[name]=fn,getElementById:id=>ids[id],createElement:tag=>new Element(tag),createTextNode:text=>text};
 URL.createObjectURL=blob=>{const id='blob:test'+serial++;blobs.set(id,blob);return id;};URL.revokeObjectURL=()=>{};
 try{
  await import('../deluxe-editor/app.mjs?ui-test');
  const file=new Uint8Array(fs.readFileSync(fixture));
  assert.equal(ids.improvements.children.length,6);
  assert.ok(ids.improvements.children.slice(1).every(card=>card.tag==='details'&&card.open));
  ids.load.files=[{text:async()=>'{invalid'}];await ids.load.onchange();assert.ok(ids.status.textContent);assert.equal(ids.rom.clicked,undefined);
  const initial=await createDeluxeProject(file);initial.changes.internalTitle='PROJECT FIRST';
  const fileClick=ids.rom.click;ids.rom.click=()=>{throw Error('browser blocked automatic file picker');};
  ids.load.files=[{name:'Projeto de teste.issdproj',text:async()=>JSON.stringify(initial)}];await ids.load.onchange();assert.equal(ids.projectRomRequest.hidden,false);assert.equal(ids.pendingProjectName.textContent,'Projeto de teste.issdproj');assert.match(ids.status.textContent,/Selecionar ROM/);
  ids.rom.click=fileClick;ids.selectProjectRom.onclick();assert.equal(ids.rom.clicked,true);
  ids.rom.listeners.cancel();assert.match(ids.status.textContent,/cancelada/);
  ids.rom.files=[{arrayBuffer:async()=>new ArrayBuffer(16)}];await ids.rom.onchange();assert.match(ids.status.textContent,/aguardando a ROM correta/);assert.equal(ids.projectRomRequest.hidden,false);
  ids.rom.files=[{arrayBuffer:async()=>file.buffer}];await ids.rom.onchange();assert.equal(ids.title.value,'PROJECT FIRST');assert.match(ids.status.textContent,/reaberto com a ROM/);assert.equal(ids.projectRomRequest.hidden,true);

  assert.equal(ids.export.disabled,false);assert.equal(ids.nativeTexts.children.length,20);assert.equal(ids.cursorHelp.children.length,14);assert.equal(ids.stadiums.children.length,8);assert.equal(ids.menuTexts.children.length,21);assert.equal(ids.mainMenu.children.length,8);assert.equal(ids.titlePalettes.children.length,4);
  assert.equal(ids.titleComposerElements.children.length,8);
  for(let i=0;i<3;i++){ids.addStructureGroup.onclick();for(let p=0;p<6;p++){const choice=ids.newGroupTeams.children[p].children[0];choice.value=choice.children[1].value;choice.onchange();}await ids.confirmNewGroup.onclick();}assert.equal(ids.playerTeam.children.length,54);assert.equal(ids.groupCards.children.length,9);assert.ok(ids.groupCards.children.every(c=>c.children[1].children.slice(2).every(l=>l.textContent!==('Vaga 1')&&l.children[0]['aria-label'])));assert.equal(ids.addStructureGroup.disabled,true);assert.equal(ids.teamSelection.children.length,54);assert.equal(ids.teamCards.children.length,1);ids.teamSelection.value='53';ids.teamSelection.onchange();const teamName=ids.teamCards.children[0].children[0].children[0];teamName.value='Nova equipe';teamName.onchange();assert.equal(ids.teamSelection.children[53].textContent,'Nova equipe');
  ids.playerTeam.value='53';ids.playerTeam.onchange();const addedName=ids.playerFields.children[0].children[0];addedName.value='Extra';addedName.onchange();assert.match(ids.playerStatus.textContent,/aplicadas/);
  const skill=ids.playerFields.children[3],number=skill.children[0],bar=skill.children[1];bar.value='10';bar.oninput();assert.equal(Number(number.value),10);number.value='7';number.oninput();assert.equal(Number(bar.value),7);
  await ids.save.onclick();const expandedProject=JSON.parse(await downloads.at(-1).blob.text());assert.equal(expandedProject.changes.structure.teams.length,54);assert.equal(expandedProject.changes.players['53:0'].name,'Extra');assert.equal(expandedProject.changes.players['53:0'].skills.acceleration,7);
  ids.resetStructure.onclick();assert.equal(ids.playerTeam.children.length,36);assert.equal(ids.groupCards.children.length,6);
  const groupName=ids.groupCards.children[0].children[1].children[0].children[0];groupName.value='GRUPO A';groupName.onchange();assert.equal(ids.groupCards.children[0].children[0].textContent,'GRUPO A');
  const groupSwap=ids.groupCards.children[0].children[1].children[1].children[0];groupSwap.value='1';groupSwap.onchange();assert.equal(ids.groupCards.children[1].children[0].textContent,'GRUPO A');
  const groupSelect=ids.groupCards.children[0].children[1].children[2].children[0];groupSelect.value='30';groupSelect.onchange();assert.match(ids.groupStatus.textContent,/aplicada/);ids.resetGroups.onclick();assert.match(ids.groupStatus.textContent,/restaurados/);
  ids.playerTeam.value='0';ids.playerSelection.value='0';ids.playerTeam.onchange();
  const playerName=ids.playerFields.children[0].children[0];playerName.value='Teste';playerName.onchange();assert.match(ids.playerStatus.textContent,/aplicadas/);
  const jersey=ids.playerFields.children[1].children[0];jersey.value='2';jersey.onchange();assert.match(ids.playerStatus.textContent,/aplicadas/);
  await ids.resetPlayer.onclick();assert.match(ids.playerStatus.textContent,/aplicadas/);
  assert.equal(ids.playerFields.children[2].children[0].disabled,true);
  ids.playerSelection.value='1';ids.playerSelection.onchange();assert.ok(ids.playerFields.children[2].children[0].children.every(o=>Number(o.value)!==1));
  globalThis.createImageBitmap=async()=>({width:176,height:65,close(){}});ids.titleComposerImageFile.files=[{}];await ids.titleComposerImageFile.onchange();await ids.titleComposerPrepareRomBtn.onclick();assert.match(ids.titleComposerRomStatus.textContent,/Composição implementada/);
  const footer=ids.titleTexts.children[0].children[0];footer.value='@1995KONAMI';footer.listeners.input();assert.equal(ids.trainingHud.children.length,8);assert.equal(ids.matchStatistics.children.length,10);
  const training=ids.trainingHud.children[1].children[0];training.value='TEMPO';training.listeners.input();
  const stats=ids.matchStatistics.children[0].children[0];stats.value='CHUTES';stats.listeners.input();assert.equal(ids.soundSelection.children.length,74);assert.match(ids.menuStatus.textContent,/original preservado/);
  const mainField=ids.mainMenu.children[0].children[0];mainField.value='AMISTOSO';mainField.listeners.input();assert.match(ids.menuStatus.textContent,/cabe no espaço/);assert.equal(ids.menuSelection.children[0].textContent,'AMISTOSO');
  const menuField=ids.menuTexts.children[0].children[1].children[0];menuField.value='TIME';menuField.listeners.input();
  const silence=Uint8Array.of(1,...Array(8).fill(0));ids.soundFile.files=[{size:9,arrayBuffer:async()=>silence.buffer}];await ids.soundFile.onchange();assert.match(ids.soundInfo.textContent,/substituída/);
  globalThis.window={AudioContext:class {async decodeAudioData(){const samples=Float32Array.from({length:1030},(_,i)=>.3*Math.sin(i/8));return {numberOfChannels:1,sampleRate:10300,getChannelData:()=>samples};}}};
  ids.soundFile.files=[{name:'voz.wav',size:30000,arrayBuffer:async()=>new ArrayBuffer(16)}];await ids.soundFile.onchange();assert.match(ids.soundStatus.textContent,/Sem acelerar a fala/);
  ids.downloadWav.onclick();assert.equal(downloads.at(-1).name,'ItsABigKick1.wav');
  const reference=JSON.parse(fs.readFileSync(new URL('../deluxe-editor/galvao-samples.json',import.meta.url)));globalThis.fetch=async url=>({ok:true,json:async()=>url.includes('fb96')?JSON.parse(fs.readFileSync(new URL('../deluxe-editor/fb96-samples.json',import.meta.url))):reference});
  await ids.useGalvao.onclick();assert.match(ids.soundInfo.textContent,/Galvão/);await ids.allGalvao.onclick();assert.match(ids.soundStatus.textContent,/74/);await ids.useFb96.onclick();assert.match(ids.soundInfo.textContent,/FB96/);await ids.allFb96.onclick();assert.match(ids.soundStatus.textContent,/FB96 aplicado aos 74/);
  ids.title.value='DELUXE UI TEST';ids.title.oninput();
  const text=ids.nativeTexts.children[0].children[0];text.value='TESTE';text.listeners.input();assert.equal(text.validationMessage,'');
  const color=ids.stadiums.children[0].children[1].children[0].children[0];color.value='#ff0000';color.oninput();
  await ids.save.onclick();const project=JSON.parse(await downloads.at(-1).blob.text());assert.equal(project.changes.internalTitle,'DELUXE UI TEST');assert.equal(project.changes.titleScreen.logoTiles.length,3840);assert.equal(project.changes.titleScreen.texts.copyright,'@1995KONAMI');assert.equal(project.changes.trainingHud.time,'TEMPO');assert.equal(project.changes.matchStatistics.shots,'CHUTES');assert.ok(project.changes.sounds.ItsABigKick1);assert.equal(Object.keys(project.changes.sounds).length,74);assert.equal(project.changes.mainMenu.texts.openGame,'AMISTOSO');assert.equal(project.changes.menuTexts['team-selection-native'].data_87c5cd,'TIME');assert.equal(project.changes.stadiums['0'][0],31);
  ids.load.files=[{text:async()=>JSON.stringify(project)}];await ids.load.onchange();assert.equal(ids.title.value,'DELUXE UI TEST');assert.equal(ids.menuTexts.children[0].children[1].children[0].value,'TIME');assert.equal(ids.nativeTexts.children[0].children[0].value,'TESTE');
  await ids.export.onclick();const output=new Uint8Array(await downloads.at(-1).blob.arrayBuffer());assert.equal(output.length,file.length);assert.equal(readStadiums(splitRom(output).rom)[0].colors[0],31);
  ids.resetSound.onclick();assert.match(ids.soundInfo.textContent,/original/);
  ids.resetMenu.onclick();assert.match(ids.menuStatus.textContent,/original preservado/);
  ids.resetTitle.onclick();assert.notEqual(ids.title.value,'DELUXE UI TEST');
  const field=ids.nativeTexts.children[0];field.children[0].value='!';field.children[0].listeners.input();const count=downloads.length;await ids.export.onclick();assert.equal(downloads.length,count);assert.match(ids.status.textContent,/A–Z/);
  field.children[1].onclick();assert.equal(field.children[0].validationMessage,'');
  ids.texts.children[0].children[2].onclick();assert.match(ids.texts.children[0].children[0].value,/TODOS/);
  await ids.allTextsActions.children[1].onclick();assert.match(ids.status.textContent,/seção inteira/);assert.equal(ids.nativeTexts.children[0].children[0].value,'ELEJA');assert.equal(ids.matchStatistics.children[0].children[0].value,'CHUTES');
  await ids.allTextsActions.children[0].onclick();assert.match(ids.status.textContent,/seção inteira/);assert.equal(ids.matchStatistics.children[0].children[0].value,'SHOTS');

  if(process.env.ISSSD_TITLE_PROJECT){const real=fs.readFileSync(process.env.ISSSD_TITLE_PROJECT,'utf8');ids.load.files=[{text:async()=>real}];await ids.load.onchange();assert.equal(ids.status.textContent,'Projeto Deluxe reaberto.');assert.equal(ids.titleComposerElements.children.length,8);assert.equal(ids.titlePalettes.children.length,4);assert.ok(ids.titleTexts.children.length>=2);}

  for(let i=0;i<3;i++)pageEvents['deluxe:title-screen-open']();assert.equal(ids.titlePalettes.children.length,4);assert.equal(ids.titleTexts.children.length,3);assert.equal(ids.titleComposerElements.children.length,8);
  const context=ids.titleComposerCanvas.getContext;ids.titleComposerCanvas.getContext=()=>{throw Error('preview test failure');};pageEvents['deluxe:title-screen-open']();assert.equal(ids.titlePalettes.children.length,4);assert.equal(ids.titleTexts.children.length,3);assert.match(ids.titleComposerRomStatus.textContent,/preview test failure/);ids.titleComposerCanvas.getContext=context;pageEvents['deluxe:title-screen-open']();assert.equal(ids.titleComposerElements.children.length,8);


 if(process.env.ISSSD_GG_RECOVERED_PROJECT){
  const real=fs.readFileSync(process.env.ISSSD_GG_RECOVERED_PROJECT,'utf8'),expected=JSON.parse(real);
  ids.load.files=[{text:async()=>real}];await ids.load.onchange();assert.equal(ids.status.textContent,'Projeto Deluxe reaberto.');
  assert.match(ids.improvements.children[0].textContent,/60 equipes · 9 grupos regulares · 6 equipes secretas · GG secreto preservado/);
  assert.equal(ids.groupCards.children.length,10);assert.equal(ids.groupCards.children[9].children[0].textContent,'GG');assert.equal(ids.playerTeam.children.length,60);assert.equal(ids.teamSelection.children.length,60);
  ids.playerTeam.value='55';ids.playerSelection.value='12';ids.playerTeam.onchange();ids.playerSelection.value='12';ids.playerSelection.onchange();assert.equal(ids.playerFields.children[0].children[0].value,'Ale 100');
  await ids.save.onclick();const saved=JSON.parse(await downloads.at(-1).blob.text());assert.deepEqual(saved.changes.structure,expected.changes.structure);assert.deepEqual(saved.changes.players,expected.changes.players);
  ids.load.files=[{text:async()=>JSON.stringify(saved)}];await ids.load.onchange();assert.match(ids.improvements.children[0].textContent,/60 equipes · 9 grupos regulares · 6 equipes secretas · GG secreto preservado/);
  assert.equal(ids.groupCards.children.length,10);
  await ids.export.onclick();assert.match(ids.status.textContent,/4 MB/);assert.equal(downloads.at(-1).blob.size,file.length+0x200000);
 }

 }finally{globalThis.createImageBitmap=previous.bitmap;globalThis.fetch=previous.fetch;globalThis.window=previous.window;globalThis.document=previous.document;URL.createObjectURL=previous.create;URL.revokeObjectURL=previous.revoke;}
});
