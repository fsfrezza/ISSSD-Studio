import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
import {decodeHairSheet} from '../../scripts/player-hair-png.mjs';
import {CUSTOM_HAIR_MANUAL_FRAMES} from '../core/player-hair-manual.mjs';
import {CUSTOM_HAIR_SLOT,encodeHairTile} from '../core/plus-custom-hair.mjs';
import {playerOffset} from '../core/plus-player.mjs';
export function loadPlayerHairFiles(root){
 const frames={},files={};for(const [h,name]of [[14,'14-original.png'],[15,'15-cascao.png']]){const bytes=fs.readFileSync(path.join(root,'assets/player-hair',name));frames[h]=decodeHairSheet(bytes);files[name]=createHash('sha256').update(bytes).digest('hex');}return{frames,files};
}
export function installPlayerHairFiles(root){const loaded=loadPlayerHairFiles(root);Object.assign(CUSTOM_HAIR_MANUAL_FRAMES,loaded.frames);return loaded;}
export function verifyPlayerHairFiles(rom,frames){
 if(rom.length!==0x400000)throw Error('Verifique uma ROM exportada de 4 MB.');
 const styles=[];for(let t=0;t<56;t++)for(let p=0;p<20;p++){const h=rom[playerOffset(t,p)+6]&15;if(h>=14&&!styles.includes(h))styles.push(h);}styles.sort();
 for(const h of styles){
  if(rom[0xC7BC3]!==0x22||rom[0xC7BE0]!==0x22)throw Error('Cabelo '+h+': gravador de gráficos novos não instalado na ROM.');
  const at=CUSTOM_HAIR_SLOT+(h-1)*4,pointer=rom[at]|rom[at+1]<<8|rom[at+2]<<16,pc=((pointer>>>16)&127)*0x8000+(pointer&32767);
  if(pc!==CUSTOM_HAIR_SLOT+0x100+(h-14)*0x300)throw Error('Cabelo '+h+': ponteiro final divergente.');
  for(let f=0;f<24;f++){const expected=encodeHairTile(frames[h][f]);for(let i=0;i<32;i++)if(rom[pc+f*32+i]!==expected[i])throw Error('Cabelo '+h+', quadro '+(f+1)+': os pixels do PNG não chegaram corretamente à ROM.');}
 }
 return {styles,framesVerified:styles.length*24,exactMatch:true};
}
