import {validateTeamPhotoDrafts,TEAM_PHOTO_WIDTH,TEAM_PHOTO_HEIGHT} from './deluxe-team-photo-drafts.mjs';
import {DELUXE_PROJECT_TO_PLUS} from './deluxe-team-identity.mjs';
import {konamiLzDecompress} from './konami-lz.mjs';

const w=n=>[n&255,n>>8&255],l=n=>[...w(n),n>>16&255],cpu=p=>0x800000|((p>>15)<<16)|0x8000|(p&32767),pc=c=>((c>>16&127)*32768)+(c&32767);
const PHOTO_VRAM=0x7400,PHOTO_BYTES=4096,PHOTO_OBJECT=0x5800;
class Code{constructor(){this.b=[];this.labels={};this.refs=[];}put(...b){this.b.push(...b);return this;}label(n){this.labels[n]=this.b.length;return this;}branch(op,n){if(op!==0x80)this.put(({0xd0:0xf0,0xf0:0xd0,0x90:0xb0,0xb0:0x90})[op],3);this.put(0x82);this.refs.push([this.b.length,n]);return this.put(0,0);}finish(){for(const[at,n]of this.refs){const d=this.labels[n]-at-2;this.b[at]=d&255;this.b[at+1]=d>>8&255;}return Uint8Array.from(this.b);}}

// 16×16 OBJ layout uses a 16-tile stride, not a packed 12-tile row.
export function encodeFormationTiles(photo){const raw=new Uint8Array(PHOTO_BYTES);for(let y=0;y<TEAM_PHOTO_HEIGHT;y++)for(let x=0;x<TEAM_PHOTO_WIDTH;x++){const tile=(y>>3)*16+(x>>3),v=photo.pixels[y*TEAM_PHOTO_WIDTH+x],bit=7-(x&7);for(let p=0;p<4;p++)raw[tile*32+(p>>1)*16+(y&7)*2+(p&1)]|=((v>>p)&1)<<bit;}return raw;}

function originalFormationTiles(base){const data=new Uint8Array(PHOTO_BYTES);for(const [source,dest] of [[0x9b9935,0x7400],[0x9b9faf,0x7900],[0x9b9fe3,0x79e0],[0x9ba3d0,0x78e0],[0x9ba078,0x7b00],[0xa18f86,0x7a80]]){const at=pc(source),decoded=konamiLzDecompress(base,at).data;let bytes=decoded;if(base[at+1]&128){bytes=new Uint8Array(decoded.length);for(let g=0;g<decoded.length;g+=16)for(let i=0;i<8;i++){bytes[g+i*2]=decoded[g+i];bytes[g+i*2+1]=decoded[g+8+i];}}data.set(bytes,(dest-PHOTO_VRAM)*2);}return data;}

export function applyDeluxeFormationPhotos(input,base,project){
 const drafts=project.changes.teamPhotoDrafts,ids=validateTeamPhotoDrafts(drafts);if(!ids.length)return input;
 const out=new Uint8Array(0x400000).fill(255);out.set(input);out[0x7fd7]=12;
 // Allocate after every other subsystem, with each DMA entirely in one LoROM bank.
 let cursor=0x3f8000;function alloc(bytes){let at=(cursor-bytes.length)&~1;while(at>=0x300000){if((at&32767)+bytes.length>32768){at=(at&~32767)-bytes.length;continue;}if(!out.subarray(at,at+bytes.length).some(v=>v!==255)){out.set(bytes,at);cursor=at;return at;}at=(at&~32767)-bytes.length;}throw Error('Fotos de formação: espaço de ROM insuficiente.');}
 const table=new Uint8Array(128*4),n=project.changes.structure?.teams.length??36,applied=new Set();for(let slot=0;slot<n;slot++){const id=project.changes.structure?.teams[slot]?.plusId??DELUXE_PROJECT_TO_PLUS[slot],photo=drafts[id];if(!photo)continue;const record=new Uint8Array(PHOTO_BYTES+32);record.set(encodeFormationTiles(photo));record.set(photo.colors.flatMap(w),PHOTO_BYTES);const address=cpu(alloc(record));table.set([...w(address),address>>16,0],slot*4);applied.add(id);}if(ids.some(id=>!applied.has(id)))throw Error('Foto importada pertence a equipe fora da estrutura atual.');
 const tableAt=cpu(alloc(table)),restoreAt=cpu(alloc(originalFormationTiles(base)));
 // Native frame interior begins at screen (24,40), not (16,48).
 const rows=[[],[],[],[]];for(let y=0;y<4;y++)for(let x=0;x<6;x++){rows[0].push(...w(0xff00|(x===0&&y===0?24:0)));rows[1].push(...w(8+x*16));rows[2].push(...w(8+y*16));rows[3].push(...w(0x140+y*32+x*2));}const objectAt=cpu(alloc(Uint8Array.from(rows.flat())));
 const code=new Code();
 // The native caller has already stored the selected team*2 in DP $26.
 code.put(0xa5,0x26,0x0a,0xaa,0xbf,...l(tableAt+2)).branch(0xf0,'native');
 // Custom: skip native photo DMA and palette script. Preserve caller DP/DB.
 code.put(0x0b,0x48,0xa9,0,0,0x5b,0x68,0xda,0x85,0,0xbf,...l(tableAt),0xa2,...w(PHOTO_BYTES),0xa0,...w(PHOTO_VRAM),0x22,...l(0x808e37),0xfa);
 // Read the palette directly after tile data, into the native OBJ palette #6.
 code.put(0xbf,...l(tableAt),0x18,0x69,...w(PHOTO_BYTES),0x85,0,0xbf,...l(tableAt+2),0x85,2,0xa0,0,0).label('pal').put(0xb7,0,0xbb,0x9f,...l(0x7e2dc0),0x9f,...l(0x7e2fc0),0xc8,0xc8,0xc0,32,0).branch(0x90,'pal').put(0x22,...l(0x80a310));
 // Copy the four interleaved native OAM tables to the unused selection-only
 // region just after the decompressed native formation record at $57dc.
 code.put(0x8b);for(let i=0;i<4;i++)code.put(0xa9,47,0,0xa2,...w(objectAt+i*48),0xa0,...w(PHOTO_OBJECT+i*0x2000),0x54,0x7e,objectAt>>16);code.put(0xab);
 // Clear only formation sprite descriptors, preserving the flags and UI.
 code.put(0xa9,0,0);for(const a of [0x1240,0x1280,0x12a0,0x12e0,0x1300,0x1320])code.put(0x8f,...l(0x7e0000+a));
 const desc=[PHOTO_OBJECT,0x0c00,0xb000,0,24,0,40,0,0,0x29,0,0,0,0,0,0];for(let i=0;i<desc.length;i++)code.put(0xa9,...w(desc[i]),0x8f,...l(0x7e12c0+i*2));
 code.put(0x2b,0xa5,0x26,0xaa,0x5c,...l(0x85b14d));
 // Switching back to a native team restores the static tiles before the
 // original routine reloads the team-dependent body strips.
 code.label('native').put(0x0b,0xa9,0,0,0x5b,0xa9,restoreAt>>16,0,0x85,0,0xa9,...w(restoreAt),0xa2,...w(PHOTO_BYTES),0xa0,...w(PHOTO_VRAM),0x22,...l(0x808e37),0x2b).put(0xa5,0x26,0xaa,0x5c,...l(0x85afa4));
 const helper=cpu(alloc(code.finish())),hook=0x2afa0,expected=[0x20,0x6f,0xaf,0xaa];if(expected.some((v,i)=>base[hook+i]!==v||out[hook+i]!==v))throw Error('Foto de formação: rotina original incompatível.');out.set([0x5c,...l(helper)],hook);return out;
}
