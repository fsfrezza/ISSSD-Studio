import {DELUXE_PROJECT_TO_PLUS} from './deluxe-team-identity.mjs';
const word=(b,p)=>b[p]|b[p+1]<<8,long=(b,p)=>word(b,p)|b[p+2]<<16;
const w=n=>[n&255,n>>8&255],l=n=>[...w(n),n>>16&255],cpu=p=>0x800000|((p>>15)<<16)|32768|(p&32767),pc=c=>((c>>16&127)*32768)+(c&32767);
const fields=[['bodyType',0x81fd5e,0x82f91b,1],['faceType',0x81fb99,0x82fa35,1],['overlayType',0x81fbd1,0x82fab3,1],['extraType',0x81fc09,0x82f8f1,1],['accessory',0x82f970,0x82f61c,2],['formationFlags',0x81fe78,0x82fa07,1]];
export function validateTeamPhotos(value){
 if(value===undefined)return null;
 if(!value||value.schema!=='isssd-deluxe-team-photos-v1'||value.version!==1||!/^[a-f0-9]{64}$/.test(value.referenceSha256)||!value.teams||Object.keys(value.teams).length!==60)throw Error('Fotos de equipes: catálogo inválido');
 for(let id=0;id<60;id++){const t=value.teams[id];if(!t)throw Error('Foto ausente: '+id);for(const[key,,,stride]of fields)if(!Number.isInteger(t[key])||t[key]<0||t[key]>(stride===1?255:65535))throw Error('Seletor de foto inválido: '+id+' / '+key);if(!Array.isArray(t.palettes)||t.palettes.length!==5)throw Error('Paletas de foto ausentes');t.palettes.forEach((a,k)=>{const size=k<2?32:24;if(!Array.isArray(a)||a.length!==size||a.some(v=>!Number.isInteger(v)||v<0||v>255)||word(a,0)!==size-3)throw Error('Paleta de foto inválida: '+id+' / '+k);});}
 return value;
}
function directory(base,out,old){const hits=[];for(let at=0;at<base.length-4;at++)if(base[at]===0xbf&&long(base,at+1)===old&&out[at]===0xbf)hits.push(pc(long(out,at+1)));const unique=[...new Set(hits)];if(unique.length!==1)throw Error('Diretório de foto divergente '+old.toString(16));return unique[0];}
export function extractGGTeamPhotos(reference,plusBase,referenceSha256){
 if(reference.length!==0x400000||plusBase.length!==0x200000)throw Error('Fotos de equipes: ROMs incompatíveis');
 const dirs=fields.map(([,old])=>directory(plusBase,reference,old)),palDirs=[0x81fa49,0x81fab9,0x81fd96].map(old=>directory(plusBase,reference,old)),skinDir=directory(plusBase,reference,0x82f945),skinIndices=directory(plusBase,reference,0x81fb29),teams={};
 const palette=(pointer,size)=>{const at=pointer>=0x6000&&pointer<0x8000?0x2e0000+pointer:0x48000+(pointer&32767);if(word(reference,at)!==size-3)throw Error('Registro fotográfico incompatível '+pointer.toString(16));return Array.from(reference.slice(at,at+size));};
 for(let id=0;id<60;id++){const t={};fields.forEach(([key,,,stride],i)=>t[key]=stride===1?reference[dirs[i]+id]:word(reference,dirs[i]+id*2));t.palettes=palDirs.map((at,i)=>palette(word(reference,at+id*2),i<2?32:24));for(let i=0;i<2;i++)t.palettes.push(palette(word(reference,skinDir+reference[skinIndices+id*2+i]),24));teams[id]=t;}
 return validateTeamPhotos({schema:'isssd-deluxe-team-photos-v1',version:1,referenceSha256,teams});
}
class Code{constructor(){this.b=[];this.labels={};this.refs=[];}put(...b){this.b.push(...b);return this;}label(n){this.labels[n]=this.b.length;return this;}branch(op,n){if(op!==0x80)this.put(({0xd0:0xf0,0xf0:0xd0,0x90:0xb0,0xb0:0x90})[op],3);this.put(0x82);this.refs.push([this.b.length,n]);return this.put(0,0);}finish(){for(const[at,n]of this.refs){const d=this.labels[n]-at-2;this.b[at]=d&255;this.b[at+1]=d>>8&255;}return Uint8Array.from(this.b);}}
export function applyDeluxeTeamPhotos(input,base,structure,value){
 const model=validateTeamPhotos(value);if(!model)return input;if(!structure)throw Error('Fotos próprias exigem estrutura de equipes');
 const out=new Uint8Array(0x400000).fill(255);out.set(input);out[0x7fd7]=12;const n=structure.teams.length,total=n+7,rows=structure.teams.map((t,i)=>model.teams[t.plusId??DELUXE_PROJECT_TO_PLUS[i]]);
 let next=0x242000,palNext=0x24c000;const cache=new Map();
 const reserve=(at,data)=>{if(at+data.length>out.length||out.slice(at,at+data.length).some(v=>v!==255))throw Error('Foto: reserva ocupada '+at.toString(16));out.set(data,at);};
 const alloc=data=>{const at=next;next=(at+data.length+1)&~1;if(next>0x248000)throw Error('Tabelas de fotos excedem reserva');reserve(at,data);return at;};
 const palette=record=>{const key=record.join(',');if(cache.has(key))return cache.get(key);const at=palNext;palNext+=record.length;if(palNext>0x24e000)throw Error('Paletas de fotos excedem reserva');reserve(at,record);const pointer=at-0x248000;cache.set(key,pointer);return pointer;};
 const table=old=>directory(base,out,old);
 for(const[key,,old,stride]of fields){const at=table(old);for(let i=0;i<n;i++)out.set(stride===1?[rows[i][key]]:w(rows[i][key]),at+i*stride);}
 for(const[k,old]of[[0,0x82fa5f],[1,0x82f89d],[2,0x82f9b3]]){const at=table(old);for(let i=0;i<n;i++)out.set(w(palette(rows[i].palettes[k])),at+i*2);}
 const skinTable=table(0x82f95f),skinOriginal=0x17945,skinPointers=Array.from({length:13},(_,i)=>word(base,skinOriginal+i*2));
 for(let id=0;id<n;id++)for(let k=0;k<2;k++){const pointer=palette(rows[id].palettes[3+k]);let index=skinPointers.indexOf(pointer);if(index<0){index=skinPointers.length;skinPointers.push(pointer);}if(index>127)throw Error('Fotos: combinações de pele excedem o seletor nativo');out[skinTable+id*2+k]=index*2;}
 const newSkin=alloc(Uint8Array.from(skinPointers.flatMap(w)));for(let at=0;at<base.length-4;at++)if(base[at]===0xbf&&long(base,at+1)===0x82f945)out.set(l(cpu(newSkin)),at+1);
 // The original palette dispatcher already saves DB/X/Y. Distinguish two virtual banks.
 const c=new Code();c.put(0xc0,0,0x40).branch(0x90,'native').put(0xc0,0,0x80).branch(0xb0,'native').put(0xc0,0,0x60).branch(0xb0,'uniform');
 const copy=bank=>c.put(0x5a,0x29,0xfe,0,0xaa,0xbf,...l(0x819176),0xa8,0xfa,0x8a,0x09,0,0x80,0xaa,0xbf,0,0,bank,0xe8,0xe8,0x54,0x7e,bank,0x7a,0xfa,0xab,0x6b);
 copy(0xc9);c.label('uniform');copy(0xc5);c.label('native').put(0x29,0xfe,0,0xaa,0x5c,0xf3,0xa4,0x80);
 const hook=(at,expected,target)=>{if(expected.some((v,i)=>base[at+i]!==v))throw Error('Foto: rotina incompatível');out.set([0x5c,...l(cpu(target))],at);};hook(0x24ef,[0x29,0xfe,0,0xaa],alloc(c.finish()));
 const stream=new Code();stream.put(0x08,0x48,0xc0,0,0x80).branch(0xb0,'done').put(0xb9,1,0,0xc9,0,0x40).branch(0x90,'done').put(0xc9,0,0x80).branch(0xb0,'done').put(0xc9,0,0x60).branch(0xb0,'uniform');
 for(const[bank,label]of[[0xc9,'photo'],[0xc5,'uniform']]){stream.label(label).put(0x09,0,0x80,0x99,1,0,0xb9,3,0,0x29,0,255,0x09,bank,0,0x99,3,0);if(bank===0xc9)stream.branch(0x80,'done');}
 stream.label('done').put(0x68,0x28,0xa9,0xa0,0,0x85,8,0x5c,0x7b,0xa9,0x80);hook(0x2976,[0xa9,0xa0,0,0x85],alloc(stream.finish()));out[0x297a]=0xea;
 return out;
}
