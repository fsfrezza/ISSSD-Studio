import {closeupPalette,closeupHeadTiles,closeupHelper,closeupFrameHelper,CLOSEUP_PALETTE_SLOT,CLOSEUP_STYLE_SLOT,CLOSEUP_HEAD_SLOT,CLOSEUP_HELPER_SLOT} from './deluxe-player-closeup-helpers.mjs';
import {deluxeAppearance,deluxeVisualRow,deluxePlayerPalette,visualTeamId} from './deluxe-visual-preview.mjs';
import {CLOSEUP_REFERENCE} from './deluxe-closeup-reference.mjs';
const cpu=p=>0x800000|((p>>15)<<16)|32768|(p&32767),long=n=>[n&255,n>>8&255,n>>16&255];
// Reuse the Plus native close-up renderer, with Deluxe roster identities and
// sixty teams. No Plus player offsets or base-slot lookups enter this writer.
export function applyDeluxePlayerCloseups(input,base,project){
 if(!project.changes.teamVisuals&&!Object.values(project.changes.players??{}).some(p=>p.appearance))return input;
 const out=new Uint8Array(0x400000).fill(255);out.set(input);
 const palettes=new Uint8Array(0x10000).fill(255),styles=new Uint8Array(60*20*2),heads=new Uint8Array(4096);
 for(let h=0;h<16;h++)heads.set(closeupHeadTiles(base,h),h*256);
 for(let team=0;team<(project.changes.structure?.teams.length??36);team++){
  const row=deluxeVisualRow(base,project,team);
  for(let slot=0;slot<20;slot++){
   const a=deluxeAppearance(base,project,team,slot),keeper=slot===0||slot===11,key=team*20+slot;
   let colors=deluxePlayerPalette(row,a.palette);
   if(keeper){const k=project.changes.players?.[team+':'+slot]?.appearance?.colors??deluxePlayerPalette(row,0,true).slice(1);colors=[0,k[0],k[1],k[1],k[2],k[3],k[4]];}
   closeupPalette(colors).forEach((v,i)=>{palettes[key*32+i*2]=v&255;palettes[key*32+i*2+1]=v>>8;});
   const hair=keeper?14:a.hair;styles[key*2]=hair;styles[key*2+1]=hair===0||hair>=14?128:0;
  }
 }
 const writes=[[CLOSEUP_PALETTE_SLOT,palettes],[CLOSEUP_STYLE_SLOT,styles],[CLOSEUP_HEAD_SLOT,heads],[CLOSEUP_HELPER_SLOT,closeupHelper()],[CLOSEUP_HELPER_SLOT+0x400,closeupFrameHelper()]];
 // The native cinematic renderer reads these seven kit tables BEFORE the
 // individual portrait hook. Extend them too; indexing the original 42-team
 // tables with a GG identity would otherwise enter unrelated ROM data.
 const n=project.changes.structure?.teams.length??36,total=n+7,table=new Uint8Array(total*4*7),records=[],allocated=new Map();let cursor=0x2cc000;
 for(let section=0;section<7;section++)for(let team=0;team<total;team++)for(let kit=0;kit<2;kit++){
  const source=team<n?(project.changes.structure?.teams[team]?.sourceTeam??team):36+team-n;
  let record;if(team<n&&project.changes.teamVisuals)record=CLOSEUP_REFERENCE[section][visualTeamId(project,team)][kit];else{const ptrAt=0x47b00+section*168+Math.min(source,41)*4+kit*2,ptr=base[ptrAt]|base[ptrAt+1]<<8,at=0x48000+(ptr&32767),size=(base[at]|base[at+1]<<8)+3;record=Array.from(base.slice(at,at+size));}
  const key=record.join(',');if(!allocated.has(key)){if(cursor+record.length>0x2d0000)throw Error('Retratos: paletas excederam a reserva');allocated.set(key,cursor);records.push([cursor,Uint8Array.from(record)]);cursor+=record.length;}
  const ptr=cpu(allocated.get(key))&65535,at=section*total*4+team*4+kit*2;table[at]=ptr&255;table[at+1]=ptr>>8;
 }
 writes.push([0x2cb000,table],...records);
 for(let section=0;section<7;section++){
  const at=0x5fdd0+section*16,reader=[0x48,0xbf,...long(cpu(0x2cb000+section*total*4)),0xa8,0x68,0x60];writes.push([at,Uint8Array.from(reader)]);
  const original=0xfb00+section*168;
  for(let site=0x59000;site<0x5918c;site++)if(base[site]===0xbc&&base[site+1]===(original&255)&&base[site+2]===original>>8){if(out[site]!==0xbc)throw Error('Retratos: tabela já alterada');out.set([0x20,at&255,cpu(at)>>8&255],site);}
 }
 // 8B:918C's original bank/push prologue is reproduced on the native path.
 // Private records use D9:C000..FFFF, without changing the global palette loader.
 const loader=Uint8Array.from([0xc0,0,0xc0,0xb0,12,0x8b,0xda,0x5a,0xf4,0,0x81,0xab,0xab,0x5c,0xef,0xa4,0x80,0x08,0x8b,0xda,0x5a,0x48,0x29,0xfe,0,0xaa,0xbf,0x76,0x91,0x81,0x48,0xbb,0xbf,0,0,0xd9,0xe8,0xe8,0x7a,0x54,0x7e,0xd9,0x68,0x7a,0xfa,0xab,0x28,0x6b]);
 writes.push([CLOSEUP_HELPER_SLOT+0x600,loader]);
 if([0x8b,0xda,0x5a,0xf4,0,0x81,0xab,0xab].some((v,i)=>out[0x5918c+i]!==v))throw Error('Retratos: leitor de paletas incompatível');
 out.set([0x5c,...long(cpu(CLOSEUP_HELPER_SLOT+0x600)),0xea,0xea,0xea,0xea],0x5918c);
 for(const[at,bytes]of writes){if(out.slice(at,at+bytes.length).some(v=>v!==255))throw Error('Retratos: reserva ocupada em 0x'+at.toString(16));out.set(bytes,at);}
 for(const[at,expected,target]of[[0x58ef8,[0x22,0x98,0x90,0x8b],CLOSEUP_HELPER_SLOT],[0x592cf,[0xb9,0xa9,0xf0,0x8d,0,9],CLOSEUP_HELPER_SLOT+0x400]]){
  if(expected.some((v,i)=>base[at+i]!==v||out[at+i]!==v))throw Error('Retratos: rotina Deluxe incompatível');
  out.set([0x22,...long(cpu(target)),...Array(expected.length-4).fill(0xea)],at);
 }
 out[0x7fd7]=12;return out;
}
