import {seedNativeMenuFontFixture} from './native-menu-font-fixture.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {plusExtraMenuGraphicsWriter,EXTRA_MENU_GRAPHIC_REGIONS} from '../src/core/plus-extra-menu-graphics.mjs';
import {konamiLzCompress,konamiLzDecompress} from '../src/core/konami-lz.mjs';
import {areaClassifier} from '../src/core/cumulative-areas.mjs';
import {transformLabelPlanes} from '../src/core/plus-graphical-labels.mjs';
const top=[0x2898,0x28A9,0x28B4,0x2898,0xA893,0,0xA893,0x2890,0x28B2,0x28B2,0x28B8,0xA8A2,0xA893,0x2896,0x287E];
const bottom=[0x2899,0x28AA,0xA89F,0x2899,0x28B1,0,0x28AE,0x2891,0x28B3,0x28B3,0x28B9,0x28A2,0x28B1,0xA896,0x287F];
function padded(raw,size){const p=konamiLzCompress(raw);assert.ok(p.length<=size);const out=new Uint8Array(size).fill(0x80);out.set(p);out[0]=size&255;out[1]=size>>8;return out;}
function fixture(){const b=new Uint8Array(0x200000).fill(255),map=new Uint8Array(2048);for(let i=0;i<15;i++){const a=(2*32+9+i)*2,c=(3*32+9+i)*2;map[a]=top[i]&255;map[a+1]=top[i]>>8;map[c]=bottom[i]&255;map[c+1]=bottom[i]>>8;}b.set(padded(map,478),0x157469);b.set(padded(new Uint8Array(608),459),0x173CA4);b.set([0xA4,0xBC,0xAE],0x1193D);
 b.set([0x72,0x74,0x76,0x78,0x80,0x82,0x84,0x73,0x75,0x77,0x79,0x81,0x83,0x85],0x3DF7A);
 b.set([0x7A,0x7C,0x7E,0x80,0x82,0x84,0,0x7B,0x7D,0x7F,0x81,0x83,0x85,0],0x3DF44);
 b.set([0x86,0x88,0x8A,0x8C,0x8E,0x90,0x87,0x89,0x8B,0x8D,0x8F,0x91],0x3DF93);b.set([0x86,0x88,0x8A,0x92,0x94,0x96,0x87,0x89,0x8B,0x93,0x95,0x97],0x3DFA7);return seedNativeMenuFontFixture(b);}
const state={additionalScreenTextsV1:{values:{'password-graphics':{enterPassword:'DIGITE SENHA'},'challenge-graphics-extra':{cornerKick:'ESCANTEIO',freeKick:'FALTA',bestTime:'TEMPO',bestScore:'PONTOS'}}}};
test('password keeps its native 16px font and challenge labels receive independent rectangles',()=>{
 const b=fixture(),before=b.slice(),r=b.slice();plusExtraMenuGraphicsWriter(r,state,b);assert.deepEqual(b,before);const map=konamiLzDecompress(r,0x157469).data;
 assert.equal(map[2*(2*32+11)],0x9F);assert.equal(map[2*(3*32+11)],0xA0,'I must not acquire the bottom horizontal stroke of L');
 const font=konamiLzDecompress(r,0x176500).data;assert.equal(font.length,1408);assert.deepEqual(font.slice(0,608),new Uint8Array(608));assert.ok(font.slice(608).some(v=>v));
 assert.notDeepEqual(r.slice(0x3DF7A,0x3DF88),b.slice(0x3DF7A,0x3DF88));assert.notDeepEqual(r.slice(0x3DF93,0x3DF9F),b.slice(0x3DF93,0x3DF9F));
 const classify=areaClassifier(r,b);for(let i=0;i<r.length;i++)if(r[i]!==b[i])assert.equal(classify(i),'pre-partida',i.toString(16));for(const [a,z]of EXTRA_MENU_GRAPHIC_REGIONS){assert.equal(classify(a),'pre-partida');assert.equal(classify(z-1),'pre-partida');}
});
test('extra graphics are atomic, keep drafts uncommitted and obey phase selection',()=>{
 const b=fixture(),r=b.slice();plusExtraMenuGraphicsWriter(r,state,b,['partida']);assert.deepEqual(r,b);plusExtraMenuGraphicsWriter(r,{additionalScreenTextsV1:{drafts:state.additionalScreenTextsV1.values}},b);assert.deepEqual(r,b);
 for(const value of ['#','DIGITE SENHA'.repeat(4)]){assert.throws(()=>plusExtraMenuGraphicsWriter(r,{additionalScreenTextsV1:{values:{'password-graphics':{enterPassword:value}}}},b));assert.deepEqual(r,b);}
 const bad=b.slice();bad[0x3DF93]=0;assert.throws(()=>plusExtraMenuGraphicsWriter(r,state,bad),/descritor/);assert.deepEqual(r,b);
});
test('the redundant scenario legend can be hidden without shortening the Portuguese description',()=>{
 const b=fixture();b.set([0x97,0x99,0x9B,0x9D,0x9F,0x98,0x9A,0x9C,0x9E,0xA0],0x3EE01);b.set([0x22,0xA4,0x8D,0x85],0x525D8);const r=b.slice();
 plusExtraMenuGraphicsWriter(r,{additionalScreenTextsV1:{values:{'scenario-graphics':{timeRemaining:''}}}},b);assert.deepEqual([...r.slice(0x525D8,0x525DC)],[0xEA,0xEA,0xEA,0xEA]);assert.deepEqual(r.slice(0x3EE01,0x3F113),b.slice(0x3EE01,0x3F113));
 const english=b.slice();plusExtraMenuGraphicsWriter(english,{additionalScreenTextsV1:{values:{'scenario-graphics':{timeRemaining:'TIME REMAINING'}}}},b);assert.deepEqual(english,b);
});
test('competition titles retain native tiles and create matching vertically reflected maps',()=>{
 const b=new Uint8Array(0x200000).fill(255),font=new Uint8Array(4512);
 for(let t=0;t<141;t++)for(let y=0;y<8;y++)font[t*32+y*2]=255;
 // Synthetic rectangular glyphs exercise segmentation without shipping ROM art.
 for(let t=2;t<6;t++)for(let y=0;y<8;y++){font[t*32+y*2]=255;font[t*32+y*2+1]=0xF8;font[t*32+16+y*2+1]=0xF8;}
 const native=transformLabelPlanes(font,true),packed=padded(native,1099);packed[1]|=128;b.set(packed,0x13680A);b.set([0x0A,0xE8,0xA6],0x10510);
 function map(lines){const raw=new Uint8Array(2048);for(let i=0;i<1024;i++){raw[i*2]=1;raw[i*2+1]=12;}for(const [row,text]of lines)for(const [i,c]of [...text].entries())if(c!==' ')for(let y=0;y<4;y++){const at=((row+y)*32+2+i*2)*2;raw[at]=2+y;}return raw;}
 for(const [pc,lines]of [[0x13DDA2,[[6,'WORLD SERIES'],[14,'1ST SEASON']]],[0x13DB46,[[6,'WORLD SERIES'],[14,'2ND SEASON']]],[0x8F79C,[[10,'INTERNATIONAL']]],[0x136C55,[[10,'CHAMPIONSHIP']]],[0x8F925,[[10,'SHORT LEAGUE']]]])b.set(konamiLzCompress(map(lines)),pc);
 for(const [pc,bytes]of [[0x10535,[0x9C,0xF7,0x91]],[0x1055F,[0xA2,0xDD,0xA7]],[0x10567,[0x46,0xDB,0xA7]]])b.set(bytes,pc);
 const r=b.slice(),before=b.slice();plusExtraMenuGraphicsWriter(r,{additionalScreenTextsV1:{values:{'competition-graphics':{worldSeries:'MEGACOPA',firstSeason:'1A TEMPORADA',secondSeason:'2A TEMPORADA',international:'CAMPEONATO'}}}},b);assert.deepEqual(b,before);
 assert.deepEqual(konamiLzDecompress(r,0x185000).data.slice(0,4512),native);
 for(const [pc,rows]of [[0x176D00,[10]],[0x177100,[6,14]],[0x177500,[6,14]]]){const m=konamiLzDecompress(r,pc).data;for(const row of rows)for(let y=0;y<4;y++)for(let x=0;x<32;x++){const a=m[(row+y)*64+x*2]|m[(row+y)*64+x*2+1]<<8,z=m[(row+7-y)*64+x*2]|m[(row+7-y)*64+x*2+1]<<8;assert.equal(a&1023,z&1023);assert.equal(z&0x8000,0x8000);}}
 const classify=areaClassifier(r,b);for(let i=0;i<r.length;i++)if(r[i]!==b[i])assert.equal(classify(i),'pre-partida');
});

test('PONTOS uses the same native shaded tall glyph cells as DRIBBLE and PASS',()=>{
 const b=fixture(),r=b.slice();plusExtraMenuGraphicsWriter(r,state,b);
 const atlas=konamiLzDecompress(r,0x176500).data,native=konamiLzDecompress(b,0xD8337).data;
 for(const [i,c]of [...'PONTOS'].entries())for(let y=0;y<2;y++){const code=0x68+c.charCodeAt(0)-65,tile=b[0x3BE6A+code*2+y]-0x90;assert.deepEqual(atlas.slice(1216+(y*6+i)*16,1232+(y*6+i)*16),native.slice(tile*16,(tile+1)*16));}
});

test('shrinking ESCANTEIO preserves strokes in native source columns skipped by nearest-neighbour sampling',()=>{
 const b=fixture(),font=new Uint8Array(768);for(let t=0;t<48;t++)for(let y=0;y<8;y++){font[t*16+y*2]=255;font[t*16+y*2+1]=0xEF;}
 b.set(konamiLzCompress(font),0xD8337);const r=b.slice();plusExtraMenuGraphicsWriter(r,state,b);
 const written=konamiLzDecompress(r,0x176500).data.slice(608,608+7*32);assert.ok(written.some((v,i)=>i%2===0&&(v&~written[i+1])),'white ink in the fourth source column must survive instead of becoming dark outline');
});

test('password SAIR changes only its three native caption tiles and private loader, preserving OK and the keyboard',()=>{
 const b=fixture(),raw=new Uint8Array(528);for(let i=0;i<raw.length;i++)raw[i]=i%7===0?0x55:0;
 b.set(padded(raw,390),0x16BAF9);b.set([0xF9,0xBA,0xAD],0x117D1);const r=b.slice(),s={additionalScreenTextsV1:{values:{'password-graphics':{exit:'SAIR'}}}};
 plusExtraMenuGraphicsWriter(r,s,b);const next=konamiLzDecompress(r,0x187000).data;
 for(let t=0;t<33;t++)if(![3,4,32].includes(t))assert.deepEqual(next.slice(t*16,t*16+16),raw.slice(t*16,t*16+16));
 assert.notDeepEqual(next,raw);assert.deepEqual(r.slice(0x157469,0x157647),b.slice(0x157469,0x157647));assert.deepEqual(r.slice(0x16BAF9,0x16BAF9+390),b.slice(0x16BAF9,0x16BAF9+390));
 assert.equal(areaClassifier(r,b)(0x187000),'pre-partida');assert.equal(areaClassifier(r,b)(0x117D1),'pre-partida');
 const bad=b.slice();assert.throws(()=>plusExtraMenuGraphicsWriter(bad,{additionalScreenTextsV1:{values:{'password-graphics':{exit:'SAIRAGORA'}}}},b),/até 4/);assert.deepEqual(bad,b);
});
