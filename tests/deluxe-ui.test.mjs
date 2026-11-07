import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {splitRom} from '../src/core/deluxe-project.mjs';
import {readStadiums} from '../src/core/deluxe-native-fields.mjs';
const fixture=process.env.ISSSD_DELUXE_ROM;
test('UI handlers: abrir, editar, salvar projeto, reabrir, exportar e restaurar',{skip:!fixture},async()=>{
 class Element{
  constructor(tag){this.tag=tag;this.children=[];this.value='';this.files=[];this.listeners={};}
  getContext(){return {clearRect(){},createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4)};},putImageData(){}};}
  append(...children){this.children.push(...children);}
  replaceChildren(...children){this.children=children;}
  setAttribute(key,value){this[key]=value;}
  setCustomValidity(value){this.validationMessage=value;}
  addEventListener(name,fn){this.listeners[name]=fn;}
  click(){if(this.tag==='a')downloads.push({name:this.download,blob:blobs.get(this.href)});}
 }
 const ids=Object.fromEntries(['rom','status','texts','stadiums','nativeTexts','cursorHelp','title','resetTitle','save','load','export','improvements','menuTexts','mainMenu','menuScale','menuSelection','resetMenu','menuPreview','menuStatus','soundSelection','soundRate','soundFile','playOriginal','playSound','stopSound','downloadSound','resetSound','soundInfo','soundStatus','downloadWav','resetAllSounds'].map(id=>[id,new Element(id)]));
 const downloads=[],blobs=new Map();let serial=0;
 const previous={window:globalThis.window,document:globalThis.document,create:URL.createObjectURL,revoke:URL.revokeObjectURL};
 globalThis.document={getElementById:id=>ids[id],createElement:tag=>new Element(tag),createTextNode:text=>text};
 URL.createObjectURL=blob=>{const id='blob:test'+serial++;blobs.set(id,blob);return id;};URL.revokeObjectURL=()=>{};
 try{
  await import('../deluxe-editor/app.mjs?ui-test');
  const file=new Uint8Array(fs.readFileSync(fixture));
  ids.rom.files=[{arrayBuffer:async()=>file.buffer}];await ids.rom.onchange();
  assert.equal(ids.export.disabled,false);assert.equal(ids.nativeTexts.children.length,20);assert.equal(ids.cursorHelp.children.length,14);assert.equal(ids.stadiums.children.length,8);assert.equal(ids.menuTexts.children.length,20);assert.equal(ids.mainMenu.children.length,8);assert.equal(ids.soundSelection.children.length,74);assert.match(ids.menuStatus.textContent,/original preservado/);
  const mainField=ids.mainMenu.children[0].children[0];mainField.value='AMISTOSO';mainField.listeners.input();assert.match(ids.menuStatus.textContent,/cabe no espaço/);
  const menuField=ids.menuTexts.children[0].children[1].children[0];menuField.value='TIME';menuField.listeners.input();
  const silence=Uint8Array.of(1,...Array(8).fill(0));ids.soundFile.files=[{size:9,arrayBuffer:async()=>silence.buffer}];await ids.soundFile.onchange();assert.match(ids.soundInfo.textContent,/substituída/);
  globalThis.window={AudioContext:class {async decodeAudioData(){const samples=Float32Array.from({length:1030},(_,i)=>.3*Math.sin(i/8));return {numberOfChannels:1,sampleRate:10300,getChannelData:()=>samples};}}};
  ids.soundFile.files=[{name:'voz.wav',size:30000,arrayBuffer:async()=>new ArrayBuffer(16)}];await ids.soundFile.onchange();assert.match(ids.soundStatus.textContent,/Sem acelerar a fala/);
  ids.downloadWav.onclick();assert.equal(downloads.at(-1).name,'ItsABigKick1.wav');
  ids.title.value='DELUXE UI TEST';ids.title.oninput();
  const text=ids.nativeTexts.children[0].children[0];text.value='TESTE';text.listeners.input();assert.equal(text.validationMessage,'');
  const color=ids.stadiums.children[0].children[1].children[0].children[0];color.value='#ff0000';color.oninput();
  await ids.save.onclick();const project=JSON.parse(await downloads.at(-1).blob.text());assert.equal(project.changes.internalTitle,'DELUXE UI TEST');assert.ok(project.changes.sounds.ItsABigKick1);assert.equal(project.changes.mainMenu.texts.openGame,'AMISTOSO');assert.equal(project.changes.menuTexts['team-selection-native'].data_87c5cd,'TIME');assert.equal(project.changes.stadiums['0'][0],31);
  ids.load.files=[{text:async()=>JSON.stringify(project)}];await ids.load.onchange();assert.equal(ids.title.value,'DELUXE UI TEST');assert.equal(ids.menuTexts.children[0].children[1].children[0].value,'TIME');assert.equal(ids.nativeTexts.children[0].children[0].value,'TESTE');
  await ids.export.onclick();const output=new Uint8Array(await downloads.at(-1).blob.arrayBuffer());assert.equal(output.length,file.length);assert.equal(readStadiums(splitRom(output).rom)[0].colors[0],31);
  ids.resetSound.onclick();assert.match(ids.soundInfo.textContent,/original/);
  ids.resetMenu.onclick();assert.match(ids.menuStatus.textContent,/original preservado/);
  ids.resetTitle.onclick();assert.notEqual(ids.title.value,'DELUXE UI TEST');
  const field=ids.nativeTexts.children[0];field.children[0].value='!';field.children[0].listeners.input();const count=downloads.length;await ids.export.onclick();assert.equal(downloads.length,count);assert.match(ids.status.textContent,/A–Z/);
  field.children[1].onclick();assert.equal(field.children[0].validationMessage,'');
 }finally{globalThis.window=previous.window;globalThis.document=previous.document;URL.createObjectURL=previous.create;URL.revokeObjectURL=previous.revoke;}
});
