import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DELUXE_SCREEN_EDITORS,deluxeScreenModel,deluxeScreenScene,MOVED_MENU_SECTIONS} from '../src/core/deluxe-screen-scenes.mjs';
import {applyDeluxePrematchLabels,DELUXE_PREMATCH_PORTUGUESE,PREMATCH_GRAPHIC_MAPS} from '../src/core/deluxe-prematch-labels.mjs';
import {createDeluxeProject,buildDeluxeProject,splitRom} from '../src/core/deluxe-project.mjs';
const fixture=process.env.ISSSD_DELUXE_ROM;
test('stadium preview selection tracks the project layout toggle',()=>{const p={changes:{improvements:[]}};assert.equal(deluxeScreenModel('stadium-screen',p).stadiumOptimized,false);p.changes.improvements.push('stadium-layout');assert.equal(deluxeScreenModel('stadium-screen',p).stadiumOptimized,true);p.changes.improvements=[];assert.equal(deluxeScreenModel('stadium-screen',p).stadiumOptimized,false);});
test('hour preview animates the native frame without modifying the project or background',()=>{
 const reference=new Uint8Array(256*224*4).fill(49),base=new Uint8Array(0x40000),project={changes:{improvements:['stadium-layout','match-hour']}},before=JSON.stringify(project);
 const active=deluxeScreenScene(base,'stadium-screen',project,0,reference,true),inactive=deluxeScreenScene(base,'stadium-screen',project,0,reference,false);
 assert.notDeepEqual(active.rgba,inactive.rgba);
 const pixel=(scene,x,y)=>Array.from(scene.rgba.slice((y*256+x)*4,(y*256+x)*4+4));
 assert.deepEqual(pixel(active,100,198),[255,255,131,255]);assert.deepEqual(pixel(inactive,100,198),[0,205,255,255]);
 assert.deepEqual(pixel(active,100,210),pixel(inactive,100,210));assert.equal(JSON.stringify(project),before);
});
test('screen fields retain their existing project paths and appear once',()=>{
 const p={changes:{menuTexts:{'game-type-native':{friendly:'JOGATINA',friendlyHelp:'X1 maroto'},'handicap-native':{data_87c811:'-VANTAGEM-'}},preMatchLabels:{gameStart:'INICIAR JOGO'}}},before=JSON.stringify(p);
 assert.equal(deluxeScreenModel('open-game',p).values.friendly,'JOGATINA');assert.equal(deluxeScreenModel('handicap',p).values.data_87c811,'-VANTAGEM-');assert.equal(deluxeScreenModel('pre-match',p).labels.gameStart,'INICIAR JOGO');assert.equal(JSON.stringify(p),before);
 assert.equal(MOVED_MENU_SECTIONS.size,4);assert.throws(()=>deluxeScreenModel('open-game',p,3),/inválida/);
 const html=fs.readFileSync(new URL('../deluxe-editor/index.html',import.meta.url),'utf8');
 for(const config of DELUXE_SCREEN_EDITORS){assert.equal([...html.matchAll(new RegExp('data-panel="'+config.id+'"','g'))].length,1);assert.match(html,new RegExp('data-page="'+config.id+'"'));}
});
test('previews use the real wallpaper and change with text/selection without mutating the project',{skip:!fixture},async()=>{
 const file=new Uint8Array(fs.readFileSync(fixture)),base=splitRom(file).rom,p=await createDeluxeProject(file),before=JSON.stringify(p);
 for(const config of DELUXE_SCREEN_EDITORS){const a=deluxeScreenScene(base,config.id,p,0),b=deluxeScreenScene(base,config.id,p,config.choices.length>1?1:0);assert.equal(a.rgba.length,256*224*4);if(config.choices.length>1)assert.notDeepEqual(a.rgba,b.rgba);assert.ok(a.rgba.every((v,i)=>i%4!==3||v===255));}
 assert.equal(JSON.stringify(p),before);const a=deluxeScreenScene(base,'open-game',p);p.changes.menuTexts={'game-type-native':{friendly:'JOGATINA',friendlyHelp:'X1 maroto'}};assert.notDeepEqual(a.rgba,deluxeScreenScene(base,'open-game',p).rgba);
});
test('all twelve pre-match labels export safely, survive roundtrip and restore to the original ROM',{skip:!fixture},async()=>{
 const file=new Uint8Array(fs.readFileSync(fixture)),base=splitRom(file).rom,p=await createDeluxeProject(file),out=base.slice();
 applyDeluxePrematchLabels(out,base,DELUXE_PREMATCH_PORTUGUESE);
 const ranges=[[0x11201,0x1124a],[0x17e800,0x17fc00],[0xf631c,0xf631c+2153],...PREMATCH_GRAPHIC_MAPS.map(m=>[m.pc,m.pc+m.size])];let count=0;
 for(let i=0;i<base.length;i++)if(base[i]!==out[i]){count++;assert.ok(ranges.some(([a,b])=>i>=a&&i<b),'Unexpected write '+i.toString(16));}assert.ok(count>0);
 p.changes.preMatchLabels=DELUXE_PREMATCH_PORTUGUESE;const saved=JSON.parse(JSON.stringify(p));await buildDeluxeProject(file,saved);assert.deepEqual(saved,p);
 delete saved.changes.preMatchLabels;assert.deepEqual((await buildDeluxeProject(file,saved)).rom,file);
 const single=base.slice();applyDeluxePrematchLabels(single,base,{gameStart:'INICIAR JOGO'});assert.notDeepEqual(single.slice(0x11246,0x11249),base.slice(0x11246,0x11249));assert.ok(single.slice(0x17e800,0x180000).some(v=>v!==255));
 const occupied=base.slice();occupied[0x17e800]=0;const snapshot=occupied.slice();assert.throws(()=>applyDeluxePrematchLabels(occupied,base,{gameStart:'INICIAR JOGO'}),/reserva/);assert.deepEqual(occupied,snapshot);
 const untouched=base.slice();assert.throws(()=>applyDeluxePrematchLabels(untouched,base,{gameStart:'W'.repeat(40)}),/excede/);assert.deepEqual(untouched,base);
 assert.throws(()=>applyDeluxePrematchLabels(base.slice(),base,{unknown:'NO'}),/inválidos/);
});

test('reference previews preserve the example flags and USA while replacing editable labels',()=>{
 const reference=new Uint8Array(256*224*4).fill(140);for(let i=3;i<reference.length;i+=4)reference[i]=255;
 const project={changes:{menuTexts:{'handicap-native':{data_87c811:'VANTAGEM'},'stadium-native':{data_87ca36:'ESTADIO',data_87ca57:'JOGO DE HOJE'}}}},snapshot=JSON.stringify(project);
 for(const [id,x,y]of [['handicap',100,44],['stadium-screen',90,50],['match-announcement',40,60]]){const scene=deluxeScreenScene(new Uint8Array(),id,project,0,reference);const at=(y*256+x)*4;assert.deepEqual(Array.from(scene.rgba.slice(at,at+4)),Array.from(reference.slice(at,at+4)));assert.notDeepEqual(scene.rgba,reference);}
 assert.equal(JSON.stringify(project),snapshot);
});
