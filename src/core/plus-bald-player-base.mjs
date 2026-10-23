import{PLAYER_BODY_CATALOG,PLAYER_POSE_CATALOG,readPlayerSprite,baldBodyPixels,originalBodyWithEdits}from'./player-sprite-editor.mjs';
import{migrateBaldAppearanceTeams,customHairPixels}from'./player-appearance.mjs';
import{ORIGINAL_HAIR_FRAMES}from'./player-original-hair.mjs';
import{encodeHairTile}from'./plus-custom-hair.mjs';import{playerOffset}from'./plus-player.mjs';
export const BALD_BASE_SLOT=0x300000,BALD_BASE_END=0x3DC000;
const cpu=p=>((128+(p>>>15))<<16)|32768|(p&32767),word=v=>[v&255,v>>>8&255],long=v=>[...word(v),v>>>16&255];
const hooks=[{pc:0x266FB,original:[0xBF,2,0,0x82],helper:0x308000},{pc:0x26706,original:[0xBF,4,0,0x82],helper:0x308200},...[0x1C930,0x1CAFE].map(pc=>({pc,original:[0xBD,6,0,0x29,15,0],helper:0x308400}))];
export function baldBaseSupported(base){return hooks.every(h=>h.original.every((v,i)=>base[h.pc+i]===v))&&PLAYER_BODY_CATALOG.every(r=>base[r.pc]===(r.top&255)&&base[r.pc+1]===r.top>>8&&base[r.pc+2+r.top]===(r.bottom&255)&&base[r.pc+3+r.top]===r.bottom>>8);}
export function prepareBaldAppearanceState(state){const out=structuredClone(state);out.teamsV1=migrateBaldAppearanceTeams(out.teamsV1||{schema:'isssd-teams-v1',version:3,teams:{}});return out;}
function coord(r,t,x,y){return r.mounted?[((t%6)>>1)*16+(t>=6?8:0)+y,t%2*8+x]:[Math.floor(t/8)*8+y,t%8*8+x];}
export function encodeBodySprite(r,pixels){const block=new Uint8Array(r.top+r.bottom+4),top=r.top/32;block.set(word(r.top));block.set(word(r.bottom),r.top+2);for(let t=0;t<(r.top+r.bottom)/32;t++){const a=new Uint8Array(64);for(let y=0;y<8;y++)for(let x=0;x<8;x++){const[py,px]=coord(r,t,x,y);a[y*8+x]=pixels[py*(r.mounted?16:64)+px];}block.set(encodeHairTile(a),(t<top?2:4)+t*32);}return block;}
export function composeBodyHead(r,pose,pixels,head){
 const out=Array.from(pixels);if(!pose.head)return out;const signed=v=>v>=128?v-256:v,h=pose.head,top=r.top/32,bottom=r.bottom/32;
 for(let y=0;y<8;y++)for(let x=0;x<8;x++){
  const v=head[(h[3]&128?7-y:y)*8+(h[3]&64?7-x:x)];if(!v)continue;const wx=signed(h[0])-4+x,wy=signed(h[1])-4+y;let target=null;
  for(const o of pose.objects){const size=o[3]&16?16:8,dx=wx-(signed(o[0])-(size>>1)),dy=wy-(signed(o[1])-(size>>1));if(dx<0||dy<0||dx>=size||dy>=size)continue;const sx=o[3]&64?size-1-dx:dx,sy=o[3]&128?size-1-dy:dy,tile=o[2]+(sy>>3)*16+(sx>>3),t=tile<top?tile:tile>=16&&tile<16+bottom?top+tile-16:-1;if(t<0)continue;const[py,px]=coord(r,t,sx&7,sy&7),at=py*(r.mounted?16:64)+px;if(target===null)target=at;if(pixels[at]){target=at;break;}}
  if(target!==null)out[target]=v;
 }
 return out;
}
class Code{constructor(){this.b=[];this.labels={};this.refs=[];}put(...b){this.b.push(...b);return this;}label(n){this.labels[n]=this.b.length;return this;}branch(op,n){if(op!==0x80)this.put(({0xD0:0xF0,0xF0:0xD0,0x90:0xB0,0xB0:0x90})[op],3);this.put(0x82);this.refs.push([this.b.length,n]);return this.put(0,0);}finish(){for(const[at,n]of this.refs){const d=this.labels[n]-at-2;if(d< -32768||d>32767)throw Error('Branch fora do helper.');this.b[at]=d&255;this.b[at+1]=d>>8&255;}return Uint8Array.from(this.b);}}
export function baldPointerHelper(bank=false){
 const c=new Code();c.put(0x08,0xD8,0xDA,0x5A,0xE0,0,0x80).branch(0x90,'fallback');
 // Skills uses preview objects at $06A0/$07A0, not the page-aligned match objects.
 c.put(0x7B,0xC9,0xA0,6).branch(0xF0,'preview1').put(0xC9,0xA0,7).branch(0xF0,'preview2');
 c.put(0x7B,0x29,255,0).branch(0xD0,'fallback').put(0x7B,0xC9,0,5).branch(0x90,'fallback').put(0xC9,0,0x1B).branch(0xB0,'fallback');
 c.put(0xA5,0x68,0x29,255,0,0xC9,11,0).branch(0xB0,'fallback').put(0xAA,0x7B,0xC9,0,0x10).branch(0xB0,'team2');
 const attrs=address=>c.put(0x0A,0x48,0x0A,0x0A,0x18,0x63,1,0xFA,0xAA,0xBF,...long(address),0x29,15,0);
 const roster=(lineup,address)=>{c.put(0xBF,...long(lineup),0x29,31,0,0xC9,20,0).branch(0xB0,'fallback');attrs(address);};
 // CODE_83CA79 adds (index+1)*10 to $3DF6/$3EBE. Thus appearance 0 is $3E06/$3ECE.
 roster(0x7E3F90,0x7E3E06);c.branch(0x80,'select');c.label('team2');roster(0x7E3FA4,0x7E3ECE);c.branch(0x80,'select');
 for(const[name,selection,address]of[['preview1',0x7E1E6C,0x7E3E06],['preview2',0x7E1E6E,0x7E3ECE]]){
  c.label(name).put(0xAF,...long(selection),0xEB,0x29,255,0,0xC9,20,0).branch(0xB0,'fallback');attrs(address);c.branch(0x80,'select');
 }
 c.label('select').put(0xC9,14,0).branch(0xD0,'fallback').put(0x7A,0xFA,0xBF,...long(cpu(BALD_BASE_SLOT)-32768),0xC9,255,255).branch(0xF0,'native');
 c.put(0x28,0xBF,...long(cpu(BALD_BASE_SLOT)-32768+(bank?2:0)),0x6B);
 c.label('fallback').put(0x7A,0xFA);c.label('native').put(0x28,0xBF,...long(bank?0x820004:0x820002),0x6B);const bytes=c.finish();if(bytes.length>0x200)throw Error('Helper do corpo excede espaço reservado.');return bytes;
}
// Cinematic close-ups have a separate native hair atlas (0..13). Types 14/15
// use the native embedded head there; match/Skills sprites keep their edits.
export function cinematicAppearanceHelper(side=0){
 if(side!==0&&side!==1)throw Error('Lado inválido.');
 return Uint8Array.from([0x08,0xBF,...long(side?0x7E3ECE:0x7E3E06),0x48,0x29,15,0,0xC9,14,0,0x68,0x90,3,0x29,0xF0,0xFF,0x28,0x09,0,0,0x6B]);
}
export function baldOverlayHelper(){return Uint8Array.from([0x08,0xBD,6,0,0x29,15,0,0xC9,14,0,0xD0,5,0x28,0xA9,0,0,0x6B,0x28,0xBD,6,0,0x29,15,0,0x6B]);}
export function plusBaldPlayerBaseWriter(rom,state,base,selectedAreas=null){
 if(selectedAreas&&!selectedAreas.includes('jogadores')||!baldBaseSupported(base))return rom;
 if(rom.length!==0x400000)throw Error('Base careca exige 4 MB.');
 const writes=[],table=new Uint8Array(32768);table.fill(255);let next=0x308600;const add=(pc,data)=>writes.push({pc,data}),alloc=data=>{if((next&32767)+data.length>32768)next=(next+32767)&~32767;const pc=next;next+=data.length;if(next>BALD_BASE_END)throw Error('Espaço da base careca excedido.');add(pc,data);return cpu(pc);};
 const originals=new Map(),bodies=new Map();for(const r of PLAYER_BODY_CATALOG){const image=readPlayerSprite(rom,{kind:'body',id:r.id}),saved=state?.teamsV1?.spriteEdits?.body?.[r.id],bald=saved?image.pixels:baldBodyPixels(r.id,image.pixels),original=saved?originalBodyWithEdits(base,r.id,state.teamsV1.spriteEdits):image.pixels;bodies.set(r.id,{r,bald});originals.set(r.id,alloc(encodeBodySprite(r,original)));const block=encodeBodySprite(r,bald);add(r.pc+2,block.slice(2,r.top+2));add(r.pc+r.top+4,block.slice(r.top+4));}
 const frames=Array.from({length:24},(_,frame)=>state?.teamsV1?.spriteEdits?.hair?.['14:'+frame]??Array.from(customHairPixels(base,14,frame))),changed=frames.map((a,f)=>a.some((v,i)=>v!==ORIGINAL_HAIR_FRAMES[f][i]));
 for(const pose of PLAYER_POSE_CATALOG){let pointer=originals.get(pose.body);if(pose.head&&changed[pose.frame]){const{r,bald}=bodies.get(pose.body);pointer=alloc(encodeBodySprite(r,composeBodyHead(r,pose,bald,frames[pose.frame])));}table.set([...long(pointer),0],parseInt(pose.id.slice(2),16)-32768);}
 for(const [pc,side]of [[0x591D0,0],[0x591DB,1]]){
  const original=[0xBF,...long(side?0x7E3ECE:0x7E3E06)];
  if(original.every((v,i)=>base[pc+i]===v)){
   if(!original.every((v,i)=>rom[pc+i]===v))throw Error('Leitor de aparência da cena já alterado.');
   const helper=0x308480+side*0x40;add(helper,cinematicAppearanceHelper(side));add(pc,Uint8Array.from([0x22,...long(cpu(helper))]));
  }
 }
 add(BALD_BASE_SLOT,table);add(0x308000,baldPointerHelper());add(0x308200,baldPointerHelper(true));add(0x308400,baldOverlayHelper());
 // Default native code 0 becomes original style 14, except an explicit new bald choice.
 const explicitBald=new Set();for(const[id,t]of Object.entries(state?.teamsV1?.teams||{}))for(const p of t.players||[])if(p.custom?.appearance?.hair===0)explicitBald.add((t.teamId??id)+':'+(p.slot-1));
 for(let t=0;t<56;t++)for(let p=0;p<20;p++){const record=playerOffset(t,p),at=record+6;
  // Goalkeeper poses have five-byte descriptors, without the four bytes of
  // head-overlay metadata present in field-player poses. Nonzero styles make
  // the native engine read the following descriptor as a head frame/spritemap.
  if((rom[record+4]>>>4)===1){if(rom[at]&15)add(at,Uint8Array.of(rom[at]&240));continue;}
  if((rom[at]&15)===0&&!explicitBald.has(t+':'+p))add(at,Uint8Array.of((rom[at]&240)|14));
 }
 for(const h of hooks){const bytes=[0x22,...long(cpu(h.helper)),...Array(h.original.length-4).fill(0xEA)];if(!h.original.every((v,i)=>rom[h.pc+i]===v))throw Error('Leitor do corpo já alterado em '+h.pc.toString(16));add(h.pc,Uint8Array.from(bytes));}
 for(const w of writes)if(w.pc>=BALD_BASE_SLOT&&!rom.slice(w.pc,w.pc+w.data.length).every(v=>v===255))throw Error('Espaço da base careca ocupado em '+w.pc.toString(16));
 for(const w of writes)rom.set(w.data,w.pc);return rom;
}
