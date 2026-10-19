import test from 'node:test';
import assert from 'node:assert/strict';
import {MATCH_ANNOUNCEMENTS,MATCH_ANNOUNCEMENT_FALLBACKS} from '../src/core/match-announcement-fields.mjs';
import {renderMatchAnnouncements,plusMatchAnnouncementsWriter,MATCH_FONT_SLOT,MATCH_ANNOUNCEMENT_REGIONS} from '../src/core/plus-match-announcements.mjs';
import {konamiLzCompress,konamiLzDecompress} from '../src/core/konami-lz.mjs';
import {expandPlusTo4MiB} from '../src/core/plus-tactics-infrastructure.mjs';
import {areaClassifier} from '../src/core/cumulative-areas.mjs';
import {buildCumulativeProject} from '../src/core/cumulative-build.mjs';
import {makePlusTacticalFixture} from './plus-tactics-fixture.mjs';
const word=n=>[n&255,n>>8&255],long=n=>[n&255,n>>8&255,n>>16&255];
const values=Object.fromEntries(MATCH_ANNOUNCEMENTS.map(([id,,pt])=>[id,pt]));
const state=v=>({additionalScreenTextsV1:{schema:'isssd-additional-screen-texts-v1',values:{'match-announcements':v}}});
function fixture(){const b=makePlusTacticalFixture();b.fill(255,0x184400,0x184800);b.set([0xF4,0,0x8B,0xAB,0xAB,0xA4,0,0xB9,0xD2,0xE7],0x5B703);
 for(const [pc,size,len]of [[0x116D81,151,240],[0x116E18,66,240],[0x116E5A,509,656],[0x117057,267,656]]){const p=konamiLzCompress(new Uint8Array(len)),pad=new Uint8Array(size).fill(128);pad.set(p);pad[0]=size&255;pad[1]=size>>8;b.set(pad,pc);}
 for(let i=0;i<4;i++){const p=[0x116D81,0x116E18,0x116E5A,0x117057][i];b.set(long((0x800000|((p>>15)<<16)|0x8000|(p&32767))^0x400000),0x12038+i*6);}
 for(let i=0;i<4;i++)b.set([128,0,1,24,...word(0x5D00+i*128),...long(0x99FA63+i*256),...word(i===3?192:256),0,0],[0x1271F3,0x127200,0x12720D,0x12721A][i]);
 MATCH_ANNOUNCEMENTS.forEach((f,i)=>b.set(word(f[3]),0x5E7D2+i*2));return b;
}
test('wider Portuguese announcements retain height and use only the approved red-card fallback',()=>{
 const r=renderMatchAnnouncements(values);assert.equal(r.texts[0],'GOL!');assert.equal(r.texts[3],'CARTÃO AMARELO');assert.equal(r.texts[4],'VERMELHO');assert.equal(r.texts[6],'IMPEDIMENTO');assert.deepEqual(r.fallbacks,['redCard']);assert.ok(r.blockCount<=41);assert.ok(r.fontTileCount<=96);
 assert.ok(r.characters.includes('Ã')&&r.characters.includes('Ê')&&r.characters.includes('Ó'));
 for(let i=0;i<4;i++)assert.deepEqual(konamiLzDecompress(r.packed[i]).data,r.raw[i]);
 for(const [i,[pc,bytes]]of r.descriptors.entries()){const f=MATCH_ANNOUNCEMENTS[i];assert.ok(pc>=0x3E3440&&pc<0x3E3C00);assert.ok(bytes.length>=6);assert.deepEqual([...bytes.slice(-2)],[255,255],'preserve shared sentinel, including score-only DATA_8BE836');let ended=false;for(let at=0;at<bytes.length-2;at+=4){if((bytes[at]|bytes[at+1]<<8)===65535){ended=true;break;}const source=bytes[at+2]|bytes[at+3]<<8;assert.ok(source>=0xC000&&source<0xC720);}assert.ok(ended||(bytes.at(-1)===255&&bytes.at(-2)===255));}
});
test('independent English restoration and each approved shorter alternative remain renderable',()=>{
 for(const [id,en]of MATCH_ANNOUNCEMENTS)assert.doesNotThrow(()=>renderMatchAnnouncements({...values,[id]:en}));
 for(const [id,text]of Object.entries(MATCH_ANNOUNCEMENT_FALLBACKS))assert.equal(renderMatchAnnouncements({...values,[id]:text}).texts[MATCH_ANNOUNCEMENTS.findIndex(f=>f[0]===id)],text);
});
test('native four-column transfers compose wider letters without erasing their neighbours',()=>{
 const r=renderMatchAnnouncements(values),map=new Uint16Array(32*10),bytes=r.descriptors[1][1];
 for(let at=0;at<bytes.length-2;at+=4){const dest=(bytes[at]|bytes[at+1]<<8)/2,source=((bytes[at+2]|bytes[at+3]<<8)-0xC200)/2;for(let y=0;y<4;y++)for(let x=0;x<4;x++)map[dest+y*32+x]=r.raw[2][source+y*4+x]|r.raw[3][source+y*4+x]<<8;}
 const ink=[];for(let y=0;y<80;y++)for(let x=0;x<256;x++){const t=(map[(y>>3)*32+(x>>3)]&1023)-0x190;if(t<0)continue;const pos=t*16+(y%8)*2,bit=7-x%8,v=(r.font[pos]>>bit&1)|(r.font[pos+1]>>bit&1)<<1;if(v===1)ink.push([x,y]);}
 const first=ink.filter(([x])=>x<104);assert.equal(Math.max(...first.map(p=>p[0]))-Math.min(...first.map(p=>p[0]))+1,10);assert.equal(Math.max(...first.map(p=>p[1]))-Math.min(...first.map(p=>p[1]))+1,28);
 for(let i=0;i<5;i++)assert.ok(ink.some(([x])=>x>=88+i*16&&x<104+i*16),'every letter of FALTA survives the overlapping native transfers');
});
test('the native writer is atomic and does not change the immutable base or semantic values',()=>{
 const base=fixture(),rom=expandPlusTo4MiB(base),before=base.slice(),initial=rom.slice(),s=state(values),saved=structuredClone(s);plusMatchAnnouncementsWriter(rom,s,base,['partida']);assert.deepEqual(base,before);assert.deepEqual(s,saved);assert.ok(rom.slice(MATCH_FONT_SLOT,MATCH_FONT_SLOT+1536).some(v=>v!==255));
 const classify=areaClassifier(rom,base);for(let i=0;i<rom.length;i++)if(rom[i]!==initial[i])assert.equal(classify(i),'partida');
 for(const [a,b]of MATCH_ANNOUNCEMENT_REGIONS){assert.equal(classify(a),'partida');assert.equal(classify(b-1),'partida');}
});
test('unchecked, English-only, and unconfirmed drafts preserve native assets; bad input fails before mutation',()=>{
 const base=fixture(),rom=expandPlusTo4MiB(base),before=rom.slice();plusMatchAnnouncementsWriter(rom,state(values),base,['pre-partida']);assert.deepEqual(rom,before);
 plusMatchAnnouncementsWriter(rom,state(Object.fromEntries(MATCH_ANNOUNCEMENTS.map(([id,en])=>[id,en]))),base);assert.deepEqual(rom,before);
 plusMatchAnnouncementsWriter(rom,{additionalScreenTextsV1:{drafts:{'match-announcements':values}}},base);assert.deepEqual(rom,before);
 for(const v of [{...values,goal:'GOL@'},{...values,foul:'FALTA '.repeat(30)}]){assert.throws(()=>plusMatchAnnouncementsWriter(rom,state(v),base));assert.deepEqual(rom,before);}
 const wrong=base.slice();wrong[0x1271F3]^=1;assert.throws(()=>plusMatchAnnouncementsWriter(rom,state(values),wrong),/DMA/);assert.deepEqual(rom,before);
});
test('the new match phase exports every mapped byte and is absent when unchecked',()=>{
 const base=fixture(),shots=[],r=buildCumulativeProject(base,{state:{semantic:state(values)}},{selectedAreas:['infraestrutura','partida'],onRom:(rom,entry)=>shots.push({rom,entry})});
 assert.deepEqual(r.pendingTextChanges,[]);assert.deepEqual(r.unassignedLegacyRanges,[]);assert.equal(r.entries.at(-1).name,'10-partida.sfc');assert.ok(shots[0].rom.slice(MATCH_FONT_SLOT,MATCH_FONT_SLOT+1536).every(v=>v===255));assert.ok(shots[1].rom.slice(MATCH_FONT_SLOT,MATCH_FONT_SLOT+1536).some(v=>v!==255));
 const skipped=[];buildCumulativeProject(base,{state:{semantic:state(values)}},{selectedAreas:['infraestrutura'],onRom:rom=>skipped.push(rom)});assert.ok(skipped[0].slice(MATCH_FONT_SLOT,MATCH_FONT_SLOT+1536).every(v=>v===255));
});

test('emitted notice DMAs preserve live flag cells and both scoreboard name strips',()=>{
 const b=fixture(),rom=expandPlusTo4MiB(b);plusMatchAnnouncementsWriter(rom,state(values),b,['partida']);
 for(const pc of [0x1271F3,0x127200,0x12720D,0x12721A]){
  const start=rom[pc+4]|rom[pc+5]<<8,size=rom[pc+9]|rom[pc+10]<<8;
  assert.ok(start>=0x5C80);assert.ok(start+size/2<=0x5F50,'never DMA over the team names beginning at 5F50');
 }
 const rendered=renderMatchAnnouncements(values);assert.ok(rendered.fontTileCount<=90);
});
