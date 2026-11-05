import fs from 'node:fs';import assert from 'node:assert/strict';
import {buildPlusProjectRom} from '../src/core/project-build.mjs';
import {readNativeAppearancePalettes} from '../src/core/player-appearance.mjs';
import {preparePlayerColorState} from '../src/core/player-color-plan.mjs';
import {applyAppearanceChoice} from '../src/core/player-color-catalog.mjs';
import {closeupPalette,CLOSEUP_PALETTE_SLOT} from '../src/core/plus-player-closeup.mjs';
const [basePath,projectPath,outputPath]=process.argv.slice(2);if(!basePath||!projectPath)throw Error('Uso: node scripts/verify-player-colors-real-rom.mjs ROM-Plus projeto.issdproj [saida.sfc]');
const base=new Uint8Array(fs.readFileSync(basePath)),project=JSON.parse(fs.readFileSync(projectPath,'utf8')),original=JSON.stringify(project),a=readNativeAppearancePalettes(base,0).palettes[1],b=readNativeAppearancePalettes(base,1).palettes[0];
project.state.semantic.playerColorsV1={schema:'isssd-player-colors-v1',version:1,players:{}};
for(let slot=2;slot<=20;slot++)if(slot!==12)project.state.semantic.playerColorsV1.players['30:'+slot]={skin:a.slice(2,7),hairColor:slot%2?b[1]:32767};
const prepared=preparePlayerColorState(base,project.state.semantic),plan=prepared.__playerColorPlans[30],rom=buildPlusProjectRom(base,project,{selectedAreas:['jogadores']}).rom;
const w=p=>rom[p]|rom[p+1]<<8,long=p=>rom[p]|rom[p+1]<<8|rom[p+2]<<16,pc=p=>((p>>16)&127)*32768+(p&32767),record=(site,offset)=>{const pointer=w(pc(long(site+1))+offset);return pointer<32768?0x2E0000+pointer:0x48000+(pointer&32767);};
const home=record(0x5CFD0,60),skin=record(0x5CFEA,60),hair=record(0x5CFFB,60);assert.equal(w(home+4),plan.combinations[0].hairColor);assert.equal(w(hair+2),plan.combinations[1].hairColor);assert.deepEqual(Array.from({length:5},(_,i)=>w(skin+2+i*2)),plan.combinations[1].skin);
for(const[slot,index]of Object.entries(plan.assignments)){
 assert.equal(rom[0x150000+30*140+(slot-1)*7+6]>>4&1,index);
 const colors=applyAppearanceChoice(readNativeAppearancePalettes(base,30).palettes[0],plan.combinations[index]);
 assert.deepEqual(Array.from({length:16},(_,i)=>w(CLOSEUP_PALETTE_SLOT+(30*20+Number(slot)-1)*32+i*2)),closeupPalette(colors));
}
const control=JSON.parse(original);delete control.state.semantic.playerColorsV1;const native=buildPlusProjectRom(base,control,{selectedAreas:['jogadores']}).rom;
const nw=p=>native[p]|native[p+1]<<8,nlong=p=>native[p]|native[p+1]<<8|native[p+2]<<16,ptr=nw(pc(nlong(0x5CFD1))+60),nativeRecord=ptr<32768?0x2E0000+ptr:0x48000+(ptr&32767);
assert.deepEqual(Array.from({length:9},(_,i)=>w(home+16+i*2)),Array.from({length:9},(_,i)=>nw(nativeRecord+16+i*2)));
if(outputPath)fs.writeFileSync(outputPath,rom);
console.log(JSON.stringify({ok:true,combinations:plan.combinations,slots:plan.assignments,output:outputPath??null}));
