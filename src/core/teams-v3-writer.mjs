import {playerOffset} from './plus-player.mjs';
import {plusPlayerWriter} from './plus-player-writer.mjs';
import {resolvePlusPlayerNameOffset} from './plus-player-name.mjs';
import {resolvePlusTacticalRecord} from './plus-tactics-address.mjs';
import {decodePlusTacticalRecord,encodePlusTacticalRecord} from './plus-tactics-record.mjs';

const POS={NONE:0,GO:1,GK:1,DF:2,'DF-MF':3,VOL:3,MF:4,MC:4,'MF-FW':5,MO:5,FW:6,AT:6};
export function teamsV3Entries(state){
 const v=state?.teamsV1;if(v?.schema!=='isssd-teams-v1'||Number(v.version)!==3)return [];
 return Object.entries(v.teams||{}).sort(([a],[b])=>Number(a)-Number(b)).map(([k,t])=>{
  const team=Number(t.teamId??k);if(!Number.isInteger(team)||team<0||team>=56)throw new Error('Invalid teamsV1 team');
  const slots=new Set(),ids=new Set();
  const players=[...(t.players||[])].sort((a,b)=>a.slot-b.slot).map(p=>{
   const slot=Number(p.slot),baseSlot=Number(p.baseSlot??String(p.playerId||'').split(':')[1]??slot);
   if(!Number.isInteger(slot)||slot<1||slot>20||!Number.isInteger(baseSlot)||baseSlot<1||baseSlot>20||slots.has(slot)||ids.has(baseSlot))throw new Error('Invalid teamsV1 player identity');
   slots.add(slot);ids.add(baseSlot);return {...p,slot,baseSlot};
  });return {team,t,players};
 });
}
export function teamsV3PlayerSteps(base,state){
 const steps=[];
 for(const {team,players} of teamsV3Entries(state)){
  // Moving identities is one atomic roster operation, read exclusively from clean base.
  const moved=players.filter(p=>p.slot!==p.baseSlot);
  if(moved.length)steps.push({id:`team-${team}-identity`,run:rom=>{
   for(const p of moved){
    rom.set(base.slice(playerOffset(team,p.baseSlot-1),playerOffset(team,p.baseSlot-1)+7),playerOffset(team,p.slot-1));
    const src=resolvePlusPlayerNameOffset(base,team,p.baseSlot-1),dst=resolvePlusPlayerNameOffset(rom,team,p.slot-1);rom.set(base.slice(src,src+8),dst);
   }return rom;
  }});
  for(const p of players){
   const c=p.custom||{};
   if(!['name','nameHex','number','position','skills','appearance'].some(k=>Object.hasOwn(c,k)))continue;
   steps.push({id:`team-${team}-player-${p.slot}-${String(c.name||p.playerId||'edit').replace(/[^a-zA-Z0-9.-]/g,'_')}`,run:rom=>{
    const edit={team,player:p.slot-1};
    if(Object.hasOwn(c,'name')&&!Object.hasOwn(c,'nameHex'))edit.name=c.name;
    if(Object.hasOwn(c,'number'))edit.jersey=c.number;
    if(Object.hasOwn(c,'position')){const pos=POS[String(c.position).toUpperCase()];if(pos===undefined)throw new Error('Invalid natural position');edit.naturalPosition=pos;}
    if(c.skills)edit.skills=c.skills;
    plusPlayerWriter(rom,{playerEdits:[edit]});
    if(Object.hasOwn(c,'nameHex')){
     if(!/^[0-9a-f]{16}$/i.test(c.nameHex))throw new Error('Invalid nameHex');
     const bytes=Uint8Array.from(c.nameHex.match(/../g).map(x=>parseInt(x,16)));rom.set(bytes,resolvePlusPlayerNameOffset(rom,team,p.slot-1));
    }
    if(c.appearance){
     const off=playerOffset(team,p.slot-1)+6;let b=rom[off];
     if(Object.hasOwn(c.appearance,'hair')){const v=c.appearance.hair;if(!Number.isInteger(v)||v<0||v>13)throw new Error('Invalid hair');b=(b&15)|(v<<4);}
     if(Object.hasOwn(c.appearance,'palette')){const v=c.appearance.palette;if(v!==0&&v!==1)throw new Error('Invalid palette');b=(b&254)|v;}rom[off]=b;
    }return rom;
   }});
  }
 }return steps;
}
export function hasTeamsV3Tactics(state){return teamsV3Entries(state).some(({t,players})=>Object.hasOwn(t.custom?.formation||{},'index')||players.some(p=>p.slot>=2&&p.slot<=11&&(p.slot!==p.baseSlot||Object.keys(p.custom?.tactical||{}).length)));}
export function teamsV3TacticalSteps(base,state){
 const steps=[];
 for(const {team,t,players} of teamsV3Entries(state)){
  if(Object.hasOwn(t.custom?.formation||{},'index'))steps.push({id:`team-${team}-formation`,run:rom=>{const r=resolvePlusTacticalRecord(rom,team);rom.set(encodePlusTacticalRecord(r.raw,{formationIndex:t.custom.formation.index}),r.recordPc);return rom;}});
  for(const p of players){
   const c=p.custom?.tactical||{};if(p.slot<2||p.slot>11||(!Object.keys(c).length&&p.slot===p.baseSlot))continue;
   steps.push({id:`team-${team}-tactical-player-${p.slot}`,run:rom=>{
    const r=resolvePlusTacticalRecord(rom,team);if(!r)throw new Error('Missing tactical record');
    const br=resolvePlusTacticalRecord(base,team);if(!br)throw new Error('Missing baseline tactic');
    const source=p.baseSlot>=2&&p.baseSlot<=11?decodePlusTacticalRecord(br.raw).players[p.baseSlot-2]:decodePlusTacticalRecord(r.raw).players[p.slot-2];
    const q={...source,...c,index:p.slot-2};
    if(q.className==='MF')q.className='MC';if(q.className==='FW')q.className='AT';
    rom.set(encodePlusTacticalRecord(r.raw,{players:[q]}),r.recordPc);return rom;
   }});
  }
 }return steps;
}
export function applySteps(rom,steps){for(const s of steps)s.run(rom);return rom;}
