import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {announcementLines,announcementRow,announcementTile,announcementTallTiles,applyDeluxeAnnouncementLayout,announcementLayoutEnabled} from '../src/core/deluxe-match-announcement-layout.mjs';
import {splitRom} from '../src/core/deluxe-project.mjs';
import {installScreenEditors} from '../deluxe-editor/screen-editors.mjs';
const values={data_87cad3:'ESTÁDIO:',data_87cada:'INICIO',data_87ca77:'CONDIÇÃO',data_87ca9b:'JAPÃO\nE.U.A.\nESPANHA\nITÁLIA\nINGLAT.\nALEMAN.\nBRASIL\nNIGÉRIA',data_87ca80:'NEVE\nSOL\nCHUV'};
const changes={improvements:['announcement-layout'],menuTexts:{'stadium-native':values}};
test('announcement uses the same native text for the preview and ROM rows',()=>{
 assert.deepEqual(announcementLines(values,1,0,1,1,1),['ESTADIO: E.U.A.','JUIZ: CARLOS','CLIMA: BOM','DURACAO POR TEMPO: 5 min.','HOJE - 13:00']);
 assert.equal(announcementLines(values,1,2,2,3,3)[2],'CLIMA: CHUVA');
 for(let s=0;s<8;s++)for(let t=0;t<3;t++)for(let w=0;w<3;w++)for(let r=0;r<4;r++)for(let d=0;d<4;d++){
  assert.ok(announcementLines(values,s,t,w,r,d).every(line=>line.length<=30));
 }
 const font=Uint8Array.from({length:0x50000},()=>0);font[0x3be6a+118*2]=0xab;font[0x3be6b+118*2]=0xac;assert.deepEqual(announcementTallTiles(font,'0'),[0xab,0xac]);assert.equal(announcementTile('0'),0xd3);assert.equal(announcementTile('h'),0x3c);assert.equal(announcementTile('.'),0xdf);
 assert.equal(announcementLayoutEnabled({}),false);assert.equal(announcementLayoutEnabled(changes),true);
 assert.equal(announcementLayoutEnabled({menuTexts:changes.menuTexts}),false);
});
test('layout preview toggles are independent from the applied project flags',async()=>{
 const elements=new Map(),create=()=>({value:'0',children:[],append(...x){this.children.push(...x)},replaceChildren(){this.children=[]},getContext(){return {clearRect(){},createImageData(){return {data:new Uint8ClampedArray(256*224*4)}},putImageData(){}}}});
 const get=id=>{if(!elements.has(id))elements.set(id,create());return elements.get(id)};
 const old=globalThis.document;globalThis.document={getElementById:get,createElement:create};
 try{
  let project={changes:{improvements:[]}},calls=[];
  const editor=installScreenEditors({getProject:()=>project,getFile:()=>new Uint8Array(0),textControl(){},addPresetButtons(){},onStatus(){},async updateImprovements(ids,checked){calls.push([ids,checked]);const s=new Set(project.changes.improvements);for(const id of ids)checked?s.add(id):s.delete(id);project={changes:{improvements:[...s]}}}});
  for(const [id,key]of [['stadiumLayoutOptimized','stadium-layout'],['announcementLayoutOptimized','announcement-layout']]){
   const box=get(id),apply=get(id+'Apply');box.checked=true;box.onchange();assert.equal(project.changes.improvements.includes(key),false);assert.equal(apply.disabled,false);
   await apply.onclick();assert.equal(project.changes.improvements.includes(key),true);assert.match(get(id+'Status').textContent,/implementada/);
   box.checked=false;box.onchange();assert.equal(project.changes.improvements.includes(key),true);await apply.onclick();assert.equal(project.changes.improvements.includes(key),false);
  }
  assert.equal(calls.length,4);editor.render();
 }finally{globalThis.document=old;}
});
test('native patch preserves the hour override and writes the shared encoded rows',{skip:!process.env.ISSSD_DELUXE_ROM},()=>{
 const base=splitRom(new Uint8Array(fs.readFileSync(process.env.ISSSD_DELUXE_ROM))).rom,out=base.slice();
 applyDeluxeAnnouncementLayout(out,base,{});
 assert.deepEqual(out,base);
 applyDeluxeAnnouncementLayout(out,base,{menuTexts:changes.menuTexts});
 assert.deepEqual(out,base);
 applyDeluxeAnnouncementLayout(out,base,changes);
 const encode=s=>Uint8Array.from([...announcementRow(s)].flatMap(c=>announcementTallTiles(base,c)));
 const expected=announcementLines(values,1,0,1,1,1);
 assert.deepEqual(out.slice(0x126900+60,0x126900+120),encode(expected[0]));
 assert.deepEqual(out.slice(0x126ae0+60,0x126ae0+120),encode(expected[1]));
 assert.deepEqual(out.slice(0x177900+300,0x177900+360),encode(expected[2]));
 assert.deepEqual(out.slice(0x177c00+60,0x177c00+120),encode(expected[3]));
 assert.deepEqual(out.slice(0x177d00,0x177d00+60),encode(expected[4]));
 assert.deepEqual(out.slice(0x34498,0x344a5),base.slice(0x34498,0x344a5));
});
