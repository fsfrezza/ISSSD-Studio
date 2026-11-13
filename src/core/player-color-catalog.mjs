export const PLAYER_COLORS_SCHEMA='isssd-player-colors-v1';
export function validatePlayerColors(value){
 if(value==null)return{schema:PLAYER_COLORS_SCHEMA,version:1,players:{}};
 if(value.schema!==PLAYER_COLORS_SCHEMA||value.version!==1||!value.players||typeof value.players!=='object'||Array.isArray(value.players))throw Error('Escolhas de pele/cabelo inválidas.');
 const out={schema:PLAYER_COLORS_SCHEMA,version:1,players:{}};
 for(const[key,v]of Object.entries(value.players)){
  if(!/^(?:[0-9]|[1-5][0-9]):(?:[1-9]|1[0-9]|20)$/.test(key)||!v||!Array.isArray(v.skin)||v.skin.length!==5||[...v.skin,v.hairColor].some(c=>!Number.isInteger(c)||c<0||c>32767))throw Error('Pele/cabelo inválidos para '+key);
  out.players[key]={skin:v.skin.slice(),hairColor:v.hairColor};
 }return out;
}
export function appearanceChoice(palette){return{skin:palette.slice(2,7),hairColor:palette[1]};}
export function applyAppearanceChoice(palette,choice){const out=palette.slice();out[1]=choice.hairColor;out.splice(2,5,...choice.skin);return out;}
export function makeAppearanceCatalog(entries){
 const skins=new Map(),hairColors=new Map();
 for(const entry of entries){const c=appearanceChoice(entry.palette),skinId=c.skin.map(v=>v.toString(16).padStart(4,'0')).join('-'),hairId=c.hairColor.toString(16).padStart(4,'0');
  if(!skins.has(skinId))skins.set(skinId,{id:skinId,colors:c.skin,sources:[]});skins.get(skinId).sources.push(entry.label);
  if(!hairColors.has(hairId))hairColors.set(hairId,{id:hairId,color:c.hairColor,sources:[]});hairColors.get(hairId).sources.push(entry.label);
 }return{skins:[...skins.values()],hairColors:[...hairColors.values()]};
}
export function allocateAppearanceChoices(players){
 const combinations=[],assignments={};
 for(const p of players){const key=JSON.stringify([p.choice.hairColor,...p.choice.skin]);let index=combinations.findIndex(v=>JSON.stringify([v.hairColor,...v.skin])===key);if(index<0){index=combinations.length;combinations.push(structuredClone(p.choice));}assignments[p.slot]=index;}
 if(combinations.length>2)throw Error('Este elenco usa '+combinations.length+' combinações de pele/cabelo. O motor atual suporta duas por equipe; as escolhas foram preservadas no projeto, mas esta ROM não pode ser gerada até reduzir as combinações.');
 return{combinations,assignments};
}
