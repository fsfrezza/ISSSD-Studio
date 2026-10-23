// Editorial gameplay calibration. No random/hash jitter and no forced uniqueness.
export const HISTORICAL_SKILL_KEYS=Object.freeze(['acceleration','speed','shot','curve','balance','intelligence','dribbling','jump','energy']);
export const HISTORICAL_SKILL_PROFILES=Object.freeze({
 G:{label:'goleiro de posicionamento',values:[4,4,2,2,7,8,3,8,7],primary:['intelligence','jump','balance']},
 R:{label:'goleiro ágil',values:[6,5,2,2,6,8,4,9,7],primary:['intelligence','jump','acceleration']},
 S:{label:'goleiro com saída de bola',values:[6,6,4,5,7,8,6,8,8],primary:['intelligence','jump','dribbling']},
 K:{label:'goleiro cobrador',values:[4,4,7,8,8,8,4,8,7],primary:['shot','curve','intelligence']},
 C:{label:'zagueiro de imposição',values:[5,6,3,3,8,7,4,8,7],primary:['balance','intelligence','jump']},
 B:{label:'zagueiro com saída de bola',values:[6,6,4,5,7,8,6,7,7],primary:['intelligence','balance','dribbling']},
 L:{label:'líbero / organizador defensivo',values:[6,7,5,6,7,8,7,6,7],primary:['intelligence','dribbling','balance']},
 F:{label:'lateral equilibrado',values:[7,7,4,5,6,7,6,6,8],primary:['intelligence','balance','energy']},
 A:{label:'lateral de apoio',values:[8,8,5,7,6,7,7,5,8],primary:['speed','curve','energy']},
 D:{label:'volante de proteção',values:[6,6,4,4,8,8,5,6,8],primary:['balance','intelligence','energy']},
 H:{label:'meio-campista de recuperação',values:[7,7,5,5,8,7,6,6,9],primary:['balance','intelligence','energy']},
 M:{label:'meio-campista de duas áreas',values:[7,7,6,6,7,8,7,6,8],primary:['intelligence','shot','energy']},
 P:{label:'organizador / passe e bola parada',values:[6,6,6,8,5,9,8,4,7],primary:['intelligence','curve','dribbling']},
 T:{label:'meia criador',values:[7,7,7,8,6,8,9,4,7],primary:['intelligence','dribbling','curve']},
 W:{label:'ponta de drible',values:[8,8,6,7,5,7,9,4,7],primary:['acceleration','dribbling','curve']},
 V:{label:'atacante de velocidade',values:[9,9,6,5,6,6,7,5,8],primary:['acceleration','speed','shot']},
 N:{label:'finalizador de área',values:[8,8,8,5,6,8,7,7,7],primary:['shot','intelligence','acceleration']},
 Q:{label:'centroavante de referência',values:[5,6,8,4,9,7,5,9,7],primary:['shot','balance','jump']},
 U:{label:'atacante completo',values:[7,8,8,7,8,8,8,7,8],primary:['shot','intelligence','dribbling']},
 E:{label:'segundo atacante técnico',values:[8,7,7,8,6,8,9,5,7],primary:['shot','intelligence','dribbling']},
});
function checkedSkills(skills,partial=false){
 if(!skills||typeof skills!=='object'||Array.isArray(skills))throw Error('Skills históricos inválidos.');
 for(const [k,v]of Object.entries(skills))if(!HISTORICAL_SKILL_KEYS.includes(k)||!Number.isInteger(v)||v<1||v>10)throw Error('Skill histórico inválido: '+k);
 if(!partial&&HISTORICAL_SKILL_KEYS.some(k=>!Object.hasOwn(skills,k)))throw Error('Skills históricos incompletos.');
 return skills;
}
export function calibrateHistoricalSkills(profile,tier,traits={},record=null){
 const spec=HISTORICAL_SKILL_PROFILES[profile];
 if(!spec||!Number.isInteger(tier)||tier<1||tier>5)throw Error('Perfil histórico inválido.');checkedSkills(traits,true);
 const result=Object.fromEntries(HISTORICAL_SKILL_KEYS.map((k,i)=>[k,Math.max(1,Math.min(9,spec.values[i]+(spec.primary.includes(k)?tier-3:0)))]));
 // Caps can support consistency, never speed, physique, technique or all attributes.
 if(Number.isInteger(record?.caps)&&record.caps>=100)result.energy=Math.min(9,result.energy+1);
 // International scoring supports finishing only, with a meaningful sample.
 if(['N','Q','U','E','W','V'].includes(profile)&&record?.caps>=30&&record?.goals/record.caps>=0.45)result.shot=Math.min(9,result.shot+1);
 // Explicit player assessments alone can reach 10, and may lower any dimension.
 Object.assign(result,traits);return checkedSkills(result);
}
export function applyHistoricalSkillCalibration(project,calibration){
 if(calibration?.schema!=='isssd-historical-skills-v1'||calibration.version!==1||!Array.isArray(calibration.players))throw Error('Catálogo de skills inválido.');
 const next=structuredClone(project),teams=next?.state?.semantic?.teamsV1?.teams,seen=new Set();if(!teams)throw Error('Projeto sem equipes.');
 for(const row of calibration.players){
  const key=row.team+':'+row.baseSlot;if(seen.has(key)||!Number.isInteger(row.team)||row.team<0||row.team>=54||[8,31].includes(row.team)||!Number.isInteger(row.baseSlot)||row.baseSlot<1||row.baseSlot>20)throw Error('Identidade de skills inválida: '+key);seen.add(key);
  const player=teams[row.team]?.players?.find(p=>p.baseSlot===row.baseSlot);
  if(!player||player.custom?.name!==row.editorName)throw Error('Jogador diverge da calibração: '+key);
  checkedSkills(row.skills);if(!['replace','fill-missing'].includes(row.mode))throw Error('Modo de skills inválido.');
  if(row.mode==='fill-missing')checkedSkills(player.custom.skills??{},true);
  player.custom.skills=row.mode==='fill-missing'?{...row.skills,...player.custom.skills}:{...row.skills};
 }
 return next;
}
