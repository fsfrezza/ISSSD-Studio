// Plus selection uses bank-81 byte IDs (team * 2), not roster indices.
export const PLUS_GROUP_ORDER=Object.freeze([6,7,8,0,1,2,3,4,5]);
export const PLUS_GROUP_TITLES=Object.freeze([0xFADC,0xFAEC,0xFAFC,0xFB0C,0xFB1C,0xFB2C,0xFB3C,0xFB4C,0xFB5C,0xFB6C]);
export const PLUS_GROUP_RANGES=Object.freeze([[0xE7F2,0xE82E],[0x3FAC8,0x3FB7C],[0xF6C78,0xF6F2B]]);
const word=(rom,pc)=>rom[pc]|rom[pc+1]<<8;
export function readPlusGroupIdentity(rom){
 if(!(rom instanceof Uint8Array)||rom.length<0x3FADC)throw new Error('ROM Plus incompleta para ler grupos.');
 const decode=b=>b===0x70?-1:b%2===0&&b<0x70?b/2:NaN;
 return {orderConvention:'issd-plus-logical-v2',groups:PLUS_GROUP_ORDER.map(p=>Array.from(rom.slice(0xE7F2+p*6,0xE7F2+p*6+6),decode)),secret:Array.from(rom.slice(0xE828,0xE82E),decode),titlePointers:[...PLUS_GROUP_ORDER,9].map(p=>word(rom,0x3FAC8+p*2))};
}
export function planPlusGroupIdentity(base,state){
 const saved=state?.plusGroups;if(!saved||saved.groups==null)return [];
 const convention=saved.orderConvention??saved.groupOrderConvention;
 if(convention&&convention!=='issd-plus-logical-v2')throw new Error('Grupos: convenção não suportada; use os nove grupos existentes da Plus.');
 const original=readPlusGroupIdentity(base);
 if([...original.groups.flat(),...original.secret].some(v=>!Number.isInteger(v))||original.titlePointers.some(v=>!PLUS_GROUP_TITLES.includes(v)))throw new Error('Grupos: tabelas da ROM-base incompatíveis com a Plus verificada.');
 const valid=v=>Number.isInteger(v)&&v>=-1&&v<56;
 if(!Array.isArray(saved.groups)||saved.groups.length!==9||saved.groups.some(g=>!Array.isArray(g)||g.length!==6||g.some(v=>!valid(v))))throw new Error('Grupos: informe nove grupos com seis posições e IDs 0–55.');
 if(!Array.isArray(saved.secret)||saved.secret.length!==6||saved.secret.some(v=>!valid(v)))throw new Error('Grupos: grupo secreto inválido.');
 const rows=[...saved.groups,saved.secret],prior=[...original.groups,original.secret];
 const changed=rows.some((r,i)=>r.some((v,j)=>v!==prior[i][j]));
 if(changed){
  if(rows.some((r,i)=>r.some((v,j)=>(v===-1)!==(prior[i][j]===-1))))throw new Error('Grupos: mantenha as posições ocupadas existentes; adicionar/remover posições exige reestruturação.');
  const all=rows.flat().filter(v=>v>=0),old=prior.flat().filter(v=>v>=0);
  if(new Set(all).size!==all.length||all.length!==old.length||all.some(v=>!old.includes(v)))throw new Error('Grupos: cada equipe existente deve aparecer exatamente uma vez.');
 }
 const pointers=saved.titlePointers??original.titlePointers;
 if(!Array.isArray(pointers)||pointers.length!==10||pointers.some(v=>!PLUS_GROUP_TITLES.includes(v)))throw new Error('Grupos: título gráfico não pertence aos descritores nativos verificados.');
 const normal=new Uint8Array(54),secret=Uint8Array.from(saved.secret,v=>v<0?0x70:v*2),titles=new Uint8Array(20);
 for(let logical=0;logical<9;logical++)normal.set(saved.groups[logical].map(v=>v<0?0x70:v*2),PLUS_GROUP_ORDER[logical]*6);
 for(let logical=0;logical<10;logical++){const physical=logical===9?9:PLUS_GROUP_ORDER[logical],ptr=pointers[logical];titles[physical*2]=ptr&255;titles[physical*2+1]=ptr>>>8;}
 return [{pc:0xE7F2,bytes:normal},{pc:0xE828,bytes:secret},{pc:0x3FAC8,bytes:titles}];
}
export function plusGroupIdentityWriter(rom,state,base,selectedAreas=null){
 if(selectedAreas&&!selectedAreas.includes('selecao-equipes'))return rom;
 const writes=planPlusGroupIdentity(base,state);
 for(const {pc,bytes} of writes)rom.set(bytes,pc);
 // E82E is the start of DATA_81E82E, an unrelated three-byte record stream.
 // E82F is NOT a secret-team count. Old UI snapshots must never replace it.
 if(writes.length)rom.set(base.subarray(0xE82E,0xE830),0xE82E);
 return rom;
}
