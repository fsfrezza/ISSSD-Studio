import test from 'node:test';import assert from 'node:assert/strict';import{encodeHairSheet,decodeHairSheet}from'../scripts/player-hair-png.mjs';
const frames=()=>Array.from({length:24},(_,f)=>Array.from({length:64},(_,i)=>(f+i)%16));
test('manual PNG sheets preserve every palette index, pose ordering and transparent pixel',()=>{const f=frames(),png=encodeHairSheet(f);assert.deepEqual(decodeHairSheet(png),f);f[23][63]=1;assert.deepEqual(decodeHairSheet(encodeHairSheet(f)),f);});
test('manual PNG importer rejects corruption and invalid dimensions before changing source data',()=>{const png=encodeHairSheet(frames()),before=Buffer.from(png);assert.throws(()=>decodeHairSheet(Buffer.from('bad')),/PNG/);const bad=Buffer.from(png);bad[50]^=255;assert.throws(()=>decodeHairSheet(bad),/CRC/);assert.deepEqual(png,before);assert.throws(()=>encodeHairSheet([[]]),/24/);});
test('independently encoded RGBA PNG from an image editor preserves the final pose pixel',()=>{const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAEAAAAAYCAYAAABKtPtEAAAAIElEQVR4nO3BAQEAAAgCIKf4/2QOCUgAAAAAAIAP2t4AGjcBYFIlMaQAAAAASUVORK5CYII=','base64'),f=decodeHairSheet(png);assert.equal(f[23][63],1);assert.equal(f.flat().filter(Boolean).length,1);});

test('bald profile artwork removes native rear hair corners and preserves frontal poses',async()=>{
 const fs=await import('node:fs');
 const native=decodeHairSheet(fs.readFileSync(new URL('../assets/player-hair/13-nativo.png',import.meta.url)));
 const bald=decodeHairSheet(fs.readFileSync(new URL('../assets/player-hair/14-careca.png',import.meta.url)));
 const tuft=decodeHairSheet(fs.readFileSync(new URL('../assets/player-hair/15-cascao.png',import.meta.url)));
 const trims={1:[11],2:[11,18],3:[11,18],6:[11],7:[11,18],8:[11,18],11:[11],12:[11,18],13:[11,18],15:[19,26],16:[19,26],17:[19,26]};
 for(const [frame,indices]of Object.entries(trims))for(const i of indices){assert.notEqual(native[frame][i],0);assert.equal(bald[frame][i],0);assert.equal(tuft[frame][i],0);}
 for(const frame of [0,4,5,9,10,14])assert.deepEqual(bald[frame],native[frame].map(v=>v===1?3:v));
 for(let f=0;f<24;f++){assert.equal(bald[f].includes(1),false);assert.deepEqual(bald[f].map(v=>v!==0),tuft[f].map(v=>v!==0));}
});
