import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const htmlPath=path.join(root,'editor','ISSSD-Studio.html');
if(!fs.existsSync(htmlPath))throw new Error('Editor gerado não encontrado: '+htmlPath);

let html=fs.readFileSync(htmlPath,'utf8');
const start='function plusTacSwapSelectedPlayers(team=currentTeam){';
const end='\n}\n\n// Troca SOMENTE as coordenadas globais X/Y dos dois jogadores selecionados.';
const a=html.indexOf(start),b=html.indexOf(end,a);
if(a<0||b<0)throw new Error('Não encontrei plusTacSwapSelectedPlayers no Editor gerado.');

const replacement=`function plusTacSwapSelectedPlayers(team=currentTeam){
  const selected=plusTacSelectedArray();
  if(selected.length!==2)return alert("Selecione exatamente dois jogadores de linha para trocar a ordem na escalação.");
  if(activeRomProfile?.id!=="iss-deluxe-plus")return alert("Operação disponível apenas no perfil ISSD Deluxe Plus.");

  const [a,b]=selected;
  if(a===b||a<0||b<0||a>9||b>9)return alert("Seleção inválida.");

  // O botão altera SOMENTE a ordem visual/física dos jogadores na escalação.
  // Para que cada jogador permaneça na MESMA posição do campo, seu bloco tático
  // (X, Y, classe e ATACAR) precisa acompanhar sua identidade durante a troca.
  const state=plusTacticalEditAllowed(team);
  if(!state?.allowed)return alert("Primeiro torne o preset exclusivo desta equipe.");
  const rec=state.rec;
  if(!rec||!Array.isArray(rec.raw)||rec.raw.length!==31)return alert("Registro tático inválido para esta equipe.");

  const ra=a+1, rb=b+1;
  const pa=teams?.[team]?.players?.[ra], pb=teams?.[team]?.players?.[rb];
  if(!pa||!pb)return alert("Não foi possível resolver os dois jogadores selecionados.");

  const nameA=playerNameFileOffset(team,ra), nameB=playerNameFileOffset(team,rb);
  const attrA=plusPlayerAttrOffset(team,ra), attrB=plusPlayerAttrOffset(team,rb);
  const bytesNameA=new Uint8Array(rom.slice(nameA,nameA+8));
  const bytesNameB=new Uint8Array(rom.slice(nameB,nameB+8));
  const bytesAttrA=new Uint8Array(rom.slice(attrA,attrA+7));
  const bytesAttrB=new Uint8Array(rom.slice(attrB,attrB+7));

  const recOff=fo(rec.recordPc);
  const tacA=new Uint8Array([rom[recOff+1+a*2],rom[recOff+2+a*2],rom[recOff+21+a]]);
  const tacB=new Uint8Array([rom[recOff+1+b*2],rom[recOff+2+b*2],rom[recOff+21+b]]);

  const writes=[
    {off:nameA,bytes:bytesNameB},
    {off:nameB,bytes:bytesNameA},
    // Faz a posição tática acompanhar o jogador, em vez de permanecer presa ao slot.
    {off:recOff+1+a*2,bytes:new Uint8Array([tacB[0]])},
    {off:recOff+2+a*2,bytes:new Uint8Array([tacB[1]])},
    {off:recOff+21+a,bytes:new Uint8Array([tacB[2]])},
    {off:recOff+1+b*2,bytes:new Uint8Array([tacA[0]])},
    {off:recOff+2+b*2,bytes:new Uint8Array([tacA[1]])},
    {off:recOff+21+b,bytes:new Uint8Array([tacA[2]])}
  ];
  for(const off of plusPlayerAttrMirrorOffsets(team,ra))writes.push({off,bytes:bytesAttrB});
  for(const off of plusPlayerAttrMirrorOffsets(team,rb))writes.push({off,bytes:bytesAttrA});

  const labelA=\`${'${'}pa.number??"—"} - ${'${'}pa.name||\`slot ${'${'}ra+1}\`}\`;
  const labelB=\`${'${'}pb.number??"—"} - ${'${'}pb.name||\`slot ${'${'}rb+1}\`}\`;
  const ok=recordAction(\`Trocar ordem na escalação · ${'${'}labelA} ↔ ${'${'}labelB}\`,"Jogadores",writes);

  if(ok){
    const roster=window.__ISSSD_LOADED_NAME_ROSTER_V1__;
    const tp=roster?.teams?.[String(team)]?.players;
    if(Array.isArray(tp)){
      const ea=tp.find(x=>Number(x?.slot)===ra+1), eb=tp.find(x=>Number(x?.slot)===rb+1);
      if(ea&&eb){
        const ha=ea.nameHex,hb=eb.nameHex,aa=ea.attrHex,ab=eb.attrHex,na=ea.name,nb=eb.name;
        ea.nameHex=hb;eb.nameHex=ha;ea.attrHex=ab;eb.attrHex=aa;ea.name=nb;eb.name=na;
      }
    }
    syncModelsFromRom();
    plusTacSelectedIndexes.clear();
    plusTacPrimaryIndex=null;
    renderEverything();
  }
}`;

html=html.slice(0,a)+replacement+html.slice(b+2);
if(!html.includes('Para que cada jogador permaneça na MESMA posição do campo'))throw new Error('Patch de troca de escalação não foi aplicado.');
fs.writeFileSync(htmlPath,html,'utf8');
console.log('ISSSD Studio: troca de ordem corrigida; posição tática passa a acompanhar cada jogador.');
