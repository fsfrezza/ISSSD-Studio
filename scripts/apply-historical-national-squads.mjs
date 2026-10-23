import{applyHistoricalSkillCalibration}from'../src/core/historical-skills.mjs';
import fs from 'node:fs';import path from 'node:path';import{fileURLToPath}from'node:url';
import{encodeFixedPlayerName}from'../src/core/plus-player-name.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const arg=process.argv.indexOf('--project'),target=arg>=0?path.resolve(process.argv[arg+1]):path.join(root,'International-Superstar-Soccer-Deluxe-Plus-projeto.issdproj');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'project-data/historical-national-squads.json'),'utf8')),recovery=JSON.parse(fs.readFileSync(path.join(root,'project-data/recovered-argentina-germany.json'),'utf8'));
const project=JSON.parse(fs.readFileSync(target,'utf8')),semantic=project.state.semantic,teams=semantic.teamsV1.teams;
const positions={GO:'GO',GK:'GO',DF:'DF',VOL:'DF-MF',MC:'MF',MF:'MF',MO:'MF-FW',AT:'FW',FW:'FW'};
const normalize=s=>s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[’']/g,"'").replace(/[^a-zA-Z0-9 .'-]/g,'');
const overrides={'Alessandro Del Piero':'DelPiero','Gianluigi Buffon':'Buffon','Edwin van der Sar':'V.d.Sar','Hans van Breukelen':'V.Breuke','Frank de Boer':'F.deBoer','Ronald Koeman':'R.Koeman','Gordon Banks':'Banks','Bobby Charlton':'Charlton','Sergio Busquets':'Busquets','Xavi Hernandez':'Xavi','Luis Suarez Miramontes':'L.Suarez','Cristiano Ronaldo':'C.Ronal.','Ronaldo Nazario':'Ronaldo','Jean-Marie Pfaff':'Pfaff','Kevin De Bruyne':'DeBruyne','Kylian Mbappe':'Mbappe','Yoshikatsu Kawaguchi':'Kawaguch','Shinji Okazaki':'Okazaki','Kunishige Kamamoto':'Kamamoto','Mohamed Al-Deayea':'M.Deayea','Abdullah Al-Deayea':'A.Deayea','Youssef En-Nesyri':'EnNesyri','Luis Suarez':'L.Suarez','Jose Leandro Andrade':'Andrade','Victor Rodriguez Andrade':'V.Andrad','Jose Francisco Cevallos':'Cevallos','Jose Luis Chilavert':'Chilaver','Jose Saturnino Cardozo':'J.Cardoz','Oscar Cardozo':'O.Cardoz','John Arne Riise':'Riise','Oyvind Leonhardsen':'Leonhard','Mark Schwarzer':'Schwarze','DaMarcus Beasley':'Beasley'};
function shortName(full,used){const words=normalize(full).split(/\s+/),last=words.at(-1);let name=overrides[full]||last.replace(/-/g,'');if(name.length>8)name=name.slice(0,8);if(used.has(name.toLowerCase()))name=(words[0][0]+'.'+last.replace(/-/g,'')).slice(0,8);if(used.has(name.toLowerCase()))throw Error('Abreviação duplicada: '+full);used.add(name.toLowerCase());return name;}
function withName(custom,name){return{...custom,name,nameHex:Buffer.from(encodeFixedPlayerName(name)).toString('hex').toUpperCase()};}
// Recover the exact reviewed legacy data into the current sparse identity schema.
for(const id of[8,31]){const old=recovery.teams[id],players=old.players.map(p=>{
 const custom=withName({number:p.number,position:positions[p.position],skills:structuredClone(p.skills),appearance:{...p.appearance,hair:positions[p.position]==='GO'?0:p.appearance.hair===0?14:p.appearance.hair},tactical:structuredClone(p.tactical)},p.name);
 if(custom.tactical?.className==='AT')custom.tactical.attack=false;
 if(!custom.position)throw Error('Posição recuperada inválida: '+p.position);
 return{playerId:`${id}:${p.baseSlot}`,baseSlot:p.baseSlot,slot:p.slot,custom};
  });
 // Old snapshots could exceed the original engine's three head-overlay objects.
 // Keep the first three explicit overlays; use the embedded original for the excess.
 let overlays=0;for(const p of players.filter(p=>p.slot<=11)){const a=p.custom.appearance;if(a.hair>0&&a.hair<14&&++overlays>3)a.hair=14;}
 teams[id]={...teams[id],teamId:id,players};}
const templates={goalkeepers:[5,5,3,4,8,9,4,9,9],defenders:[7,7,5,5,9,8,6,8,9],midfielders:[8,8,7,8,7,9,9,6,9],forwards:[9,9,9,8,8,8,9,8,8]},keys=['acceleration','speed','shot','curve','balance','intelligence','dribbling','jump','energy'];
const shape=[null,[-32,30],[-38,10],[-38,-10],[-32,-30],[-8,25],[-14,7],[8,-10],[10,-28],[35,13],[35,-13]];
let total=0;
for(const [id,team]of Object.entries(catalog.teams)){
 const groups=Object.fromEntries(['goalkeepers','defenders','midfielders','forwards'].map(role=>[role,team.players.filter(p=>p.role===role)]));
 const order=[groups.goalkeepers[0],...groups.defenders.slice(0,4),...groups.midfielders.slice(0,4),...groups.forwards.slice(0,2),groups.goalkeepers[1],...groups.defenders.slice(4),...groups.midfielders.slice(4),...groups.forwards.slice(2)];
 if(order.length!==20||order.some(p=>!p))throw Error('Elenco incompleto: '+id);const used=new Set();
 const players=order.map((p,i)=>{
  const role=p.role,position=p.name==='Alcides Ghiggia'?'MF-FW':{goalkeepers:'GO',defenders:'DF',midfielders:'MF',forwards:'FW'}[role],slot=i+1,name=shortName(p.name,used),skills=Object.fromEntries(keys.map((key,j)=>[key,templates[role][j]]));
  // These are transparent gameplay starting presets, not claimed statistical measurements.
  const custom=withName({number:slot,position,skills},name);
  if(i>=1&&i<=10){const [x,y]=shape[i];custom.tactical={x,y,className:role==='defenders'?'DF':role==='midfielders'?'MC':'AT',attack:role==='midfielders'&&x>0};}
  p.editorName=name;p.slot=slot;
  return{playerId:`${id}:${slot}`,baseSlot:slot,slot,custom};
 });teams[id]={...teams[id],teamId:Number(id),players};total+=players.length;
}
// User-verified visual references override the older generic recovery guesses.
const appearanceReferences=JSON.parse(fs.readFileSync(path.join(root,'project-data/player-appearance-references.json'),'utf8'));
const confirmed=new Set();for(const ref of appearanceReferences.references){const player=teams[ref.team]?.players.find(p=>p.baseSlot===ref.baseSlot);if(!player)throw Error('Referência de aparência sem jogador: '+ref.name);player.custom.appearance={hair:ref.hair,palette:ref.palette};confirmed.add(ref.team+':'+ref.baseSlot);}
for(const id of new Set(appearanceReferences.references.map(r=>r.team))){const overlays=teams[id].players.filter(p=>p.custom?.appearance?.hair>0&&p.custom.appearance.hair!==14);let excess=overlays.length-3;for(const p of overlays.slice().reverse()){if(excess<=0)break;if(confirmed.has(id+':'+p.baseSlot))continue;p.custom.appearance.hair=14;excess--;}if(excess>0)throw Error('Referências confirmadas excedem o limite nativo de cabelo.');}
semantic.teamsV1.appearanceModel='bald-base-v1';
project.savedAt=new Date().toISOString();
const calibrated=applyHistoricalSkillCalibration(project,JSON.parse(fs.readFileSync(path.join(root,'project-data/historical-skill-calibration.json'),'utf8')));
fs.writeFileSync(target,JSON.stringify(calibrated,null,2)+'\n');
fs.writeFileSync(path.join(root,'project-data/historical-national-squads.json'),JSON.stringify(catalog,null,2)+'\n');
console.log(`Recuperados Alemanha/Argentina; ${Object.keys(catalog.teams).length} outras seleções, ${total} jogadores. Brasil e duas equipes especiais preservados.`);
