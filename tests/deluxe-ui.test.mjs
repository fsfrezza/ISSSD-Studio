import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {splitRom} from '../src/core/deluxe-project.mjs';
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
  click(){if(this.tag==='a')downloads.push({name:this.download,blob:blobs.get(this.href)});}
 }
 const ids=Object.fromEntries(['rom','status','texts','stadiums','nativeTexts','cursorHelp','title','resetTitle','save','load','export','improvements','menuTexts','mainMenu','menuScale','menuSelection','resetMenu','menuPreview','menuStatus','soundSelection','soundRate','soundFile','playOriginal','playSound','stopSound','downloadSound','resetSound','soundInfo','soundStatus','downloadWav','resetAllSounds','playGalvao','useGalvao','allGalvao','trainingHud','matchStatistics','playFb96','useFb96','allFb96','titleTexts','titlePalettes','titleLogoPreview','titleLogoInfo','titleLogoFile','exportTitleLogo','resetTitleLogo','titleLogoStatus','titleComposite','titleLayerPreview','titleLayer','titleLayerFile','exportTitleLayer','resetTitleLayer','titleLayerX','titleLayerY','titleLayerScale','applyTitleTransform','titleLayerInfo','titleLayerStatus','playerTeam','playerSelection','playerFields','playerStatus','resetPlayer','resetPlayerTeam','resetGroups','groupCards','groupStatus','teamCards','addStructureGroup','resetStructure','playerCount','teamSelection','allTextsActions','textsActions','nativeTextsActions','menuTextsActions','trainingHudActions','matchStatisticsActions','cursorHelpActions','mainMenuActions','titleTextsActions'].map(id=>[id,new Element(id)]));
 const downloads=[],blobs=new Map();let serial=0;
 const previous={bitmap:globalThis.createImageBitmap,fetch:globalThis.fetch,window:globalThis.window,document:globalThis.document,create:URL.createObjectURL,revoke:URL.revokeObjectURL};
 globalThis.document={getElementById:id=>ids[id],createElement:tag=>new Element(tag),createTextNode:text=>text};
 URL.createObjectURL=blob=>{const id='blob:test'+serial++;blobs.set(id,blob);return id;};URL.revokeObjectURL=()=>{};
 try{
  await import('../deluxe-editor/app.mjs?ui-test');
  const file=new Uint8Array(fs.readFileSync(fixture));
  ids.rom.files=[{arrayBuffer:async()=>file.buffer}];await ids.rom.onchange();
  assert.equal(ids.export.disabled,false);assert.equal(ids.nativeTexts.children.length,20);assert.equal(ids.cursorHelp.children.length,14);assert.equal(ids.stadiums.children.length,8);assert.equal(ids.menuTexts.children.length,20);assert.equal(ids.mainMenu.children.length,8);assert.equal(ids.titlePalettes.children.length,4);
  ids.titleLayer.value='photos';ids.titleLayer.onchange();
  globalThis.createImageBitmap=async()=>({width:256,height:104,close(){}});ids.titleLayerFile.files=[{}];await ids.titleLayerFile.onchange();assert.match(ids.titleLayerStatus.textContent,/convertida/);
  await ids.resetTitleLayer.onclick();assert.match(ids.titleLayerStatus.textContent,/restaurada/);
  ids.titleLayerX.value='1000';ids.titleLayerY.value='0';ids.titleLayerScale.value='100';await ids.applyTitleTransform.onclick();assert.match(ids.titleLayerStatus.textContent,/ultrapassa/);
  for(let i=0;i<3;i++)ids.addStructureGroup.onclick();assert.equal(ids.playerTeam.children.length,54);assert.equal(ids.groupCards.children.length,9);assert.equal(ids.addStructureGroup.disabled,true);assert.equal(ids.teamSelection.children.length,54);assert.equal(ids.teamCards.children.length,1);ids.teamSelection.value='53';ids.teamSelection.onchange();const teamName=ids.teamCards.children[0].children[0].children[0];teamName.value='Nova equipe';teamName.onchange();assert.equal(ids.teamSelection.children[53].textContent,'Nova equipe');
  ids.playerTeam.value='53';ids.playerTeam.onchange();const addedName=ids.playerFields.children[0].children[0];addedName.value='Extra';addedName.onchange();assert.match(ids.playerStatus.textContent,/aplicadas/);
  const skill=ids.playerFields.children[3],number=skill.children[0],bar=skill.children[1];bar.value='10';bar.oninput();assert.equal(Number(number.value),10);number.value='7';number.oninput();assert.equal(Number(bar.value),7);
  await ids.save.onclick();const expandedProject=JSON.parse(await downloads.at(-1).blob.text());assert.equal(expandedProject.changes.structure.teams.length,54);assert.equal(expandedProject.changes.players['53:0'].name,'Extra');assert.equal(expandedProject.changes.players['53:0'].skills.acceleration,7);
  ids.resetStructure.onclick();assert.equal(ids.playerTeam.children.length,36);assert.equal(ids.groupCards.children.length,6);
  const groupSelect=ids.groupCards.children[0].children[1].children[0].children[0];groupSelect.value='30';groupSelect.onchange();assert.match(ids.groupStatus.textContent,/aplicada/);ids.resetGroups.onclick();assert.match(ids.groupStatus.textContent,/restaurados/);
  ids.playerTeam.value='0';ids.playerSelection.value='0';ids.playerTeam.onchange();
  const playerName=ids.playerFields.children[0].children[0];playerName.value='Teste';playerName.onchange();assert.match(ids.playerStatus.textContent,/aplicadas/);
  const jersey=ids.playerFields.children[1].children[0];jersey.value='2';jersey.onchange();assert.match(ids.playerStatus.textContent,/aplicadas/);
  await ids.resetPlayer.onclick();assert.match(ids.playerStatus.textContent,/aplicadas/);
  globalThis.createImageBitmap=async()=>({width:176,height:65,close(){}});ids.titleLogoFile.files=[{}];await ids.titleLogoFile.onchange();assert.match(ids.titleLogoStatus.textContent,/convertido/);
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
  ids.titleLayer.value='photo2';ids.titleLayer.onchange();globalThis.createImageBitmap=async()=>({width:500,height:700,close(){}});ids.titleLayerFile.files=[{}];await ids.titleLayerFile.onchange();assert.match(ids.titleLayerStatus.textContent,/convertida/);await ids.resetTitleLayer.onclick();assert.match(ids.titleLayerStatus.textContent,/restaurada/);

 }finally{globalThis.createImageBitmap=previous.bitmap;globalThis.fetch=previous.fetch;globalThis.window=previous.window;globalThis.document=previous.document;URL.createObjectURL=previous.create;URL.revokeObjectURL=previous.revoke;}
});
